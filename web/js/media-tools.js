/*
 * Local Media Tools
 * A dependency-free UMD module for URL inspection and local File metadata.
 * It deliberately does not fetch remote media, scrape platforms, or bypass access controls.
 */
(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof define === 'function' && define.amd) define(function () { return api; });
  root.MediaTools = api;
}(typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var BLOCKED_SCHEMES = { javascript: true, data: true, file: true };
  var MEDIA_EXTENSIONS = {
    video: ['mp4', 'webm', 'mov', 'm4v', 'ogv', 'avi', 'mkv'],
    audio: ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac', 'opus', 'weba']
  };
  // These are treated as page URLs, not direct media URLs. No platform requests are made.
  var PLATFORM_HOSTS = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com|bilibili\.com|douyin\.com|tiktok\.com|instagram\.com|facebook\.com|x\.com|twitter\.com|music\.163\.com|qq\.com)$/i;

  function text(value) { return value === undefined || value === null ? '' : String(value); }
  function extension(pathname) {
    var match = /\.([a-z0-9]{1,10})$/i.exec(pathname || '');
    return match ? match[1].toLowerCase() : '';
  }
  function mediaKindFromExtension(ext) {
    if (MEDIA_EXTENSIONS.video.indexOf(ext) !== -1) return 'video';
    if (MEDIA_EXTENSIONS.audio.indexOf(ext) !== -1) return 'audio';
    return null;
  }
  function mediaKindFromMime(mime) {
    if (/^video\//i.test(mime || '')) return 'video';
    if (/^audio\//i.test(mime || '')) return 'audio';
    return null;
  }
  function humanSize(bytes) {
    if (!isFinite(bytes) || bytes < 0) return '未知';
    var units = ['B', 'KB', 'MB', 'GB', 'TB'];
    var index = 0;
    while (bytes >= 1024 && index < units.length - 1) { bytes /= 1024; index++; }
    return (index ? bytes.toFixed(bytes >= 10 ? 1 : 2) : String(bytes)) + ' ' + units[index];
  }
  function formatDuration(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '未知';
    seconds = Math.round(seconds);
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remaining = seconds % 60;
    return (hours ? String(hours).padStart(2, '0') + ':' : '') + String(minutes).padStart(2, '0') + ':' + String(remaining).padStart(2, '0');
  }

  /** Analyze syntax only. This function never sends a network request. */
  function analyzePublicUrl(value) {
    var input = text(value).trim();
    if (!input) return { ok: false, code: 'empty', message: '请输入公开 HTTP(S) URL。' };
    var parsed;
    try { parsed = new URL(input); } catch (error) {
      return { ok: false, code: 'invalid-url', message: 'URL 格式无效。' };
    }
    var protocol = parsed.protocol.replace(':', '').toLowerCase();
    if (BLOCKED_SCHEMES[protocol]) {
      return { ok: false, code: 'blocked-scheme', message: '出于安全原因，不接受 ' + protocol + ': URL。', protocol: protocol };
    }
    if (protocol !== 'http' && protocol !== 'https') {
      return { ok: false, code: 'unsupported-scheme', message: '只分析公开 HTTP(S) URL。', protocol: protocol };
    }
    var ext = extension(parsed.pathname);
    var kind = mediaKindFromExtension(ext);
    if (PLATFORM_HOSTS.test(parsed.hostname)) {
      return {
        ok: false, code: 'platform-page', protocol: protocol, hostname: parsed.hostname, extension: ext || null,
        message: '这看起来是平台页面 URL；本工具不会解析页面、抓取媒体或提供下载提示。'
      };
    }
    return {
      ok: true, code: kind ? 'direct-media-looking-url' : 'public-url', protocol: protocol,
      hostname: parsed.hostname, pathname: parsed.pathname, extension: ext || null, mediaKind: kind,
      message: kind ? '仅根据 URL 路径识别为疑似 ' + (kind === 'video' ? '视频' : '音频') + ' 文件；未进行网络访问或验证。' : '公开 HTTP(S) URL；路径中未识别出常见媒体扩展名。'
    };
  }

  function inspectLocalFile(file) {
    if (!file || typeof file.name !== 'string') return null;
    var ext = extension(file.name);
    return {
      name: file.name,
      size: Number(file.size) || 0,
      sizeText: humanSize(Number(file.size) || 0),
      mime: file.type || '未提供',
      extension: ext || null,
      mediaKind: mediaKindFromMime(file.type) || mediaKindFromExtension(ext),
      duration: null,
      durationText: '正在读取元数据…'
    };
  }

  function readDuration(file) {
    return new Promise(function (resolve) {
      var kind = mediaKindFromMime(file.type) || mediaKindFromExtension(extension(file.name));
      if (!kind || !root.URL || !root.URL.createObjectURL) { resolve(null); return; }
      var media = document.createElement(kind === 'video' ? 'video' : 'audio');
      var objectUrl = root.URL.createObjectURL(file);
      var settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        media.removeAttribute('src');
        root.URL.revokeObjectURL(objectUrl);
        resolve(isFinite(value) ? value : null);
      }
      media.preload = 'metadata';
      media.onloadedmetadata = function () { finish(media.duration); };
      media.onerror = function () { finish(null); };
      media.src = objectUrl;
    });
  }

  // An ffmpeg implementation must be passed by the host application; this module never imports it.
  function detectLocalConversion(options) {
    var ffmpeg = options && options.ffmpeg;
    return {
      available: !!(ffmpeg && (typeof ffmpeg.convert === 'function' || typeof ffmpeg.exec === 'function')),
      reason: '音频转换需要由宿主显式打包并传入本地 ffmpeg.wasm 依赖；本模块不会远程加载代码。'
    };
  }

  function createElement(tag, label) {
    var node = document.createElement(tag);
    if (label) node.textContent = label;
    return node;
  }
  function appendInfo(list, label, value) {
    var row = createElement('div');
    var key = createElement('strong', label + '：');
    var val = createElement('span', value);
    row.appendChild(key); row.appendChild(val); list.appendChild(row);
    return val;
  }

  /** Mount a self-contained, local-only UI. Does not alter existing tool modules. */
  function mount(container, options) {
    if (!container || !container.appendChild) throw new TypeError('mount(container) requires a DOM element.');
    options = options || {};
    var conversion = detectLocalConversion(options);
    var objectUrl = null;
    container.textContent = '';

    var section = createElement('section');
    section.className = 'media-tools';
    var urlTitle = createElement('h3', '公开 URL 分析（仅语法）');
    var urlRow = createElement('div');
    var urlInput = createElement('input');
    urlInput.type = 'url'; urlInput.placeholder = 'https://example.com/media.mp4'; urlInput.autocomplete = 'off';
    var analyzeButton = createElement('button', '分析 URL'); analyzeButton.type = 'button';
    var urlResult = createElement('p', '不会请求、下载、抓取或绕过任何平台。'); urlResult.setAttribute('role', 'status');
    urlRow.appendChild(urlInput); urlRow.appendChild(analyzeButton);
    section.appendChild(urlTitle); section.appendChild(urlRow); section.appendChild(urlResult);
    analyzeButton.addEventListener('click', function () { urlResult.textContent = analyzePublicUrl(urlInput.value).message; });

    var localTitle = createElement('h3', '本地媒体文件');
    var picker = createElement('input'); picker.type = 'file'; picker.accept = 'audio/*,video/*';
    var details = createElement('div'); details.hidden = true; details.setAttribute('aria-live', 'polite');
    var download = createElement('button', '下载此本地文件'); download.type = 'button'; download.hidden = true;
    section.appendChild(localTitle); section.appendChild(picker); section.appendChild(details); section.appendChild(download);
    picker.addEventListener('change', function () {
      var file = picker.files && picker.files[0];
      details.textContent = ''; download.hidden = true;
      if (objectUrl) { root.URL.revokeObjectURL(objectUrl); objectUrl = null; }
      if (!file) { details.hidden = true; return; }
      var metadata = inspectLocalFile(file);
      details.hidden = false;
      appendInfo(details, '名称', metadata.name); appendInfo(details, '大小', metadata.sizeText);
      appendInfo(details, 'MIME', metadata.mime); var durationValue = appendInfo(details, '时长', metadata.durationText);
      readDuration(file).then(function (duration) { durationValue.textContent = duration === null ? '无法读取' : formatDuration(duration); });
      objectUrl = root.URL.createObjectURL(file); download.hidden = false;
      download.onclick = function () {
        var link = createElement('a'); link.href = objectUrl; link.download = file.name; link.style.display = 'none';
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
      };
    });

    var convertTitle = createElement('h3', '本地音频转换');
    var convertInfo = createElement('p', conversion.reason);
    var convertButton = createElement('button', conversion.available ? '本地转换接口可用' : '转换不可用（缺少本地依赖）');
    convertButton.type = 'button'; convertButton.disabled = !conversion.available;
    section.appendChild(convertTitle); section.appendChild(convertInfo); section.appendChild(convertButton);
    container.appendChild(section);
    return { destroy: function () { if (objectUrl) root.URL.revokeObjectURL(objectUrl); container.textContent = ''; }, conversion: conversion };
  }

  return { analyzePublicUrl: analyzePublicUrl, inspectLocalFile: inspectLocalFile, readDuration: readDuration, detectLocalConversion: detectLocalConversion, mount: mount, formatDuration: formatDuration, humanSize: humanSize };
}));
