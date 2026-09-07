/*
 * 屿航 · 工具箱模块（15 个纯前端小工具 + 快捷查询）
 * ------------------------------------------------------------
 * 暴露 window.YHTools { init, open }。app.js 初始化时调用 init(opts) 注入
 * on / t / enterView / exitAllViews / fadeInView / fadeHide / toolsGrid / toolsView / toolsBack。
 * 与状态对象 S 无耦合。
 */
(function (root) {
  'use strict';
  var $ = document.getElementById.bind(document);
  var opts = null;

  // ---------- 内部状态 ----------
  var pomoState = { total: 25 * 60, left: 25 * 60, timer: null };
  var calcState = { disp: '0', acc: null, op: null, fresh: true };

  // ---------- 工具卡片定义 ----------
  var TOOLS = [
    {
      id: 'pw', icon: '🔐', key: 'tool_pw',
      body: '<div class="tool-row"><label>' + '<input id="tl-pw-len" type="number" value="16" min="4" max="64" title="长度">' + '</label>' +
        '<label class="tool-check"><input id="tl-pw-sym" type="checkbox" checked> 符号</label>' +
        '<button class="btn small" data-act="pw-gen">' + '生成' + '</button>' +
        '<input id="tl-pw-out" class="tool-out" readonly></div>'
    },
    {
      id: 'b64', icon: '🔤', key: 'tool_b64',
      body: '<textarea id="tl-b64-in" class="tool-ta" placeholder="输入文本…"></textarea>' +
        '<div class="tool-row"><button class="btn small" data-act="b64-enc">' + '编码' + '</button>' +
        '<button class="btn small" data-act="b64-dec">' + '解码' + '</button></div>' +
        '<textarea id="tl-b64-out" class="tool-ta" readonly></textarea>'
    },
    {
      id: 'ts', icon: '🕐', key: 'tool_ts',
      body: '<div class="tool-row"><input id="tl-ts-num" class="tool-out" placeholder="时间戳（秒）"><button class="btn small" data-act="ts-num">' + '→ 日期' + '</button><span id="tl-ts-date" class="tool-result"></span></div>' +
        '<div class="tool-row"><input id="tl-ts-datein" class="tool-out" placeholder="2026-01-01 12:00:00"><button class="btn small" data-act="ts-date">' + '→ 时间戳' + '</button><span id="tl-ts-num2" class="tool-result"></span></div>'
    },
    {
      id: 'json', icon: '🧾', key: 'tool_json',
      body: '<textarea id="tl-json-in" class="tool-ta" placeholder="粘贴 JSON…"></textarea>' +
        '<div class="tool-row"><button class="btn small" data-act="json-fmt">' + '格式化' + '</button>' +
        '<button class="btn small" data-act="json-min">' + '压缩' + '</button>' +
        '<button class="btn small" data-act="json-val">' + '校验' + '</button></div>' +
        '<textarea id="tl-json-out" class="tool-ta" readonly></textarea>'
    },
    {
      id: 'cnt', icon: '🔢', key: 'tool_cnt',
      body: '<textarea id="tl-cnt-in" class="tool-ta" placeholder="输入文本…"></textarea>' +
        '<div class="tool-row"><span id="tl-cnt-out" class="tool-result">0 字</span></div>'
    },
    {
      id: 'uuid', icon: '🆔', key: 'tool_uuid',
      body: '<div class="tool-row"><input id="tl-uuid-out" class="tool-out" readonly><button class="btn small" data-act="uuid-gen">' + '生成' + '</button></div>'
    },
    {
      id: 'color', icon: '🎨', key: 'tool_color',
      body: '<div class="tool-row"><input id="tl-color-hex" class="tool-out" placeholder="#4f6ef7"><button class="btn small" data-act="hex-rgb">' + 'HEX → RGB' + '</button><span id="tl-color-rgb" class="tool-result"></span></div>' +
        '<div class="tool-row"><input id="tl-color-rgbin" class="tool-out" placeholder="79,110,247"><button class="btn small" data-act="rgb-hex">' + 'RGB → HEX' + '</button><span id="tl-color-hex2" class="tool-result"></span></div>'
    },
    {
      id: 'url', icon: '🔗', key: 'tool_url',
      body: '<div class="tool-row"><input id="tl-url-in" class="tool-out" placeholder="https://…"><button class="btn small" data-act="url-enc">' + '编码' + '</button><button class="btn small" data-act="url-dec">' + '解码' + '</button></div>' +
        '<textarea id="tl-url-out" class="tool-ta" readonly></textarea>'
    },
    {
      id: 'regex', icon: '🔍', key: 'tool_regex',
      body: '<div class="tool-row"><input id="tl-regex-pat" class="tool-out" placeholder="正则表达式，如 \\d+"><input id="tl-regex-flags" class="tool-out tl-short" placeholder="标志，如 gi"></div>' +
        '<textarea id="tl-regex-in" class="tool-ta" placeholder="要匹配的文本…"></textarea>' +
        '<div class="tool-row"><button class="btn small" data-act="regex-run">' + '测试' + '</button><span id="tl-regex-out" class="tool-result"></span></div>'
    },
    {
      id: 'unit', icon: '📏', key: 'tool_unit',
      body: '<div class="tool-row"><select id="tl-unit-type" class="tool-out tl-select">' +
        '<option value="len">长度 km ↔ mile</option><option value="weight">重量 kg ↔ lb</option>' +
        '<option value="temp">温度 °C ↔ °F</option></select></div>' +
        '<div class="tool-row"><input id="tl-unit-in" class="tool-out" placeholder="输入数值"><button class="btn small" data-act="unit-run">' + '换算' + '</button></div>' +
        '<div class="tool-row"><span id="tl-unit-out" class="tool-result"></span></div>'
    },
    {
      id: 'calc', icon: '🧮', key: 'tool_calc',
      body: '<div class="calc-disp" id="tl-calc-disp">0</div>' +
        '<div class="calc-grid">' +
          ['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','C','+','='].map(function (k) {
            return '<button class="calc-key' + (k === '=' ? ' calc-eq' : '') + '" data-calc="' + k + '">' + k + '</button>';
          }).join('') +
        '</div>'
    },
    {
      id: 'graph', icon: '📈', key: 'tool_graph',
      body: '<div class="tool-row"><input id="tl-graph-fn" class="tool-out" placeholder="如 x^2、sin(x)、x*2+1"><button class="btn small" data-act="graph-run">' + '绘制' + '</button></div>' +
        '<canvas id="tl-graph-cv" class="tool-cv" width="300" height="190"></canvas>' +
        '<div class="tool-row"><span id="tl-graph-msg" class="tool-result"></span></div>'
    },
    {
      id: 'pomo', icon: '🍅', key: 'tool_pomo',
      body: '<div class="pomo-disp" id="tl-pomo-time">25:00</div>' +
        '<div class="tool-row">' +
          '<button class="btn small" data-act="pomo-set" data-min="25">25分</button>' +
          '<button class="btn small" data-act="pomo-set" data-min="10">10分</button>' +
          '<button class="btn small" data-act="pomo-set" data-min="5">5分</button>' +
          '<button class="btn small" data-act="pomo-toggle">' + '开始' + '</button>' +
          '<button class="btn small" data-act="pomo-reset">' + '重置' + '</button>' +
        '</div>' +
        '<div class="tool-row"><span id="tl-pomo-msg" class="tool-result"></span></div>'
    },
    {
      id: 'qr', icon: '▦', key: 'tool_qr',
      body: '<div class="tool-row"><input id="tl-qr-in" class="tool-out" placeholder="输入网址或文本…"><button class="btn small" data-act="qr-now">' + '当前页' + '</button><button class="btn small" data-act="qr-gen">' + '生成' + '</button></div>' +
        '<div class="qr-out"><img id="tl-qr-img" alt="二维码" hidden><span id="tl-qr-msg" class="tool-result"></span></div>'
    },
    {
      id: 'ip', icon: '🌐', key: 'tool_ip',
      body: '<div class="tool-row"><button class="btn small" data-act="ip-lookup">' + '查询我的 IP' + '</button></div>' +
        '<div class="tool-row"><span id="tl-ip-out" class="tool-result"></span></div>'
    },
  ];
  // 媒体工具（独立分类，不计入原有 15 个纯前端工具；仅处理用户提供的 URL/本地文件）
  var MEDIA_TOOLS = [
    {
      id: 'media-link', icon: '🔎', key: 'tool_media_link',
      body: '<div class="tool-row"><input id="tl-media-url" class="tool-out" type="url" aria-label="媒体链接" placeholder="https://example.com/media.mp4"><button type="button" class="btn small" data-act="media-link-analyze">分析</button></div>' +
        '<div class="tool-hint">仅检查你输入的 HTTP(S) 地址，不会抓取受限平台内容。</div><div id="tl-media-url-out" class="tool-result" aria-live="polite"></div>'
    },
    {
      id: 'media-file', icon: '🎞️', key: 'tool_media_file',
      body: '<div class="tool-row"><input id="tl-media-file" type="file" aria-label="选择本地媒体" accept="audio/*,video/*,image/*"><button type="button" class="btn small" data-act="media-file-analyze">分析</button></div>' +
        '<div class="tool-hint">文件只在浏览器本地读取基本元数据，不会上传。</div><div id="tl-media-file-out" class="tool-result" aria-live="polite"></div>'
    },
    {
      id: 'media-download', icon: '⬇️', key: 'tool_media_download',
      body: '<div class="tool-row"><input id="tl-media-download" type="file" aria-label="选择要下载的本地文件"><button type="button" class="btn small" data-act="media-download-file">下载所选文件</button></div>' +
        '<div class="tool-hint">仅重新下载你明确选择的本地文件，不访问第三方平台。</div><div id="tl-media-download-out" class="tool-result" aria-live="polite"></div>'
    },
    {
      id: 'media-format', icon: '🧩', key: 'tool_media_format',
      body: '<div class="tool-row"><button type="button" class="btn small" data-act="media-format-detect">检测当前浏览器</button></div>' +
        '<div class="tool-hint">检测浏览器原生播放能力，不执行格式转换或解密。</div><div id="tl-media-format-out" class="tool-result" aria-live="polite"></div>'
    }
  ];
  var TOOL_QUICK = [
    { name: '📦 快递查询', url: 'https://www.kuaidi100.com' },
    { name: '✈️ 航班查询', url: 'https://zh.flightaware.com' },
    { name: '💱 汇率换算', url: 'https://www.huilv.cc' },
    { name: '🌐 翻译', url: 'https://fanyi.baidu.com' },
    { name: '🗺 地图', url: 'https://www.amap.com' },
    { name: '📰 今日头条', url: 'https://www.toutiao.com' },
  ];

  function renderMediaTools() {
    return '<div class="tools-sec tools-sec-media">' + opts.t('tool_sec_media') + '</div>' +
      MEDIA_TOOLS.map(function (tl) {
        return '<div class="tool-card" data-tool="' + tl.id + '">' +
          '<div class="tool-head"><span class="tool-ico">' + tl.icon + '</span><span class="tool-name">' + opts.t(tl.key) + '</span><span class="tool-arrow">▾</span></div>' +
          '<div class="tool-body">' + tl.body + '</div></div>';
      }).join('');
  }

  function formatBytes(n) {
    if (!n) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'], i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), 3);
    return (n / Math.pow(1024, i)).toFixed(i ? 2 : 0) + ' ' + units[i];
  }
  function mediaLinkAnalyze() {
    var input = $('tl-media-url'), out = $('tl-media-url-out');
    if (!input || !out) return;
    var value = input.value.trim();
    try {
      var u = new URL(value);
      if (!/^https?:$/.test(u.protocol)) throw new Error('仅支持 HTTP(S) 链接');
      var path = u.pathname, ext = (path.match(/\.([a-z0-9]{2,5})$/i) || [])[1] || '未知';
      out.textContent = '✅ 有效链接 · 类型后缀：' + ext.toUpperCase() + ' · 不会自动抓取或绕过平台限制';
    } catch (e) { out.textContent = '请输入有效的 HTTP(S) 媒体链接'; }
  }
  function mediaFileAnalyze() {
    var input = $('tl-media-file'), out = $('tl-media-file-out'), file = input && input.files && input.files[0];
    if (!out) return;
    if (!file) { out.textContent = '请先选择音频、视频或图片文件'; return; }
    out.textContent = '✅ ' + file.name + ' · ' + (file.type || '未知类型') + ' · ' + formatBytes(file.size) + ' · ' + (file.lastModified ? new Date(file.lastModified).toLocaleDateString() : '');
  }
  function mediaDownloadFile() {
    var input = $('tl-media-download'), out = $('tl-media-download-out'), file = input && input.files && input.files[0];
    if (!out) return;
    if (!file) { out.textContent = '请先选择要下载的本地文件'; return; }
    try {
      var a = document.createElement('a'), url = URL.createObjectURL(file);
      a.href = url; a.download = file.name; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      out.textContent = '✅ 已触发下载：' + file.name;
    } catch (e) { out.textContent = '当前浏览器不支持本地下载'; }
  }
  function mediaFormatDetect() {
    var out = $('tl-media-format-out');
    if (!out) return;
    var audio = document.createElement('audio'), video = document.createElement('video');
    var types = ['audio/mpeg', 'audio/ogg; codecs="vorbis"', 'audio/wav', 'video/mp4', 'video/webm', 'video/ogg'];
    var recorder = window.MediaRecorder;
    out.textContent = types.map(function (type) {
      var el = type.indexOf('audio/') === 0 ? audio : video;
      var play = el.canPlayType(type) || 'no';
      var record = recorder && typeof recorder.isTypeSupported === 'function' && recorder.isTypeSupported(type) ? '可录制' : '不支持录制';
      return type + ': 播放=' + play + '，' + record;
    }).join(' · ') + '（仅能力检测，不执行格式转换）';
  }

  function renderTools() {
    var toolsGrid = opts && opts.toolsGrid;
    if (!toolsGrid) return;
    toolsGrid.innerHTML =
      '<div class="tools-sec">' + opts.t('tool_sec_local') + '</div>' +
      TOOLS.map(function (tl, ti) {
        return '<div class="tool-card"' + (ti === 0 ? ' open' : '') + ' data-tool="' + tl.id + '">' +
          '<div class="tool-head">' +
            '<span class="tool-ico">' + tl.icon + '</span>' +
            '<span class="tool-name">' + opts.t(tl.key) + '</span>' +
            '<span class="tool-arrow">▾</span>' +
          '</div>' +
          '<div class="tool-body">' + tl.body + '</div>' +
        '</div>';
      }).join('') +
      renderMediaTools() +
      '<div class="tools-sec">' + opts.t('tool_sec_quick') + '</div>' +
      TOOL_QUICK.map(function (q) {
        return '<a class="tool-card tool-link" href="' + q.url + '" target="_blank" rel="noopener">' +
          '<div class="tool-head">' +
            '<span class="tool-ico tool-ico-q">🔗</span>' +
            '<span class="tool-name">' + q.name + '</span>' +
            '<span class="tool-open-hint">' + opts.t('tool_open') + ' <b>→</b></span>' +
          '</div>' +
        '</a>';
      }).join('');
  }

  function openTools() {
    if (!opts) return;
    opts.enterView('tools');
    opts.toolsView.hidden = false;
    opts.fadeInView(opts.toolsView);
    renderTools();
  }

  // ---------- 番茄钟 ----------
  function pomoRender() {
    var m = Math.floor(pomoState.left / 60), s = pomoState.left % 60;
    var d = $('tl-pomo-time');
    if (d) d.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }
  function pomoBeep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ac = new Ctx();
      var osc = ac.createOscillator(), gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.8);
      osc.start(); osc.stop(ac.currentTime + 0.8);
    } catch (err) { /* 忽略 */ }
  }
  function pomoReset(min) {
    if (pomoState.timer) { clearInterval(pomoState.timer); pomoState.timer = null; }
    pomoState.total = pomoState.left = (min || 25) * 60;
    var msg = $('tl-pomo-msg'); if (msg) msg.textContent = '';
    pomoRender();
  }
  function pomoToggle() {
    if (pomoState.timer) {
      clearInterval(pomoState.timer);
      pomoState.timer = null;
      var m2 = $('tl-pomo-msg'); if (m2) m2.textContent = opts.t('pomo_paused');
      return;
    }
    if (pomoState.left <= 0) pomoReset(Math.round(pomoState.total / 60) || 25);
    pomoState.timer = setInterval(function () {
      pomoState.left--;
      pomoRender();
      if (pomoState.left <= 0) {
        clearInterval(pomoState.timer);
        pomoState.timer = null;
        pomoBeep();
        var m3 = $('tl-pomo-msg'); if (m3) m3.textContent = opts.t('pomo_done');
      }
    }, 1000);
    var m4 = $('tl-pomo-msg'); if (m4) m4.textContent = opts.t('pomo_running');
  }

  // ---------- 二维码（多源图片接口回退） ----------
  var QR_SOURCES = [
    'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=',
    'https://api.pwmqr.com/qrcode/create/?url=',
  ];
  function qrGen() {
    var input = $('tl-qr-in');
    var img = $('tl-qr-img');
    var msg = $('tl-qr-msg');
    if (!input || !img || !msg) return;
    var text = input.value.trim();
    if (!text) { msg.textContent = opts.t('qr_need'); return; }
    if (!/^https?:\/\//i.test(text) && text.indexOf('.') !== -1 && text.indexOf(' ') === -1) text = 'https://' + text;
    msg.textContent = '';
    img.hidden = true;
    var idx = 0;
    function tryNext() {
      if (idx >= QR_SOURCES.length) { msg.textContent = opts.t('qr_fail') + ' ' + text; return; }
      var src = QR_SOURCES[idx++];
      if (src.indexOf('pwmqr') !== -1) {
        if (typeof fetch !== 'function') { tryNext(); return; }
        fetch(src + encodeURIComponent(text), { cache: 'no-store' })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            var u = j && j.data && (j.data.qr_url || j.data.url);
            if (!u) throw new Error('empty');
            img.src = u;
            img.onerror = tryNext;
            img.hidden = false;
          })
          .catch(tryNext);
      } else {
        img.src = src + encodeURIComponent(text);
        img.onerror = tryNext;
        img.hidden = false;
      }
    }
    tryNext();
  }

  // ---------- IP 查询（多源回退） ----------
  var IP_SOURCES = [
    function (cb) {
      fetch('https://qifu-api.baidubce.com/ip/local/geo/v1/district', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.data || !j.data.ip) throw new Error('empty');
          cb(j.data.ip + ' · ' + [j.data.country, j.data.province, j.data.city, j.data.isp].filter(Boolean).join(' '));
        })
        .catch(function () { cb(null); });
    },
    function (cb) {
      fetch('https://ip.useragentinfo.com/json', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.ip) throw new Error('empty');
          cb(j.ip + ' · ' + [j.country, j.province, j.city, j.isp].filter(Boolean).join(' '));
        })
        .catch(function () { cb(null); });
    },
    function (cb) {
      fetch('https://api.ip.sb/geoip', { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.ip) throw new Error('empty');
          cb(j.ip + ' · ' + [j.country, j.region, j.city, j.organisation].filter(Boolean).join(' '));
        })
        .catch(function () { cb(null); });
    },
  ];
  function ipLookup() {
    var out = $('tl-ip-out');
    if (!out) return;
    if (typeof fetch !== 'function') { out.textContent = opts.t('ip_fail'); return; }
    out.textContent = opts.t('ip_loading');
    var i = 0;
    (function next() {
      if (i >= IP_SOURCES.length) { out.textContent = opts.t('ip_fail'); return; }
      IP_SOURCES[i++](function (res) {
        if (res) out.textContent = '📍 ' + res;
        else next();
      });
    })();
  }

  // ---------- 计算器 ----------
  function calcKey(k) {
    var c = $('tl-calc-disp');
    if (!c) return;
    if (k === 'C') {
      calcState = { disp: '0', acc: null, op: null, fresh: true };
    } else if (k === '=') {
      if (calcState.op && calcState.acc !== null && !calcState.fresh) {
        var bv = parseFloat(calcState.disp);
        var av = calcState.acc;
        var r = calcState.op === '+' ? av + bv
          : calcState.op === '−' ? av - bv
          : calcState.op === '×' ? av * bv
          : (bv === 0 ? NaN : av / bv);
        calcState.disp = isNaN(r) ? '错误' : String(Math.round(r * 1e10) / 1e10);
        calcState.acc = null; calcState.op = null; calcState.fresh = true;
      }
    } else if (['+', '−', '×', '÷'].indexOf(k) !== -1) {
      calcState.acc = parseFloat(calcState.disp);
      calcState.op = k;
      calcState.fresh = true;
    } else {
      if (calcState.fresh || calcState.disp === '0') {
        calcState.disp = k === '.' ? '0.' : k;
        calcState.fresh = false;
      } else if (k === '.' && calcState.disp.indexOf('.') === -1) {
        calcState.disp += '.';
      } else if (k !== '.') {
        calcState.disp += k;
      }
    }
    c.textContent = calcState.disp;
  }

  // ---------- 函数图像 ----------
  function safeMathExpr(e) {
    return String(e)
      .replace(/\^/g, '**')
      .replace(/\bsin\s*\(/g, 'Math.sin(')
      .replace(/\bcos\s*\(/g, 'Math.cos(')
      .replace(/\btan\s*\(/g, 'Math.tan(')
      .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
      .replace(/\babs\s*\(/g, 'Math.abs(')
      .replace(/\blog\s*\(/g, 'Math.log(')
      .replace(/\bexp\s*\(/g, 'Math.exp(')
      .replace(/\bpi\b/gi, 'Math.PI');
  }
  function drawGraph(ctx, cv, fn) {
    var w = cv.width || 300, h = cv.height || 190;
    var xMin = -10, xMax = 10, yMin = -6, yMax = 6;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    function sx(x) { return (x - xMin) / (xMax - xMin) * w; }
    function sy(y) { return h - (y - yMin) / (yMax - yMin) * h; }
    ctx.strokeStyle = '#e6e8ef'; ctx.lineWidth = 1;
    for (var gx = Math.ceil(xMin); gx <= xMax; gx++) { ctx.beginPath(); ctx.moveTo(sx(gx), 0); ctx.lineTo(sx(gx), h); ctx.stroke(); }
    for (var gy = Math.ceil(yMin); gy <= yMax; gy++) { ctx.beginPath(); ctx.moveTo(0, sy(gy)); ctx.lineTo(w, sy(gy)); ctx.stroke(); }
    ctx.strokeStyle = '#9aa3b2'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(sx(0), 0); ctx.lineTo(sx(0), h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, sy(0)); ctx.lineTo(w, sy(0)); ctx.stroke();
    ctx.strokeStyle = '#5b6cff'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    var started = false;
    var N = 400;
    for (var i = 0; i <= N; i++) {
      var x = xMin + (xMax - xMin) * i / N;
      var y = fn(x);
      if (y === undefined || isNaN(y) || !isFinite(y)) { started = false; continue; }
      var px = sx(x), py = sy(y);
      if (py < -h || py > 2 * h) { started = false; continue; }
      if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  function genPassword(len, useSym) {
    var low = 'abcdefghijkmnpqrstuvwxyz', up = 'ABCDEFGHJKLMNPQRSTUVWXYZ', num = '23456789';
    var pool = low + up + num + (useSym ? '!@#$%^&*_-+=?' : '');
    var out = '';
    for (var i = 0; i < len; i++) out += pool[Math.floor(Math.random() * pool.length)];
    return out;
  }
  function genUUID() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  function fmtDateTime(d) {
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  // ---------- 主事件处理器（手风琴 + 各工具动作） ----------
  function onToolClick(e) {
    var head = e.target.closest ? e.target.closest('.tool-head') : null;
    if (head && !(e.target.closest && e.target.closest('.tool-link'))) {
      var tcard = head.closest ? head.closest('.tool-card') : null;
      if (tcard) {
        var wasOpen = tcard.classList.contains('open');
        var opened = opts.toolsGrid.querySelectorAll('.tool-card.open');
        for (var i = 0; i < opened.length; i++) opened[i].classList.remove('open');
        if (!wasOpen) tcard.classList.add('open');
      }
      return;
    }
    var ck = e.target.closest ? e.target.closest('[data-calc]') : null;
    if (ck) { calcKey(ck.getAttribute('data-calc')); if (ck.blur) ck.blur(); return; }
    var btn = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!btn) return;
    var act = btn.getAttribute('data-act');
    if (act === 'pw-gen') {
      var len = parseInt($('tl-pw-len').value, 10) || 16;
      var sym = $('tl-pw-sym').checked;
      $('tl-pw-out').value = genPassword(len, sym);
    } else if (act === 'b64-enc') {
      try { $('tl-b64-out').value = btoa(unescape(encodeURIComponent($('tl-b64-in').value))); } catch (err) { $('tl-b64-out').value = '编码失败'; }
    } else if (act === 'b64-dec') {
      try { $('tl-b64-out').value = decodeURIComponent(escape(atob($('tl-b64-in').value.trim()))); } catch (err) { $('tl-b64-out').value = '解码失败（非有效 Base64）'; }
    } else if (act === 'ts-num') {
      var ts = parseInt($('tl-ts-num').value, 10);
      $('tl-ts-date').textContent = isNaN(ts) ? '请输入秒级时间戳' : fmtDateTime(new Date(ts * 1000));
    } else if (act === 'ts-date') {
      var d = new Date($('tl-ts-datein').value.replace(' ', 'T'));
      $('tl-ts-num2').textContent = isNaN(d.getTime()) ? '格式：2026-01-01 12:00:00' : String(Math.floor(d.getTime() / 1000));
    } else if (act === 'json-fmt') {
      try { $('tl-json-out').value = JSON.stringify(JSON.parse($('tl-json-in').value), null, 2); } catch (err) { $('tl-json-out').value = 'JSON 解析失败'; }
    } else if (act === 'json-min') {
      try { $('tl-json-out').value = JSON.stringify(JSON.parse($('tl-json-in').value)); } catch (err) { $('tl-json-out').value = 'JSON 解析失败'; }
    } else if (act === 'json-val') {
      try { JSON.parse($('tl-json-in').value); $('tl-json-out').value = '✅ 合法 JSON'; } catch (err) { $('tl-json-out').value = '❌ 非法 JSON'; }
    } else if (act === 'uuid-gen') {
      $('tl-uuid-out').value = genUUID();
    } else if (act === 'hex-rgb') {
      var hx = ($('tl-color-hex').value || '').trim().replace('#', '');
      var m = /^([0-9a-f]{6})$/i.exec(hx);
      $('tl-color-rgb').textContent = m
        ? 'rgb(' + parseInt(m[1].slice(0, 2), 16) + ', ' + parseInt(m[1].slice(2, 4), 16) + ', ' + parseInt(m[1].slice(4, 6), 16) + ')'
        : '请输入 6 位 HEX（如 4f6ef7）';
    } else if (act === 'rgb-hex') {
      var p = ($('tl-color-rgbin').value || '').split(/[,，\s]+/).map(function (x) { return parseInt(x, 10); });
      var ok = p.length === 3 && p.every(function (x) { return x >= 0 && x <= 255; });
      $('tl-color-hex2').textContent = ok
        ? '#' + p.map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('')
        : '请输入 0-255 的三个数（如 79,110,247）';
    } else if (act === 'url-enc') {
      try { $('tl-url-out').value = encodeURIComponent($('tl-url-in').value); } catch (err) { $('tl-url-out').value = '编码失败'; }
    } else if (act === 'url-dec') {
      try { $('tl-url-out').value = decodeURIComponent($('tl-url-in').value); } catch (err) { $('tl-url-out').value = '解码失败'; }
    } else if (act === 'regex-run') {
      try {
        var pat = $('tl-regex-pat').value;
        var flags = ($('tl-regex-flags') || {}).value || '';
        var re = new RegExp(pat, flags.indexOf('g') === -1 ? flags + 'g' : flags);
        var text = $('tl-regex-in').value;
        var ms = text.match(re) || [];
        var preview = ms.slice(0, 6).map(function (mm) { return JSON.stringify(mm); }).join('、');
        $('tl-regex-out').textContent = '匹配 ' + ms.length + ' 处' + (ms.length ? '：' + preview + (ms.length > 6 ? ' …' : '') : '');
      } catch (err) { $('tl-regex-out').textContent = '正则错误：' + err.message; }
    } else if (act === 'unit-run') {
      var uv = parseFloat($('tl-unit-in').value);
      var ut = $('tl-unit-type').value;
      if (isNaN(uv)) { $('tl-unit-out').textContent = '请输入数值'; }
      else if (ut === 'len') {
        $('tl-unit-out').textContent = uv + ' km = ' + (uv * 0.621371).toFixed(4) + ' mile · ' + uv + ' mile = ' + (uv / 0.621371).toFixed(4) + ' km';
      } else if (ut === 'weight') {
        $('tl-unit-out').textContent = uv + ' kg = ' + (uv * 2.20462).toFixed(4) + ' lb · ' + uv + ' lb = ' + (uv / 2.20462).toFixed(4) + ' kg';
      } else {
        $('tl-unit-out').textContent = uv + ' °C = ' + (uv * 9 / 5 + 32).toFixed(2) + ' °F · ' + uv + ' °F = ' + ((uv - 32) * 5 / 9).toFixed(2) + ' °C';
      }
    } else if (act === 'graph-run') {
      var expr = $('tl-graph-fn').value.trim();
      var cv = $('tl-graph-cv');
      var msgEl = $('tl-graph-msg');
      if (!expr || !cv || typeof cv.getContext !== 'function') { if (msgEl) msgEl.textContent = '请输入函数（如 x^2、sin(x)）'; }
      else {
        var cctx = cv.getContext('2d');
        if (!cctx) { if (msgEl) msgEl.textContent = '当前环境不支持绘图'; }
        else {
          try {
            var fn = new Function('x', 'return (' + safeMathExpr(expr) + ');');
            fn(1);
            drawGraph(cctx, cv, fn);
            if (msgEl) msgEl.textContent = '';
          } catch (err) { if (msgEl) msgEl.textContent = '表达式错误：' + err.message; }
        }
      }
    } else if (act === 'pomo-set') {
      pomoReset(parseInt(btn.getAttribute('data-min'), 10) || 25);
    } else if (act === 'pomo-toggle') {
      pomoToggle();
    } else if (act === 'pomo-reset') {
      pomoReset(25);
    } else if (act === 'qr-now') {
      var qrIn = $('tl-qr-in');
      if (qrIn) qrIn.value = window.location.href;
      qrGen();
    } else if (act === 'qr-gen') {
      qrGen();
    } else if (act === 'ip-lookup') {
      ipLookup();
    } else if (act === 'media-link-analyze') {
      mediaLinkAnalyze();
    } else if (act === 'media-file-analyze') {
      mediaFileAnalyze();
    } else if (act === 'media-download-file') {
      mediaDownloadFile();
    } else if (act === 'media-format-detect') {
      mediaFormatDetect();
    }
    if (btn && btn.blur) btn.blur();
  }

  function onToolInput(e) {
    if (!e.target || e.target.id !== 'tl-cnt-in') return;
    var v = e.target.value;
    var han = (v.match(/[\u4e00-\u9fff]/g) || []).length;
    var chars = v.length;
    var lines = v ? v.split(/\n/).length : 0;
    $('tl-cnt-out').textContent = chars + ' 字符 · ' + han + ' 汉字 · ' + lines + ' 行';
  }

  function init(o) {
    if (!o || !o.toolsGrid) return;
    opts = o;
    renderTools();
    o.on(o.toolsBack, 'click', function () { o.fadeHide(o.toolsView); o.exitAllViews(); });
    o.on(o.toolsGrid, 'click', onToolClick);
    o.on(o.toolsGrid, 'input', onToolInput);
  }

  root.YHTools = { init: init, open: openTools };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window));
