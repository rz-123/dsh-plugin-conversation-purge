window.__ModuleLoader__.load({
  id: '@local/dsh-conversation-purge',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const PANEL_ID = 'conversation-purge'
    const NS = 'conversation-purge'

    const DICT = {
      zh: {
        entry: '对话清理',
        title: '对话清理',
        subtitle: '彻底删除对话记录；可选择同时删除该对话创建的文档、附件与子代理记录。',
        refresh: '刷新',
        searchPlaceholder: '搜索标题、路径或会话 ID',
        noResults: '没有匹配的对话',
        searchResults: '搜索结果',
        emptyTitle: '还没有可清理的对话',
        emptyBody: '打开过对话后，它们会出现在这里。',
        loading: '正在读取对话列表…',
        loadFailed: '读取对话列表失败',
        retry: '重试',
        groupOther: '未归类对话',
        groupOrphans: '孤立子代理会话',
        liveBadge: '使用中',
        subagentBadge: '子代理',
        delete: '删除',
        totalSessions: '共 {count} 个对话 · {size}',
        pendingNote: '{count} 个删除任务将在下次启动时继续清理',
        dialogTitle: '永久删除对话',
        dialogDesc: '此操作不可恢复。请选择要删除的范围。',
        modeChatTitle: '仅删除对话与聊天记录',
        modeChatBody: '删除会话日志和隐藏的子代理聊天记录，并从工作区列表移除。文档与附件保留。',
        modeAllTitle: '对话、文档与附件一并删除',
        modeAllBody: '在上一项的基础上，再删除该对话交付或创建的文件，以及仅被该对话使用的附件。',
        previewLoading: '正在分析该对话产生的文件…',
        previewFailed: '分析失败',
        analysis: '分析结果',
        docsTitle: '文档',
        attachmentsTitle: '附件',
        subagentsTitle: '子代理会话',
        docsEmpty: '未发现该对话创建或交付的文件',
        attachmentsEmpty: '未发现该对话使用的附件',
        sharedBadge: '其他对话仍在用',
        missingBadge: '已不存在',
        sourceDelivered: '交付',
        sourceWritten: '写入',
        sourceEdited: '修改',
        sourceScanned: '推测',
        scanToggle: '额外扫描该对话时间段内工作目录中新建的文件（推测，默认不勾选）',
        selectAll: '全选',
        selectNone: '全不选',
        subagentNote: '将一并删除 {count} 个子代理会话记录。',
        warning: '删除后无法恢复，也无法从回收站找回。',
        cancel: '取消',
        confirm: '永久删除',
        confirmAll: '永久删除对话与 {count} 个文件',
        deleting: '正在删除…',
        deleteFailed: '删除失败',
        toastDeleted: '已永久删除对话「{title}」',
        toastFiles: '，删除 {count} 个文件',
        toastPending: '，{count} 项因占用将在下次启动时继续清理',
        close: '关闭',
        liveNote: '该对话仍在内存中，删除时会先停止它的运行。',
        documentsCount: '{count} 个文件 · {size}',
      },
      en: {
        entry: 'Purge conversations',
        title: 'Conversation purge',
        subtitle: 'Permanently delete conversations, optionally together with the documents, attachments and subagent records they produced.',
        refresh: 'Refresh',
        searchPlaceholder: 'Search title, path or session id',
        noResults: 'No matching conversations',
        searchResults: 'Search results',
        emptyTitle: 'Nothing to purge yet',
        emptyBody: 'Conversations appear here after they have been opened.',
        loading: 'Loading conversations…',
        loadFailed: 'Failed to load conversations',
        retry: 'Retry',
        groupOther: 'Unassigned conversations',
        groupOrphans: 'Orphaned subagent sessions',
        liveBadge: 'In use',
        subagentBadge: 'Subagent',
        delete: 'Delete',
        totalSessions: '{count} conversations · {size}',
        pendingNote: '{count} deletion tasks will finish on the next start',
        dialogTitle: 'Delete conversation permanently',
        dialogDesc: 'This cannot be undone. Choose what should be removed.',
        modeChatTitle: 'Conversation and chat history only',
        modeChatBody: 'Deletes the session log and hidden subagent chat records and removes the conversation from its workspace. Documents and attachments stay.',
        modeAllTitle: 'Conversation, documents and attachments',
        modeAllBody: 'Also deletes the files this conversation delivered or created, and the attachments only it uses.',
        previewLoading: 'Analyzing files produced by this conversation…',
        previewFailed: 'Analysis failed',
        analysis: 'Analysis',
        docsTitle: 'Documents',
        attachmentsTitle: 'Attachments',
        subagentsTitle: 'Subagent sessions',
        docsEmpty: 'No files created or delivered by this conversation',
        attachmentsEmpty: 'No attachments used by this conversation',
        sharedBadge: 'Still used elsewhere',
        missingBadge: 'Already gone',
        sourceDelivered: 'Delivered',
        sourceWritten: 'Written',
        sourceEdited: 'Edited',
        sourceScanned: 'Guessed',
        scanToggle: 'Also scan files created in the working directory during this conversation (heuristic, off by default)',
        selectAll: 'Select all',
        selectNone: 'Select none',
        subagentNote: '{count} subagent session records will also be deleted.',
        warning: 'Deleted data cannot be recovered.',
        cancel: 'Cancel',
        confirm: 'Delete permanently',
        confirmAll: 'Delete conversation and {count} files',
        deleting: 'Deleting…',
        deleteFailed: 'Deletion failed',
        toastDeleted: 'Permanently deleted “{title}”',
        toastFiles: ', {count} files removed',
        toastPending: ', {count} items will finish on the next start',
        close: 'Close',
        liveNote: 'This conversation is still in memory; its work is stopped before deletion.',
        documentsCount: '{count} files · {size}',
      },
    }

    const CSS = `
.cp-page {
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  padding: 28px 32px 56px;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-base);
}
.cp-shell { max-width: 900px; margin: 0 auto; }
.cp-head { display: flex; align-items: flex-start; gap: 16px; justify-content: space-between; }
.cp-title { margin: 0; font-size: 20px; font-weight: 600; line-height: 28px; letter-spacing: .01em; }
.cp-sub { margin: 6px 0 0; font-size: 13px; line-height: 20px; color: var(--dsw-alias-label-secondary); max-width: 620px; }
.cp-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 32px; padding: 0 12px; border-radius: 8px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; cursor: pointer;
}
.cp-btn:hover { border-color: var(--dsw-alias-border-l2); }
.cp-btn:disabled { opacity: .55; cursor: default; }
.cp-btn-icon { width: 32px; padding: 0; justify-content: center; }
.cp-toolbar { display: flex; align-items: center; gap: 12px; margin: 22px 0 18px; }
.cp-search {
  flex: 1; height: 36px; box-sizing: border-box;
  padding: 0 12px; border-radius: 9px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 13px; outline: none;
}
.cp-search:focus { border-color: var(--dsw-alias-brand-primary); }
.cp-search::placeholder { color: var(--dsw-alias-label-secondary); }
.cp-total { font-size: 12px; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.cp-group { margin: 0 0 22px; }
.cp-group-head { display: flex; align-items: baseline; gap: 10px; padding: 0 4px 8px; }
.cp-group-title { font-size: 13px; font-weight: 600; }
.cp-group-path { min-width: 0; font-size: 12px; color: var(--dsw-alias-label-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-group-count { margin-left: auto; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cp-list { display: flex; flex-direction: column; gap: 2px; }
.cp-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  border: 1px solid transparent;
}
.cp-row:hover { background: var(--dsw-alias-bg-layer-1); border-color: var(--dsw-alias-border-l1); }
.cp-row-main { min-width: 0; flex: 1; }
.cp-row-title-line { display: flex; align-items: center; gap: 8px; min-width: 0; }
.cp-row-title { min-width: 0; font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cp-row-meta { display: flex; align-items: center; gap: 12px; margin-top: 3px; font-size: 12px; color: var(--dsw-alias-label-secondary); min-width: 0; }
.cp-row-meta > span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cp-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.cp-badge {
  flex: none; display: inline-flex; align-items: center;
  height: 18px; padding: 0 6px; border-radius: 5px;
  font-size: 11px; line-height: 1;
  border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-secondary);
}
.cp-badge-live { color: var(--dsw-alias-state-warn-primary); border-color: var(--dsw-alias-state-warn-primary); }
.cp-del {
  flex: none; display: inline-flex; align-items: center; gap: 5px;
  height: 30px; padding: 0 10px; border-radius: 8px;
  border: 1px solid transparent; background: transparent;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer;
}
.cp-row:hover .cp-del { border-color: var(--dsw-alias-border-l1); }
.cp-del:hover { color: var(--dsw-alias-state-error-primary); border-color: var(--dsw-alias-state-error-primary); }
.cp-empty { padding: 56px 24px; text-align: center; border: 1px dashed var(--dsw-alias-border-l1); border-radius: 12px; }
.cp-empty-title { font-size: 14px; font-weight: 500; }
.cp-empty-body { margin-top: 6px; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cp-error { margin-top: 18px; padding: 12px 14px; border-radius: 10px; font-size: 13px; border: 1px solid var(--dsw-alias-state-error-primary); color: var(--dsw-alias-state-error-primary); }
.cp-loading { display: flex; align-items: center; gap: 10px; padding: 40px 4px; color: var(--dsw-alias-label-secondary); font-size: 13px; }
.cp-spinner {
  width: 16px; height: 16px; border-radius: 50%; flex: none;
  border: 2px solid var(--dsw-alias-border-l1);
  border-top-color: var(--dsw-alias-brand-primary);
  animation: cp-spin .8s linear infinite;
}
@keyframes cp-spin { to { transform: rotate(360deg); } }
.cp-overlay {
  position: fixed; inset: 0; z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 24px; background: rgba(0, 0, 0, .45);
}
.cp-dialog {
  width: min(680px, 100%); max-height: min(84vh, 760px);
  display: flex; flex-direction: column;
  background: var(--dsw-alias-bg-overlay);
  border: 1px solid var(--dsw-alias-border-l1);
  border-radius: 14px;
  box-shadow: 0 24px 64px color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent);
  outline: none;
}
.cp-dialog-head { padding: 20px 22px 0; }
.cp-dialog-title { margin: 0; font-size: 16px; font-weight: 600; }
.cp-dialog-desc { margin: 6px 0 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.cp-dialog-body { padding: 18px 22px; overflow: auto; flex: 1; }
.cp-dialog-foot {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 22px; border-top: 1px solid var(--dsw-alias-border-l1);
}
.cp-dialog-foot .cp-warning { margin-right: auto; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cp-mode {
  width: 100%; display: flex; gap: 10px; align-items: flex-start; text-align: left;
  padding: 12px 14px; margin-bottom: 8px; border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary); font: inherit; cursor: pointer;
}
.cp-mode[aria-checked="true"] { border-color: var(--dsw-alias-brand-primary); box-shadow: 0 0 0 1px var(--dsw-alias-brand-primary) inset; }
.cp-mode-dot {
  flex: none; width: 15px; height: 15px; margin-top: 2px; border-radius: 50%;
  border: 1.5px solid var(--dsw-alias-border-l2); box-sizing: border-box;
}
.cp-mode[aria-checked="true"] .cp-mode-dot { border: 4.5px solid var(--dsw-alias-brand-primary); }
.cp-mode-text { min-width: 0; }
.cp-mode-title { display: block; font-size: 13px; font-weight: 500; }
.cp-mode-body { display: block; margin-top: 3px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.cp-section { margin-top: 18px; }
.cp-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.cp-section-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--dsw-alias-label-secondary); }
.cp-section-count { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.cp-link {
  margin-left: auto; border: none; background: none; padding: 0 4px;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer;
}
.cp-link:hover { color: var(--dsw-alias-label-primary); }
.cp-check {
  display: flex; align-items: flex-start; gap: 9px;
  padding: 7px 8px; border-radius: 8px; font-size: 12px; line-height: 18px;
}
.cp-check:hover { background: var(--dsw-alias-bg-layer-1); }
.cp-check input { margin: 2px 0 0; accent-color: var(--dsw-alias-brand-primary); flex: none; }
.cp-check-main { min-width: 0; flex: 1; }
.cp-check-path { display: block; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; word-break: break-all; }
.cp-check-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px; color: var(--dsw-alias-label-secondary); }
.cp-check-size { margin-left: auto; color: var(--dsw-alias-label-secondary); white-space: nowrap; }
.cp-hint { margin: 6px 2px 0; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.cp-subagents { padding: 10px 12px; border-radius: 9px; background: var(--dsw-alias-bg-layer-1); font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); }
.cp-btn-danger {
  height: 34px; padding: 0 14px; border-radius: 8px; font: inherit; font-size: 13px; cursor: pointer;
  border: 1px solid var(--dsw-alias-state-error-primary);
  background: var(--dsw-alias-state-error-primary);
  color: var(--dsw-alias-bg-base);
}
.cp-btn-danger:disabled { opacity: .55; cursor: default; }
.cp-btn-primary {
  height: 34px; padding: 0 14px; border-radius: 8px; font: inherit; font-size: 13px; cursor: pointer;
  border: 1px solid var(--dsw-alias-brand-primary);
  background: var(--dsw-alias-brand-primary);
  color: var(--dsw-alias-bg-base);
}
.cp-btn-primary:disabled { opacity: .55; cursor: default; }
.cp-toast {
  position: fixed; left: 50%; bottom: 26px; transform: translateX(-50%);
  z-index: 1100; max-width: min(640px, calc(100vw - 48px));
  padding: 10px 16px; border-radius: 10px; font-size: 13px; line-height: 20px;
  background: var(--dsw-alias-bg-overlay);
  border: 1px solid var(--dsw-alias-border-l1);
  color: var(--dsw-alias-label-primary);
  box-shadow: 0 12px 32px color-mix(in srgb, var(--dsw-alias-label-primary) 18%, transparent);
}
`

    /**
     * @param {string} text
     * @param {Record<string, string | number>} params
     */
    function fill(text, params) {
      return String(text).replace(/\{(\w+)\}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
      )
    }

    /**
     * @param {number} bytes
     */
    function formatBytes(bytes) {
      if (!bytes || bytes < 0) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let value = bytes
      let unit = 0
      while (value >= 1024 && unit < units.length - 1) {
        value /= 1024
        unit += 1
      }
      return `${unit === 0 ? Math.round(value) : value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`
    }

    /**
     * @param {number} ms
     */
    function formatDate(ms) {
      if (!ms) return '—'
      const date = new Date(ms)
      const pad = (value) => String(value).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    /**
     * @param {string} url
     * @param {Record<string, unknown> | undefined} body
     */
    async function call(url, body) {
      const init = body === undefined
        ? { cache: 'no-store' }
        : {
            method: 'POST',
            cache: 'no-store',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          }
      const response = await fetch(url, init)
      const text = await response.text()
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(text.slice(0, 300) || `HTTP ${response.status}`)
      }
      if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`)
      return data
    }

    const ICON_TRASH = [
      h('path', { key: 'a', d: 'M4 7h16' }),
      h('path', { key: 'b', d: 'M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7' }),
      h('path', { key: 'c', d: 'M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7' }),
      h('path', { key: 'd', d: 'M10.5 11v5M13.5 11v5' }),
    ]

    function TrashIcon(props) {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: props.size || 16,
          height: props.size || 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block', flex: 'none' },
        },
        ICON_TRASH,
      )
    }

    function RefreshIcon() {
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: 16,
          height: 16,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          style: { display: 'block', flex: 'none' },
        },
        h('path', { d: 'M20 12a8 8 0 1 1-2.34-5.66' }),
        h('path', { d: 'M20 4v5h-5' }),
      )
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, 'zh', DICT.zh), 'conversation-purge: zh dictionary')
        ctx.effect(() => ctx.locale.register(NS, 'en', DICT.en), 'conversation-purge: en dictionary')

        const t = ctx.locale.bind(NS)
        const tf = (key, params) => fill(t(key), params || {})

        /**
         * Re-render on locale change so every label follows the active language.
         */
        function useLocaleTick() {
          const [, bump] = React.useState(0)
          React.useEffect(() => {
            const unsubscribe = ctx.locale.subscribe(() => bump((value) => value + 1))
            return subscribeCleanup(unsubscribe)
          }, [])
        }

        function subscribeCleanup(value) {
          return typeof value === 'function' ? value : () => {}
        }

        function SidebarEntry(props) {
          useLocaleTick()
          const size = props && props.size ? props.size : 20
          return h(
            'svg',
            {
              viewBox: '0 0 24 24',
              width: size,
              height: size,
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 1.7,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-hidden': true,
              style: { display: 'block' },
            },
            ICON_TRASH,
          )
        }

        function SessionRow(props) {
          const row = props.row
          return h(
            'div',
            { className: 'cp-row' },
            h(
              'div',
              { className: 'cp-row-main' },
              h(
                'div',
                { className: 'cp-row-title-line' },
                h('span', { className: 'cp-row-title', title: row.title }, row.title),
                row.live ? h('span', { className: 'cp-badge cp-badge-live' }, t('liveBadge')) : null,
                row.kind === 'subagent' ? h('span', { className: 'cp-badge' }, t('subagentBadge')) : null,
              ),
              h(
                'div',
                { className: 'cp-row-meta' },
                h('span', null, formatDate(row.createdAt)),
                row.sizeBytes > 0 ? h('span', null, formatBytes(row.sizeBytes)) : null,
                row.cwd ? h('span', { className: 'cp-mono', title: row.cwd }, row.cwd) : null,
              ),
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'cp-del',
                onClick: () => props.onDelete(row),
                'aria-label': `${t('delete')} ${row.title}`,
              },
              h(TrashIcon, { size: 14 }),
              h('span', null, t('delete')),
            ),
          )
        }

        function Group(props) {
          const group = props.group
          return h(
            'section',
            { className: 'cp-group' },
            h(
              'div',
              { className: 'cp-group-head' },
              h('span', { className: 'cp-group-title' }, group.title),
              group.path ? h('span', { className: 'cp-group-path', title: group.path }, group.path) : null,
              h('span', { className: 'cp-group-count' }, String(group.sessions.length)),
            ),
            h(
              'div',
              { className: 'cp-list' },
              group.sessions.map((row) => h(SessionRow, { key: row.id, row, onDelete: props.onDelete })),
            ),
          )
        }

        function PurgeDialog(props) {
          useLocaleTick()
          const row = props.row
          const [mode, setMode] = React.useState('chat')
          const [preview, setPreview] = React.useState(null)
          const [previewError, setPreviewError] = React.useState('')
          const [previewNonce, setPreviewNonce] = React.useState(0)
          const [includeScan, setIncludeScan] = React.useState(false)
          const [selectedDocs, setSelectedDocs] = React.useState(new Set())
          const [selectedAttachments, setSelectedAttachments] = React.useState(new Set())
          const [busy, setBusy] = React.useState(false)
          const [failure, setFailure] = React.useState('')
          const dialogRef = React.useRef(null)

          React.useEffect(() => {
            const onKey = (event) => {
              if (event.key === 'Escape' && !busy) props.onClose()
            }
            document.addEventListener('keydown', onKey)
            const previousOverflow = document.body.style.overflow
            document.body.style.overflow = 'hidden'
            if (dialogRef.current && typeof dialogRef.current.focus === 'function') dialogRef.current.focus()
            return () => {
              document.removeEventListener('keydown', onKey)
              document.body.style.overflow = previousOverflow
            }
          }, [busy])

          React.useEffect(() => {
            if (mode !== 'everything') return undefined
            let cancelled = false
            setPreview(null)
            setPreviewError('')
            call('api/conversation-purge.preview', { sessionId: row.id, includeScan })
              .then((data) => {
                if (cancelled) return
                setPreview(data)
                setSelectedDocs(new Set(data.documents.filter((doc) => doc.exists && doc.created).map((doc) => doc.path)))
                setSelectedAttachments(new Set(data.attachments.filter((item) => item.exists && !item.shared).map((item) => item.id)))
              })
              .catch((error) => {
                if (!cancelled) setPreviewError(error.message)
              })
            return () => {
              cancelled = true
            }
          }, [mode, includeScan, previewNonce, row.id])

          const documentRows = preview
            ? preview.documents.concat(preview.scanned).slice().sort((left, right) => left.display.localeCompare(right.display))
            : []
          const attachmentRows = preview ? preview.attachments : []

          const toggleDoc = (doc) => {
            if (!doc.exists) return
            setSelectedDocs((current) => {
              const next = new Set(current)
              if (next.has(doc.path)) next.delete(doc.path)
              else next.add(doc.path)
              return next
            })
          }
          const toggleAttachment = (item) => {
            if (!item.exists || item.shared) return
            setSelectedAttachments((current) => {
              const next = new Set(current)
              if (next.has(item.id)) next.delete(item.id)
              else next.add(item.id)
              return next
            })
          }
          const selectAll = () => {
            setSelectedDocs(new Set(documentRows.filter((doc) => doc.exists).map((doc) => doc.path)))
            setSelectedAttachments(new Set(attachmentRows.filter((item) => item.exists && !item.shared).map((item) => item.id)))
          }
          const selectNone = () => {
            setSelectedDocs(new Set())
            setSelectedAttachments(new Set())
          }

          const busyBlocked = busy || (mode === 'everything' && (!preview || Boolean(previewError)))
          const selectedCount = mode === 'everything' ? selectedDocs.size + selectedAttachments.size : 0

          const confirm = async () => {
            if (busyBlocked) return
            setBusy(true)
            setFailure('')
            try {
              const payload = {
                sessionId: row.id,
                mode,
                documents: mode === 'everything' ? [...selectedDocs] : [],
                attachments: mode === 'everything' ? [...selectedAttachments] : [],
              }
              const result = await call('api/conversation-purge.delete', payload)
              props.onDone(result, row)
            } catch (error) {
              setFailure(error.message)
              setBusy(false)
            }
          }

          const modeCard = (key, title, body) =>
            h(
              'button',
              {
                type: 'button',
                className: 'cp-mode',
                role: 'radio',
                'aria-checked': mode === key,
                onClick: () => {
                  if (busy) return
                  setMode(key)
                  setFailure('')
                },
              },
              h('span', { className: 'cp-mode-dot', 'aria-hidden': true }),
              h(
                'span',
                { className: 'cp-mode-text' },
                h('span', { className: 'cp-mode-title' }, title),
                h('span', { className: 'cp-mode-body' }, body),
              ),
            )

          const badge = (text, tone) =>
            h('span', { className: 'cp-badge' + (tone ? ` cp-badge-${tone}` : '') }, text)

          const sourceLabel = (doc) => {
            if (doc.source === 'delivered') return t('sourceDelivered')
            if (doc.source === 'written') return t('sourceWritten')
            if (doc.source === 'edited') return t('sourceEdited')
            return t('sourceScanned')
          }

          return h(
            'div',
            {
              className: 'cp-overlay',
              onMouseDown: (event) => {
                if (event.target === event.currentTarget && !busy) props.onClose()
              },
            },
            h(
              'div',
              {
                className: 'cp-dialog',
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': 'cp-dialog-title',
                tabIndex: -1,
                ref: dialogRef,
              },
              h(
                'div',
                { className: 'cp-dialog-head' },
                h('h2', { className: 'cp-dialog-title', id: 'cp-dialog-title' }, t('dialogTitle')),
                h('p', { className: 'cp-dialog-desc' }, `${row.title} · ${t('dialogDesc')}`),
                row.live ? h('p', { className: 'cp-hint' }, t('liveNote')) : null,
              ),
              h(
                'div',
                { className: 'cp-dialog-body' },
                h('div', { role: 'radiogroup', 'aria-label': t('dialogTitle') },
                  modeCard('chat', t('modeChatTitle'), t('modeChatBody')),
                  modeCard('everything', t('modeAllTitle'), t('modeAllBody')),
                ),
                mode === 'everything'
                  ? h(
                      'div',
                      { className: 'cp-section' },
                      previewError
                        ? h(
                            'div',
                            { className: 'cp-error' },
                            `${t('previewFailed')}: ${previewError} `,
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'cp-link',
                                onClick: () => setPreviewNonce((value) => value + 1),
                              },
                              t('retry'),
                            ),
                          )
                        : !preview
                          ? h(
                              'div',
                              { className: 'cp-loading' },
                              h('span', { className: 'cp-spinner', 'aria-hidden': true }),
                              t('previewLoading'),
                            )
                          : h(
                              React.Fragment,
                              null,
                              h(
                                'div',
                                { className: 'cp-section-head' },
                                h('span', { className: 'cp-section-title' }, t('analysis')),
                                documentRows.length > 0
                                  ? h('span', { className: 'cp-section-count' },
                                      fill(t('documentsCount'), {
                                        count: documentRows.length,
                                        size: formatBytes(documentRows.reduce((total, doc) => total + (doc.exists ? doc.sizeBytes : 0), 0)),
                                      }))
                                  : null,
                                h(
                                  'button',
                                  { type: 'button', className: 'cp-link', onClick: selectAll },
                                  t('selectAll'),
                                ),
                                h(
                                  'button',
                                  { type: 'button', className: 'cp-link', onClick: selectNone },
                                  t('selectNone'),
                                ),
                              ),
                              h(
                                'label',
                                { className: 'cp-check' },
                                h('input', {
                                  type: 'checkbox',
                                  checked: includeScan,
                                  onChange: () => setIncludeScan((value) => !value),
                                }),
                                h(
                                  'span',
                                  { className: 'cp-check-main' },
                                  h('span', null, t('scanToggle')),
                                ),
                              ),
                              h(
                                'div',
                                { className: 'cp-section' },
                                h(
                                  'div',
                                  { className: 'cp-section-head' },
                                  h('span', { className: 'cp-section-title' }, t('docsTitle')),
                                  h('span', { className: 'cp-section-count' }, String(documentRows.length)),
                                ),
                                documentRows.length === 0
                                  ? h('p', { className: 'cp-hint' }, t('docsEmpty'))
                                  : documentRows.map((doc) =>
                                      h(
                                        'label',
                                        { className: 'cp-check', key: `doc:${doc.path}` },
                                        h('input', {
                                          type: 'checkbox',
                                          checked: selectedDocs.has(doc.path) && doc.exists,
                                          disabled: !doc.exists,
                                          onChange: () => toggleDoc(doc),
                                        }),
                                        h(
                                          'span',
                                          { className: 'cp-check-main' },
                                          h('span', { className: 'cp-check-path', title: doc.path }, doc.display),
                                          h(
                                            'span',
                                            { className: 'cp-check-meta' },
                                            badge(sourceLabel(doc)),
                                            doc.via && doc.via.length
                                              ? h('span', null, doc.via.filter((value) => value !== 'scan').join(' · '))
                                              : null,
                                            !doc.exists ? badge(t('missingBadge')) : null,
                                          ),
                                        ),
                                        doc.exists ? h('span', { className: 'cp-check-size' }, formatBytes(doc.sizeBytes)) : null,
                                      ),
                                    ),
                              ),
                              h(
                                'div',
                                { className: 'cp-section' },
                                h(
                                  'div',
                                  { className: 'cp-section-head' },
                                  h('span', { className: 'cp-section-title' }, t('attachmentsTitle')),
                                  h('span', { className: 'cp-section-count' }, String(attachmentRows.length)),
                                ),
                                attachmentRows.length === 0
                                  ? h('p', { className: 'cp-hint' }, t('attachmentsEmpty'))
                                  : attachmentRows.map((item) =>
                                      h(
                                        'label',
                                        { className: 'cp-check', key: `attachment:${item.id}` },
                                        h('input', {
                                          type: 'checkbox',
                                          checked: selectedAttachments.has(item.id) && item.exists && !item.shared,
                                          disabled: !item.exists || item.shared,
                                          onChange: () => toggleAttachment(item),
                                        }),
                                        h(
                                          'span',
                                          { className: 'cp-check-main' },
                                          h('span', { className: 'cp-check-path', title: item.id }, item.name),
                                          h(
                                            'span',
                                            { className: 'cp-check-meta' },
                                            item.mediaType ? h('span', null, item.mediaType) : null,
                                            item.shared ? badge(t('sharedBadge')) : null,
                                            !item.exists ? badge(t('missingBadge')) : null,
                                          ),
                                        ),
                                        item.exists ? h('span', { className: 'cp-check-size' }, formatBytes(item.bytes)) : null,
                                      ),
                                    ),
                              ),
                              preview.subagents.length > 0
                                ? h(
                                    'div',
                                    { className: 'cp-section' },
                                    h(
                                      'div',
                                      { className: 'cp-section-head' },
                                      h('span', { className: 'cp-section-title' }, t('subagentsTitle')),
                                      h('span', { className: 'cp-section-count' }, String(preview.subagents.length)),
                                    ),
                                    h(
                                      'div',
                                      { className: 'cp-subagents' },
                                      fill(t('subagentNote'), { count: preview.subagents.length }),
                                    ),
                                  )
                                : null,
                            ),
                    )
                  : null,
                failure
                  ? h('div', { className: 'cp-error' }, `${t('deleteFailed')}: ${failure}`)
                  : null,
              ),
              h(
                'div',
                { className: 'cp-dialog-foot' },
                h('span', { className: 'cp-warning' }, t('warning')),
                h(
                  'button',
                  { type: 'button', className: 'cp-btn', onClick: () => { if (!busy) props.onClose() }, disabled: busy },
                  t('cancel'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'cp-btn-danger',
                    onClick: confirm,
                    disabled: busyBlocked,
                  },
                  busy
                    ? t('deleting')
                    : mode === 'everything'
                      ? fill(t('confirmAll'), { count: selectedCount })
                      : t('confirm'),
                ),
              ),
            ),
          )
        }

        function PurgePanel() {
          useLocaleTick()
          const [status, setStatus] = React.useState('loading')
          const [data, setData] = React.useState(null)
          const [error, setError] = React.useState('')
          const [reloadKey, setReloadKey] = React.useState(0)
          const [query, setQuery] = React.useState('')
          const [activeRow, setActiveRow] = React.useState(null)
          const [toast, setToast] = React.useState('')

          React.useEffect(() => {
            let cancelled = false
            setStatus((current) => (data ? 'refreshing' : current === 'error' ? 'loading' : current))
            setError('')
            call('api/conversation-purge.list')
              .then((payload) => {
                if (cancelled) return
                setData(payload)
                setStatus('ready')
              })
              .catch((reason) => {
                if (cancelled) return
                setError(reason.message)
                setStatus('error')
              })
            return () => {
              cancelled = true
            }
          }, [reloadKey])

          React.useEffect(() => {
            if (!toast) return undefined
            const timer = setTimeout(() => setToast(''), 8000)
            return () => clearTimeout(timer)
          }, [toast])

          const onDone = (result, row) => {
            setActiveRow(null)
            const removedFiles = (result.deleted.documents || []).filter((item) => item.ok).length +
              (result.deleted.attachments || []).filter((item) => item.ok).length
            let text = fill(t('toastDeleted'), { title: row.title })
            if (removedFiles > 0) text += fill(t('toastFiles'), { count: removedFiles })
            if (result.pending && result.pending.length > 0) text += fill(t('toastPending'), { count: result.pending.length })
            setToast(text)
            setReloadKey((value) => value + 1)
          }

          const queryText = query.trim().toLowerCase()
          const matches = (row) =>
            !queryText ||
            row.title.toLowerCase().includes(queryText) ||
            row.id.toLowerCase().includes(queryText) ||
            (row.cwd || '').toLowerCase().includes(queryText)

          let groups = data ? data.groups : []
          let other = data ? data.orphans : []
          let orphanSubagents = data ? data.orphanSubagents : []
          if (queryText) {
            const flat = []
            for (const group of groups) for (const row of group.sessions) if (matches(row)) flat.push(row)
            for (const row of other) if (matches(row)) flat.push(row)
            for (const row of orphanSubagents) if (matches(row)) flat.push(row)
            groups = flat.length ? [{ id: 'search', title: t('searchResults'), sessions: flat }] : []
            other = []
            orphanSubagents = []
          }

          const totalGroups = groups.length + (other.length ? 1 : 0) + (orphanSubagents.length ? 1 : 0)

          return h(
            'div',
            { className: 'cp-page' },
            h('style', { key: 'conversation-purge-css' }, CSS),
            h(
              'div',
              { className: 'cp-shell' },
              h(
                'header',
                { className: 'cp-head' },
                h(
                  'div',
                  null,
                  h('h1', { className: 'cp-title' }, t('title')),
                  h('p', { className: 'cp-sub' }, t('subtitle')),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'cp-btn',
                    onClick: () => setReloadKey((value) => value + 1),
                    disabled: status === 'loading',
                  },
                  h(RefreshIcon),
                  t('refresh'),
                ),
              ),
              h(
                'div',
                { className: 'cp-toolbar' },
                h('input', {
                  className: 'cp-search',
                  type: 'search',
                  value: query,
                  placeholder: t('searchPlaceholder'),
                  'aria-label': t('searchPlaceholder'),
                  onChange: (event) => setQuery(event.target.value),
                }),
                data
                  ? h(
                      'span',
                      { className: 'cp-total' },
                      fill(t('totalSessions'), {
                        count: data.totals.sessions,
                        size: formatBytes(data.totals.bytes),
                      }),
                    )
                  : null,
              ),
              status === 'loading'
                ? h(
                    'div',
                    { className: 'cp-loading' },
                    h('span', { className: 'cp-spinner', 'aria-hidden': true }),
                    t('loading'),
                  )
                : status === 'error'
                  ? h(
                      'div',
                      { className: 'cp-error' },
                      `${t('loadFailed')}: ${error} `,
                      h(
                        'button',
                        { type: 'button', className: 'cp-link', onClick: () => setReloadKey((value) => value + 1) },
                        t('retry'),
                      ),
                    )
                  : totalGroups === 0
                    ? h(
                        'div',
                        { className: 'cp-empty' },
                        h('div', { className: 'cp-empty-title' }, queryText ? t('noResults') : t('emptyTitle')),
                        h('div', { className: 'cp-empty-body' }, queryText ? '' : t('emptyBody')),
                      )
                    : h(
                        React.Fragment,
                        null,
                        groups.map((group) => h(Group, { key: group.id, group, onDelete: setActiveRow })),
                        other.length
                          ? h(Group, {
                              key: 'cp-other',
                              group: { id: 'cp-other', title: t('groupOther'), path: '', sessions: other },
                              onDelete: setActiveRow,
                            })
                          : null,
                        orphanSubagents.length
                          ? h(Group, {
                              key: 'cp-orphan-subagents',
                              group: { id: 'cp-orphan-subagents', title: t('groupOrphans'), path: '', sessions: orphanSubagents },
                              onDelete: setActiveRow,
                            })
                          : null,
                      ),
              data && data.totals.pending > 0
                ? h('p', { className: 'cp-hint' }, fill(t('pendingNote'), { count: data.totals.pending }))
                : null,
            ),
            activeRow ? h(PurgeDialog, { row: activeRow, onClose: () => setActiveRow(null), onDone }) : null,
            toast ? h('div', { className: 'cp-toast', role: 'status' }, toast) : null,
          )
        }

        ctx.slots.inject('sidebar.panellist', () =>
          ctx.slots.register(
            {
              name: 'sidebar.panellist',
              id: PANEL_ID,
              order: 20,
              label: () => t('entry'),
            },
            SidebarEntry,
          ),
        )

        ctx.slots.inject('main', () =>
          ctx.slots.register(
            {
              name: 'main',
              key: PANEL_ID,
            },
            PurgePanel,
          ),
        )
      },
    }
  },
})
