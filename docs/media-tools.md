# 本地媒体工具模块

`web/js/media-tools.js` 是一个无外部依赖的 UMD / 原生 JavaScript 模块，用于安全地提供**本地媒体文件信息**和**公开 URL 的纯语法分析**。它是独立模块，未修改既有工具模块。

## 合规与安全边界

模块明确遵循以下限制：

- **不会发起 URL 网络请求**：只使用浏览器 `URL` API 分析协议、主机名、路径和文件扩展名。
- 仅接受公开 `http:` 与 `https:` URL；拒绝 `javascript:`、`data:`、`file:` 及其他非 HTTP(S) 协议。
- 对明显的平台页面域名给出拒绝结果；不会解析页面、抓取媒体、提供平台下载提示，或绕过访问控制。
- 不实现 DRM 绕过、登录/鉴权绕过、付费墙绕过、网易云 NCM 解密、媒体抓取或远程下载。
- 本地文件只在用户通过 `<input type="file">` 明确选择后处理。模块用 `URL.createObjectURL()` 读取元数据并在不再需要时释放 URL。
- “下载此本地文件”仅重新下载用户已选择的同一个本地 `File` 对象；不下载任何远程资源。
- UI 全部通过 DOM API 和 `textContent` 构造，避免将用户输入拼接到 `innerHTML`。

## 引入方式

浏览器中以普通脚本加载：

```html
<script src="web/js/media-tools.js"></script>
<div id="media-tools-root"></div>
<script>
  var controller = window.MediaTools.mount(
    document.getElementById('media-tools-root')
  );
</script>
```

CommonJS 和 AMD 环境同样可使用该 UMD 导出。浏览器全局名称为 `window.MediaTools`。

> 该文件不会自动接入 `tools.js`，从而避免修改或改变现有工具模块的行为。需要展示 UI 的页面可显式调用 `MediaTools.mount(...)`。

## API

### `analyzePublicUrl(value)`

只分析字符串 URL 的语法，返回包括 `ok`、`code`、`message`，以及可用时的 `protocol`、`hostname`、`extension`、`mediaKind`。不调用 `fetch`、XHR 或第三方服务。

```js
var result = MediaTools.analyzePublicUrl('https://cdn.example.test/song.mp3');
// result.mediaKind === 'audio'
```

URL 路径中的常见音/视频扩展名只代表“疑似直接媒体 URL”，不是远程可用性、许可、文件内容或下载授权的证明。

### `inspectLocalFile(file)` 与 `readDuration(file)`

`inspectLocalFile(file)` 同步读取用户选择的 `File` 的名称、字节大小、MIME 和扩展名。`readDuration(file)` 返回 Promise，使用临时 `HTMLAudioElement` 或 `HTMLVideoElement` 读取本地媒体元数据中的时长；浏览器或编码不支持时返回 `null`。

### `detectLocalConversion(options)`

仅做能力检测：

```js
var state = MediaTools.detectLocalConversion({ ffmpeg: localFfmpeg });
```

转换能力要求由宿主应用**预先打包并显式传入本地** `ffmpeg.wasm` 适配器（具备 `convert()` 或 `exec()`）。模块不会从 CDN、第三方站点或任意远程 URL 加载 WebAssembly、脚本或转换器。当前 UI 仅显示能力状态与占位按钮，未执行转换。

## 生命周期

`mount(container, options)` 返回控制器：

```js
var controller = MediaTools.mount(root, { ffmpeg: localFfmpeg });
// 页面销毁时：
controller.destroy();
```

`destroy()` 会释放当前本地文件的 object URL 并清空挂载容器。

## 不支持的用途

请勿将该模块用于下载或提取社交/音视频平台内容、规避版权与技术保护措施、绕过账户权限或订阅限制，或处理受保护的 NCM/DRM 内容。对内容使用、保存或再分发前，用户必须自行确认拥有相应授权。
