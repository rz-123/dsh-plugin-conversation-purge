# 对话清理 / Conversation Purge

一个 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）Web 插件：在左侧栏增加一个入口，用于**彻底删除对话**。删除时提供两种范围：

1. **仅删除对话与聊天记录**——删除会话日志、隐藏的子代理聊天记录，并从工作区和侧栏移除；
2. **对话、文档与附件一并删除**——在上一项基础上，再删除该对话交付或创建的文件，以及仅被该对话使用的附件。

> 这是一个**不可恢复**的破坏性工具。所有删除都直接作用于磁盘，不进入回收站。请先拿一个可丢弃的对话试用。

---

## 功能

- **左侧栏入口**：与「插件」「定时任务」并列的全局面板图标，点击打开中央清理页。
- **对话列表**：按工作区分组，显示标题、创建时间、日志大小、是否正在使用；支持按标题、路径、会话 ID 搜索。
- **两种删除模式**：删除前弹出确认框，逐项列出将删除的会话、文档、附件和子代理记录，可取消勾选。
- **文档识别**（用于模式 2）：
  - `present` 工具交付的文件（`deliverables/presented` 事件）；
  - `write` 工具成功写入的文件（`tool/result.meta.path`）；
  - `edit` / `str_replace_editor` 修改的文件（默认不勾选）；
  - 可选的“推测扫描”：该对话时间段内工作目录中新建的文件（按文件创建时间推测，默认不勾选）。
- **附件识别**：只删除仅被该对话引用的附件对象；被其他对话共享的附件会跳过。
- **安全防护**：
  - 删除前停止该对话正在运行的回合；
  - 只删除普通文件，不递归删除目录，跳过符号链接；
  - 拒绝删除会话目录、附件仓库、DSH profile、插件状态目录；
  - 客户端提交的路径必须与服务端重新扫描的结果取交集；
  - 文件被占用时写入待删清单，先让对话从界面消失，下次启动 DSH 时自动补删；
  - 每次操作返回逐项结果，失败项单独报告，不谎报成功。

## 环境要求

- DSH Web / Desktop，profile 中启用 `connection`、`sessionQuery`、`workspaceRegistry` 服务；
- 开发与验证环境：**DSH 0.2.1-rc.3 / Windows 11**；
- 插件自身无第三方运行时依赖，Host 端只使用 Node 内置模块。

## 安装

### 从 npm 安装（推荐）

在 DSH 的「添加插件」对话框中输入包名：

```text
dsh-plugin-conversation-purge
```

或者用 plugin manager：

```text
plugin_manager action=install_bundle target=dsh-plugin-conversation-purge
```

### 从源码或本地目录安装

克隆本仓库，然后以该目录为 target 安装：

```text
plugin_manager action=install_bundle target=<本仓库的绝对路径>
```

安装会把包加入当前 profile 的 bundle 列表；安装后左侧栏出现「对话清理」图标。DSH 支持 HMR，通常无需重启；如果图标未出现，刷新一次页面。

> 同一个面板 id 只能存在一份：不要同时安装 npm 版和本地版。

## 使用

1. 点击左侧栏的垃圾桶图标，打开「对话清理」；
2. 找到要删除的对话，点击右侧「删除」；
3. 选择范围：
   - **仅删除对话与聊天记录**：直接确认即可；
   - **对话、文档与附件一并删除**：等待分析完成，按需勾选文档和附件，再确认；
4. 点击「永久删除」。

### 两种模式分别删除什么

| 内容 | 仅聊天 | 聊天 + 文档附件 |
|---|---|---|
| 会话日志（`session*.jsonl*`） | ✅ | ✅ |
| 该对话派生的子代理会话日志 | ✅ | ✅ |
| 工作区归属、置顶/归档标记 | ✅ | ✅ |
| 标题/统计投影缓存（尽力清理） | ✅ | ✅ |
| 对话交付/创建的文件 | — | ✅（可勾选） |
| 仅被该对话使用的附件 | — | ✅（可勾选） |
| 被其他对话共享的附件 | — | 保留 |

## 工作原理

- Host 半（`index.js`）注册三个需要浏览器认证的精确路由：
  - `GET /api/conversation-purge.list`
  - `POST /api/conversation-purge.preview`
  - `POST /api/conversation-purge.delete`
- 会话数据通过 `ctx.sessionQuery`、`ctx.sessionPersistence` 读取；工作区归属通过 `ctx.workspaceRegistry` 移除；日志目录位于 `$DSH_HOME/sessions/<project>/<sessionId>`。
- 待删清单保存在 `$DSH_HOME/conversation-purge/pending.json`，插件启动后 3 秒重试；成功清空后自动删除清单。
- Client 半（`client.js`）向 `sidebar.panellist` 注册入口、向 `main` 注册面板；样式只使用 `--dsw-alias-*` 主题 token。

