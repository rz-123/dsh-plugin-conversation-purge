/**
 * Host half of the conversation purge bundle.
 *
 * Registers three authenticated fetch routes used by the browser half:
 *   GET  /api/conversation-purge.list     list conversations
 *   POST /api/conversation-purge.preview  preview what a deletion would remove
 *   POST /api/conversation-purge.delete   perform the permanent deletion
 *
 * The Host is the only side allowed to touch the durable session store, so
 * every path, attachment id and session id sent by the browser is re-checked
 * against the live corpus before anything is removed.
 */

import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export const name = 'conversation-purge'
export const inject = ['connection', 'sessionQuery', 'workspaceRegistry']

const HOME = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
const SESSIONS_ROOT = process.env.DSH_SESSIONS_ROOT || path.join(HOME, 'sessions')
const ATTACHMENTS_ROOT = path.join(HOME, 'attachments')
const STATE_DIR = path.join(HOME, 'conversation-purge')
const MANIFEST_PATH = path.join(STATE_DIR, 'pending.json')

const ROUTE_LIST = '/api/conversation-purge.list'
const ROUTE_PREVIEW = '/api/conversation-purge.preview'
const ROUTE_DELETE = '/api/conversation-purge.delete'

const DOCUMENT_TOOLS = new Set(['write', 'edit', 'str_replace_editor'])
const MAX_SHARED_SCAN_SESSIONS = 80
const MAX_SCAN_ENTRIES = 4000
const MAX_SCAN_RESULTS = 400
const SCAN_SKIP_DIRS = new Set(['node_modules', '.git', '.venv', 'venv', '__pycache__', '.uv-cache', '.cache'])

let queue = Promise.resolve()

/**
 * Serialize destructive operations so two browser tabs cannot interleave.
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
function exclusive(operation) {
  const next = queue.then(operation, operation)
  queue = next.then(
    () => undefined,
    () => undefined,
  )
  return next
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function messageOf(error) {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * @param {unknown} data
 * @param {number} [status]
 * @returns {Response}
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

/**
 * @param {Response} response
 * @returns {Promise<Record<string, unknown>>}
 */
