# 网络增强集成

`web/js/integrations.js` 提供一个可选、默认不阻塞的网络增强模块：

- `YHIntegrations.init(config)`
- `YHIntegrations.fetchMetadata(url, { timeout })`
- `YHIntegrations.checkLink(url, { timeout })`
- `YHIntegrations.withTimeout(input, timeout, options)`

## 默认行为与使用

模块加载时**不会发起请求**。网络能力默认关闭，必须由调用方明确选择加入：

```html
<script src="/js/integrations.js"></script>
<script>
  YHIntegrations.init({ enabled: true, timeout: 5000 });

  YHIntegrations.checkLink('https://example.com', { timeout: 3000 })
    .then(function (result) {
      if (result.ok) console.log('链接可访问', result.status);
      else console.warn(result.error && result.error.code);
    });
</script>
```

`init` 接受 `enabled: true`（也兼容 `optIn: true`）、默认超时 `timeout`，以及 Node 环境可注入的 `fetch` 实现。每次调用都显式返回 Promise；禁用、URL 不合法、超时和网络错误均解析为标准结果，不会抛出未处理异常。

## 结果格式

结果始终包含：

```js
{
  ok: Boolean,
  url: String | null,
  status: Number | null,
  statusText: String,
  error: null | { code: String, message: String },
  data: null | {
    contentType: String | null,
    contentLength: String | null,
    lastModified: String | null,
    etag: String | null
  }
}
```

`fetchMetadata` 读取响应头中的有限元数据；`checkLink` 只检查响应状态。请求使用 `HEAD`，不下载页面正文。

## 隐私与安全边界

- **不自动请求**：仅在 `init({ enabled: true })` 后、调用方法时请求。
- **不绕过 CORS**：浏览器使用标准 `cors` 模式和匿名凭据（`credentials: omit`），绝不使用 `no-cors`、代理或服务端转发。目标服务器必须自行允许跨源请求；CORS 失败会返回 `NETWORK_ERROR`。
- **不访问内网**：仅接受 `http:`/`https:` 公网 URL，并拒绝 localhost、`.local`、常见私有/回环/链路本地 IPv4 与 IPv6 字面量。DNS 解析或套接字探测不会在模块中执行。
- **不发送凭据**：不会主动发送 Cookie、Authorization 或其他用户凭据；仍应只对可信的、用户明确选择的 URL 调用。
- **超时与取消**：默认 8 秒，可按调用覆盖；支持 AbortController 的运行环境会在超时时中止请求。`withTimeout` 可包装 Promise 或返回 Promise 的函数。
- **信息最小化**：只返回状态和少量标准响应头，不读取或保存正文，不写入本地存储。

Node 使用时请自行提供合规的 `fetch` 实现，例如 `init({ enabled: true, fetch })`，并在应用层继续执行域名白名单和网络出口策略。该模块不会替应用完成 SSRF 防护或隐私审查。