### 目录结构

```text
.
├── index.js            # Host：路由、扫描、删除、待删重试
├── client.js           # Client：左侧栏图标、清理页、确认弹窗
├── package.json        # bundle 清单（dsh.bundle / dsh.client）
├── cordis.patch.yml    # Loader 插入行
├── icon.svg            # 插件图标
└── locale/
    ├── zh.json
    └── en.json
```

## 已知限制

- 通过 shell / Python 等命令创建、且没有 `present` 的文件不会被默认识别；需要打开“推测扫描”，并自行确认勾选项。
- “推测扫描”依据文件创建时间，可能包含你在此期间创建的文件；默认不勾选。
- 标题/统计投影缓存是尽力清理；如果对应存储域不可用，可能残留少量标题或用量统计（不含聊天正文）。
- 如果会话日志被其他进程占用，删除会延后到下次启动 DSH 时完成。
- 在另一个标签页仍打开该对话时删除，那个标签页可能继续写入并重建日志；请先关闭该对话。
- 目前只在 Windows 上验证；POSIX 的文件锁语义不同，未做跨平台验证。
- 这是用户操作，不向 Agent 暴露删除工具。

## 隐私

- 不联网、无遥测、无第三方依赖；
- 只访问 `$DSH_HOME/sessions`、`$DSH_HOME/attachments`、`$DSH_HOME/conversation-purge` 和 DSH 的工作区注册表；
- 不读取、不上传对话内容到任何外部服务。

## 开发

插件是纯 JavaScript（ESM），不需要构建步骤：

- 修改 `index.js` 后，Host 侧通常需要重启 DSH 才能加载新的模块代；
- 修改 `client.js` 后，DSH 的 HMR 会重新加载客户端 bundle（需要页面连接正常）。

## License

[MIT](LICENSE) © 2026 rz-123

---

# Conversation Purge (English)

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) web plugin that adds a left-sidebar entry for **permanently deleting conversations**. It offers two scopes:

1. **Conversation and chat history only** — removes the session log, hidden subagent logs, workspace membership, and pin/archive markers;
2. **Conversation, documents and attachments** — everything above plus files the conversation delivered or created and attachments used only by it.

> This is destructive and irreversible. Deletions act directly on disk and do not go to the recycle bin.

## Features

- Left-sidebar entry and a full management panel;
- Conversations grouped by workspace, with search, size, creation time and live status;
- A confirmation dialog that previews exactly what will be deleted, with per-item checkboxes;
- Documents are detected from `present` deliveries and successful `write`/`edit` tool results, plus an optional heuristic scan of files created in the working directory during the conversation;
- Attachments are deleted only when no other conversation references them;
- Path guards, no recursive directory deletion, no symlink following; locked files are queued and retried on the next DSH start;
- The plugin makes no network requests and has no third-party runtime dependencies.

## Requirements

- DSH Web/Desktop with `connection`, `sessionQuery` and `workspaceRegistry` services;
- Developed and verified on **DSH 0.2.1-rc.3 / Windows 11**.

## Install

### From npm (recommended)

Enter the package name in DSH's **Add plugin** dialog:

```text
dsh-plugin-conversation-purge
```

Or install it with the plugin manager:

```text
plugin_manager action=install_bundle target=dsh-plugin-conversation-purge
```

### From source / a local directory

Clone this repository, then install the folder as a local bundle:

```text
plugin_manager action=install_bundle target=<absolute path to this repository>
```

After installation, a trash-can icon appears in the left sidebar. Refresh the page if it does not appear immediately.

> Only one copy can be installed at a time: do not install both the npm and the local version.

## Usage

1. Open **Conversation Purge** from the left sidebar;
2. Pick a conversation and click **Delete**;
3. Choose **Chat history only** or **Conversation, documents and attachments**;
4. Review the preview, select the files to remove, and confirm.

## Limitations

- Files created by shell or Python commands without a `present` call are not detected by default; enable the heuristic scan and review its candidates;
- The heuristic scan uses file birth time and may include files you created during the conversation (unchecked by default);
- Title/statistics cache cleanup is best-effort;
- A conversation still open in another tab may recreate its log after deletion;
- Windows only so far; POSIX file-locking behavior is untested;
- Deletion is a user action and is not exposed as an agent tool.

## License

[MIT](LICENSE) © 2026 rz-123