async function readBody(request) {
  let text
  try {
    text = await request.text()
  } catch {
    text = ''
  }
  if (!text) return {}
  try {
    const parsed = JSON.parse(text)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    throw new Error('请求内容不是有效的 JSON')
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  return typeof value === 'string' ? value : ''
}

/**
 * @param {{ id: string }} entry
 */
function normalizeSessionId(entry) {
  const id = asString(entry)
  return id && !id.includes('/') && !id.includes('\\') && id !== '.' && id !== '..' ? id : ''
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isInside(filePath, parent) {
  if (!parent) return false
  const relative = path.relative(path.resolve(parent), path.resolve(filePath))
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function canonicalPath(filePath) {
  const resolved = path.resolve(filePath)
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved
}

// ---------------------------------------------------------------------------
// Pending-deletion manifest
// ---------------------------------------------------------------------------

/**
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function readManifest() {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf8')
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.entries)) return parsed.entries
  } catch {
    /* missing or unreadable manifest means nothing is pending */
  }
  return []
}

/**
 * @param {Array<Record<string, unknown>>} entries
 */
async function writeManifest(entries) {
  await fs.mkdir(STATE_DIR, { recursive: true })
  const temporary = `${MANIFEST_PATH}.${process.pid}.tmp`
  await fs.writeFile(temporary, JSON.stringify({ version: 1, entries }, null, 2), 'utf8')
  await fs.rename(temporary, MANIFEST_PATH)
}

/**
 * @param {Record<string, unknown>} entry
 */
async function upsertPending(entry) {
  const entries = (await readManifest()).filter((item) => item.id !== entry.id)
  entries.push(entry)
  await writeManifest(entries)
}

/**
 * @param {string} id
 */
async function removePending(id) {
  const entries = (await readManifest()).filter((item) => item.id !== id)
  await writeManifest(entries)
}

// ---------------------------------------------------------------------------
// Corpus helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} id
 * @returns {Promise<string | null>}
 */
async function findSessionDir(id) {
  if (!normalizeSessionId(id)) return null
  let projects
  try {
    projects = await fs.readdir(SESSIONS_ROOT)
  } catch {
    return null
  }
  for (const project of projects) {
    const candidate = path.join(SESSIONS_ROOT, project, id)
    try {
      const stat = await fs.stat(candidate)
      if (stat.isDirectory()) return candidate
    } catch {
      /* keep looking */
    }
  }
  return null
}

/**
 * @param {unknown} node
 * @param {Array<Record<string, unknown>>} out
 */
function flattenDescendants(node, out) {
  if (!node || typeof node !== 'object') return out
  const session = node.session
  if (session && session.header) {
    out.push({ header: session.header, live: Boolean(session.live), persisted: Boolean(session.persisted) })
  }
  const children = Array.isArray(node.descendants) ? node.descendants : []
  for (const child of children) flattenDescendants(child, out)
  return out
}

/**
 * @returns {Promise<Array<{ header: any, live: boolean, persisted: boolean }>>}
 */
async function descendantsOf(ctx, sessionId) {
  try {
    const trace = await ctx.sessionQuery.traceSession(sessionId)
    return flattenDescendants({ descendants: trace.descendants || [] }, [])
  } catch {
    return []
  }
}

/**
 * @param {any} record
 * @param {Map<string, string | undefined>} titles
 * @param {Map<string, number>} sizes
 * @returns {Record<string, unknown>}
 */
function sessionRow(record, titles, sizes) {
  const header = record.header || {}
  const id = header.id
  const title = titles.get(id) || (header.origin === 'subagent' ? '子代理会话' : '未命名对话')
  return {
    id,
    title,
    createdAt: typeof header.createdAt === 'number' ? header.createdAt : 0,
    cwd: header.cwd || '',
    parentId: header.parentSession || '',
    kind: header.origin === 'subagent' ? 'subagent' : 'root',
    live: Boolean(record.live),
    persisted: Boolean(record.persisted),
    sizeBytes: sizes.get(id) || 0,
  }
}

/**
 * @param {readonly string[]} ids
 * @returns {Promise<Map<string, string | undefined>>}
 */
async function readTitles(ctx, ids) {
  const titles = new Map()
  if (ids.length === 0) return titles
  try {
    const observations = await ctx.sessionQuery.readTitleSnapshots(ids)
    for (const observation of observations) {
      if (observation && observation.status === 'fulfilled') {
        const title = observation.value && observation.value.title
        if (title && typeof title.title === 'string' && title.title.trim()) {
          titles.set(observation.sessionId, title.title.trim())
        }
      }
    }
  } catch {
    /* titles are cosmetic; the list still works without them */
  }
  return titles
}

// ---------------------------------------------------------------------------
// Preview: documents, attachments, subagent sessions
// ---------------------------------------------------------------------------

/**
 * @param {unknown} value
 * @returns {Record<string, any>}
 */
function safeParseJson(value) {
  if (typeof value !== 'string' || !value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Collect files a session declared or mutated, from durable events only.
 * @param {Array<{ session: any, events: any[] }>} snapshots
 * @returns {Array<{ path: string, source: string, created: boolean, via: string, description?: string }>}
 */
function collectDocuments(snapshots) {
  /** @type {Map<string, any>} */
  const byPath = new Map()

  /**
   * @param {unknown} rawPath
   * @param {{ source: string, created: boolean, via: string, description?: string }} meta
   */
  const add = (rawPath, meta) => {
    if (typeof rawPath !== 'string') return
    const trimmed = rawPath.trim()
    if (!trimmed || !path.isAbsolute(trimmed)) return
    const absolute = path.resolve(trimmed)
    const key = canonicalPath(absolute)
    const current = byPath.get(key)
    if (current) {
      current.created = current.created || meta.created
      if (!current.sources.includes(meta.source)) current.sources.push(meta.source)
      if (!current.via.includes(meta.via)) current.via.push(meta.via)
      if (!current.description && meta.description) current.description = meta.description
      return
    }
    byPath.set(key, {
      path: absolute,
      source: meta.source,
      sources: [meta.source],
      via: [meta.via],
      created: meta.created,
      description: meta.description,
    })
  }

  for (const snapshot of snapshots) {
    /** @type {Map<string, { name: string, args: Record<string, any> }>} */
    const calls = new Map()
    for (const event of snapshot.events || []) {
      const data = event && event.data
      if (!data || typeof data !== 'object') continue
      if (event.type === 'tool/call') {
        if (typeof data.callId === 'string') {
          calls.set(data.callId, { name: asString(data.name), args: safeParseJson(data.arguments) })
        }
        continue
      }
      if (event.type === 'deliverables/presented') {
        const files = Array.isArray(data.files) ? data.files : []
        for (const file of files) {
          if (!file || typeof file !== 'object') continue
          add(file.path, {
            source: 'delivered',
            created: true,
            via: 'present',
            description: asString(file.description) || undefined,
          })
        }
        continue
      }
      if (event.type !== 'tool/result') continue
      const call = calls.get(data.callId)
      if (!call || !DOCUMENT_TOOLS.has(call.name)) continue
      if (data.error || (data.message && data.message.isError)) continue
      const meta = data.meta && typeof data.meta === 'object' ? data.meta : {}
      const metaPath = typeof meta.path === 'string' ? meta.path : ''
      const command = asString(call.args.command)
      const created = call.name === 'write' || (call.name === 'str_replace_editor' && command === 'create')
      add(metaPath, {
        source: call.name === 'write' ? 'written' : 'edited',
        created,
        via: call.name,
      })
    }
  }

  return [...byPath.values()]
}

/**
 * Files that exist in the session working directory and were born inside the
 * session's lifetime. This is a heuristic and stays unselected by default.
 * @param {any} header
 * @param {Array<{ events: any[] }>} snapshots
 * @param {Set<string>} recorded
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
async function scanCreatedFiles(header, snapshots, recorded) {
  const cwd = header && typeof header.cwd === 'string' ? header.cwd : ''
  if (!cwd) return []
  const startedAt = typeof header.createdAt === 'number' ? header.createdAt : 0
  let endedAt = startedAt
  for (const snapshot of snapshots) {
    for (const event of snapshot.events || []) {
      if (typeof event.time === 'number' && event.time > endedAt) endedAt = event.time
    }
  }
  const lowerBound = startedAt - 120_000
  const upperBound = endedAt + 120_000
  const results = []
  let visited = 0

  /**
   * @param {string} directory
   * @param {number} depth
   */
  async function walk(directory, depth) {
    if (depth > 4 || visited >= MAX_SCAN_ENTRIES || results.length >= MAX_SCAN_RESULTS) return
    let entries
    try {
      entries = await fs.readdir(directory, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      if (visited >= MAX_SCAN_ENTRIES || results.length >= MAX_SCAN_RESULTS) return
      if (entry.name.startsWith('.') || SCAN_SKIP_DIRS.has(entry.name)) continue
      const absolute = path.join(directory, entry.name)
      visited += 1
      if (entry.isDirectory()) {
        await walk(absolute, depth + 1)
        continue
      }
      if (!entry.isFile()) continue
      if (recorded.has(canonicalPath(absolute))) continue
      try {
        const stat = await fs.lstat(absolute)
        if (!stat.isFile()) continue
        if (stat.birthtimeMs < lowerBound || stat.birthtimeMs > upperBound) continue
        results.push({
          path: absolute,
          source: 'scanned',
          sources: ['scanned'],
          via: ['scan'],
          created: true,
          exists: true,
          sizeBytes: stat.size,
          modifiedAt: stat.mtimeMs,
        })
      } catch {
        /* unreadable entries are ignored */
      }
    }
  }

  await walk(cwd, 0)
  return results
}

/**
 * @param {unknown} value
 * @param {Map<string, Record<string, any>>} out
 * @param {{ count: number }} budget
 * @param {number} [depth]
 */
function walkAttachmentRefs(value, out, budget, depth = 0) {
  if (budget.count > 250_000 || depth > 14) return
  if (value === null || typeof value !== 'object') return
  budget.count += 1
  if (Array.isArray(value)) {
    for (const item of value) walkAttachmentRefs(item, out, budget, depth + 1)
    return
  }
  const record = /** @type {Record<string, any>} */ (value)
  if (typeof record.attachmentId === 'string' && record.attachmentId) {
    const id = record.attachmentId
    const previous = out.get(id) || {}
    out.set(id, {
      id,
      name: typeof record.name === 'string' ? record.name : previous.name,
      mediaType: typeof record.mediaType === 'string' ? record.mediaType : previous.mediaType,
      bytes: typeof record.bytes === 'number' ? record.bytes : previous.bytes || 0,
    })
  }
  for (const key of Object.keys(record)) {
    if (key === 'attachmentId') continue
    walkAttachmentRefs(record[key], out, budget, depth + 1)
  }
}

/**
 * @param {Array<{ events: any[] }>} snapshots
 * @returns {Map<string, Record<string, any>>}
 */
function attachmentRefsOf(snapshots) {
  const refs = new Map()
  const budget = { count: 0 }
  for (const snapshot of snapshots) {
    for (const event of snapshot.events || []) walkAttachmentRefs(event && event.data, refs, budget)
  }
  return refs
}

/**
 * @param {string} attachmentId
 * @returns {string | null}
 */
function attachmentObjectPath(attachmentId) {
  const match = /^(?:sha256:)?([0-9a-fA-F]{64})$/.exec(attachmentId)
  if (!match) return null
  const digest = match[1].toLowerCase()
  return path.join(ATTACHMENTS_ROOT, 'v1', 'objects', digest.slice(0, 2), digest)
}

/**
 * Mark attachments that another session still references.
 * @param {any} ctx
 * @param {Set<string>} targetIds
 * @param {Set<string>} candidateIds
 * @returns {Promise<Set<string>>}
 */
async function findSharedAttachments(ctx, targetIds, candidateIds) {
  const shared = new Set()
  if (candidateIds.size === 0) return shared
  let records
  try {
    records = await ctx.sessionQuery.listSessions()
  } catch {
    return new Set(candidateIds)
  }
  const others = records.filter((record) => !targetIds.has(record.header.id))
  if (others.length > MAX_SHARED_SCAN_SESSIONS) return new Set(candidateIds)
  for (const record of others) {
    if (candidateIds.size === 0) break
    let snapshot
    try {
      snapshot = await ctx.sessionQuery.readSession(record.header.id)
    } catch {
      // An unreadable session may still reference any candidate; refuse all
      // rather than risk deleting a shared object.
      return new Set(candidateIds)
    }
    for (const id of attachmentRefsOf([snapshot]).keys()) {
      if (candidateIds.has(id)) shared.add(id)
    }
  }
  return shared
}

/**
 * @param {string} title
 * @param {string} sessionId
 * @param {{ includeScan?: boolean }} options
 * @returns {Promise<Record<string, unknown>>}
 */
async function buildPreview(ctx, sessionId, options) {
  const records = await ctx.sessionQuery.listSessions()
  const record = records.find((item) => item.header.id === sessionId)
  if (!record) throw new Error('找不到该对话')

  const snapshot = await ctx.sessionQuery.readSession(sessionId)
  const descendants = await descendantsOf(ctx, sessionId)
  const snapshots = [snapshot]
  for (const descendant of descendants) {
    try {
      snapshots.push(await ctx.sessionQuery.readSession(descendant.header.id))
    } catch {
      /* a damaged child must not hide the rest of the preview */
    }
  }

  const documents = collectDocuments(snapshots)
  const recorded = new Set(documents.map((document) => canonicalPath(document.path)))
  const enriched = []
  for (const document of documents) {
    let exists = false
    let sizeBytes = 0
    try {
      const stat = await fs.lstat(document.path)
      exists = stat.isFile()
      if (exists) sizeBytes = stat.size
    } catch {
      exists = false
    }
    enriched.push({
      ...document,
      exists,
      sizeBytes,
      display: displayPath(document.path, snapshot.session.cwd),
    })
  }
  enriched.sort((left, right) => left.display.localeCompare(right.display, 'zh-CN'))

  const scanned = options.includeScan ? await scanCreatedFiles(snapshot.session, snapshots, recorded) : []
  const scannedRows = scanned.map((file) => ({
    ...file,
    display: displayPath(file.path, snapshot.session.cwd),
  }))

  const refs = attachmentRefsOf(snapshots)
  const targetIds = new Set([sessionId, ...descendants.map((item) => item.header.id)])
  const shared = await findSharedAttachments(ctx, targetIds, new Set(refs.keys()))
  const attachments = []
  for (const ref of refs.values()) {
    const objectPath = attachmentObjectPath(ref.id)
    let exists = false
    let bytes = ref.bytes || 0
    if (objectPath) {
      try {
        const stat = await fs.lstat(objectPath)
        exists = stat.isFile()
        if (exists) bytes = stat.size
      } catch {
        exists = false
      }
    }
    attachments.push({
      id: ref.id,
      name: ref.name || '附件',
      mediaType: ref.mediaType || '',
      bytes,
      exists,
      shared: shared.has(ref.id),
    })
  }
  attachments.sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

  const subagentTitles = await readTitles(ctx, descendants.map((item) => item.header.id))
  const subagents = descendants.map((item) => ({
    id: item.header.id,
    title: subagentTitles.get(item.header.id) || '子代理会话',
    live: item.live,
    sizeBytes: 0,
  }))

  const documentBytes = enriched.reduce((total, doc) => total + (doc.exists ? doc.sizeBytes : 0), 0)
  const attachmentBytes = attachments.reduce((total, item) => total + (item.exists ? item.bytes : 0), 0)

  return {
    ok: true,
    session: {
      id: sessionId,
      title: (await readTitles(ctx, [sessionId])).get(sessionId) || (record.header.origin === 'subagent' ? '子代理会话' : '未命名对话'),
      createdAt: record.header.createdAt || 0,
      cwd: snapshot.session.cwd || '',
      live: Boolean(record.live),
    },
    documents: enriched,
    scanned: scannedRows,
    attachments,
    subagents,
    totals: {
      documentBytes,
      attachmentBytes,
      documents: enriched.length,
      attachments: attachments.length,
      subagents: subagents.length,
    },
  }
}

/**
 * @param {string} filePath
 * @param {string} [cwd]
 * @returns {string}
 */
function displayPath(filePath, cwd) {
  if (cwd) {
    const relative = path.relative(cwd, filePath)
    if (relative && !relative.startsWith('..') && !path.isAbsolute(relative)) return relative
  }
  return filePath
}

// ---------------------------------------------------------------------------
// Deletion
// ---------------------------------------------------------------------------

/**
 * @param {string} filePath
 * @returns {boolean}
 */
function isDocumentPathAllowed(filePath) {
  if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return false
  const resolved = path.resolve(filePath)
  if (isInside(resolved, SESSIONS_ROOT) || isInside(resolved, STATE_DIR)) return false
  if (isInside(resolved, ATTACHMENTS_ROOT)) return false
  if (process.env.DSH_PROFILE_DIR && isInside(resolved, process.env.DSH_PROFILE_DIR)) return false
  return true
}

/**
 * @param {string} id
 * @returns {Promise<{ sessionId: string, ok: boolean, error?: string, missing?: boolean }>}
 */
async function removeSessionLog(id) {
  const directory = await findSessionDir(id)
  if (!directory) return { sessionId: id, ok: true, missing: true }
  try {
    await fs.rm(directory, { recursive: true, force: true, maxRetries: 2, retryDelay: 100 })
    return { sessionId: id, ok: true }
  } catch (error) {
    return { sessionId: id, ok: false, error: messageOf(error) }
  }
}

/**
 * Stop live agents for the target sessions before their logs are removed.
 * @param {any} ctx
 * @param {string[]} ids
 */
async function stopLiveAgents(ctx, ids) {
  const agents = ctx.get('agents')
  if (!agents) return
  for (const id of ids) {
    let agent
    try {
      agent = agents.get(id)
    } catch {
      continue
    }
    if (!agent) continue
    try {
      if (typeof agent.cancel === 'function') agent.cancel({ kind: 'user' })
    } catch {
      /* a cancelled or disposed agent is already stopped */
    }
    try {
      if (typeof agent.whenIdle === 'function') {
        await Promise.race([
          agent.whenIdle(),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ])
      }
    } catch {
      /* idle wait is best effort */
    }
  }
}

/**
 * Execute one pending entry. Safe to call again after a partial failure.
 * @param {any} ctx
 * @param {Record<string, any>} entry
 * @returns {Promise<Record<string, unknown>>}
 */
async function executePurge(ctx, entry) {
  const sessionId = String(entry.id)
  const sessionIds = Array.isArray(entry.sessionIds) && entry.sessionIds.length > 0
    ? entry.sessionIds.map(String)
    : [sessionId]
  const warnings = []

  await stopLiveAgents(ctx, sessionIds)

  for (const workspace of ctx.workspaceRegistry.list()) {
    if (!Array.isArray(workspace.sessionIds) || !workspace.sessionIds.includes(sessionId)) continue
    try {
      await workspace.detachSession(sessionId)
    } catch (error) {
      warnings.push(`从工作区「${workspace.title}」移除失败：${messageOf(error)}`)
    }
  }
  try {
    await ctx.workspaceRegistry.unarchiveSession(sessionId)
  } catch (error) {
    warnings.push(`取消归档失败：${messageOf(error)}`)
  }
  try {
    await ctx.workspaceRegistry.unpinSession(sessionId)
  } catch (error) {
    warnings.push(`取消置顶失败：${messageOf(error)}`)
  }

  const sessions = []
  const pending = []
  for (const id of sessionIds) {
    const result = await removeSessionLog(id)
    sessions.push(result)
    if (!result.ok) pending.push({ kind: 'session', id, error: result.error })
  }

  const documents = []
  const requestedDocuments = Array.isArray(entry.documents) ? entry.documents : []
  for (const documentPath of requestedDocuments) {
    if (typeof documentPath !== 'string') continue
    if (!isDocumentPathAllowed(documentPath)) {
      documents.push({ path: documentPath, ok: false, error: '路径不在可删除范围内' })
      pending.push({ kind: 'document', id: documentPath, error: '路径不在可删除范围内' })
      continue
    }
    try {
      const stat = await fs.lstat(documentPath)
      if (!stat.isFile()) {
        documents.push({ path: documentPath, ok: false, error: '不是普通文件' })
        pending.push({ kind: 'document', id: documentPath, error: '不是普通文件' })
        continue
      }
      await fs.unlink(documentPath)
      documents.push({ path: documentPath, ok: true })
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        documents.push({ path: documentPath, ok: true, missing: true })
        continue
      }
      documents.push({ path: documentPath, ok: false, error: messageOf(error) })
      pending.push({ kind: 'document', id: documentPath, error: messageOf(error) })
    }
  }

  const attachments = []
  const requestedAttachments = Array.isArray(entry.attachments) ? entry.attachments : []
  for (const attachmentId of requestedAttachments) {
    const objectPath = attachmentObjectPath(String(attachmentId))
    if (!objectPath) {
      attachments.push({ id: String(attachmentId), ok: false, error: '无法识别的附件 id' })
      pending.push({ kind: 'attachment', id: String(attachmentId), error: '无法识别的附件 id' })
      continue
    }
    if (!isInside(objectPath, ATTACHMENTS_ROOT)) {
      attachments.push({ id: String(attachmentId), ok: false, error: '附件路径越界' })
      pending.push({ kind: 'attachment', id: String(attachmentId), error: '附件路径越界' })
      continue
    }
    try {
      await fs.unlink(objectPath)
      attachments.push({ id: String(attachmentId), ok: true })
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        attachments.push({ id: String(attachmentId), ok: true, missing: true })
        continue
      }
      attachments.push({ id: String(attachmentId), ok: false, error: messageOf(error) })
      pending.push({ kind: 'attachment', id: String(attachmentId), error: messageOf(error) })
    }
  }

  // Best effort: drop the session's title/statistics cache row through the
  // open storage domain, so no visible title is left behind.
  try {
    const domain = ctx.get('storageDomain') && ctx.get('storageDomain').get('session_projcache')
    if (domain) await domain.table('sessions').delete(sessionId)
  } catch {
    /* the cache is derived state; leave it when the domain is unavailable */
  }

  return {
    deleted: {
      sessions,
      documents,
      attachments,
    },
    pending,
    warnings,
  }
}

/**
 * Retry every tombstoned deletion, once, shortly after startup.
 * @param {any} ctx
 */
async function retryPending(ctx) {
  let entries
  try {
    entries = await readManifest()
  } catch {
    return
  }
  for (const entry of entries) {
    if (!entry || typeof entry.id !== 'string') continue
    try {
      const result = await exclusive(() => executePurge(ctx, entry))
      if (result.pending.length === 0) await removePending(entry.id)
    } catch {
      /* keep the tombstone for the next startup */
    }
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * @param {any} ctx
 * @returns {Promise<Record<string, unknown>>}
 */
async function listPayload(ctx) {
  const persistence = ctx.get('sessionPersistence')
  const [records, snapshots, workspaces, pending] = await Promise.all([
    ctx.sessionQuery.listSessions(),
    persistence ? persistence.list().catch(() => []) : Promise.resolve([]),
    Promise.resolve(ctx.workspaceRegistry.list()),
    readManifest(),
  ])
  const hidden = new Set(pending.map((entry) => entry.id))
  const sizes = new Map()
  for (const snapshot of snapshots) sizes.set(snapshot.header.id, typeof snapshot.sizeBytes === 'number' ? snapshot.sizeBytes : 0)
  const visibleIds = records.map((record) => record.header.id).filter((id) => !hidden.has(id))
  const titles = await readTitles(ctx, visibleIds)
  const byId = new Map(records.map((record) => [record.header.id, record]))

  const claimed = new Set()
  const groups = []
  for (const workspace of workspaces) {
    const sessions = []
    for (const id of workspace.sessionIds || []) {
      const record = byId.get(id)
      if (!record || hidden.has(id)) continue
      claimed.add(id)
      sessions.push(sessionRow(record, titles, sizes))
    }
    if (sessions.length > 0) {
      groups.push({ id: workspace.id, title: workspace.title, path: workspace.path, sessions })
    }
  }

  const orphans = []
  const orphanSubagents = []
  for (const record of records) {
    const id = record.header.id
    if (claimed.has(id) || hidden.has(id)) continue
    const row = sessionRow(record, titles, sizes)
    if (record.header.origin === 'subagent') {
      const parent = record.header.parentSession
      if (parent && byId.has(parent) && !hidden.has(parent)) continue
      orphanSubagents.push(row)
    } else {
      orphans.push(row)
    }
  }

  let totalBytes = 0
  for (const record of records) {
    if (hidden.has(record.header.id)) continue
    totalBytes += sizes.get(record.header.id) || 0
  }

  return {
    ok: true,
    groups,
    orphans,
    orphanSubagents,
    totals: {
      sessions: visibleIds.length,
      bytes: totalBytes,
      pending: pending.length,
    },
  }
}

/**
 * @param {any} ctx
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handlePreview(ctx, request) {
  try {
    const body = await readBody(request)
    const sessionId = normalizeSessionId(body.sessionId)
    if (!sessionId) return jsonResponse({ ok: false, error: '缺少有效的 sessionId' }, 400)
    const preview = await buildPreview(ctx, sessionId, { includeScan: body.includeScan === true })
    return jsonResponse(preview)
  } catch (error) {
    const message = messageOf(error)
    return jsonResponse({ ok: false, error: message }, message === '找不到该对话' ? 404 : 500)
  }
}

/**
 * @param {any} ctx
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleDelete(ctx, request) {
  try {
    const body = await readBody(request)
    const sessionId = normalizeSessionId(body.sessionId)
    if (!sessionId) return jsonResponse({ ok: false, error: '缺少有效的 sessionId' }, 400)
    const mode = body.mode === 'everything' ? 'everything' : 'chat'

    return await exclusive(async () => {
      const preview = await buildPreview(ctx, sessionId, { includeScan: mode === 'everything' })

      const allowedDocuments = new Map(
        preview.documents.concat(preview.scanned || []).map((doc) => [canonicalPath(doc.path), doc.path]),
      )
      const requestedDocuments = []
      if (mode === 'everything' && Array.isArray(body.documents)) {
        const seen = new Set()
        for (const candidate of body.documents) {
          if (typeof candidate !== 'string') continue
          const allowed = allowedDocuments.get(canonicalPath(candidate))
          if (!allowed || seen.has(canonicalPath(allowed))) continue
          seen.add(canonicalPath(allowed))
          requestedDocuments.push(allowed)
        }
      }

      const allowedAttachments = new Map(
        preview.attachments.filter((item) => !item.shared).map((item) => [item.id, item]),
      )
      const requestedAttachments = []
      if (mode === 'everything' && Array.isArray(body.attachments)) {
        const seen = new Set()
        for (const candidate of body.attachments) {
          if (typeof candidate !== 'string' || seen.has(candidate)) continue
          if (!allowedAttachments.has(candidate)) continue
          seen.add(candidate)
          requestedAttachments.push(candidate)
        }
      }

      const entry = {
        id: sessionId,
        sessionIds: [sessionId, ...preview.subagents.map((item) => item.id)],
        documents: requestedDocuments,
        attachments: requestedAttachments,
        createdAt: Date.now(),
      }
      await upsertPending(entry)
      const result = await executePurge(ctx, entry)
      if (result.pending.length === 0) await removePending(sessionId)
      return jsonResponse({ ok: true, mode, session: preview.session, ...result })
    })
  } catch (error) {
    const message = messageOf(error)
    return jsonResponse({ ok: false, error: message }, message === '找不到该对话' ? 404 : 500)
  }
}

// ---------------------------------------------------------------------------
// Plugin entry
// ---------------------------------------------------------------------------

/**
 * @param {any} ctx
 */
export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_LIST,
        methods: ['GET'],
        requestBody: 'buffered',
        fetch: async () => {
          try {
            return jsonResponse(await listPayload(ctx))
          } catch (error) {
            return jsonResponse({ ok: false, error: messageOf(error) }, 500)
          }
        },
      }),
    'conversation-purge: list route',
  )

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_PREVIEW,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: (request) => handlePreview(ctx, request),
      }),
    'conversation-purge: preview route',
  )

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_DELETE,
        methods: ['POST'],
        requestBody: 'buffered',
        fetch: (request) => handleDelete(ctx, request),
      }),
    'conversation-purge: delete route',
  )

  ctx.effect(() => {
    const timer = setTimeout(() => {
      void retryPending(ctx)
    }, 3000)
    return () => clearTimeout(timer)
  }, 'conversation-purge: retry pending deletions')
}
