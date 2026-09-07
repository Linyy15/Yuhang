/* Optional, privacy-conscious network integrations.
 * Nothing is requested until init({ enabled: true }) and a method is called.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.YHIntegrations = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_TIMEOUT = 8000;
  var state = { enabled: false, timeout: DEFAULT_TIMEOUT, fetch: null };
  var hasOwn = Object.prototype.hasOwnProperty;

  function numberOr(value, fallback) {
    return typeof value === 'number' && isFinite(value) && value > 0 ? value : fallback;
  }

  function init(config) {
    config = config && typeof config === 'object' ? config : {};
    state.enabled = config.enabled === true || config.optIn === true;
    state.timeout = numberOr(config.timeout, DEFAULT_TIMEOUT);
    state.fetch = typeof config.fetch === 'function' ? config.fetch : null;
    return { enabled: state.enabled, timeout: state.timeout };
  }

  function withTimeout(input, timeout, options) {
    var ms = numberOr(timeout, state.timeout);
    var opts = options && typeof options === 'object' ? options : {};
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer;
    var signal = opts.signal;
    if (controller) {
      if (signal) {
        if (signal.aborted) controller.abort();
        else if (typeof signal.addEventListener === 'function') signal.addEventListener('abort', function () { controller.abort(); }, { once: true });
      }
      opts = Object.assign({}, opts, { signal: controller.signal });
    }
    var promise = typeof input === 'function' ? Promise.resolve().then(input) : Promise.resolve(input);
    var timeoutPromise = new Promise(function (_, reject) {
      timer = setTimeout(function () {
        if (controller) controller.abort();
        var error = new Error('Request timed out');
        error.name = 'TimeoutError';
        reject(error);
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).then(function (value) {
      clearTimeout(timer); return value;
    }, function (error) {
      clearTimeout(timer); throw error;
    });
  }

  function validExternalUrl(value) {
    if (typeof value !== 'string' || value.length > 4096) return null;
    var parsed;
    try { parsed = new URL(value); } catch (_) { return null; }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    var host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host === '0.0.0.0' || host === '::' || host === '::1') return null;
    // Reject syntactically private/link-local IPv4 ranges (no internal-network probing).
    var octets = host.split('.').map(Number);
    if (octets.length === 4 && octets.every(function (n) { return Number.isInteger(n) && n >= 0 && n <= 255; })) {
      if (octets[0] === 10 || octets[0] === 127 || octets[0] === 0 || octets[0] === 169 && octets[1] === 254 || octets[0] === 192 && octets[1] === 168 || octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) return null;
    }
    // Reject common private/link-local IPv6 forms without DNS or socket access.
    if (host.indexOf(':') !== -1 && (/^(fc|fd)/.test(host) || /^fe[89ab]/.test(host) || host === '::1')) return null;
    return parsed.href;
  }

  function normalizedBase(url) {
    return { ok: false, url: url == null ? null : String(url), status: null, statusText: '', error: null, data: null };
  }

  function failure(url, code, message) {
    var result = normalizedBase(url);
    result.error = { code: code, message: message };
    return result;
  }

  function request(url, purpose, timeout) {
    if (!state.enabled) return Promise.resolve(failure(url, 'OPT_IN_REQUIRED', 'Network integrations are disabled; call init({ enabled: true }) first.'));
    var safeUrl = validExternalUrl(url);
    if (!safeUrl) return Promise.resolve(failure(url, 'INVALID_URL', 'Only public HTTP(S) URLs are allowed.'));
    var fetcher = state.fetch || (typeof fetch === 'function' ? fetch : null);
    if (!fetcher) return Promise.resolve(failure(safeUrl, 'FETCH_UNAVAILABLE', 'No fetch implementation is available.'));
    var result = normalizedBase(safeUrl);
    var requestOptions = { method: 'HEAD', redirect: 'manual' };
    // Browsers enforce CORS; never use no-cors, proxy, or credentialed requests.
    if (typeof window !== 'undefined') { requestOptions.mode = 'cors'; requestOptions.credentials = 'omit'; }
    return withTimeout(function () { return fetcher(safeUrl, requestOptions); }, timeout).then(function (response) {
      result.ok = !!(response && response.ok);
      result.status = response && typeof response.status === 'number' ? response.status : null;
      result.statusText = response && response.statusText ? String(response.statusText) : '';
      if (purpose === 'metadata' && response && response.headers) {
        var get = function (name) { return response.headers.get(name) || null; };
        result.data = { contentType: get('content-type'), contentLength: get('content-length'), lastModified: get('last-modified'), etag: get('etag') };
      }
      return result;
    }, function (error) {
      result.error = { code: error && error.name === 'TimeoutError' ? 'TIMEOUT' : 'NETWORK_ERROR', message: error && error.message ? String(error.message) : 'Network request failed.' };
      return result;
    });
  }

  function fetchMetadata(url, options) {
    options = options && typeof options === 'object' ? options : {};
    return request(url, 'metadata', options.timeout);
  }

  function checkLink(url, options) {
    options = options && typeof options === 'object' ? options : {};
    return request(url, 'link', options.timeout);
  }

  return { init: init, fetchMetadata: fetchMetadata, checkLink: checkLink, withTimeout: withTimeout };
}));
