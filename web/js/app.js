/* ===== 屿航 - 前端逻辑（v11：登录 + 个人网站） ===== */
(function () {
  'use strict';
  var S = window.YHState;
  console.log('[屿航] app v6 已加载（SW 缓存命中时仍为旧版请强刷）');

  // ---------- 性能分级：低端设备降级动效（与 prefers-reduced-motion 互补）
  // 逻辑：reduced-motion 是用户主动选择；low-fx 是设备被动降级（低核数/慢网络/低端 GPU）
  // 检测时机必须尽早（页面顶层），确保 CSS 在首次 layout 前生效
  var perfLevel = 'high'; // high | mid | low
  try {
    var hc = (navigator.hardwareConcurrency || 0);
    var net = (navigator.connection && navigator.connection.effectiveType) || '';
    var isSlow = /2g|slow-2g|3g/.test(net);
    var isLowCore = hc > 0 && hc <= 4;
    if (isSlow || isLowCore) { perfLevel = 'low'; }
    else if (hc > 0 && hc <= 6) { perfLevel = 'mid'; }
  } catch (e) {}
  if (perfLevel === 'low' || perfLevel === 'mid') {
    try { document.documentElement.setAttribute('data-perf', perfLevel); } catch (e) {}
  }

  // 每次进入都定位到网页顶部：禁止浏览器刷新时恢复上次滚动位置
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);
  window.addEventListener('load', function () { window.scrollTo(0, 0); });

  var SITES = window.SITES || [];
  var META = window.SITES_META || {};

  function $(id) { return document.getElementById(id); }
  function on(el, evt, fn) { if (el) el.addEventListener(evt, fn); }

  var grid = $('grid');
  var appEl = $('app');
  var catBar = $('cat-bar');
  var filterBar = $('filter-bar');
  var searchInput = $('search-input');
  var btnSearch = $('btn-search');
  var btnClear = $('btn-clear');
  var engineBtn = document.querySelectorAll('#engine-btn');
  var engineMenu = $('engine-menu');
  var searchResult = $('search-result');
  var btnRandom = document.querySelectorAll('#btn-random');
  var footerInfo = $('footer-info');
  var footerUpdated = $('footer-updated');
  var backTop = $('back-top');
  var brandName = $('brand-name');
  var statTotal = $('stat-total');
  var statTags = $('stat-tags');
  var statFavs = $('stat-favs');
  var descTotal = $('desc-total');
  var descTags = $('desc-tags');
  var clockEl = $('clock-weather');
  var btnSettings = document.querySelectorAll('#btn-settings');
  var btnLogin = document.querySelectorAll('#btn-login');
  var loginMenu = $('login-menu');
  var fxEl = $('fx');
  var glowEl = $('cursor-glow');
  var trailEl = $('cursor-trail');
  var modal = $('modal');
  var modalBody = $('modal-body');
  var modalClose = $('modal-close');
  var modalSettingsBtn = $('modal-settings');
  var settingsModal = $('settings-modal');
  var settingsClose = $('settings-close');
  var sStyle = $('s-style');
  var sColors = $('s-colors');
  var sSize = $('s-size');
  var sLang = $('s-lang');
  var btnBackIntro = document.querySelectorAll('#btn-back-intro');
  var loginModal = $('login-modal');
  var loginClose = $('login-close');
  var loginBody = $('login-body');
  var loginMsg = $('login-msg');
  var addModal = $('add-modal');
  var addClose = $('add-close');
  var addName = $('add-name');
  var addUrl = $('add-url');
  var addBrief = $('add-brief');
  var addTags = $('add-tags');
  var addMsg = $('add-msg');
  var addSubmit = $('add-submit');
  var wsModal = $('ws-modal');
  var wsClose = $('ws-close');
  var wsList = $('ws-list');
  var wsNameInput = $('ws-name');
  var wsAddBtn = $('ws-add');
  var disclaimerModal = $('disclaimer-modal');
  var disclaimerOk = $('disclaimer-ok');
  var disclaimerConsent = $('disclaimer-consent');
  var passModal = $('pass-modal');
  var passClose = $('pass-close');
  var passNew = $('pass-new');
  var passNew2 = $('pass-new2');
  var passMsg = $('pass-msg');
  var passSubmit = $('pass-submit');
  var passBar = $('pass-bar');
  var passStrength = $('pass-strength');
  var passHints = $('pass-hints');
  var btnChangePass = $('btn-change-pass');
  var favModal = $('fav-modal');
  var favClose = $('fav-close');
  var favList = $('fav-list');
  var favClear = $('fav-clear');
  var rankView = $('rank-view');
  var rankBack = $('rank-back');
  var rankPodium = $('rank-podium');
  var rankTable = $('rank-table');
  var rankTabs = $('rank-tabs');
  var hotView = $('hot-view');
  var hotBack = $('hot-back');
  var hotTabs = $('hot-tabs');
  var hotList = $('hot-list');
  var hotRefresh = $('hot-refresh');
  var hotToolbar = $('hot-toolbar');
  var hotMeta = $('hot-meta');
  var hotFilter = $('hot-filter');
  var catFilterBtn = document.querySelectorAll('#cat-filter-btn');
  var catFilterLabel = document.querySelectorAll('#cat-filter-label');
  var catDropdown = document.querySelectorAll('#cat-dropdown');
  // 兼容 shim：上述已改用 querySelectorAll 绑定双副本，此处 getElementById 一次仅用于填充测试 elCache
  $('cat-filter-btn'); $('cat-filter-label'); $('cat-dropdown');
  var toolsView = $('tools-view');
  var toolsBack = $('tools-back');
  var toolsGrid = $('tools-grid');
  var btnWander = document.querySelectorAll('#btn-wander');
  var btnStats = document.querySelectorAll('#btn-stats');
  var statModal = $('stat-modal');
  var statClose = $('stat-close');
  var statBody = $('stat-body');
  var helpModal = $('help-modal');
  var helpClose = $('help-close');
  var randomModal = $('random-modal');
  var randomClose = $('random-close');
  var randomBody = $('random-body');
  var randomOpen = $('random-open');
  var randomNext = $('random-next');
  var searchHot = $('search-hot');
  var searchAc = $('search-ac');
  var btnSubmit = document.querySelectorAll('#btn-submit');
  // 兼容 shim：上述按钮已改用 querySelectorAll 绑定双副本，此处 getElementById 一次仅用于填充测试 elCache
  $('btn-login'); $('btn-settings'); $('btn-random'); $('btn-back-intro'); $('btn-wander'); $('btn-stats'); $('btn-submit');
  var submitModal = $('submit-modal');
  var submitClose = $('submit-close');
  var submitName = $('submit-name');
  var submitUrl = $('submit-url');
  var submitBrief = $('submit-brief');
  var submitMsg = $('submit-msg');
  var submitSend = $('submit-send');
  var introQuote = $('intro-quote');
  var favOpenAll = $('fav-openall');
  var fbModal = $('fb-modal');
  var fbClose = $('fb-close');
  var fbText = $('fb-text');
  var fbMsg = $('fb-msg');
  var fbSubmit = $('fb-submit');

  var activeCat = '全部';
  var selectedTags = new Set();
  var activeWs = null;
  var editingPersonalId = null; // 正在编辑的个人网站 id（null=新增）
  var keyword = '';
  var currentSite = null;
  var FAV_CAT = '⭐ 收藏';
  var HOT_CAT = '🔥 最常';
  var WS_CAT = '🗂 工作区';
  var MY_CAT = '我的网站';
  var RANK_CAT = '🏆 排行';
  var HOT_NEW_CAT = '📈 热搜';
  var TOOLS_CAT = '🧰 工具箱';
  var RECENT_CAT = '🕘 最近';

  // ---------- 本地存储 ----------
  var DISCLAIMER_KEY = 'nav_disclaimer_v1';
  var SESSION_KEY = 'nav_session_v1';

  // 账号数据：按账号隔离（收藏 / 工作区 / 点击统计 均为个人专属）

  function loadAccountData() {
    if (S.currentUser) {
      S.clicks = S.clicksAll[S.currentUser] || {};
      S.clickLog = S.clickLogAll[S.currentUser] || [];
      S.favs = new Set(S.favsAll[S.currentUser] || []);
      S.workspaces = S.workspacesAll[S.currentUser] || {};
    } else {
      S.clicks = {};
      S.clickLog = [];
      S.favs = new Set();
      S.workspaces = {};
    }
  }
  function pruneClickLog(log) {
    if (!Array.isArray(log)) return [];
    return log.filter(function (x) { return x && x.id && x.ts > 0; }).slice(-500);
  }
  function recordClick(id) {
    if (!S.currentUser || !id) return;
    S.clicks[id] = (S.clicks[id] || 0) + 1;
    S.clickLog = S.clickLog || [];
    S.clickLog.push({ id: id, ts: Date.now() });
    var dayMs = 24 * 60 * 60 * 1000;
    var cutoff = Date.now() - 7 * dayMs;
    if (S.clickLog.length > 500 || S.clickLog.length && S.clickLog[0].ts < cutoff) {
      S.clickLog = pruneClickLog(S.clickLog.filter(function (x) { return x.ts >= cutoff; }));
    }
    saveAccountData();
  }
  function saveAccountData() {
    if (S.currentUser) {
      S.clicksAll[S.currentUser] = S.clicks;
      S.clickLogAll[S.currentUser] = pruneClickLog(S.clickLog);
      S.favsAll[S.currentUser] = Array.from(S.favs);
      S.workspacesAll[S.currentUser] = S.workspaces;
    }
    try {
      S.persist.accountData();
    } catch (e) { /* 忽略 */ }
    YHAuth.scheduleCloudPush();
  }

  function saveSettings() { try { S.persist.settings(); } catch (e) {} }
  function saveAccounts() { try { S.persist.accounts(); } catch (e) {} }
  function savePersonal() { try { S.persist.personal(); } catch (e) {} YHAuth.scheduleCloudPush(); }

  // 最近访问 / 站内搜索热词（轻量本地记录，游客也可用，不随账号走）
  function saveRecent() { try { S.persist.recent(); } catch (e) {} }
  function saveHotWords() { try { S.persist.hotWords(); } catch (e) {} }
  function addRecent(id) {
    var i = S.recentIds.indexOf(id);
    if (i !== -1) S.recentIds.splice(i, 1);
    S.recentIds.unshift(id);
    if (S.recentIds.length > 30) S.recentIds.length = 30;
    saveRecent();
  }
  function saveSearchHistory() { try { S.persist.searchHistory(); } catch (e) {} }
  // 记录最近搜索词：去重置顶，最多 10 条；空词不记
  function recordSearchHistory(q) {
    q = String(q || '').trim();
    if (!q) return;
    S.searchHistory = S.searchHistory.filter(function (h) { return h.q.toLowerCase() !== q.toLowerCase(); });
    S.searchHistory.unshift({ q: q, ts: Date.now() });
    if (S.searchHistory.length > 10) S.searchHistory.length = 10;
    saveSearchHistory();
  }
  function recordHotWord(q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return;
    S.hotWords[q] = (S.hotWords[q] || 0) + 1;
    var keys = Object.keys(S.hotWords);
    if (keys.length > 60) {
      keys.sort(function (a, b) { return S.hotWords[b] - S.hotWords[a]; });
      var keep = keys.slice(0, 60), next = {};
      keep.forEach(function (k) { next[k] = S.hotWords[k]; });
      S.hotWords = next;
    }
    saveHotWords();
  }

  var siteById = {};
  SITES.forEach(function (s) { siteById[s.id] = s; });
  function siteOf(id) {
    if (siteById[id]) return siteById[id];
    if (S.currentUser) {
      var mine = S.personalSites[S.currentUser] || [];
      for (var i = 0; i < mine.length; i++) if (mine[i].id === id) return mine[i];
    }
    return null;
  }
  function allSites() {
    var mine = S.currentUser ? (S.personalSites[S.currentUser] || []) : [];
    return SITES.concat(mine);
  }

  // ================= 中英文 =================
  var DICT = {
    settings_head: { zh: '⚙ 设置', en: '⚙ Settings' },
    lang_label: { zh: '语言', en: 'Language' },
    style_label: { zh: '界面风格', en: 'Style' },
    color_label: { zh: '主题颜色', en: 'Accent color' },
    size_label: { zh: '卡片大小', en: 'Card size' },
    icon_label: { zh: '卡片图标', en: 'Card icon' },
    icon_favicon: { zh: '网站图标', en: 'Favicon' },
    icon_letter: { zh: '首字', en: 'Letter' },
    fx_label: { zh: '特效与行为', en: 'Effects & behavior' },
    petals: { zh: '落花效果', en: 'Falling petals' },
    snow: { zh: '飘雪效果', en: 'Falling snow' },
    cursor: { zh: '鼠标轨迹光效', en: 'Cursor trail' },
    intro_toggle: { zh: '每次进入显示起始页', en: 'Show intro on load' },
    back_intro: { zh: '🏝 回到起始页', en: '🏝 Back to intro' },
    show_disclaimer: { zh: '📜 再次显示免责声明', en: '📜 Show disclaimer again' },
    export_data: { zh: '⬇ 导出本地数据（备份）', en: '⬇ Export local data (backup)' },
    import_data: { zh: '⬆ 导入本地数据（恢复）', en: '⬆ Import local data (restore)' },
    bn_home: { zh: '首页', en: 'Home' },
    bn_favs: { zh: '收藏', en: 'Favorites' },
    bn_tools: { zh: '工具', en: 'Tools' },
    bn_search: { zh: '搜索', en: 'Search' },
    bn_me: { zh: '我的', en: 'Me' },
    random_open: { zh: '🌐 打开', en: '🌐 Open' },
    random_next: { zh: '🎲 换一个', en: '🎲 Another' },
    random_empty: { zh: '当前筛选下没有网站，换个分类试试', en: 'No sites in the current filter — try another category' },
    data_exported: { zh: '✅ 已导出备份文件', en: '✅ Backup exported' },
    data_imported: { zh: '✅ 已恢复本地数据', en: '✅ Local data restored' },
    data_import_fail: { zh: '❌ 备份文件无效', en: '❌ Invalid backup file' },
    bm_import: { zh: '🔖 导入浏览器书签', en: '🔖 Import browser bookmarks' },
    bm_need_login: { zh: '请先登录（书签将导入为个人网站）', en: 'Sign in first (bookmarks become your personal sites)' },
    bm_imported: { zh: '✅ 已导入 ', en: '✅ Imported ' },
    bm_fail: { zh: '❌ 书签文件解析失败', en: '❌ Failed to parse bookmarks file' },
    my_workspaces: { zh: '🗂 我的工作区', en: '🗂 My workspaces' },
    ws_name_ph: { zh: '新工作区名称，如：学习工具', en: 'Workspace name, e.g. Study' },
    ws_add: { zh: '＋ 新建', en: '＋ New' },
    settings: { zh: '⚙ 设置', en: '⚙ Settings' },
    random: { zh: '🎲 今天去哪', en: '🎲 Go anywhere' },
    search_ph: { zh: '搜索网站（支持模糊）…', en: 'Search sites (fuzzy ok)…' },
    search_btn: { zh: '搜索', en: 'Search' },
    engine_local: { zh: '站内', en: 'Local' },
    engine_baidu: { zh: '百度', en: 'Baidu' },
    engine_google: { zh: '谷歌', en: 'Google' },
    engine_bing: { zh: '必应', en: 'Bing' },
    engine_bili: { zh: 'B站', en: 'Bilibili' },
    engine_zhihu: { zh: '知乎', en: 'Zhihu' },
    engine_github: { zh: 'GitHub', en: 'GitHub' },
    hot_new: { zh: '📈 热搜', en: '📈 Hot search' },
    hot_title: { zh: '📈 全网热搜', en: '📈 Trending' },
    hot_loading: { zh: '加载中…', en: 'Loading…' },
    hot_weibo: { zh: '微博', en: 'Weibo' },
    hot_zhihu: { zh: '知乎', en: 'Zhihu' },
    hot_baidu: { zh: '百度', en: 'Baidu' },
    hot_douyin: { zh: '抖音', en: 'Douyin' },
    hot_bili: { zh: 'B站', en: 'Bilibili' },
    hot_toutiao: { zh: '头条', en: 'Toutiao' },
    tools_title: { zh: '🧰 工具箱', en: '🧰 Toolbox' },
    tool_sec_local: { zh: '⚡ 实用小工具（纯本地，无需联网）', en: '⚡ Mini tools (local, offline)' },
    tool_sec_quick: { zh: '🔗 快捷查询（跳转网站）', en: '🔗 Quick links' },
    tool_open: { zh: '打开', en: 'Open' },
    tool_pw: { zh: '随机密码', en: 'Random password' },
    tool_b64: { zh: 'Base64 编解码', en: 'Base64 encode/decode' },
    tool_ts: { zh: '时间戳转换', en: 'Timestamp converter' },
    tool_json: { zh: 'JSON 格式化', en: 'JSON formatter' },
    tool_cnt: { zh: '字数统计', en: 'Word counter' },
    tool_uuid: { zh: 'UUID 生成', en: 'UUID generator' },
    tool_color: { zh: '颜色转换 HEX ↔ RGB', en: 'Color HEX ↔ RGB' },
    tool_url: { zh: 'URL 编解码', en: 'URL encode/decode' },
    tool_regex: { zh: '正则测试', en: 'Regex tester' },
    tool_unit: { zh: '单位换算', en: 'Unit converter' },
    tool_calc: { zh: '计算器', en: 'Calculator' },
    tool_graph: { zh: '函数图像', en: 'Function plotter' },
    all: { zh: '全部', en: 'All' },
    favs: { zh: '⭐ 收藏', en: '⭐ Favorites' },
    hot: { zh: '🔥 最常', en: '🔥 Top' },
    ws: { zh: '🗂 工作区', en: '🗂 Workspaces' },
    my_sites: { zh: '我的网站', en: 'My sites' },
    sel_tags: { zh: '已选标签（命中任一即显示）：', en: 'Selected tags (match any):' },
    current_ws: { zh: '当前工作区：', en: 'Workspace:' },
    clear_all: { zh: '清除全部', en: 'Clear all' },
    reco: { zh: '💡 为你推荐', en: '💡 For you' },
    reco_sub: { zh: '根据你的浏览习惯为你精选', en: 'Based on your browsing' },
    stat_sites: { zh: ' 个网站', en: ' sites' },
    stat_tags: { zh: ' 个标签', en: ' tags' },
    stat_favs: { zh: ' 个收藏', en: ' favorites' },
    intro_desc: {
      zh: '这里收录了 <b id="desc-total">0</b> 个值得一看的网站，按 <b id="desc-tags">0</b> 个标签分类整理。<br>每一个网站都是一座数字小岛——搜索、收藏、随机探索，从屿航出发。',
      en: 'A curated collection of <b id="desc-total">0</b> great websites across <b id="desc-tags">0</b> tags.<br>Every site is a digital island — search, save, explore. Set sail from Yuhang.'
    },
    scroll_enter: { zh: '向下滚动进入', en: 'Scroll to enter' },
    updated: { zh: '数据更新于', en: 'Updated' },
    visits: { zh: '👁 访问量', en: '👁 Visits' },
    fav_yes: { zh: '已收藏', en: 'Saved' },
    fav_no: { zh: '未收藏', en: 'Not saved' },
    open_site: { zh: '🚀 打开网站', en: '🚀 Open site' },
    add_fav: { zh: '☆ 收藏', en: '☆ Save' },
    un_fav: { zh: '★ 取消收藏', en: '★ Unsave' },
    add_ws: { zh: '🗂 添加到工作区', en: '🗂 Add to workspace' },
    copy: { zh: '📋 复制链接', en: '📋 Copy link' },
    copied: { zh: '✅ 已复制', en: '✅ Copied' },
    ws_pick: { zh: '选择工作区…', en: 'Choose workspace…' },
    ws_new: { zh: '＋ 新建工作区…', en: '＋ New workspace…' },
    ws_new_ph: { zh: '新工作区名称', en: 'Workspace name' },
    add: { zh: '添加', en: 'Add' },
    added: { zh: '✅ 已添加', en: '✅ Added' },
    created_added: { zh: '✅ 已创建并添加', en: '✅ Created & added' },
    need_vpn: { zh: '⚡ 需加速器访问', en: '⚡ May need VPN' },
    open_all: { zh: '🚀 打开全部', en: '🚀 Open all' },
    view: { zh: '查看', en: 'View' },
    del: { zh: '删除', en: 'Delete' },
    ws_empty: { zh: '还没有工作区～ 在卡片详情的"添加到工作区"里创建，或直接新建一个。', en: 'No workspaces yet — add sites from a card\'s details, or create one.' },
    empty_all: { zh: '没有找到匹配的网站，换个关键词试试？', en: 'No matching sites, try another keyword?' },
    empty_fav: { zh: '还没有收藏任何网站～ 点击卡片上的 ☆ 即可收藏', en: 'No favorites yet — tap ☆ on a card to save' },
    empty_hot: { zh: '还没有点击记录，多逛逛，这里会出现你常去的网站', en: 'No click history yet — keep browsing' },
    empty_tags: { zh: '没有同时包含这些标签的网站，换个标签试试？', en: 'No sites match these tags, try others?' },
    empty_ws: { zh: '这个工作区还没有网站～ 在卡片详情的"添加到工作区"里添加', en: 'This workspace is empty — add sites from card details' },
    empty_my: { zh: '还没有添加个人网站～ 点击"＋ 添加网站"', en: 'No personal sites yet — tap "＋ Add site"' },
    // Supabase 登录
    lp_email_pass: { zh: '邮箱密码', en: 'Email + password' },
    lp_email_otp: { zh: '邮箱验证码', en: 'Email code' },
    lp_social: { zh: '第三方', en: 'Social' },
    lp_local: { zh: '本地离线', en: 'Local offline' },
    email_ph: { zh: '邮箱', en: 'Email' },
    pass_ph: { zh: '密码', en: 'Password' },
    code_ph: { zh: '验证码', en: 'Code' },
    send_code: { zh: '发送验证码', en: 'Send code' },
    verify_code: { zh: '验证并登录', en: 'Verify & sign in' },
    email_login: { zh: '登录', en: 'Sign in' },
    email_register: { zh: '注册', en: 'Register' },
    reg_mail_title: { zh: '注册需管理员开通', en: 'Registration requires admin approval' },
    reg_mail_text: { zh: '请按「用户名 / 密码」的格式发送邮件到站长邮箱，等待官方添加账号后即可登录：', en: 'Email the owner with "username / password". Wait for the account to be added, then sign in:' },
    reg_mail_fmt: { zh: '主题：屿航注册申请<br>内容：<br>用户名：你的用户名<br>密码：你的密码', en: 'Subject: Yuhang registration<br>Body:<br>Username: your username<br>Password: your password' },
    reg_mail_btn: { zh: '📧 发送申请邮件', en: '📧 Send request email' },
    reg_mail_copy: { zh: '复制邮箱', en: 'Copy email' },
    reg_mail_copied: { zh: '✅ 邮箱已复制', en: '✅ Email copied' },
    reg_mail_copy_content: { zh: '📋 复制申请内容', en: '📋 Copy request text' },
    reg_mail_content_copied: { zh: '✅ 申请内容已复制', en: '✅ Request text copied' },
    confirm_email: { zh: '✅ 请到邮箱点击确认链接完成注册', en: '✅ Please confirm your email to finish' },
    otp_sent: { zh: '✅ 验证码已发送到邮箱', en: '✅ Code sent to your email' },
    otp_err: { zh: '发送失败', en: 'Failed to send' },
    auth_err: { zh: '登录失败', en: 'Sign-in failed' },
    google_login: { zh: '继续使用谷歌', en: 'Continue with Google' },
    microsoft_login: { zh: '继续使用微软', en: 'Continue with Microsoft' },
    no_supabase: { zh: '⚠️ 尚未配置 Supabase（请在 js/config.js 填入密钥）', en: '⚠️ Supabase not configured (add keys in js/config.js)' },
    to_login: { zh: '已有账号？去登录', en: 'Have an account? Sign in' },
    to_register: { zh: '没有账号？去注册', en: 'No account? Register' },
    email_invalid: { zh: '邮箱格式不正确', en: 'Invalid email' },
    pw_short_err: { zh: '密码至少需要 8 位', en: 'Password must be at least 8 characters' },
    pw_strength_label: { zh: '密码强度', en: 'Strength' },
    pw_strong: { zh: '强', en: 'Strong' },
    pw_medium: { zh: '中', en: 'Medium' },
    pw_weak: { zh: '弱', en: 'Weak' },
    pw_short: { zh: '至少 8 位', en: 'min 8 chars' },
    pw_lower: { zh: '含小写字母', en: 'add lowercase' },
    pw_upper: { zh: '含大写字母', en: 'add uppercase' },
    pw_num: { zh: '含数字', en: 'add numbers' },
    pw_special: { zh: '含特殊字符', en: 'add symbols' },
    pw_show: { zh: '显示密码', en: 'Show password' },
    pw_hide: { zh: '隐藏密码', en: 'Hide password' },
    login_hint_short: { zh: '🔑 登录解锁个人功能', en: '🔑 Sign in to unlock' },
    need_login_fav: { zh: '登录后才能使用收藏 / 工作区 / 最常访问 / 个人网站等功能', en: 'Sign in to use favorites, workspaces, top sites & personal sites' },
    err_bad_creds: { zh: '账号不存在或密码错误（若刚注册请先完成邮箱确认）', en: 'Account not found or wrong password (confirm your email if newly registered)' },
    err_not_confirmed: { zh: '邮箱尚未确认，请先到邮箱点击确认链接', en: 'Email not confirmed yet — check your inbox' },
    err_already_registered: { zh: '该邮箱已注册，请直接登录', en: 'This email is already registered — sign in instead' },
    err_rate_limit: { zh: '请求太频繁，请稍后再试', en: 'Too many requests, try again later' },
    disclaimer_title: { zh: '免责声明', en: 'Disclaimer' },
    disclaimer_ok: { zh: '我知道了! 不再提醒', en: 'Got it! Don\'t remind again' },
    disclaimer_text: {
      zh: '· 本网站（屿航）由 屿雀iris 制作，内容均为个人兴趣收集，仅供学习交流，不含任何商业推广。<br>' +
         '· 收藏、点击、个人网站等数据随账号云端同步，仅本人可见。<br>' +
         '· 如有网站违反法律法规或链接失效，请联系 jubei516206@163.com，我们会尽快处理。<br>' +
         '· 使用各网站前请查阅其授权许可，部分内容禁止商用；因误用产生的一切后果与本站无关。',
      en: '· Yuhang (屿航) is made by Yunque Iris. All listings are collected out of personal interest for learning and sharing only, with no commercial promotion.<br>' +
         '· Your favorites, clicks and personal sites are synced to the cloud and only visible to you.<br>' +
         '· If any site violates the law or a link breaks, contact jubei516206@163.com.<br>' +
         '· Please check each site\'s license before use; some content is not for commercial use. Misuse is at your own risk.'
    },
    footer_disclaimer: {
      zh: '本导航为个人兴趣收集，仅供学习交流，不构成任何推广或担保；使用各网站请遵守其条款与法律法规。',
      en: 'A personal interest collection for learning and sharing only — not an endorsement or guarantee. Use each site at your own discretion and follow the law.'
    },
    slogan: { zh: '探索每一座数字岛屿', en: 'Explore every digital island' },
    // 登录 / 个人网站
    login: { zh: '🔑 登录', en: '🔑 Sign in' },
    logout: { zh: '退出登录', en: 'Sign out' },
    add_site: { zh: '添加网站', en: 'Add site' },
    login_title: { zh: '🔑 登录', en: '🔑 Sign in' },
    login_user_ph: { zh: '用户名', en: 'Username' },
    login_pass_ph: { zh: '密码', en: 'Password' },
    login_pass2_ph: { zh: '确认密码', en: 'Confirm password' },
    login_submit: { zh: '登录', en: 'Sign in' },
    login_create: { zh: '创建账号', en: 'Create account' },
    login_hint: { zh: '用邮箱注册账号，登录后可在本机添加个人网站（数据仅存本机，不会上传）', en: 'Sign up with email; personal sites are stored locally on this device, never uploaded' },
    login_need: { zh: '请填写用户名和密码', en: 'Please enter username and password' },
    login_err: { zh: '用户名或密码错误', en: 'Wrong username or password' },
    login_mismatch: { zh: '两次密码不一致', en: 'Passwords do not match' },
    add_title: { zh: '＋ 添加网站', en: '＋ Add site' },
    add_name: { zh: '网站名称（必填）', en: 'Name (required)' },
    add_url: { zh: '网址（必填）', en: 'URL (required)' },
    add_brief: { zh: '简介（选填）', en: 'Description (optional)' },
    add_tags: { zh: '标签（选填，逗号分隔）', en: 'Tags (optional, comma-separated)' },
    add_submit: { zh: '添加', en: 'Add' },
    edit_title: { zh: '✏️ 编辑网站', en: '✏️ Edit site' },
    edit_site: { zh: '编辑', en: 'Edit' },
    save: { zh: '保存', en: 'Save' },
    saved: { zh: '✅ 已保存', en: '✅ Saved' },
    ws_rename: { zh: '重命名', en: 'Rename' },
    ws_rename_ph: { zh: '输入工作区新名称', en: 'Enter new workspace name' },
    forgot_pass: { zh: '忘记密码？', en: 'Forgot password?' },
    reset_title: { zh: '找回密码', en: 'Reset password' },
    send_reset: { zh: '发送重置邮件', en: 'Send reset email' },
    reset_sent: { zh: '✅ 重置邮件已发送，请查收（部署域名后链接可正常打开）', en: '✅ Reset email sent — check your inbox (link opens after deploying)' },
    back_login: { zh: '← 返回登录', en: '← Back to sign in' },
    change_pass: { zh: '修改密码', en: 'Change password' },
    change_pass_title: { zh: '🔒 修改密码', en: '🔒 Change password' },
    new_pass_ph: { zh: '新密码', en: 'New password' },
    new_pass2_ph: { zh: '确认新密码', en: 'Confirm new password' },
    pass_changed: { zh: '✅ 密码已修改', en: '✅ Password changed' },
    manage_favs: { zh: '管理收藏', en: 'Manage favorites' },
    fav_manage_title: { zh: '⭐ 收藏管理', en: '⭐ Manage favorites' },
    clear_favs: { zh: '清空全部收藏', en: 'Clear all favorites' },
    clear_confirm: { zh: '确定清空全部收藏？', en: 'Clear all favorites?' },
    fav_sel_all: { zh: '全选', en: 'Select all' },
    fav_sel_n: { zh: '已选 {n} 项', en: '{n} selected' },
    fav_sel_empty: { zh: '请先勾选要操作的收藏', en: 'Select favorites first' },
    fav_batch_ws_new: { zh: '＋ 移入新工作区…', en: '＋ Move to new workspace…' },
    fav_batch_ws_prompt: { zh: '新工作区名称：', en: 'New workspace name:' },
    fav_batch_ws_done: { zh: '已移入工作区 {n} 项', en: 'Moved {n} to workspace' },
    fav_batch_remove: { zh: '批量移除', en: 'Remove selected' },
    fav_batch_remove_confirm: { zh: '确定移除选中的 {n} 个收藏？', en: 'Remove {n} selected favorites?' },
    fav_batch_export: { zh: '批量导出书签', en: 'Export bookmarks' },
    fav_batch_done: { zh: '✅ 批量操作完成', en: '✅ Done' },
    share_stats: { zh: '共享数据参与全站统计', en: 'Share data to site-wide stats' },
    rank_title: { zh: '🏆 全站排行', en: '🏆 Site ranking' },
    rank_fav: { zh: '收藏榜', en: 'By favorites' },
    rank_click: { zh: '点击榜', en: 'By clicks' },
    rank_empty: { zh: '还没有数据，多分享收藏/点击后会生成', en: 'No data yet — share favorites & clicks to build rankings' },
    crown: { zh: '👑', en: '👑' },
    back: { zh: '← 返回', en: '← Back' },
    medal_1: { zh: '冠军', en: 'Champion' },
    medal_2: { zh: '亚军', en: 'Runner-up' },
    medal_3: { zh: '季军', en: 'Third place' },
    fb_title: { zh: '📣 反馈网站问题', en: '📣 Report an issue' },
    fb_ph: { zh: '请描述这个网站有什么问题…', en: 'Describe what\'s wrong with this site…' },
    fb_submit: { zh: '提交反馈', en: 'Submit' },
    fb_ok: { zh: '✅ 反馈已提交', en: '✅ Feedback submitted' },
    fb_need_login: { zh: '登录后才能反馈', en: 'Sign in to give feedback' },
    add_hint: { zh: '只保存在本机浏览器，不会上传到服务器', en: 'Stored only in this browser, never uploaded' },
    add_err: { zh: '请填写名称和网址', en: 'Please fill in name and URL' },
    del_site: { zh: '删除', en: 'Delete' },
    del_confirm: { zh: '确定删除这个网站？', en: 'Delete this site?' },
    official: { zh: '官方', en: 'Official' },
    personal: { zh: '个人', en: 'Mine' },
    recent: { zh: '🕘 最近', en: '🕘 Recent' },
    clear_recent: { zh: '清空记录', en: 'Clear history' },
    wander: { zh: '🎠 漫游模式', en: '🎠 Wander mode' },
    wander_stop: { zh: '⏹ 停止漫游', en: '⏹ Stop wander' },
    wander_tip: { zh: '🎠 漫游中：每 4 秒随机打开一个网站（点悬浮球里的「停止漫游」结束）', en: '🎠 Wandering: opens a random site every 4s (stop from the FAB)' },
    stats: { zh: '📊 数据统计', en: '📊 My stats' },
    stats_title: { zh: '📊 我的数据统计', en: '📊 My stats' },
    stats_favs: { zh: '收藏', en: 'Favorites' },
    stats_clicks: { zh: '点击', en: 'Clicks' },
    stats_mine: { zh: '我的网站', en: 'My sites' },
    stats_ws: { zh: '工作区', en: 'Workspaces' },
    stats_top: { zh: '🏆 最常访问', en: '🏆 Most visited' },
    stats_7d: { zh: '📅 近 7 日访问', en: '📅 Last 7 days' },
    stats_7d_empty: { zh: '近 7 日还没有点击流水（累计次数不受影响）', en: 'No click log in the last 7 days (totals remain)' },
    stats_tags: { zh: '🏷 我的标签分布', en: '🏷 My tag mix' },
    stats_empty: { zh: '还没有数据，多逛逛、收藏几个网站后再来看看', en: 'No data yet — browse and favorite some sites first' },
    help_title: { zh: '⌨ 快捷键', en: '⌨ Shortcuts' },
    help_slash: { zh: '聚焦搜索框', en: 'Focus search box' },
    help_enter: { zh: '在搜索框内确认搜索', en: 'Confirm search' },
    help_esc: { zh: '关闭弹窗 / 退出视图', en: 'Close modal / exit view' },
    help_arrow: { zh: '卡片间移动焦点', en: 'Move focus between cards' },
    help_card: { zh: '在卡片上打开网站', en: 'Open site on card' },
    help_q: { zh: '显示本面板', en: 'Show this panel' },
    hot_search_title: { zh: '🔥 站内热门搜索', en: '🔥 Popular searches' },
    recent_search_title: { zh: '🕘 最近搜索', en: '🕘 Recent searches' },
    clear_search_hist: { zh: '清空', en: 'Clear' },
    clear_search_hist_tip: { zh: '清空最近搜索记录', en: 'Clear search history' },
    hot_updated: { zh: '更新于', en: 'updated' },
    hot_count: { zh: '条', en: 'items' },
    hot_hits: { zh: '命中', en: 'hits' },
    hot_none: { zh: '没有匹配的热搜', en: 'No matching trending items' },
    hot_fetching: { zh: '获取中…', en: 'Fetching…' },
    hot_direct: { zh: '接口暂不可用，请点击下方平台直达', en: 'API unavailable — pick a platform below' },
    hot_filter_ph: { zh: '过滤当前榜单…', en: 'Filter list…' },
    tool_pomo: { zh: '🍅 番茄钟', en: '🍅 Pomodoro' },
    tool_qr: { zh: '▦ 二维码', en: '▦ QR code' },
    tool_ip: { zh: '🌐 IP 查询', en: '🌐 My IP' },
    pomo_running: { zh: '🍅 专注中…', en: '🍅 Focusing…' },
    pomo_paused: { zh: '⏸ 已暂停', en: '⏸ Paused' },
    pomo_done: { zh: '✅ 时间到！休息一下吧', en: '✅ Time\'s up! Take a break' },
    qr_need: { zh: '请输入网址或文本', en: 'Enter a URL or text' },
    qr_fail: { zh: '二维码服务不可用，请复制链接：', en: 'QR service unavailable — copy the link: ' },
    ip_loading: { zh: '查询中…', en: 'Looking up…' },
    ip_fail: { zh: 'IP 查询失败（需联网）', en: 'IP lookup failed (needs network)' },
    open_all_confirm: { zh: '将打开 {n} 个标签页，确定？', en: 'Open {n} tabs?' },
    filter_n: { zh: '已选 {n} 项', en: '{n} selected' },
    copy_title_url: { zh: '📋 复制 标题+网址', en: '📋 Copy title+URL' },
    export_bm: { zh: '🔖 导出收藏为书签', en: '🔖 Export favorites as bookmarks' },
    bm_exported: { zh: '✅ 已导出书签 HTML，可在浏览器「导入书签」中使用', en: '✅ Bookmarks exported — import into any browser' },
    bm_empty: { zh: '还没有收藏，先去收藏几个网站吧', en: 'No favorites yet — favorite some sites first' },
    ac_direct: { zh: '直达', en: 'Open' },
    ac_more: { zh: '站内搜索：', en: 'Search: ' },
    fb_mail: { zh: '📧 发给站长', en: '📧 Email owner' },
    fb_mail_subject: { zh: '屿航网站反馈', en: 'Yuhang site feedback' },
    fb_mail_body: { zh: '以下网站存在反馈：', en: 'Feedback about this site:' },
    fb_mail_sent: { zh: '📧 已打开邮件发送给站长', en: '📧 Opened email to owner' },
    submit: { zh: '📥 提交收录', en: '📥 Submit site' },
    submit_title: { zh: '📥 提交收录', en: '📥 Submit a site' },
    submit_name: { zh: '网站名称', en: 'Site name' },
    submit_url: { zh: '网址（https://…）', en: 'URL (https://…)' },
    submit_brief: { zh: '一句话简介', en: 'One-line description' },
    submit_send: { zh: '📧 发给站长', en: '📧 Email owner' },
    submit_hint: { zh: '提交后会在你的邮箱客户端打开一封发往站长的申请邮件', en: 'Opens an email to the owner in your mail client' },
    submit_need: { zh: '请填写名称和网址', en: 'Please fill in name and URL' },
    submit_mail_subject: { zh: '屿航收录申请', en: 'Yuhang submission request' },
    submit_mail_body: { zh: '你好，想推荐以下网站收录到屿航：', en: 'Hi, please consider adding this site to Yuhang:' },
    submit_mail_name: { zh: '名称：', en: 'Name: ' },
    submit_mail_url: { zh: '网址：', en: 'URL: ' },
    submit_mail_brief: { zh: '简介：', en: 'Description: ' },
    submit_sent: { zh: '📧 已打开邮件发送给站长', en: '📧 Opened email to owner' }
  };
  var TAG_EN = {
    'AI': 'AI', '游戏': 'Games', '设计与创意': 'Design & Creative',
    '视频与直播': 'Video & Live', '音乐': 'Music', '社交媒体': 'Social',
    '新闻资讯': 'News', '在线学习': 'Learning', '办公协作': 'Office & Collab',
    '效率工具': 'Tools', '编程开发': 'Coding', '云盘与云服务': 'Cloud & Drive',
    '电商购物': 'Shopping', '生活服务': 'Life Services', '数码硬件': 'Hardware',
    '汽车': 'Cars', '运动户外': 'Sports/Outdoor', '文具': 'Stationery',
    '金融理财': 'Finance', '政务': 'Gov Services', '其他': 'Other'
  };
  var NAME_EN = {
    '文心一言': 'ERNIE Bot', '豆包': 'Doubao', '通义千问': 'Qwen', '智谱AI': 'ChatGLM',
    '天工AI': 'Tiangong', '百川智能': 'Baichuan', '腾讯混元': 'Hunyuan', '讯飞星火': 'iFlytek Spark',
    '华为盘古': 'Pangu', '小米AI': 'Xiaomi AI', 'Coze扣子': 'Coze', 'Deepseek': 'DeepSeek',
    '哔哩哔哩': 'Bilibili', '优酷': 'Youku', '爱奇艺': 'iQiyi', '腾讯视频': 'Tencent Video',
    '芒果TV': 'Mango TV', '搜狐视频': 'Sohu Video', '西瓜视频': 'Xigua Video', '快手': 'Kuaishou',
    '抖音网页版': 'Douyin', '抖音': 'Douyin', '虎牙直播': 'Huya', '斗鱼': 'Douyu',
    '央视网': 'CCTV', '梨视频': 'Pear Video', '新片场': 'Xinpianchang', '茶杯狐': 'Cupfox', '茶杯狐影视': 'Cupfox',
    '网易云音乐': 'NetEase Cloud Music', 'QQ音乐': 'QQ Music', '酷狗音乐': 'Kugou', '酷我音乐': 'Kuwo',
    '咪咕音乐': 'Migu Music', '汽水音乐': 'Qishui Music', '波点音乐': 'Bodian Music', '豆瓣FM': 'Douban FM',
    '微博': 'Weibo', '知乎': 'Zhihu', '小红书': 'Xiaohongshu', '豆瓣': 'Douban', '贴吧': 'Baidu Tieba',
    '微信网页版': 'WeChat Web', 'QQ': 'QQ', 'QQ邮箱': 'QQ Mail', '163邮箱': '163 Mail', '网易邮箱': 'NetEase Mail',
    '淘宝': 'Taobao', '京东': 'JD.com', '天猫': 'Tmall', '拼多多': 'Pinduoduo', '拼多多(特价)': 'Pinduoduo Deals',
    '苏宁易购': 'Suning', '唯品会': 'Vipshop', '考拉海购': 'Kaola', '闲鱼': 'Xianyu', '转转': 'Zhuanzhuan',
    '爱回收': 'Aihuishou', '优衣库': 'UNIQLO', '新华书店': 'Xinhua Bookstore', '亚马逊': 'Amazon',
    '携程旅行': 'Ctrip', '飞猪旅行': 'Fliggy', '滴滴': 'Didi', '美团': 'Meituan', '饿了么': 'Ele.me',
    '高德地图': 'Amap', '百度地图': 'Baidu Maps', '快递100': 'Kuaidi100', '墨迹天气': 'Mojia Weather',
    '哈啰': 'Hellobike', '黑猫投诉': 'Heimao Complaint', '雅迪': 'Yadea', '爱玛': 'AIMA',
    '台铃': 'Tailg', '绿源': 'Luyuan', '小牛': 'NIU', '九号': 'Ninebot', '懂车帝': 'Dongchedi',
    '百度百科': 'Baidu Baike', '百度网盘': 'Baidu Pan', '阿里云盘': 'Aliyun Drive', '腾讯微云': 'Weiyun',
    '坚果云': 'Jianguoyun', '微信读书': 'WeRead', '起点中文网': 'Qidian', '晋江文学城': 'Jinjiang',
    '菜鸟教程': 'Runoob', '酷安': 'Coolapk', '迅雷': 'Xunlei', '草料二维码': 'Cli.im', '语雀': 'Yuque',
    '石墨文档': 'Shimo', '飞书': 'Feishu', '钉钉': 'DingTalk', '腾讯文档': 'Tencent Docs', '腾讯文档(在线)': 'Tencent Docs',
    '维基百科': 'Wikipedia', '谷歌': 'Google', '夸克': 'Quark', '小鸡词典': 'Jikipedia', '新华字典': 'Xinhua Dictionary',
    '番茄时钟': 'Forest', '倒数日': 'Days Matter', '万能命令': 'Wannengrun', '图吧工具箱': 'Tuba Toolbox',
    '阿里云': 'Aliyun', '腾讯云': 'Tencent Cloud', '京东云': 'JD Cloud', '无影云电脑': 'WuYing Cloud PC',
    '微软365': 'Microsoft 365', '微软官网': 'Microsoft', 'WPS Office': 'WPS Office', '苹果云服务': 'iCloud',
    '原神官网': 'Genshin Impact', '王者荣耀': 'Honor of Kings', '英雄联盟': 'League of Legends',
    '和平精英': 'Game for Peace', '明日方舟': 'Arknights', '崩坏:星穹铁道': 'Honkai: Star Rail',
    '绝区零': 'Zenless Zone Zero', '鸣潮': 'Wuthering Waves', '黑神话:悟空': 'Black Myth: Wukong',
    '我的世界官网': 'Minecraft', '永劫无间': 'Naraka: Bladepoint', '米哈游': 'miHoYo',
    '星露谷物语': 'Stardew Valley', '泰拉瑞亚': 'Terraria', '饥荒': 'Don\'t Starve', '空洞骑士': 'Hollow Knight',
    '哈迪斯': 'Hades', '艾尔登法环': 'Elden Ring', '赛博朋克2077': 'Cyberpunk 2077',
    '怪物猎人:世界': 'Monster Hunter: World', 'MC百科': 'MC Wiki', 'MC中文维基': 'MC Wiki',
    'MC种子地图': 'MC Seed Map', '种子地图': 'Chunkbase', 'MoeUB服列表': 'MoeUB',
    '育碧平台': 'Ubisoft', 'Lilith Games': 'Lilith Games', '利尔无尽游戏': 'Lilith Games', '异环官网': 'Duet Night Abyss',
    '比亚迪': 'BYD', '吉利': 'Geely', '蔚来': 'NIO', '小鹏': 'XPeng', '理想': 'Li Auto',
    '小米汽车': 'Xiaomi Auto', '鸿蒙智行': 'HarmonyOS', '奔驰': 'Mercedes-Benz', '宝马': 'BMW',
    '奥迪': 'Audi', '大众': 'Volkswagen', '丰田': 'Toyota', '本田': 'Honda', '特斯拉': 'Tesla',
    '保时捷': 'Porsche', '法拉利': 'Ferrari', '劳斯莱斯': 'Rolls-Royce', '宾利': 'Bentley',
    '布加迪': 'Bugatti', '帕加尼': 'Pagani', '科尼赛格': 'Koenigsegg', '莲花': 'Lotus',
    '福特': 'Ford', '雪佛兰': 'Chevrolet', '通用': 'General Motors', '道奇': 'Dodge',
    '林肯': 'Lincoln', '沃尔沃': 'Volvo', '马自达': 'Mazda', '雅马哈': 'Yamaha', '川崎': 'Kawasaki',
    '杜卡迪': 'Ducati', '春风': 'CFMOTO', '野马': 'Ford Mustang', 'GMC': 'GMC',
    '华为官网': 'Huawei', '华为': 'Huawei', '小米商城': 'Xiaomi', '小米': 'Xiaomi',
    '三星': 'Samsung', '三星官网': 'Samsung China', '苹果': 'Apple', '苹果官网': 'Apple China',
    '索尼': 'Sony', '松下': 'Panasonic', '佳能': 'Canon', '尼康': 'Nikon', '卡西欧': 'Casio',
    '哈苏': 'Hasselblad', '徕卡': 'Leica', '英特尔': 'Intel', '英特尔官网': 'Intel China',
    '英伟达': 'NVIDIA', 'NVIDIA商店': 'NVIDIA', '高通': 'Qualcomm', '联发科': 'MediaTek',
    '美光': 'Micron', '希捷': 'Seagate', '西数': 'Western Digital', '七彩虹': 'Colorful',
    '影驰': 'Galaxy', '铭瑄': 'Maxsun', '微星': 'MSI', '海盗船': 'Corsair', '博世': 'Bosch',
    '劳力士': 'Rolex', '哈曼卡顿': 'Harman Kardon', '马歇尔': 'Marshall', '嘉立创': 'JLCPCB', '正点原子': 'Alientek',
    '耐克': 'Nike', '安踏': 'Anta', '李宁': 'Li-Ning', '鸿星尔克': 'ERKE', '迪卡侬': 'Decathlon',
    '始祖鸟': 'Arc\'teryx', '骆驼': 'Camel', '凯乐石': 'Kailas', '捷安特': 'Giant', '喜德盛': 'XDS',
    '闪电': 'Specialized', '永久': 'Forever', '梅花': 'Colnago', '优尼克斯': 'Yonex', '胜利': 'Victor',
    '晨光': 'M&G', '得力': 'Deli', '百乐': 'Pilot', '斑马': 'Zebra', '国誉': 'Kokuyo', '三菱': 'Mitsubishi',
    '东方财富': 'Eastmoney', '同花顺': '10jqka', '新浪财经': 'Sina Finance', '金投网': 'Jintou', '白银价格': 'Silver Price',
    '人民日报': 'People\'s Daily', '新华网': 'Xinhua Net', '今日头条': 'Toutiao', '澎湃新闻': 'The Paper',
    '虎嗅': 'Huxiu', '中国知网': 'CNKI', '中国政府网': 'Gov.cn'
  };
  var STYLE_NAME = {
    terminal: { zh: '终端', en: 'Terminal' }, magazine: { zh: '杂志', en: 'Magazine' },
    brutalism: { zh: '粗野主义', en: 'Brutalism' }, cyber: { zh: '赛博霓虹', en: 'Cyber Neon' },
    pixel: { zh: '像素', en: 'Pixel' }, swiss: { zh: '瑞士极简', en: 'Swiss' },
    glass: { zh: '玻璃拟态', en: 'Glass' }, journal: { zh: '手帐', en: 'Journal' }, space: { zh: '3D空间', en: '3D Space' }
  };
  var STYLE_COLOR = {
    terminal: 'green', magazine: 'red', brutalism: 'orange',
    cyber: 'mint', pixel: 'orange', swiss: 'red',
    glass: 'blue', journal: 'orange', space: 'blue'
  };
  function t(k) {
    var v = DICT[k];
    if (!v) return k;
    return v[S.lang] != null ? v[S.lang] : v['zh'];
  }
  function tagLabel(name) { return S.lang === 'en' && TAG_EN[name] ? TAG_EN[name] : name; }
  function nameLabel(s) { return S.lang === 'en' && NAME_EN[s.name] ? NAME_EN[s.name] : s.name; }

  // 类目色：按首个标签（无则按 category）名哈希为稳定的 HSL 色相 + 饱和度，
  // 用于卡片顶部渐变条、图标光晕环、侧栏筛选色点。同一标签全站同色。
  // 返回 "hue sat%" 字符串，作为单个 CSS 变量 --card-c / --chip-c，
  // 便于用纯 style 字符串注入（兼容旧环境，同时真实浏览器正常解析）。
  function tagHue(name) {
    if (!name || !name.length) return '228 28%';
    var h = 0;
    for (var i = 0; i < name.length; i++) {
      var c = name.charCodeAt(i);
      h = (h * 31 + c) >>> 0;
    }
    var hue = h % 360;
    if (hue < 14) hue += 20;
    var sat = 28 + (h % 10);
    return hue + ' ' + sat + '%';
  }
  // 返回完整 hsl 字符串，light% 默认 62
  function tagHsl(name, l) { return 'hsl(' + tagHue(name) + (l == null ? ' 62%' : ' ' + l + '%') + ')'; }
  // 数字滚动动画（统计页 + hero）
  function countUp(el) {
    if (!el) return;
    var target = parseInt(el.dataset.target, 10);
    if (isNaN(target)) return;
    var start = 0, t0 = null, dur = 900;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  function applyLang() {
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      if (nodes[i].tagName === 'INPUT') { nodes[i].placeholder = t(key); continue; }
      nodes[i].innerHTML = t(key);
    }
    // innerHTML 重建了开场段落的 <b>，重新绑定计数元素，避免更新到游离节点
    descTotal = $('desc-total');
    descTags = $('desc-tags');
    if (searchInput) searchInput.placeholder = t('search_ph');
    if (hotFilter) hotFilter.placeholder = t('hot_filter_ph');
    YHSearch.renderEngineMenu();
    YHSearch.syncEngineUI();
    if (sStyle) {
      var opts = sStyle.querySelectorAll('.style-opt');
      for (var j = 0; j < opts.length; j++) {
        var sv = opts[j].getAttribute('data-style');
        var nm = opts[j].querySelector('.style-name');
        if (nm && STYLE_NAME[sv]) nm.textContent = STYLE_NAME[sv][S.lang] || STYLE_NAME[sv]['zh'];
      }
    }
    YHAuth.updateLoginBtn();
    renderCats();
    renderFilterBar();
    YHCards.render();
    if (modal && !modal.hidden && currentSite) renderModal();
  }
  function setLang(l) {
    S.lang = l;
    try { S.persist.lang(); } catch (e) {}
    applyLang();
    syncThemeUI();
  }
  on(sLang, 'click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    setLang(btn.getAttribute('data-lang'));
  });

  // ---------- 视图管理：排行 / 热搜 / 工具箱（互斥整页视图） ----------
  var rankMode = 'fav';
  var hideTimer = null;
  function fadeHide(el) { if (!el) return; el.classList.add('fading'); clearTimeout(hideTimer); hideTimer = setTimeout(function () { hideTimer = null; el.hidden = true; el.classList.remove('fading'); }, 280); }
  function showNow(el) { if (!el) return; clearTimeout(hideTimer); el.hidden = false; el.classList.remove('fading'); }
  function fadeInView(el) { if (!el) return; el.hidden = false; el.classList.add('fading'); requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('fading'); }); }); }
  function exitAllViews() {
    S.rankActive = S.hotActive = S.toolsActive = false;
    if (rankView) rankView.hidden = true;
    if (hotView) hotView.hidden = true;
    if (toolsView) toolsView.hidden = true;
    // 退出视图 = 回到 grid，一律立即显形（保证搜索恢复/连续切换不留滞留隐藏）
    if (grid) { clearTimeout(hideTimer); grid.hidden = false; grid.classList.remove('fading'); }
    if (filterBar) filterBar.hidden = false;
    renderCats();
  }
  function enterView(mode) {
    exitAllViews();
    if (grid) { grid.hidden = true; grid.classList.remove('fading'); }
    if (filterBar) filterBar.hidden = true;
    if (mode === 'rank') { S.rankActive = true; fadeInView(rankView); }
    else if (mode === 'hot') { S.hotActive = true; fadeInView(hotView); }
    else if (mode === 'tools') { S.toolsActive = true; fadeInView(toolsView); }
    renderCats();
  }
  // ---------- 全站排行（只读聚合，不暴露个人） ----------
  function openRank() {
    if (!S.currentUser) { YHAuth.openLogin(t('need_login_fav')); return; }
    enterView('rank');
    rankView.hidden = false; fadeInView(rankView);
    renderRankTabs();
  }
  function exitRank() { fadeHide(rankView); exitAllViews(); }
  function renderRankTabs() {
    if (!rankTabs) return;
    rankTabs.innerHTML =
      '<button class="login-tab' + (rankMode === 'fav' ? ' active' : '') + '" data-rank="fav">' + t('rank_fav') + '</button>' +
      '<button class="login-tab' + (rankMode === 'click' ? ' active' : '') + '" data-rank="click">' + t('rank_click') + '</button>';
    renderRankView();
  }
  on(rankTabs, 'click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-rank]') : null;
    if (!b) return;
    rankMode = b.getAttribute('data-rank');
    renderRankTabs();
  });
  on(rankBack, 'click', exitRank);
  function renderRankView() {
    if (!rankPodium || !rankTable) return;
    rankPodium.innerHTML = '<div class="ws-empty">' + t('rank_empty') + '</div>';
    rankTable.innerHTML = '';
    YHAuth.ensureSupabase().then(function (client) {
      if (!client) { rankPodium.innerHTML = '<div class="ws-empty">' + t('rank_empty') + '</div>'; return; }
      client.rpc('get_site_stats').then(function (res) {
        if (res.error) { rankPodium.innerHTML = '<div class="ws-empty">' + t('rank_empty') + '</div>'; return; }
        var rows = (res.data || []).slice();
        rows.sort(function (a, b) {
          return rankMode === 'click' ? (b.click_total - a.click_total) : (b.favorite_count - a.favorite_count);
        });
        if (!rows.length) { rankPodium.innerHTML = '<div class="ws-empty">' + t('rank_empty') + '</div>'; return; }
        renderPodium(rows.slice(0, 3));
        renderRankTable(rows.slice(3));
      });
    });
  }
  function siteCountOf(r) {
    return rankMode === 'click' ? (r.click_total || 0) : (r.favorite_count || 0);
  }
  function renderPodium(top3) {
    // 领奖台：左=亚军(2) 中=冠军(1) 右=季军(3)，金银铜金属质感
    var places = [
      { idx: 1, place: 2 },
      { idx: 0, place: 1 },
      { idx: 2, place: 3 }
    ];
    var bars = { 1: 150, 2: 110, 3: 76 };
    rankPodium.innerHTML = '<div class="podium">' + places.map(function (p) {
      var r = top3[p.idx];
      if (!r) return '';
      var s = siteOf(r.site_id);
      var nm = s ? nameLabel(s) : r.site_id;
      var count = siteCountOf(r);
      return '<div class="podium-item place-' + p.place + '">' +
        '<div class="podium-crown">' + (p.place === 1 ? t('crown') : '') + '</div>' +
        '<div class="podium-medal" title="' + t('medal_' + p.place) + '">' + p.place + '</div>' +
        '<div class="podium-name" title="' + escapeHtml(nm) + '">' + escapeHtml(nm) + '</div>' +
        '<div class="podium-count">' + (rankMode === 'click' ? '👁' : '⭐') + count + '</div>' +
        '<div class="podium-place">' + t('medal_' + p.place) + '</div>' +
        '<div class="podium-bar" style="height:' + bars[p.place] + 'px"></div>' +
      '</div>';
    }).join('') + '</div>';
  }
  function renderRankTable(rest) {
    if (!rest.length) { rankTable.innerHTML = ''; return; }
    rankTable.innerHTML = rest.map(function (r, i) {
      var s = siteOf(r.site_id);
      var nm = s ? nameLabel(s) : r.site_id;
      var fav = r.favorite_count || 0, clk = r.click_total || 0;
      var active = rankMode === 'click';
      return '<div class="trow">' +
        '<span class="trank">' + (i + 4) + '</span>' +
        '<span class="tname" title="' + escapeHtml(nm) + '">' + escapeHtml(nm) + '</span>' +
        '<span class="tcount">' + (active ? '👁' + clk : '⭐' + fav) + '</span>' +
        '<span class="tmeta">⭐' + fav + ' · 👁' + clk + '</span>' +
      '</div>';
    }).join('');
  }

  // ---------- 全网热搜（聚合接口 + 断网降级） ----------
  var HOT_PLATFORMS = [
    { code: 'wbHot', key: 'hot_weibo', label: '微博' },
    { code: 'zhihuHot', key: 'hot_zhihu', label: '知乎' },
    { code: 'baiduRD', key: 'hot_baidu', label: '百度' },
    { code: 'douyinHot', key: 'hot_douyin', label: '抖音' },
    { code: 'bili', key: 'hot_bili', label: 'B站' },
    { code: 'toutiao', key: 'hot_toutiao', label: '头条' },
  ];
  // 多源热搜接口：每平台按顺序回退（vvhan → 60s → oioweb），全部失败才降级直达
  var HOT_APIS = {
    wbHot: ['https://api.vvhan.com/api/hotlist/wbHot', 'https://60s.viki.moe/v2/hot?type=weibo', 'https://api.oioweb.cn/api/common/HotList?type=wbHot'],
    zhihuHot: ['https://api.vvhan.com/api/hotlist/zhihuHot', 'https://60s.viki.moe/v2/hot?type=zhihu', 'https://api.oioweb.cn/api/common/HotList?type=zhihuHot'],
    baiduRD: ['https://api.vvhan.com/api/hotlist/baiduRD', 'https://60s.viki.moe/v2/hot?type=baidu', 'https://api.oioweb.cn/api/common/HotList?type=baiduRD'],
    douyinHot: ['https://api.vvhan.com/api/hotlist/douyinHot', 'https://60s.viki.moe/v2/hot?type=douyin', 'https://api.oioweb.cn/api/common/HotList?type=douyinHot'],
    bili: ['https://api.vvhan.com/api/hotlist/bili', 'https://60s.viki.moe/v2/hot?type=bilibili', 'https://api.oioweb.cn/api/common/HotList?type=bili'],
    toutiao: ['https://api.vvhan.com/api/hotlist/toutiao', 'https://60s.viki.moe/v2/hot?type=toutiao', 'https://api.oioweb.cn/api/common/HotList?type=toutiao'],
  };
  // 降级直达的平台热搜页
  var HOT_FALLBACK_URL = {
    wbHot: 'https://weibo.com/hot/search',
    zhihuHot: 'https://www.zhihu.com/hot',
    baiduRD: 'https://top.baidu.com/board?tab=realtime',
    douyinHot: 'https://www.douyin.com/hot',
    bili: 'https://www.bilibili.com/v/popular/rank/all',
    toutiao: 'https://www.toutiao.com/hot/',
  };
  var hotPlatform = 'wbHot';
  var hotCache = {};          // 平台 -> [{title,url,hot}]
  var hotUpdatedAt = {};      // 平台 -> 加载成功时间戳
  var hotRows = [];           // 当前平台的完整榜单（用于本地过滤）
  function openHot() {
    enterView('hot');
    hotView.hidden = false; fadeInView(hotView);
    renderHotTabs();
    loadHot();
  }
  function renderHotTabs() {
    if (!hotTabs) return;
    hotTabs.innerHTML = HOT_PLATFORMS.map(function (p) {
      return '<button class="login-tab' + (hotPlatform === p.code ? ' active' : '') + '" data-hot="' + p.code + '">' + t(p.key) + '</button>';
    }).join('');
  }
  on(hotTabs, 'click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-hot]') : null;
    if (!b) return;
    hotPlatform = b.getAttribute('data-hot');
    if (hotFilter) hotFilter.value = '';
    renderHotTabs();
    loadHot();
  });
  on(hotBack, 'click', function () { fadeHide(hotView); exitAllViews(); });
  on(hotRefresh, 'click', function () { loadHot(true); });
  on(hotFilter, 'input', function () {
    if (hotRows.length) renderHotList(hotRows); // 重新按过滤词渲染
  });
  function setHotMeta(text) {
    if (hotMeta) hotMeta.textContent = text || '';
  }
  function loadHot(force) {
    if (!hotList) return;
    if (!force && hotCache[hotPlatform]) {
      hotRows = hotCache[hotPlatform];
      renderHotList(hotRows);
      return;
    }
    hotRows = [];
    if (hotFilter) hotFilter.value = '';
    hotList.innerHTML = '<div class="skeleton-grid">' + (function(){var h='';for(var i=0;i<5;i++){h+='<div class="skeleton"><div class="skeleton-row tall"></div><div class="skeleton-row w90"></div><div class="skeleton-row w40"></div></div>';}return h;})() + '</div>';
    setHotMeta(t('hot_fetching'));
    if (typeof fetch !== 'function') { renderHotFail(); return; }
    fetchHotRace((HOT_APIS[hotPlatform] || []).slice());
  }
  // 多源竞速：同时发起全部接口，最快返回者胜出，其余自动取消（冷启动体感显著优于串行 fallback）
  function fetchHotRace(urls) {
    if (!urls.length) { renderHotFail(); return; }
    var TIMEOUT = 5000;
    var done = false;
    var remaining = urls.length;
    var ctrls = [];
    var clearAll = function () {
      for (var c = 0; c < ctrls.length; c++) {
        if (ctrls[c]) { try { ctrls[c].abort(); } catch (e) {} }
      }
    };
    var finish = function (rows) {
      if (done) return;
      done = true;
      clearAll();
      hotCache[hotPlatform] = rows;
      hotUpdatedAt[hotPlatform] = Date.now();
      hotRows = rows;
      renderHotList(rows);
    };
    var allFailed = function () {
      if (done) return;
      done = true;
      clearAll();
      renderHotFail();
    };
    for (var i = 0; i < urls.length; i++) {
      (function (url) {
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        ctrls.push(ctrl);
        var timer = null;
        if (ctrl) timer = setTimeout(function () { ctrl.abort(); }, TIMEOUT);
        fetch(url, { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
          .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
          .then(function (payload) {
            if (timer) clearTimeout(timer);
            var rows = (window.YH && YH.parseHotlist) ? YH.parseHotlist(payload) : [];
            if (rows.length) finish(rows);
          })
          .catch(function () {
            if (timer) clearTimeout(timer);
            if (--remaining <= 0) allFailed();
          });
      })(urls[i]);
    }
    // 兜底：极端情况下 remaining 未归零时，超时后强制降级
    setTimeout(function () {
      if (!done) { done = true; renderHotFail(); }
    }, TIMEOUT + 200);
  }
  function renderHotList(rows) {
    var kw = (hotFilter ? hotFilter.value : '').trim().toLowerCase();
    var shown = rows;
    if (kw) {
      shown = rows.filter(function (r) {
        return (r.title || '').toLowerCase().indexOf(kw) !== -1 || (r.hot || '').indexOf(kw) !== -1;
      });
    }
    var html = shown.slice(0, 50).map(function (r, i) {
      var topCls = i < 3 ? ' hot-top hot-top-' + (i + 1) : '';
      var no = i < 3 ? '' : (i + 1);
      var noCls = i < 3 ? 'hot-no med' : 'hot-no';
      return '<a class="hot-item' + topCls + '" href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener" title="' + escapeHtml(r.title) + '">' +
        '<span class="' + noCls + '">' + no + '</span>' +
        '<span class="hot-title">' + escapeHtml(r.title) + '</span>' +
        (r.hot ? '<span class="hot-val">' + escapeHtml(r.hot) + '</span>' : '') +
      '</a>';
    }).join('');
    hotList.innerHTML = html || '<div class="ws-empty">' + t('hot_none') + '</div>';
    // 信息条：平台名 · 更新于 xx:xx · N 条（过滤时显示命中数）
    var meta = hotPlatformLabel() + ' · ' + t('hot_updated') + ' ' + fmtTime(hotUpdatedAt[hotPlatform] || Date.now());
    if (kw) meta += ' · ' + t('hot_hits') + ' ' + shown.length + '/' + rows.length;
    else meta += ' · ' + rows.length + ' ' + t('hot_count');
    setHotMeta(meta);
  }
  function hotPlatformLabel() {
    for (var i = 0; i < HOT_PLATFORMS.length; i++) {
      if (HOT_PLATFORMS[i].code === hotPlatform) return t(HOT_PLATFORMS[i].key);
    }
    return hotPlatform;
  }
  function renderHotFail() {
    // 全部接口失败：不显示报错文案、不自动跳转，仅提供平台直达链接由用户自行点选
    var links = HOT_PLATFORMS.map(function (p) {
      return '<a class="hot-item hot-fallback" href="' + HOT_FALLBACK_URL[p.code] + '" target="_blank" rel="noopener">' +
        '<span class="hot-no med"></span><span class="hot-title">' + t(p.key) + ' →</span></a>';
    }).join('');
    hotList.innerHTML = links;
    setHotMeta(t('hot_direct'));
  }


  // ---------- 官方网站反馈 ----------
  function openFeedback() {
    if (!S.currentUser) { YHAuth.openLogin(t('fb_need_login')); return; }
    if (!currentSite) return;
    fbText.value = '';
    fbMsg.innerHTML = '';
    fbModal.hidden = false;
  }
  // 站长接收邮箱（公开联系邮箱；如需修改，改这一处即可）
  var CONTACT_EMAIL = 'jubei516206@163.com';
  // 打开一封发给站长的邮件（本地邮箱客户端）
  function mailToOwner(subject, body) {
    var u = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body || '');
    var a = document.createElement('a');
    a.href = u;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { a.remove(); }, 300);
  }
  on(fbClose, 'click', function () { fbModal.hidden = true; });
  on(fbModal, 'click', function (e) { if (e.target === fbModal) fbModal.hidden = true; });
  on(fbSubmit, 'click', function () {
    if (!currentSite) { fbMsg.innerHTML = t('no_supabase'); return; }
    var msg = fbText.value.trim();
    if (!msg) { fbMsg.innerHTML = t('login_need'); return; }
    YHAuth.ensureSupabase().then(function (client) {
      if (!client) { fbMsg.innerHTML = t('no_supabase'); return; }
      client.from('feedback').insert({ user_id: cloudUid(), site_id: currentSite.id, message: msg }).then(function (res) {
        if (res.error) { fbMsg.innerHTML = t('auth_err') + ': ' + authErrorMsg(res.error); return; }
        fbMsg.innerHTML = t('fb_ok');
        setTimeout(function () { fbModal.hidden = true; }, 1000);
      });
    });
  });
  // 反馈也直接发给站长（邮件）
  on($('fb-mail'), 'click', function () {
    var msg = fbText.value.trim();
    if (!msg) { fbMsg.innerHTML = t('login_need'); return; }
    var name = currentSite ? nameLabel(currentSite) : '';
    var url = currentSite ? currentSite.url : '';
    mailToOwner(
      t('fb_mail_subject'),
      t('fb_mail_body') + '\n\n' + name + '\n' + url + '\n\n' + msg
    );
    fbMsg.innerHTML = t('fb_mail_sent');
  });

  // ---------- 提交收录（推荐网站给站长，通过邮件发送） ----------
  function openSubmit() {
    if (submitName) submitName.value = '';
    if (submitUrl) submitUrl.value = '';
    if (submitBrief) submitBrief.value = '';
    if (submitMsg) submitMsg.innerHTML = '';
    if (submitModal) submitModal.hidden = false;
  }
  btnSubmit.forEach(function (b) { on(b, 'click', openSubmit); });
  on(submitClose, 'click', function () { submitModal.hidden = true; });
  on(submitModal, 'click', function (e) { if (e.target === submitModal) submitModal.hidden = true; });
  on(submitSend, 'click', function () {
    var name = (submitName ? submitName.value : '').trim();
    var url = (submitUrl ? submitUrl.value : '').trim();
    var brief = (submitBrief ? submitBrief.value : '').trim();
    if (!name || !url) { if (submitMsg) submitMsg.innerHTML = t('submit_need'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    mailToOwner(
      t('submit_mail_subject'),
      t('submit_mail_body') + '\n\n' + t('submit_mail_name') + ' ' + name + '\n' +
        t('submit_mail_url') + ' ' + url + '\n' +
        t('submit_mail_brief') + ' ' + brief
    );
    if (submitMsg) submitMsg.innerHTML = t('submit_sent');
    setTimeout(function () { if (submitModal) submitModal.hidden = true; }, 1200);
  });

    // Supabase 会话初始化与状态监听（懒加载完成后注册，走 YHAuth 接口）
  function initSupabase() {
    YHAuth.ensureSupabase().then(function (client) {
      if (!client) return;
      YHAuth.supabaseClient.auth.getSession().then(function (res) {
        if (res && res.data && res.data.session && res.data.session.user && !res.data.session.user.is_anonymous) {
          YHAuth.setSupabaseUser(res.data.session.user);
          S.currentUser = YHAuth.supabaseUser.email || YHAuth.supabaseUser.id;
          loadAccountData();
          YHAuth.pullFromCloud().then(function () {
            YHAuth.updateLoginBtn();
            renderCats();
            renderFilterBar();
            YHCards.render();
          });
        }
      });
      YHAuth.supabaseClient.auth.onAuthStateChange(function (event, session) {
        if (session && session.user && !session.user.is_anonymous) {
          YHAuth.setSupabaseUser(session.user);
          S.currentUser = YHAuth.supabaseUser.email || session.user.id;
          loadAccountData();
          if (event === 'SIGNED_IN') {
            YHAuth.pullFromCloud().then(function () {
              YHAuth.updateLoginBtn();
              renderCats();
              renderFilterBar();
              YHCards.render();
            });
          }
        } else {
          YHAuth.setSupabaseUser(null);
          S.currentUser = null;
          loadAccountData();
          YHAuth.updateLoginBtn();
          renderCats();
          renderFilterBar();
          YHCards.render();
        }
      });
    });
  }
// ---------- 添加个人网站 ----------
  function openAdd(site) {
    editingPersonalId = site ? site.id : null;
    addName.value = site ? site.name : '';
    addUrl.value = site ? site.url : '';
    addBrief.value = site ? (site.brief || '') : '';
    addTags.value = site ? (site.tags || []).join(',') : '';
    addMsg.innerHTML = '';
    var head = addModal.querySelector('.s-head');
    if (head) head.innerHTML = site ? t('edit_title') : t('add_title');
    addSubmit.innerHTML = site ? t('save') : t('add_submit');
    addModal.hidden = false;
  }
  function closeAdd() { addModal.hidden = true; editingPersonalId = null; }
  on(addClose, 'click', closeAdd);
  on(addModal, 'click', function (e) { if (e.target === addModal) closeAdd(); });
  on(addSubmit, 'click', function () {
    if (!S.currentUser) { addMsg.innerHTML = t('login_need'); return; }
    var name = (addName.value || '').trim();
    var url = (addUrl.value || '').trim();
    if (!name || !url) { addMsg.innerHTML = t('add_err'); return; }
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    var tags = (addTags.value || '').split(/[,，]/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (editingPersonalId) {
      // 编辑已有个人网站
      var mine = S.personalSites[S.currentUser] || [];
      for (var i = 0; i < mine.length; i++) {
        if (mine[i].id === editingPersonalId) {
          mine[i].name = name;
          mine[i].fullName = name;
          mine[i].url = url;
          mine[i].brief = addBrief.value.trim();
          mine[i].tags = tags;
          break;
        }
      }
      addMsg.innerHTML = t('saved');
    } else {
      var site = {
        id: 'p' + Date.now(),
        owner: S.currentUser,
        name: name,
        fullName: name,
        url: url,
        brief: addBrief.value.trim(),
        detail: '',
        category: '',
        tags: tags,
        vpn: false,
        source: 'personal'
      };
      if (!S.personalSites[S.currentUser]) S.personalSites[S.currentUser] = [];
      S.personalSites[S.currentUser].push(site);
      addMsg.innerHTML = t('add_ok');
    }
    savePersonal();
    setTimeout(function () {
      closeAdd();
      renderCats();
      renderFilterBar();
      YHCards.render();
    }, 600);
  });

  // ---------- 添加弹窗：手动 / 从收录中选 双标签 + 收录搜索 ----------
  var addManual = $('add-manual'), addPick = $('add-pick'), addSearch = $('add-search'), addSugg = $('add-sugg');
  function switchAddTab(tab) {
    addManual && addManual.classList.toggle('hidden', tab !== 'manual');
    addPick && addPick.classList.toggle('hidden', tab !== 'pick');
    document.querySelectorAll('.add-tab').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-addtab') === tab); });
    if (tab === 'pick' && addSearch) addSearch.focus();
  }
  document.querySelectorAll('.add-tab').forEach(function (b) {
    on(b, 'click', function () { switchAddTab(b.getAttribute('data-addtab')); });
  });
  function renderAddSugg() {
    if (!addSugg || !addSearch) return;
    var q = (addSearch.value || '').trim().toLowerCase();
    if (!q) { addSugg.innerHTML = ''; return; }
    var sites = (window.SITES || []);
    var hits = [];
    for (var i = 0; i < sites.length && hits.length < 8; i++) {
      var s = sites[i], hay = ((s.name || '') + ' ' + (s.fullName || '') + ' ' + (s.url || '') + ' ' + (s.brief || '')).toLowerCase();
      if (hay.indexOf(q) !== -1) hits.push(s);
    }
    if (!hits.length) { addSugg.innerHTML = '<div class="add-sugg-item" style="justify-content:center;color:var(--text-faint);cursor:default">未找到匹配</div>'; return; }
    addSugg.innerHTML = hits.map(function (s) {
      return '<button type="button" class="add-sugg-item" data-pick-idx="' + (window.SITES.indexOf(s)) + '">' +
        '<span class="add-sugg-name">' + esc(s.name) + '</span>' +
        '<span class="add-sugg-url">' + esc(hostOf(s.url || '')) + '</span></button>';
    }).join('');
  }
  on(addSearch, 'input', renderAddSugg);
  on(addSugg, 'click', function (e) {
    var b = e.target.closest ? e.target.closest('.add-sugg-item[data-pick-idx]') : null;
    if (!b) return;
    var s = window.SITES[parseInt(b.getAttribute('data-pick-idx'), 10)];
    if (!s) return;
    addName.value = s.name || '';
    addUrl.value = s.url || '';
    addBrief.value = s.brief || '';
    addTags.value = (s.tags || []).join(',');
    addMsg.innerHTML = '';
    switchAddTab('manual');
  });

  // ---------- 主题：风格 + 颜色 ----------
  (function migrateTheme() {
    var old = localStorage.getItem('nav_theme_v1');
    var oldStyles = ['light', 'dark', 'aurora', 'sunset', 'forest', 'mono', 'violet', 'mint'];
    if (oldStyles.indexOf(old) !== -1) {
      if (old === 'violet' || old === 'mint') S.color = old;
      S.theme = 'brutalism';
    }
  })();
  function applyTheme() {
    // 保存当前滚动位置，防止 CSS 重排导致滚动跳跃
    var y = (window.scrollY || document.documentElement.scrollTop || 0);
    document.documentElement.setAttribute('data-theme', S.theme);
    document.documentElement.setAttribute('data-color', S.color);
    requestAnimationFrame(function () { window.scrollTo(0, y); });
  }
  function spinActiveDot() {
    var dot = document.querySelector('#s-colors .color-dot.active');
    if (!dot) return;
    dot.classList.remove('spin');
    void dot.offsetWidth;
    dot.classList.add('spin');
  }
  function syncThemeUI() {
    if (sStyle) {
      var opts = sStyle.querySelectorAll('.style-opt');
      for (var i = 0; i < opts.length; i++) opts[i].classList.toggle('active', opts[i].getAttribute('data-style') === S.theme);
    }
    var dots = document.querySelectorAll('#s-colors .color-dot');
    for (var j = 0; j < dots.length; j++) dots[j].classList.toggle('active', dots[j].getAttribute('data-color') === S.color);
    if (sLang) {
      var lb = sLang.querySelectorAll('button');
      for (var k = 0; k < lb.length; k++) lb[k].classList.toggle('active', lb[k].getAttribute('data-lang') === S.lang);
      updatePill(sLang);
    }
  }
  on(sStyle, 'click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    S.theme = btn.getAttribute('data-style');
    if (STYLE_COLOR[S.theme]) S.color = STYLE_COLOR[S.theme];
    try { S.persist.theme(); S.persist.color(); } catch (err) {}
    applyTheme();
    syncThemeUI();
    spinActiveDot();
  });
  on(sColors, 'click', function (e) {
    var dot = e.target.closest ? e.target.closest('.color-dot') : null;
    if (!dot) return;
    S.color = dot.getAttribute('data-color');
    try { S.persist.color(); } catch (err) {}
    applyTheme();
    syncThemeUI();
    spinActiveDot();
  });
  applyTheme();

  // ---------- 卡片大小：滑动指示器药丸 ----------
  function ensurePill(container) {
    if (!container) return null;
    var pill = container.querySelector('.size-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'size-pill';
      container.appendChild(pill);
    }
    return pill;
  }
  function updatePill(container) {
    if (!container) return;
    var pill = ensurePill(container);
    var active = container.querySelector('button.active');
    if (!active || active.offsetWidth === 0) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '1';
    if (!pill.dataset.inited) {
      pill.style.transition = 'none';
      pill.dataset.inited = '1';
    }
    pill.style.width = active.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    if (pill.style.transition === 'none') {
      void pill.offsetWidth;
      pill.style.transition = '';
    }
  }
  function syncSizeBtns() {
    if (!sSize) return;
    var btns = sSize.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-size') === S.gridSize);
    updatePill(sSize);
  }
  on(sSize, 'click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    S.gridSize = btn.getAttribute('data-size');
    try { S.persist.gridSize(); } catch (err) {}
    syncSizeBtns();
    YHCards.render();
  });

  // ---------- 设置面板 ----------
  var sIcon = $('s-icon');
  function syncIconModeBtns() {
    if (!sIcon) return;
    var btns = sIcon.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', btns[i].getAttribute('data-iconmode') === S.settings.cardIcon);
    }
    updatePill(sIcon);
  }
  on(sIcon, 'click', function (e) {
    var btn = e.target.closest ? e.target.closest('button') : null;
    if (!btn) return;
    S.settings.cardIcon = btn.getAttribute('data-iconmode');
    saveSettings();
    syncIconModeBtns();
    YHCards.render();
  });
  function syncSettingsUI() {
    var switches = document.querySelectorAll('.switch');
    for (var i = 0; i < switches.length; i++) {
      var key = switches[i].getAttribute('data-key');
      switches[i].classList.toggle('on', !!S.settings[key]);
    }
    syncIconModeBtns();
  }
  function applySetting(key, val) {
    if (key === 'petals') {
      if (val) initParticles(); else disableParticles();
    } else if (key === 'snow') {
      if (val) initSnow(); else disableSnow();
    } else if (key === 'cursorFx') {
      if (val) enableCursorFx(); else disableCursorFx();
    } else if (key === 'showIntro') {
      if (!val) document.body.classList.add('entered');
    }
  }
  function openSettings() {
    syncSettingsUI();
    settingsModal.hidden = false;
    // 弹窗可见后再测量滑动指示条（隐藏时 offsetWidth 为 0 会导致指示条不显示/错位）
    requestAnimationFrame(function () { syncThemeUI(); syncSizeBtns(); syncIconModeBtns(); });
  }
  function closeSettings() { settingsModal.hidden = true; }
  on(settingsClose, 'click', closeSettings);
  on(settingsModal, 'click', function (e) { if (e.target === settingsModal) closeSettings(); });
  on(modalSettingsBtn, 'click', openSettings);
  btnSettings.forEach(function (b) { on(b, 'click', openSettings); });
  document.addEventListener('click', function (e) {
    var sw = e.target.closest ? e.target.closest('.switch') : null;
    if (!sw) return;
    var key = sw.getAttribute('data-key');
    S.settings[key] = !S.settings[key];
    saveSettings();
    syncSettingsUI();
    applySetting(key, S.settings[key]);
  });
  btnBackIntro.forEach(function (b) { on(b, 'click', function () {
    document.body.classList.remove('entered');
    document.body.classList.remove('instant');
    closeSettings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }); });

  // ---------- 工作区 ----------
  function wsCount() { return Object.keys(S.workspaces).length; }
  function openWsManager() {
    if (!S.currentUser) { YHAuth.openLogin(t('need_login_fav')); return; }
    renderWsList();
    wsModal.hidden = false;
  }
  function closeWsManager() { wsModal.hidden = true; }
  function renderWsList() {
    if (!wsList) return;
    var keys = Object.keys(S.workspaces);
    if (!keys.length) { wsList.innerHTML = '<div class="ws-empty">' + t('ws_empty') + '</div>'; return; }
    wsList.innerHTML = keys.map(function (id) {
      var ws = S.workspaces[id];
      return '<div class="ws-item" draggable="true" data-wsid="' + id + '">' +
        '<span class="ws-drag" title="拖拽排序">⋮⋮</span>' +
        '<div class="ws-info"><span class="ws-name">' + escapeHtml(ws.name) + '</span><span class="ws-count">' + ws.ids.length + ' ' + (S.lang === 'en' ? 'sites' : '个网站') + '</span></div>' +
        '<div class="ws-actions">' +
          '<button class="btn btn-ghost" data-ws-open="' + id + '">' + t('open_all') + '</button>' +
          '<button class="btn btn-ghost" data-ws-view="' + id + '">' + t('view') + '</button>' +
          '<button class="btn btn-ghost" data-ws-ren="' + id + '">' + t('ws_rename') + '</button>' +
          '<button class="btn btn-ghost" data-ws-del="' + id + '">' + t('del') + '</button>' +
        '</div></div>';
    }).join('');
  }
  // 工作区拖拽排序
  var wsDragId = null;
  function reorderWs(fromId, toId) {
    if (fromId === toId) return;
    var keys = Object.keys(S.workspaces);
    var fi = keys.indexOf(fromId), ti = keys.indexOf(toId);
    if (fi < 0 || ti < 0) return;
    keys.splice(fi, 1);
    keys.splice(ti, 0, fromId);
    var next = {};
    keys.forEach(function (k) { next[k] = S.workspaces[k]; });
    S.workspaces = next;
    saveAccountData();
    renderWsList();
  }
  on(wsList, 'dragstart', function (e) {
    var it = e.target.closest ? e.target.closest('.ws-item') : null;
    if (!it) return;
    wsDragId = it.getAttribute('data-wsid');
    if (it.classList) it.classList.add('ws-dragging');
  });
  on(wsList, 'dragend', function () { wsDragId = null; });
  on(wsList, 'dragover', function (e) { if (e.preventDefault) e.preventDefault(); });
  on(wsList, 'drop', function (e) {
    if (e.preventDefault) e.preventDefault();
    var it = e.target.closest ? e.target.closest('.ws-item') : null;
    if (it && wsDragId) reorderWs(wsDragId, it.getAttribute('data-wsid'));
    wsDragId = null;
  });
  on(wsClose, 'click', closeWsManager);
  on(wsModal, 'click', function (e) { if (e.target === wsModal) closeWsManager(); });
  on(wsList, 'click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-ws-open],[data-ws-view],[data-ws-del],[data-ws-ren]') : null;
    if (!btn) return;
    var id = btn.getAttribute('data-ws-open') || btn.getAttribute('data-ws-view') || btn.getAttribute('data-ws-del') || btn.getAttribute('data-ws-ren');
    var ws = S.workspaces[id];
    if (!ws) return;
    if (btn.hasAttribute('data-ws-open')) {
      ws.ids.forEach(function (sid) {
        var s = siteOf(sid);
        if (s && s.url) window.open(s.url, '_blank');
      });
    } else if (btn.hasAttribute('data-ws-ren')) {
      var nn = window.prompt(t('ws_rename_ph'), ws.name);
      if (nn && (nn = nn.trim())) {
        ws.name = nn;
        saveAccountData();
        renderWsList();
        renderCats();
      }
    } else if (btn.hasAttribute('data-ws-view')) {
      closeWsManager();
      activeWs = id;
      activeCat = WS_CAT;
      renderCats(); renderFilterBar(); YHCards.render();
    } else if (btn.hasAttribute('data-ws-del')) {
      delete S.workspaces[id];
      saveAccountData();
      renderWsList(); renderCats();
      if (activeWs === id) { activeWs = null; activeCat = '全部'; renderFilterBar(); YHCards.render(); }
    }
  });
  on(wsAddBtn, 'click', function () {
    var name = (wsNameInput.value || '').trim();
    if (!name) return;
    S.workspaces['w' + Date.now()] = { name: name, ids: [] };
    saveAccountData();
    wsNameInput.value = '';
    renderWsList(); renderCats();
  });

  // ---------- 收藏（个人专属） ----------
  function toggleFav(id) {
    if (S.favs.has(id)) S.favs.delete(id); else S.favs.add(id);
    saveAccountData();
    renderCats(); YHCards.render();
    if (modal && !modal.hidden && currentSite && currentSite.id === id) renderModal();
  }

  // ---------- 时钟 ----------
  var cwTime = null, cwDate = null;
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function tickClock() {
    if (!cwTime || !cwDate) return;
    var d = new Date();
    cwTime.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    var m = d.getMonth() + 1, day = d.getDate();
    if (S.lang === 'en') {
      cwDate.textContent = m + '/' + day + ' ' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    } else {
      cwDate.textContent = m + '月' + day + '日 · 周' + '日一二三四五六'[d.getDay()];
    }
  }
  function initClock() {
    if (!clockEl) return;
    clockEl.innerHTML = '<span class="cw-time"></span><span class="cw-date"></span>';
    cwTime = clockEl.querySelector('.cw-time');
    cwDate = clockEl.querySelector('.cw-date');
    tickClock();
    setInterval(tickClock, 1000);
  }

  // ---------- 背景落花 ----------
  // 按 class 独立增删：花瓣与雪花互不干扰（各操作只清理自己的类型）
  function clearFxClass(cls) {
    if (!fxEl || !fxEl.querySelectorAll) return;
    var els = fxEl.querySelectorAll('.' + cls);
    for (var i = els.length - 1; i >= 0; i--) {
      var p = els[i].parentNode;
      if (p && p.removeChild) p.removeChild(els[i]);
    }
  }
  function appendFxHTML(html) {
    if (!fxEl) return;
    // 真实浏览器用 insertAdjacentHTML；测试桩无此方法时退化为 innerHTML 拼接
    if (typeof fxEl.insertAdjacentHTML === 'function') { fxEl.insertAdjacentHTML('beforeend', html); return; }
    fxEl.innerHTML += html;
  }
  function initParticles() {
    if (!fxEl || !S.settings.petals) return;
    clearFxClass('fx-petal');
    var html = '';
    for (var i = 0; i < 16; i++) {
      var size = 6 + Math.random() * 9;
      var left = Math.random() * 100;
      var dur = 10 + Math.random() * 10;
      var delay = -Math.random() * 20;
      var sway = (Math.random() * 70 - 35).toFixed(0) + 'px';
      html += '<i class="fx-petal" style="left:' + left.toFixed(1) + '%;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) +
        'px;animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + delay.toFixed(1) + 's;--sway:' + sway + '"></i>';
    }
    appendFxHTML(html);
  }
  function disableParticles() { clearFxClass('fx-petal'); }

  // ---------- 背景飘雪 ----------
  function initSnow() {
    if (!fxEl || !S.settings.snow) return;
    clearFxClass('fx-snow');
    var html = '';
    for (var i = 0; i < 12; i++) {
      var size = 3 + Math.random() * 5;
      var left = Math.random() * 100;
      var dur = 14 + Math.random() * 12;
      var delay = -Math.random() * 20;
      var sway = (Math.random() * 50 - 25).toFixed(0) + 'px';
      html += '<i class="fx-snow" style="left:' + left.toFixed(1) + '%;width:' + size.toFixed(1) + 'px;height:' + size.toFixed(1) +
        'px;animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + delay.toFixed(1) + 's;--sway:' + sway + '"></i>';
    }
    appendFxHTML(html);
  }
  function disableSnow() { clearFxClass('fx-snow'); }

  // ---------- 光标光晕 + 拖尾 ----------
  var mouseX = -9999, mouseY = -9999;
  var dots = [{ x: -9999, y: -9999 }, { x: -9999, y: -9999 }, { x: -9999, y: -9999 }];
  var glowX = -9999, glowY = -9999;
  var fxRaf = null;
  var trailDots = trailEl ? trailEl.querySelectorAll('i') : [];
  var mouseMovePending = false;
  function onMouseMove(e) {
    // 节流：多个 mousemove 事件只在上一次 rAF 处理完后再读一次坐标
    // 高频显示器上 mousemove 可达 200+/s，此处节流至 1/rAF-frame
    if (mouseMovePending) return;
    mouseMovePending = true;
    mouseX = e.clientX; mouseY = e.clientY;
    if (glowEl) glowEl.style.opacity = '1';
    if (trailEl) trailEl.style.opacity = '1';
    requestAnimationFrame(function () { mouseMovePending = false; });
  }
  var mouseIdleMs = 0;
  function fxFrame() {
    // 光标静止超 60ms 停止 rAF 循环，避免空闲时持续消耗 GPU/CPU
    if (mouseIdleMs > 60) { fxRaf = null; return; }
    glowX += (mouseX - glowX) * 0.1;
    glowY += (mouseY - glowY) * 0.1;
    if (glowEl) glowEl.style.transform = 'translate(' + (glowX - 75) + 'px,' + (glowY - 75) + 'px)';
    var px = mouseX, py = mouseY;
    for (var i = 0; i < trailDots.length; i++) {
      dots[i].x += (px - dots[i].x) * 0.32;
      dots[i].y += (py - dots[i].y) * 0.32;
      px = dots[i].x; py = dots[i].y;
      trailDots[i].style.transform = 'translate(' + px + 'px,' + py + 'px)';
    }
    fxRaf = requestAnimationFrame(fxFrame);
  }
  function initCursorFx() {
    if (!S.settings.cursorFx) return;
    if (perfLevel === 'low') return; // 低端机关闭光标特效
    document.addEventListener('mousemove', onMouseMove);
    if (trailEl) trailEl.style.opacity = '0';
    if (!fxRaf) fxRaf = requestAnimationFrame(fxFrame);
  }
  function disableCursorFx() {
    document.removeEventListener('mousemove', onMouseMove);
    if (fxRaf) { cancelAnimationFrame(fxRaf); fxRaf = null; }
    if (glowEl) glowEl.style.opacity = '0';
    if (trailEl) trailEl.style.opacity = '0';
    mouseIdleMs = 0;
  }
  function enableCursorFx() {
    if (perfLevel === 'low') return;
    if (trailEl) trailEl.style.opacity = '0';
    if (!fxRaf) fxRaf = requestAnimationFrame(fxFrame);
    document.addEventListener('mousemove', onMouseMove);
  }

  // ---------- 工具函数 ----------
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // 涟漪反馈：在容器内创建白色圆从点击点扩散
  function makeRipple(el, x, y) {
    if (!el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    var dx = (x - r.left), dy = (y - r.top);
    var sz = Math.max(r.width, r.height) * 2;
    var d = document.createElement('span');
    d.className = 'ripple';
    d.style.width = d.style.height = sz + 'px';
    d.style.left = (dx - sz / 2) + 'px';
    d.style.top = (dy - sz / 2) + 'px';
    el.appendChild(d);
    setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 600);
  }
  function letterHue(name) {
    var h = 0;
    for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
    return h;
  }
  function clickedCount() {
    var n = 0;
    for (var k in S.clicks) if (S.clicks[k] > 0) n++;
    return n;
  }
  function iconHTML(s, big) {
    var letter = escapeHtml(nameLabel(s).slice(0, 1));
    var host = '';
    try { if (s.url) host = new URL(s.url).hostname; } catch (e) { /* 忽略非法网址 */ }
    var img = '';
    if (host && S.settings.cardIcon !== 'letter' && !badIconHosts[host]) {
      // 网站图标：懒加载（data-src 占位，IntersectionObserver 进入视口时再设 src）
      // 避免大网格 1000+ 站点同时发起全量网络请求
      img = '<img class="icon-img" data-host="' + escapeHtml(host) + '" data-src="0" ' +
        'alt="" decoding="async" loading="lazy" ' +
        'onload="var l=this.parentNode.querySelector(\'.icon-letter\');if(l)l.style.display=\'none\';">';
    }
    return '<span class="icon' + (big ? ' icon-lg' : '') + '" style="--h:' + letterHue(s.name) + 'deg">' +
      img + '<span class="icon-letter">' + letter + '</span></span>';
  }
  // favicon 多源回退（Google 服务在国内常被墙）：favicon.im → DuckDuckGo → Google
  var FAV_SOURCES = [
    function (h) { return 'https://favicon.im/' + h; },
    function (h) { return 'https://icons.duckduckgo.com/ip3/' + h + '.ico'; },
    function (h) { return 'https://www.google.com/s2/favicons?domain=' + h + '&sz=64'; },
  ];
  var badIconHosts = {}; // 全部源都失败的主机名（避免反复请求）
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || !img.classList.contains('icon-img')) return;
    var host = img.getAttribute('data-host');
    var idx = parseInt(img.getAttribute('data-src') || '0', 10) + 1;
    if (idx < FAV_SOURCES.length) {
      img.setAttribute('data-src', String(idx));
      img.src = FAV_SOURCES[idx](host);
    } else {
      if (host) badIconHosts[host] = 1;
      var parent = img.parentNode;
      img.remove();
      var l = parent ? parent.querySelector('.icon-letter') : null;
      if (l) l.style.display = '';
    }
  }, true);

  // 懒加载 favicon：IntersectionObserver 进入视口时再设 src
  var favLazyIo = null;
  function lazyLoadIcons() {
   var imgs = grid ? grid.querySelectorAll('.icon-img[data-src="0"]:not([src])') : [];
   if (imgs.length === 0) return;
   if (!('IntersectionObserver' in window)) {
     imgs.forEach(function (im) { im.src = FAV_SOURCES[0](im.getAttribute('data-host')); });
     return;
   }
   if (!favLazyIo) {
     favLazyIo = new IntersectionObserver(function (entries) {
       entries.forEach(function (en) {
         if (en.isIntersecting) {
           var im = en.target;
           if (im.getAttribute('data-src') === '0' && !im.src) {
             im.src = FAV_SOURCES[0](im.getAttribute('data-host'));
           }
           favLazyIo.unobserve(im);
         }
       });
     }, { rootMargin: '200px' });
   }
   imgs.forEach(function (im) { favLazyIo.observe(im); });
  }

  function sourceBadge(s) {
    return s.source === 'personal'
      ? '<span class="tag tag-me">' + t('personal') + '</span>'
      : '<span class="tag tag-off">' + t('official') + '</span>';
  }

  // ---------- 左侧导航 ----------
  function renderCats() {
    if (!catBar && !catDropdown[0]) return;
    var specials = [
      { name: '全部', label: t('all'), count: allSites().length },
      { name: HOT_NEW_CAT, label: t('hot_new'), count: '' },
      { name: TOOLS_CAT, label: t('tools_title'), count: '' },
    ];
    if (S.currentUser) {
      // 登录后专属：个人网站 / 收藏 / 最常 / 工作区
      specials.push({ name: MY_CAT, label: t('my_sites'), count: (S.personalSites[S.currentUser] || []).length });
      specials.push({ name: FAV_CAT, label: t('favs'), count: S.favs.size });
      specials.push({ name: HOT_CAT, label: t('hot'), count: clickedCount() });
      specials.push({ name: WS_CAT, label: t('ws'), count: wsCount() });
      specials.push({ name: RANK_CAT, label: t('rank_title'), count: '' });
    } else {
      // 未登录：登录解锁提示
      specials.push({ name: '__login', label: t('login_hint_short'), count: '' });
    }
    if (S.recentIds.length) {
      // 最近访问（本地记录，登录与否都可用）
      specials.push({ name: RECENT_CAT, label: t('recent'), count: S.recentIds.length });
    }
    var tags = (META.tags || []).map(function (tt) { return { name: tt.name, label: tagLabel(tt.name), count: tt.count }; });
    var items = specials.concat(tags);
    // 生成单个分类项（桌面分类栏与移动端筛选下拉共用）
    function makeItem(item) {
      var viewOn = S.rankActive || S.hotActive || S.toolsActive; // 视图打开时，普通分类不高亮
      var isSpecial = (item.name === '全部' || item.name === MY_CAT || item.name === FAV_CAT || item.name === HOT_CAT || item.name === WS_CAT || item.name === RANK_CAT || item.name === HOT_NEW_CAT || item.name === TOOLS_CAT || item.name === RECENT_CAT || item.name === '__login');
      var viewActive = (item.name === RANK_CAT && S.rankActive) || (item.name === HOT_NEW_CAT && S.hotActive) || (item.name === TOOLS_CAT && S.toolsActive);
      var isActive = isSpecial
        ? (viewOn ? viewActive : activeCat === item.name)
        : selectedTags.has(item.name);
      var b = document.createElement('button');
      b.className = 'chip' + (item.name === '__login' ? ' chip-login' : '') + (isActive ? ' active' : '');
      if (!isSpecial) { b.dataset.hue = '1'; b.style = '--chip-h ' + tagHue(item.name); }
      var label = document.createElement('span');
      label.textContent = item.label;
      var cnt = document.createElement('span');
      cnt.className = 'chip-count';
      if (item.count !== '') cnt.textContent = item.count;
      b.appendChild(label); b.appendChild(cnt);
      b.addEventListener('click', function (e) {
        var tgt = e && e.currentTarget ? e.currentTarget : b;
        if (e && e.clientX != null) makeRipple(tgt, e.clientX, e.clientY);
        onCatItemClick(item.name)(e);
      });
      return b;
    }
    if (catBar) {
      catBar.innerHTML = '';
      items.forEach(function (item) { catBar.appendChild(makeItem(item)); });
    }
    catDropdown.forEach(function (dd) {
      dd.innerHTML = '';
      items.forEach(function (item) { dd.appendChild(makeItem(item)); });
    });
    updateCatFilterLabel();
    syncBottomNav();
  }
  // 分类项点击（桌面/移动下拉共用）
  function onCatItemClick(name) {
    return function () {
      if (name !== RANK_CAT && name !== HOT_NEW_CAT && name !== TOOLS_CAT) exitAllViews();
      if (name === '__login') { YHAuth.openLogin(t('need_login_fav')); closeCatDropdown(); return; }
      if (name === WS_CAT) { openWsManager(); closeCatDropdown(); return; }
      if (name === RANK_CAT) { openRank(); closeCatDropdown(); return; }
      if (name === HOT_NEW_CAT) { openHot(); closeCatDropdown(); return; }
      if (name === TOOLS_CAT) { YHTools.open(); closeCatDropdown(); return; }
      if (name === '全部' || name === MY_CAT || name === FAV_CAT || name === HOT_CAT || name === RECENT_CAT) {
        activeCat = name;
        selectedTags.clear();
        activeWs = null;
      } else {
        if (activeCat !== '') activeCat = '';
        activeWs = null;
        if (selectedTags.has(name)) selectedTags.delete(name); else selectedTags.add(name);
        if (selectedTags.size === 0) activeCat = '全部';
      }
      closeCatDropdown();
      renderCats(); renderFilterBar(); YHCards.render();
    };
  }
  // 移动端筛选按钮：显示当前所处分类
  function updateCatFilterLabel() {
    if (!catFilterLabel) return;
    var label = t('all');
    if (selectedTags.size === 1) label = tagLabel(Array.from(selectedTags)[0]);
    else if (selectedTags.size > 1) label = t('filter_n').replace('{n}', selectedTags.size);
    else if (S.rankActive) label = t('rank_title');
    else if (S.hotActive) label = t('hot_new');
    else if (S.toolsActive) label = t('tools_title');
    else if (activeCat === MY_CAT) label = t('my_sites');
    else if (activeCat === FAV_CAT) label = t('favs');
    else if (activeCat === HOT_CAT) label = t('hot');
    else if (activeCat === WS_CAT) label = t('ws');
    else if (activeCat === RECENT_CAT) label = t('recent');
    catFilterLabel.forEach(function (l) { l.textContent = label; });
  }
  function closeCatDropdown() {
    catDropdown.forEach(function (dd) { dd.hidden = true; });
    catFilterBtn.forEach(function (b) { b.classList.remove('open'); });
  }
  catFilterBtn.forEach(function (btn) { on(btn, 'click', function (e) {
    if (e.stopPropagation) e.stopPropagation();
    var wrap = btn.parentElement;
    var dd = wrap ? wrap.querySelector('#cat-dropdown') : null;
    var open = dd ? dd.hidden : true;
    if (dd) dd.hidden = !open;
    btn.classList.toggle('open', open);
  }); });
  document.addEventListener('click', function (e) {
    catDropdown.forEach(function (dd) {
      if (!dd.hidden && !(e.target.closest && e.target.closest('.cat-filter-wrap'))) dd.hidden = true;
    });
    catFilterBtn.forEach(function (b) { b.classList.remove('open'); });
  });

  // ---------- 已选标签/工作区筛选条 ----------
  function renderFilterBar() {
    if (!filterBar) return;
    if (activeWs) {
      var ws = S.workspaces[activeWs];
      filterBar.hidden = false;
      filterBar.innerHTML = '<span class="filter-label">' + t('current_ws') + '</span>' +
        '<button class="filter-chip" data-ws-exit="1">' + escapeHtml(ws ? ws.name : '') + ' ✕</button>';
      return;
    }
    if (activeCat === MY_CAT) {
      filterBar.hidden = false;
      filterBar.innerHTML = '<span class="filter-label">' + t('my_sites') + '</span>' +
        '<button class="filter-chip filter-add" data-my-add="1">＋ ' + t('add_site') + '</button>' +
        '<button class="filter-chip" data-my-exit="1">✕</button>';
      return;
    }
    if (activeCat === FAV_CAT) {
      filterBar.hidden = false;
      filterBar.innerHTML = '<span class="filter-label">' + t('favs') + '</span>' +
        '<button class="filter-chip" data-fav-openall="1">' + t('open_all') + '</button>' +
        '<button class="filter-chip" data-fav-manage="1">' + t('manage_favs') + '</button>' +
        '<button class="filter-chip" data-fav-clear="1">' + t('clear_favs') + '</button>';
      return;
    }
    if (activeCat === RECENT_CAT) {
      filterBar.hidden = false;
      filterBar.innerHTML = '<span class="filter-label">' + t('recent') + '</span>' +
        '<button class="filter-chip" data-recent-clear="1">' + t('clear_recent') + '</button>' +
        '<button class="filter-chip" data-recent-exit="1">✕</button>';
      return;
    }
    if (!selectedTags.size) { filterBar.hidden = true; return; }
    filterBar.hidden = false;
    var html = '<span class="filter-label">' + t('sel_tags') + '</span>';
    selectedTags.forEach(function (tname) {
      html += '<button class="filter-chip" data-tag="' + escapeHtml(tname) + '">' + escapeHtml(tagLabel(tname)) + ' ✕</button>';
    });
    html += '<button class="filter-clear">' + t('clear_all') + '</button>';
    filterBar.innerHTML = html;
  }
  on(filterBar, 'click', function (e) {
    var myAdd = e.target.closest ? e.target.closest('[data-my-add]') : null;
    if (myAdd) {
      if (!S.currentUser) { YHAuth.openLogin(t('need_login_fav')); return; }
      openAdd();
      return;
    }
    var myExit = e.target.closest ? e.target.closest('[data-my-exit]') : null;
    if (myExit) {
      activeCat = '全部';
      renderCats(); renderFilterBar(); YHCards.render();
      return;
    }
    var favMan = e.target.closest ? e.target.closest('[data-fav-manage]') : null;
    if (favMan) { openFavManage(); return; }
    var favClr = e.target.closest ? e.target.closest('[data-fav-clear]') : null;
    if (favClr) {
      if (window.confirm(t('clear_confirm'))) {
        S.favs.clear();
        saveAccountData();
        renderCats(); YHCards.render();
      }
      return;
    }
    var favOpen = e.target.closest ? e.target.closest('[data-fav-openall]') : null;
    if (favOpen) {
      openSitesInTabs(allSites().filter(function (s) { return S.favs.has(s.id); }));
      return;
    }
    var recentClear = e.target.closest ? e.target.closest('[data-recent-clear]') : null;
    if (recentClear) {
      S.recentIds = [];
      saveRecent();
      activeCat = '全部';
      renderCats(); renderFilterBar(); YHCards.render();
      return;
    }
    var recentExit = e.target.closest ? e.target.closest('[data-recent-exit]') : null;
    if (recentExit) {
      activeCat = '全部';
      renderCats(); renderFilterBar(); YHCards.render();
      return;
    }
    var wsExit = e.target.closest ? e.target.closest('[data-ws-exit]') : null;
    if (wsExit) {
      activeWs = null;
      activeCat = '全部';
      renderCats(); renderFilterBar(); YHCards.render();
      return;
    }
    var chip = e.target.closest ? e.target.closest('.filter-chip') : null;
    if (chip) {
      selectedTags.delete(chip.getAttribute('data-tag'));
      if (selectedTags.size === 0) activeCat = '全部';
      renderCats(); renderFilterBar(); YHCards.render();
      return;
    }
    if (e.target.closest && e.target.closest('.filter-clear')) {
      selectedTags.clear();
      activeCat = '全部';
      renderCats(); renderFilterBar(); YHCards.render();
    }
  });

  // ---------- 开场页 ----------
  function initReveal() {
    if (!appEl) return;
    var revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      appEl.classList.add('revealed');
      document.body.classList.add('entered');
      // 开场页收缩到 0 高度时，保持滚动位置在顶部，避免页尾内容上移导致'跳到底部'
      window.scrollTo(0, 0);
    }
    if (S.settings.showIntro === false) {
      document.body.classList.add('entered', 'instant');
      appEl.classList.add('revealed');
      window.scrollTo(0, 0);
      return;
    }
    // 滚动即进入：用户一开始向下滚动就收起开场页、显现主界面（各浏览器可靠）
    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      if (y > 90) reveal();
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // 兼容兜底：支持 IntersectionObserver 时，主网格进入视口也触发
    if (!revealed && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { reveal(); io.disconnect(); }
        });
      }, { threshold: 0.1 });
      io.observe(appEl);
    }
  }

  // ---------- 详情弹窗 ----------
  function openModal(s) {
    currentSite = s;
    renderModal();
    if (modal) modal.hidden = false;
  }
  function closeModal() {
    if (modal) modal.hidden = true;
    currentSite = null;
  }
  function wsOptionsHtml() {
    var keys = Object.keys(S.workspaces);
    var html = '<option value="">' + t('ws_pick') + '</option>';
    keys.forEach(function (id) {
      html += '<option value="' + id + '">' + escapeHtml(S.workspaces[id].name) + '</option>';
    });
    html += '<option value="__new">' + t('ws_new') + '</option>';
    return html;
  }
  function renderModal() {
    var s = currentSite;
    if (!s || !modalBody) return;
    // 动态 aria-label：随卡片内容变化更新，读屏用户可感知当前是哪个网站的详情
    if (modal) { modal.setAttribute('aria-label', escapeHtml(nameLabel(s)) + ' - ' + t('site_detail')); }
    var isFav = S.favs.has(s.id);
    var count = S.clicks[s.id] || 0;
    var tags = (s.tags || []).map(function (tn) {
      return '<span class="m-tag">' + escapeHtml(tagLabel(tn)) + '</span>';
    }).join('');
    var catChip = s.category ? '<span class="m-cat">' + escapeHtml(s.category) + '</span>' : '';
    var flags = '';
    if (s.vpn) flags += '<span class="m-vpn">' + t('need_vpn') + '</span>';
    var srcTag = s.source === 'personal'
      ? '<span class="m-tag tag-me">' + t('personal') + '</span>'
      : '<span class="m-tag tag-off">' + t('official') + '</span>';
    var urlLine = s.url
      ? '<div class="m-url">🔗 <a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + escapeHtml(s.url) + '</a></div>'
      : '';
    var editBtn = (s.source === 'personal' && s.owner === S.currentUser)
      ? '<button id="m-edit" class="btn btn-ghost">' + t('edit_site') + '</button>' : '';
    var delBtn = (s.source === 'personal' && s.owner === S.currentUser)
      ? '<button id="m-del" class="btn btn-ghost">' + t('del_site') + '</button>' : '';
    var fbBtn = (s.source !== 'personal')
      ? '<button id="m-fb" class="btn btn-ghost">' + t('fb_title') + '</button>' : '';
    modalBody.innerHTML =
      '<div class="m-head">' + iconHTML(s, true) +
        '<div style="min-width:0"><div class="m-name">' + escapeHtml(nameLabel(s)) + '</div>' +
        (s.fullName && s.fullName !== nameLabel(s) ? '<div class="m-full">' + escapeHtml(s.fullName) + '</div>' : '') + '</div>' +
      '</div>' +
      '<div class="m-meta">' + catChip + flags + srcTag + tags + '</div>' +
      urlLine +
      (s.brief ? '<p class="m-brief">' + escapeHtml(s.brief) + '</p>' : '') +
      (s.detail ? '<p class="m-detail">' + escapeHtml(s.detail) + '</p>' : '') +
      '<div class="m-stats">' +
        '<span>' + t('visits') + ' <b>' + count + '</b></span>' +
        '<span>🔖 ' + (isFav ? t('fav_yes') : t('fav_no')) + '</span>' +
      '</div>' +
      '<div class="m-actions">' +
        '<a class="btn btn-primary" href="' + escapeHtml(s.url || '#') + '" target="_blank" rel="noopener">' + t('open_site') + '</a>' +
        '<button id="m-fav" class="btn btn-ghost">' + (isFav ? t('un_fav') : t('add_fav')) + '</button>' +
        '<button id="m-ws" class="btn btn-ghost">' + t('add_ws') + '</button>' +
        '<button id="m-copy" class="btn btn-ghost">' + t('copy') + '</button>' +
        '<button id="m-copy2" class="btn btn-ghost">' + t('copy_title_url') + '</button>' +
        editBtn +
        delBtn +
        fbBtn +
      '</div>' +
      '<div id="m-ws-row" class="m-ws-row" hidden>' +
        '<select id="m-ws-select" class="m-ws-select">' + wsOptionsHtml() + '</select>' +
        '<input id="m-ws-new" class="m-ws-new" type="text" placeholder="' + t('ws_new_ph') + '" hidden>' +
        '<button id="m-ws-ok" class="btn btn-primary">' + t('add') + '</button>' +
      '</div>';
    var favBtn = modalBody.querySelector('#m-fav');
    if (favBtn) favBtn.addEventListener('click', function () { toggleFav(s.id); });
    var editBtnEl = modalBody.querySelector('#m-edit');
    if (editBtnEl) editBtnEl.addEventListener('click', function () {
      closeModal();
      openAdd(s);
    });
    var fbBtnEl = modalBody.querySelector('#m-fb');
    if (fbBtnEl) fbBtnEl.addEventListener('click', function () { openFeedback(); });
    var delBtnEl = modalBody.querySelector('#m-del');
    if (delBtnEl) delBtnEl.addEventListener('click', function () {
      if (!window.confirm(t('del_confirm'))) return;
      var mine = S.personalSites[S.currentUser] || [];
      S.personalSites[S.currentUser] = mine.filter(function (x) { return x.id !== s.id; });
      savePersonal();
      closeModal();
      renderCats(); renderFilterBar(); YHCards.render();
    });
    var copyBtn = modalBody.querySelector('#m-copy');
    if (copyBtn) copyBtn.addEventListener('click', function () {
      var done = function () { copyBtn.textContent = t('copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(s.url).then(done).catch(function () {});
      } else {
        var ta = document.createElement('textarea');
        ta.value = s.url;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta);
      }
    });
    // 复制「标题 + 网址」（便于分享）
    var copy2Btn = modalBody.querySelector('#m-copy2');
    if (copy2Btn) copy2Btn.addEventListener('click', function () {
      var text = nameLabel(s) + '\n' + (s.url || '');
      var done = function () { copy2Btn.textContent = t('copied'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {});
      } else {
        var ta2 = document.createElement('textarea');
        ta2.value = text;
        document.body.appendChild(ta2);
        ta2.select();
        try { document.execCommand('copy'); done(); } catch (e) {}
        document.body.removeChild(ta2);
      }
    });
    var wsBtn = modalBody.querySelector('#m-ws');
    var wsRow = modalBody.querySelector('#m-ws-row');
    var wsSelect = modalBody.querySelector('#m-ws-select');
    var wsNew = modalBody.querySelector('#m-ws-new');
    var wsOk = modalBody.querySelector('#m-ws-ok');
    if (wsBtn && wsRow) wsBtn.addEventListener('click', function () { wsRow.hidden = !wsRow.hidden; });
    if (wsSelect) wsSelect.addEventListener('change', function () {
      if (wsNew) wsNew.hidden = wsSelect.value !== '__new';
    });
    if (wsOk) wsOk.addEventListener('click', function () {
      var val = wsSelect ? wsSelect.value : '';
      if (val === '__new') {
        var name = (wsNew.value || '').trim();
        if (!name) return;
        var id = 'w' + Date.now();
        S.workspaces[id] = { name: name, ids: [s.id] };
        wsOk.textContent = t('created_added');
      } else if (val) {
        if (S.workspaces[val].ids.indexOf(s.id) === -1) S.workspaces[val].ids.push(s.id);
        wsOk.textContent = t('added');
      } else {
        return;
      }
      saveAccountData();
      renderCats();
    });
  }
  on(modalClose, 'click', closeModal);
  on(modal, 'click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (catDropdown[0] && !catDropdown[0].hidden) { closeCatDropdown(); return; }
      if (randomModal && !randomModal.hidden) { randomModal.hidden = true; return; }
      if (submitModal && !submitModal.hidden) { submitModal.hidden = true; return; }
      if (disclaimerModal && !disclaimerModal.hidden) { disclaimerModal.hidden = true; return; }
      if (helpModal && !helpModal.hidden) { helpModal.hidden = true; return; }
      if (statModal && !statModal.hidden) { statModal.hidden = true; return; }
      if (settingsModal && !settingsModal.hidden) closeSettings();
      else if (loginModal && !loginModal.hidden) closeLogin();
      else if (addModal && !addModal.hidden) closeAdd();
      else if (passModal && !passModal.hidden) passModal.hidden = true;
      else if (favModal && !favModal.hidden) favModal.hidden = true;
      else if (fbModal && !fbModal.hidden) fbModal.hidden = true;
      else if (wsModal && !wsModal.hidden) closeWsManager();
      else if (S.rankActive || S.hotActive || S.toolsActive) exitAllViews();
      else if (modal && !modal.hidden) closeModal();
      return;
    }
    // 弹窗焦点 trap：Tab / Shift+Tab 在可见弹窗内循环，避免焦点漏到背景
    if (e.key === 'Tab') {
      var activeModal = findVisibleModal();
      if (activeModal) {
        trapTabFocus(e, activeModal);
        return;
      }
    }
    // 快捷键：/ 聚焦搜索、? 快捷键说明（输入框内不拦截）
    if (e.key === '/' || e.key === '?') {
      var tag = (e.target && e.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;
      e.preventDefault();
      if (e.key === '/') {
        if (searchInput) { searchInput.focus(); if (searchInput.select) searchInput.select(); }
      } else {
        toggleHelp();
      }
    }
  });
  // 找到当前可见的弹窗（优先返回最"上层"——最近被打开的）
  function findVisibleModal() {
    var candidates = [disclaimerModal, randomModal, submitModal, helpModal, statModal, settingsModal, loginModal, addModal, passModal, favModal, fbModal, wsModal, modal];
    for (var i = 0; i < candidates.length; i++) {
      if (candidates[i] && !candidates[i].hidden) return candidates[i];
    }
    return null;
  }
  // Tab 焦点在弹窗内循环
  function trapTabFocus(e, modalEl) {
    var focusable = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var list = Array.prototype.slice.call(focusable);
    var first = list[0], last = list[list.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function toggleHelp() {
    if (!helpModal) return;
    helpModal.hidden = !helpModal.hidden;
  }
  on(helpClose, 'click', function () { helpModal.hidden = true; });
  on(helpModal, 'click', function (e) { if (e.target === helpModal) helpModal.hidden = true; });

  // ---------- 免责声明 ----------
  function initDisclaimer() {
    if (!disclaimerModal) return;
    if (localStorage.getItem(DISCLAIMER_KEY) === '1') return;
    if (disclaimerConsent) disclaimerConsent.checked = false;
    if (disclaimerOk) disclaimerOk.disabled = true;
    disclaimerModal.hidden = false;
  }
  on(disclaimerConsent, 'change', function () {
    if (disclaimerOk) disclaimerOk.disabled = !disclaimerConsent.checked;
  });
  on(disclaimerOk, 'click', function () {
    if (!disclaimerConsent || !disclaimerConsent.checked) return;
    try { localStorage.setItem(DISCLAIMER_KEY, '1'); } catch (e) {}
    disclaimerModal.hidden = true;
  });
  // 设置里可随时重新显示（清除"不再提醒"标记）
  on($('btn-show-disclaimer'), 'click', function () {
    try { localStorage.removeItem(DISCLAIMER_KEY); } catch (e) {}
    if (disclaimerModal) disclaimerModal.hidden = false;
  });

  // ---------- 本地数据备份：导出 / 导入 ----------
  function showMsg(text) {
    var box = document.getElementById('m-toasts');
    if (!box) {
      box = document.createElement('div');
      box.id = 'm-toasts';
      box.className = 'm-toasts';
      document.body.appendChild(box);
    }
    var t = document.createElement('div');
    t.className = 'm-toast';
    t.textContent = text;
    box.appendChild(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 2200);
  }
  function downloadText(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  on($('btn-export-data'), 'click', function () {
    var data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      favsAll: S.favsAll,
      clicksAll: S.clicksAll,
      clickLogAll: S.clickLogAll,
      workspacesAll: S.workspacesAll,
      personalSites: S.personalSites,
      settings: S.settings,
    };
    downloadText('yuhang-backup.json', JSON.stringify(data, null, 2), 'application/json');
    showMsg(t('data_exported'));
  });
  // ---------- 收藏导出为浏览器书签（HTML，可导入任意浏览器） ----------
  function exportBookmarksHtml() {
    var items = allSites().filter(function (s) { return S.favs.has(s.id); });
    var lines = items.map(function (s) {
      return '    <DT><A HREF="' + escapeHtml(s.url || '') + '">' + escapeHtml(nameLabel(s)) + '</A>';
    });
    var html =
      '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n' +
      '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n' +
      '<TITLE>' + t('export_bm') + '</TITLE>\n' +
      '<H1>' + t('export_bm') + '</H1>\n' +
      '<DL><p>\n  <DT><H3>' + t('export_bm') + '</H3>\n  <DL><p>\n' +
      lines.join('\n') +
      '\n  </DL><p>\n</DL><p>\n';
    downloadText('yuhang-bookmarks.html', html, 'text/html');
    showMsg(t('bm_exported'));
  }
  on($('btn-export-bookmarks'), 'click', function () {
    if (!S.favs.size) { showMsg(t('bm_empty')); return; }
    exportBookmarksHtml();
  });
  on($('fav-export-bm'), 'click', function () {
    if (!S.favs.size) { showMsg(t('bm_empty')); return; }
    exportBookmarksHtml();
  });
  on($('btn-import-data'), 'click', function () {
    var f = $('import-file');
    if (f) f.click();
  });
  on($('import-file'), 'change', function (e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var d = JSON.parse(reader.result);
        if (!d || d.version !== 1 || typeof d.favsAll !== 'object') throw new Error('bad');
        S.favsAll = d.favsAll || {};
        S.clicksAll = d.clicksAll || {};
        S.clickLogAll = d.clickLogAll || {};
        S.workspacesAll = d.workspacesAll || {};
        S.personalSites = d.personalSites || {};
        if (d.settings && typeof d.settings === 'object') Object.assign(S.settings, d.settings);
        saveAccountData();
        savePersonal();
        saveSettings();
        loadAccountData();
        YHAuth.updateLoginBtn();
        renderCats();
        renderFilterBar();
        YHCards.render();
        showMsg(t('data_imported'));
      } catch (err) {
        showMsg(t('data_import_fail'));
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  });
  // 浏览器书签导入（HTML 书签文件 → 个人网站）
  on($('btn-import-bm'), 'click', function () {
    var f = $('import-bm-file');
    if (f) f.click();
  });
  on($('import-bm-file'), 'change', function (e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    if (!S.currentUser) { showMsg(t('bm_need_login')); return; }
    if (typeof DOMParser === 'undefined') { showMsg(t('bm_fail')); return; }
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var doc = new DOMParser().parseFromString(reader.result, 'text/html');
        var links = doc.querySelectorAll('a[href]');
        if (!S.personalSites[S.currentUser]) S.personalSites[S.currentUser] = [];
        var added = 0;
        for (var i = 0; i < links.length; i++) {
          var href = (links[i].getAttribute('href') || '').trim();
          if (!href || /^(javascript:|#|about:)/i.test(href)) continue;
          var nm = (links[i].textContent || '').trim().slice(0, 40) || href;
          S.personalSites[S.currentUser].push({
            id: 'p' + Date.now() + Math.random().toString(36).slice(2, 7),
            owner: S.currentUser, name: nm, fullName: nm, url: href,
            brief: '', detail: '', category: '', tags: ['书签'], vpn: false, source: 'personal'
          });
          added++;
        }
        if (!added) { showMsg(t('bm_fail')); return; }
        savePersonal();
        renderCats();
        renderFilterBar();
        YHCards.render();
        showMsg(t('bm_imported') + added + (S.lang === 'en' ? ' bookmarks' : ' 个书签'));
      } catch (err) {
        showMsg(t('bm_fail'));
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  });

  // ---------- 一键回到顶部 ----------
  function updateBackTop() {
    if (!backTop) return;
    backTop.hidden = (window.scrollY || document.documentElement.scrollTop || 0) < 300;
  }
  window.addEventListener('scroll', updateBackTop, { passive: true });
  on(backTop, 'click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 若开场页未收起，也回到展示态
    if (appEl && !appEl.classList.contains('revealed')) {
      appEl.classList.add('revealed');
      document.body.classList.add('entered');
    }
  });
  updateBackTop();

  // ---------- 悬浮操作球（登录/设置/随机/起始页）：桌面/移动各一套，相对父 .fab 找 panel ----------
  // 先 getElementById 一次以建立测试缓存；实际绑定用 querySelectorAll（桌面/移动各一套）
  $('fab-btn'); $('fab-panel');
  var fabButtons = document.querySelectorAll('.fab-btn');
  function closeAllFab() {
    document.querySelectorAll('.fab-panel').forEach(function (p) {
      p.classList.remove('open'); p.style.top = ''; p.style.left = '';
    });
  }
  function openFabPanel(btn) {
    var panel = btn.parentElement ? btn.parentElement.querySelector('.fab-panel') : null;
    if (!panel) return;
    closeAllFab();
    panel.hidden = false;
    panel.classList.add('open');
    var rect = btn.getBoundingClientRect();
    panel.style.top = (rect.bottom + 8) + 'px';
    requestAnimationFrame(function () {
      var pw = panel.offsetWidth;
      var left = rect.right - pw;
      if (left < 8) left = 8;
      var maxL = window.innerWidth - pw - 8;
      if (left > maxL) left = maxL;
      panel.style.left = left + 'px';
    });
  }
  fabButtons.forEach(function (btn) {
    on(btn, 'click', function (e) {
      e.stopPropagation();
      openFabPanel(btn);
    });
  });
  document.querySelectorAll('.fab-panel').forEach(function (panel) {
    on(panel, 'click', function (e) {
      if (!(e.target.closest && e.target.closest('.theme-wrap'))) closeAllFab();
    });
  });
  document.addEventListener('click', function (e) {
    if (!(e.target.closest && e.target.closest('.fab'))) closeAllFab();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAllFab();
  });

  // ---------- 移动端固定底部导航 ----------
  // 底部导航：两套 DOM（桌面/移动副本），均绑定 + 同步高亮
  var bottomNavs = document.querySelectorAll('.bottom-nav');
  function handleBottomNav(b) {
    var act = b.getAttribute('data-bn');
    if (act === 'home') {
      exitAllViews();
      activeCat = '全部'; selectedTags.clear(); activeWs = null;
      renderCats(); renderFilterBar(); YHCards.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'search') {
      exitAllViews();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(function () { if (searchInput) searchInput.focus(); }, 350);
    } else if (act === 'favs') {
      exitAllViews();
      if (!S.currentUser) { YHAuth.openLogin(t('need_login_fav')); return; }
      activeCat = FAV_CAT; selectedTags.clear(); activeWs = null;
      renderCats(); renderFilterBar(); YHCards.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'tools') {
      if (S.toolsActive) { exitAllViews(); return; }
      YHTools.open();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'me') {
      exitAllViews();
      if (S.currentUser) {
        activeCat = MY_CAT; selectedTags.clear(); activeWs = null;
        renderCats(); renderFilterBar(); YHCards.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else { YHAuth.openLogin(t('need_login_fav')); }
    }
  }
  bottomNavs.forEach(function (nav) {
    on(nav, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-bn]') : null;
      if (b) handleBottomNav(b);
    });
  });
  function syncBottomNav() {
    bottomNavs.forEach(function (nav) {
      var items = nav.querySelectorAll ? nav.querySelectorAll('.bn-item') : [];
      for (var i = 0; i < items.length; i++) {
        var bn = items[i].getAttribute('data-bn');
        var on = false;
        if (bn === 'home') on = !S.rankActive && !S.hotActive && !S.toolsActive && activeCat === '全部' && selectedTags.size === 0;
        else if (bn === 'favs') on = activeCat === FAV_CAT;
        else if (bn === 'tools') on = S.toolsActive;
        else if (bn === 'me') on = activeCat === MY_CAT;
        items[i].classList.toggle('active', on);
      }
    });
  }

  // ---------- 卡片交互 ----------
  on(grid, 'click', function (e) {
    var addBtn = e.target.closest ? e.target.closest('[data-empty-add]') : null;
    if (addBtn) {
      if (!S.currentUser) { YHAuth.openLogin(t('need_login_fav')); return; }
      openAdd();
      return;
    }
    var moreBtn = e.target.closest ? e.target.closest('.more') : null;
    if (moreBtn) {
      var ms = siteOf(moreBtn.getAttribute('data-id'));
      if (ms) openModal(ms);
      return;
    }
    var star = e.target.closest ? e.target.closest('.star') : null;
    if (star) {
      star.classList.remove('burst'); void star.offsetWidth; star.classList.add('burst');
      if (!S.currentUser) { YHAuth.openLogin(t('need_login_fav')); return; }
      toggleFav(star.getAttribute('data-id'));
      return;
    }
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (!card) return;
    makeRipple(card, e.clientX, e.clientY);
    var id = card.getAttribute('data-id');
    var url = card.getAttribute('data-url');
    if (id) {
      // 最近访问：本地记录，登录与否都记
      addRecent(id);
      // 点击统计为个人专属：仅登录后记录，并保留近 7 日流水
      recordClick(id);
    }
    if (url) {
      // 飞出反馈：被点开的卡片短暂上浮放大淡出
      if (card && card.classList && card.classList.add) {
        card.classList.add('card-launch');
        (function (el) {
          setTimeout(function () { if (el.classList) el.classList.remove('card-launch'); }, 300);
        })(card);
      }
      window.open(url, '_blank');
    }
  });
  on(grid, 'keydown', function (e) {
    var card = e.target.closest ? e.target.closest('.card') : null;
    if (!card) return;
    if (e.key === 'Enter') { card.click(); return; }
    // 方向键在卡片间移动焦点（按网格列数计算）
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      var cards = Array.prototype.slice.call(grid.querySelectorAll('.card'));
      var idx = cards.indexOf(card);
      var cols = 3;
      if (typeof getComputedStyle === 'function') {
        try {
          var colsStr = getComputedStyle(grid).gridTemplateColumns || '';
          cols = colsStr.split(' ').filter(function (x) { return x && x !== 'none'; }).length || 3;
        } catch (err) { cols = 3; }
      }
      var next = -1;
      if (e.key === 'ArrowRight') next = idx + 1;
      else if (e.key === 'ArrowLeft') next = idx - 1;
      else if (e.key === 'ArrowDown') next = idx + cols;
      else if (e.key === 'ArrowUp') next = idx - cols;
      if (next >= 0 && next < cards.length) { e.preventDefault(); cards[next].focus(); }
    }
  });

  // ---------- 随机进入（今天去哪：先选出一个网站，询问用户是否跳转） ----------
  var randomPick = null;
  function pickRandomSite() {
    if (!randomBody) return;
    var list = YHCards.getFilteredSites();
    if (!list.length) {
      randomPick = null;
      randomBody.innerHTML = '<div class="ws-empty">' + t('random_empty') + '</div>';
      return;
    }
    randomPick = list[Math.floor(Math.random() * list.length)];
    var tagHtml = (randomPick.tags && randomPick.tags.length)
      ? '<div class="random-tags">' + randomPick.tags.slice(0, 3).map(function (tn) {
          return '<span class="tag">' + escapeHtml(tagLabel(tn)) + '</span>';
        }).join('') + '</div>'
      : '';
    randomBody.innerHTML =
      '<div class="random-site">' +
        '<span class="random-ico">' + escapeHtml((randomPick.name || '?').charAt(0)) + '</span>' +
        '<div class="random-info">' +
          '<div class="random-name">' + escapeHtml(nameLabel(randomPick)) + '</div>' +
          '<div class="random-brief">' + escapeHtml(randomPick.brief || randomPick.detail || '') + '</div>' +
          tagHtml +
        '</div>' +
      '</div>';
  }
  btnRandom.forEach(function (b) { on(b, 'click', function () {
    pickRandomSite();
    if (randomModal) randomModal.hidden = false;
  }); });
  on(randomOpen, 'click', function () {
    if (randomPick && randomPick.url) {
      window.open(randomPick.url, '_blank');
      if (randomPick.id) { addRecent(randomPick.id); recordClick(randomPick.id); }
    }
    if (randomModal) randomModal.hidden = true;
  });
  on(randomNext, 'click', pickRandomSite);
  on(randomClose, 'click', function () { if (randomModal) randomModal.hidden = true; });
  on(randomModal, 'click', function (e) { if (e.target === randomModal) randomModal.hidden = true; });

  // ---------- 漫游模式：连续自动随机打开 ----------
  var wanderTimer = null;
  btnWander.forEach(function (b) { on(b, 'click', function () {
    if (wanderTimer) { stopWander(); return; }
    wanderTimer = setInterval(function () {
      var list = YHCards.getFilteredSites();
      if (!list.length) { stopWander(); return; }
      var pick = list[Math.floor(Math.random() * list.length)];
      if (pick.url) window.open(pick.url, '_blank');
    }, 4000);
    b.innerHTML = t('wander_stop');
    showMsg(t('wander_tip'));
  }); });
  function stopWander() {
    if (wanderTimer) { clearInterval(wanderTimer); wanderTimer = null; }
    btnWander.forEach(function (b) { b.innerHTML = t('wander'); });
  }

  // ---------- 每日一言（开场页，点击换一句） ----------
  var QUOTES = [
    '行到水穷处，坐看云起时。',
    '长风破浪会有时，直挂云帆济沧海。',
    '山重水复疑无路，柳暗花明又一村。',
    '海内存知己，天涯若比邻。',
    '会当凌绝顶，一览众山小。',
    '不畏浮云遮望眼，自缘身在最高层。',
    '博观而约取，厚积而薄发。',
    '纸上得来终觉浅，绝知此事要躬行。',
    '问渠那得清如许？为有源头活水来。',
    '路漫漫其修远兮，吾将上下而求索。',
    'Stay hungry, stay foolish.',
    'Keep exploring — every island holds a new world.',
    'Less, but better.',
  ];
  function pickQuote() {
    if (!introQuote) return;
    var qText = $('q-text');
    if (qText) qText.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  }
  on(introQuote, 'click', pickQuote);

  // ---------- 本地数据统计 ----------
  function openStats() {
    if (!statModal) return;
    renderStats();
    statModal.hidden = false;
  }
  btnStats.forEach(function (b) { on(b, 'click', openStats); });
  on(statClose, 'click', function () { statModal.hidden = true; });
  on(statModal, 'click', function (e) { if (e.target === statModal) statModal.hidden = true; });
  function statBar(label, n, max, colorStyle, rank) {
    var pct = max > 0 ? Math.round(n / max * 100) : 0;
    var medal = '';
    if (rank === 1) medal = '<span class="stat-medal stat-medal-1">🥇</span>';
    else if (rank === 2) medal = '<span class="stat-medal stat-medal-2">🥈</span>';
    else if (rank === 3) medal = '<span class="stat-medal stat-medal-3">🥉</span>';
    else medal = '<span class="stat-rank">' + rank + '</span>';
    return '<div class="stat-bar-row">' + medal +
      '<span class="stat-bar-label">' + escapeHtml(label) + '</span>' +
      '<span class="stat-bar-track">' + (colorStyle ? '<i style="width:' + pct + '%;' + colorStyle + '"></i>' : '<i style="width:' + pct + '%"></i>') + '</span>' +
      '<span class="stat-bar-num">' + n + '</span></div>';
  }
  function clickStats() {
    var clickTotal = 0, clickKeys = Object.keys(S.clicks);
    clickKeys.forEach(function (k) { clickTotal += S.clicks[k]; });
    var top = clickKeys
      .map(function (k) { return { id: k, n: S.clicks[k] }; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 6);
    return { clickTotal: clickTotal, top: top };
  }
  function renderStats() {
    if (!statBody) return;
    var favCount = S.favs.size;
    var stats = clickStats();
    var clickTotal = stats.clickTotal;
    var top = stats.top;
    var myCount = S.currentUser ? (S.personalSites[S.currentUser] || []).length : 0;
    var wsCountN = Object.keys(S.workspaces).length;
    var html = '<div class="stat-cards">' +
      '<div class="stat-card"><span class="sc-ico">⭐</span><b data-target="' + favCount + '" class="stat-num">' + favCount + '</b><span>' + t('stats_favs') + '</span></div>' +
      '<div class="stat-card"><span class="sc-ico">👁</span><b data-target="' + clickTotal + '" class="stat-num">' + clickTotal + '</b><span>' + t('stats_clicks') + '</span></div>' +
      '<div class="stat-card"><span class="sc-ico">📁</span><b data-target="' + myCount + '" class="stat-num">' + myCount + '</b><span>' + t('stats_mine') + '</span></div>' +
      '<div class="stat-card"><span class="sc-ico">🗂</span><b data-target="' + wsCountN + '" class="stat-num">' + wsCountN + '</b><span>' + t('stats_ws') + '</span></div>' +
    '</div>';
    // 最常访问 Top 6
    if (top.length) {
      var maxTop = top[0].n || 1;
      html += '<div class="stat-sec">' + t('stats_top') + '</div>';
      html += top.map(function (x, i) {
        var s = siteOf(x.id);
        return statBar(s ? nameLabel(s) : x.id, x.n, maxTop, '', i + 1);
      }).join('');
    }
    // 近 7 日访问频次（依赖点击流水；旧数据若无流水则只提示，不破坏累计统计）
    var dayMs = 24 * 60 * 60 * 1000;
    var cutoff = Date.now() - 7 * dayMs;
    var recent = pruneClickLog(S.clickLog || [])
      .filter(function (x) { return x.ts >= cutoff; })
      .reduce(function (acc, x) { acc[x.id] = (acc[x.id] || 0) + 1; return acc; }, {});
    var recentTop = Object.keys(recent)
      .map(function (k) { return { id: k, n: recent[k] }; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 5);
    html += '<div class="stat-sec">' + t('stats_7d') + '</div>';
    if (recentTop.length) {
      var maxRecent = recentTop[0].n || 1;
      html += recentTop.map(function (x, i) {
        var s = siteOf(x.id);
        return statBar(s ? nameLabel(s) : x.id, x.n, maxRecent, 'background:linear-gradient(90deg,' + tagHsl('效率工具') + ',' + tagHsl('效率工具', 52) + ');', i + 1);
      }).join('');
    } else {
      html += '<div class="ws-empty">' + t('stats_7d_empty') + '</div>';
    }
    // 我的标签分布（收藏+点击过的站）
    var tagPool = {};
    allSites().forEach(function (s) {
      if (S.favs.has(s.id) || (S.clicks[s.id] || 0) > 0) {
        (s.tags || []).forEach(function (tn) { tagPool[tn] = (tagPool[tn] || 0) + 1; });
      }
    });
    var tagKeys = Object.keys(tagPool).sort(function (a, b) { return tagPool[b] - tagPool[a]; }).slice(0, 8);
    if (tagKeys.length) {
      var maxTag = tagPool[tagKeys[0]] || 1;
      html += '<div class="stat-sec">' + t('stats_tags') + '</div>';
      html += tagKeys.map(function (k) { return statBar(tagLabel(k), tagPool[k], maxTag, 'background:linear-gradient(90deg,' + tagHsl(k) + ',' + tagHsl(k, 52) + ');S.color:#fff;', ''); }).join('');
    }
    statBody.innerHTML = html;
    // 统计数字滚动
    var nums = statBody.querySelectorAll('.stat-num');
    for (var i = 0; i < nums.length; i++) countUp(nums[i]);
  }

  // ---------- 初始化 ----------
  YHNav.init({ S: S, t: t, escapeHtml: escapeHtml, nameLabel: nameLabel, siteOf: siteOf, YHAuth: YHAuth, YHTools: YHTools, YHCards: YHCards, YHSearch: YHSearch, renderCats: renderCats, renderFilterBar: renderFilterBar, searchInput: searchInput, rankView: rankView, hotView: hotView, toolsView: toolsView, rankPodium: rankPodium, rankTable: rankTable, rankTabs: rankTabs, rankBack: rankBack, hotTabs: hotTabs, hotBack: hotBack, hotRefresh: hotRefresh, hotMeta: hotMeta, hotFilter: hotFilter, hotList: hotList, grid: grid, filterBar: filterBar, on: on, getActiveCat: function(){ return activeCat; }, setActiveCat: function(v){ activeCat = v; }, getActiveWs: function(){ return activeWs; }, setActiveWs: function(v){ activeWs = v; }, getSelectedTags: function(){ return selectedTags; }, MY_CAT: MY_CAT, FAV_CAT: FAV_CAT, HOT_CAT: HOT_CAT, WS_CAT: WS_CAT, RECENT_CAT: RECENT_CAT, RANK_CAT: RANK_CAT, HOT_NEW_CAT: HOT_NEW_CAT, TOOLS_CAT: TOOLS_CAT });

  YHAuth.init({ S: S, t: t, escapeHtml: escapeHtml, nameLabel: nameLabel, siteOf: siteOf, allSites: allSites, downloadText: downloadText, showMsg: showMsg, openAdd: openAdd, renderCats: renderCats, renderFilterBar: renderFilterBar, YHCards: YHCards, loadAccountData: loadAccountData, saveAccountData: saveAccountData, on: on, getActiveCat: function(){ return activeCat; }, setActiveCat: function(v){ activeCat = v; }, getActiveWs: function(){ return activeWs; }, setActiveWs: function(v){ activeWs = v; }, getSelectedTags: function(){ return selectedTags; }, MY_CAT: MY_CAT, FAV_CAT: FAV_CAT, HOT_CAT: HOT_CAT, WS_CAT: WS_CAT, RECENT_CAT: RECENT_CAT, dom: { loginMsg: loginMsg, loginBody: loginBody, loginModal: loginModal, loginClose: loginClose, btnLogin: btnLogin, loginMenu: loginMenu, btnChangePass: btnChangePass, passNew: passNew, passNew2: passNew2, passMsg: passMsg, passBar: passBar, passStrength: passStrength, passHints: passHints, passModal: passModal, passClose: passClose, favList: favList, favClose: favClose, favModal: favModal, favClear: favClear, favOpenAll: favOpenAll, favSelCount: $('fav-sel-count'), favSelAll: $('fav-selall'), favBatchWs: $('fav-batch-ws'), favBatchRemove: $('fav-batch-remove'), favBatchExport: $('fav-batch-export') } });
  YHCards.init({ S: S, t: t, escapeHtml: escapeHtml, nameLabel: nameLabel, tagLabel: tagLabel, tagHue: tagHue, siteOf: siteOf, allSites: allSites, iconHTML: iconHTML, lazyLoadIcons: lazyLoadIcons, YH: window.YH, SITES: SITES, perfLevel: perfLevel, grid: grid, searchResult: searchResult, footerInfo: footerInfo, footerUpdated: footerUpdated, statTotal: statTotal, statTags: statTags, statFavs: statFavs, descTotal: descTotal, descTags: descTags, META: META, MY_CAT: MY_CAT, FAV_CAT: FAV_CAT, HOT_CAT: HOT_CAT, WS_CAT: WS_CAT, RECENT_CAT: RECENT_CAT, getKeyword: function(){ return keyword; }, getActiveCat: function(){ return activeCat; }, getActiveWs: function(){ return activeWs; }, getSelectedTags: function(){ return selectedTags; } });
  if (brandName && META.name) brandName.textContent = META.name;
  applyTheme();
  syncThemeUI();
  syncSizeBtns();
  YHAuth.updateLoginBtn();
  renderCats();
  renderFilterBar();
  YHCards.render();
  applyLang();
  if (descTotal) descTotal.textContent = allSites().length;
  if (descTags) descTags.textContent = (META.tags || []).length;
  initSupabase();
  initDisclaimer();
  initClock();
  pickQuote();
  YHSearch.init({ S: S, on: on, t: t, escapeHtml: escapeHtml, nameLabel: nameLabel, tagLabel: tagLabel, allSites: allSites, siteOf: siteOf, addRecent: addRecent, recordHotWord: recordHotWord, recordSearchHistory: recordSearchHistory, saveSearchHistory: saveSearchHistory, renderGrid: YHCards.render, exitAllViews: exitAllViews, hasActiveView: function(){ return S.rankActive||S.hotActive||S.toolsActive; }, engineMenu: engineMenu, searchInput: searchInput, btnSearch: btnSearch, btnClear: btnClear, engineBtn: engineBtn, searchHot: searchHot, searchAc: searchAc, appEl: appEl, getKeyword: function(){ return keyword; }, setKeyword: function(v){ keyword = v; } });
  YHTools.init({ on: on, t: t, enterView: YHNav.enterView, exitAllViews: YHNav.exitAllViews, fadeInView: YHNav.fadeInView, fadeHide: YHNav.fadeHide, toolsGrid: toolsGrid, toolsView: toolsView, toolsBack: toolsBack });

  // ---------- 加载界面：资源就绪 + 至少展示片刻后淡出 ----------
  var loader = $('loader');
  if (loader) {
    document.body.classList.add('is-loading');
    var reduceMotion = (typeof window.matchMedia === 'function') && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var minShow = reduceMotion ? 0 : 700;
    var loadStart = Date.now();
    var loaderHidden = false;
    function hideLoader() {
      if (loaderHidden || !loader) return;
      loaderHidden = true;
      document.body.classList.remove('is-loading');
      loader.classList.add('hide');
      setTimeout(function () { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
    }
    function tryHideLoader() {
      var left = minShow - (Date.now() - loadStart);
      if (left > 0) { setTimeout(tryHideLoader, left); return; }
      hideLoader();
    }
    if (document.readyState === 'complete') tryHideLoader();
    else window.addEventListener('load', tryHideLoader);
    setTimeout(tryHideLoader, 2500); // 兜底：个别资源卡住也不遮挡页面
  }
  initReveal();
  if (S.settings.petals) initParticles();
  if (S.settings.snow) initSnow();
  if (S.settings.cursorFx) initCursorFx();

  // PWA：注册 Service Worker（需 HTTPS 或 localhost；file:// 直接打开时跳过）
  if ('serviceWorker' in navigator && location && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 忽略（单文件模式无 sw.js） */ });
    });
  }

  // 起始页统计数字滚动
  function animateCount(el, target) {
    if (!el || target === undefined) return;
    // 低端机跳过数字滚动动画，直接显示最终值（避免 3 个并发 rAF 循环）
    if (perfLevel === 'low') { el.textContent = target; return; }
    var start = 0, t0 = null, dur = 1100;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }
  animateCount(statTotal, allSites().length);
  animateCount(statTags, (META.tags || []).length);
  animateCount(statFavs, S.favs.size);

  // ---------- 起始页：拖拽回弹 + 滚动联动视差（尊重减少动态效果） ----------
  (function initIntroFx() {
    var reduce = (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || (perfLevel === 'low');
    var wrap = $('avatar-drag');
    var inner = $('intro-inner');
    var bg = document.querySelector ? document.querySelector('.intro-bg') : null;
    // 1) 拖拽头像 → 弹簧回弹（鼠标拖；触屏不拖，避免与滚动冲突）
    // 降级：low 设备关闭弹簧回弹动画，直接复位
    if (wrap && !reduce) {
      var dragging = false, sx = 0, sy = 0;
      wrap.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') return;
        dragging = true; sx = e.clientX; sy = e.clientY;
        wrap.style.transition = 'none';
        wrap.style.cursor = 'grabbing';
        try { if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId); } catch (err) {}
        if (e.preventDefault) e.preventDefault();
      });
      window.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        wrap.style.transform = 'translate(' + (e.clientX - sx) + 'px,' + (e.clientY - sy) + 'px)';
      });
      window.addEventListener('pointerup', function () {
        if (!dragging) return;
        dragging = false;
        wrap.style.cursor = '';
        wrap.style.transition = 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'; // 弹簧回弹
        wrap.style.transform = 'translate(0,0)';
      });
    }
    // 2) 滚动联动视差：滚动时内容下沉/缩小/淡出，背景反向移动
    // 降级：low 设备关闭（持续监听 + transform 在低端机掉帧主因之一）；mid 设备保留内容动画、关闭背景反向移动
    if (inner && !reduce) {
      var ticking = false;
      function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          if (document.body.classList.contains('entered')) return;
          var intro = $('intro');
          if (!intro) return;
          var h = Math.max(intro.offsetHeight || 0, 1);
          var p = Math.min((window.scrollY || 0) / h, 1);
          inner.style.transform = 'translateY(' + (p * 70) + 'px) scale(' + (1 - p * 0.1) + ')';
          inner.style.opacity = String(1 - p * 0.4);
          if (bg && perfLevel !== 'mid') { bg.style.transform = 'translateY(' + (p * -46) + 'px)'; }
        });
      }
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  })();

  // 弹窗打开自动聚焦：监听所有 .modal 的 hidden 属性变化，打开时将焦点移到首个可聚焦元素
  // （配合上面的 Tab trap 形成完整键盘流；避免弹窗打开后焦点仍在触发按钮导致键盘操作错位）
  (function initModalFocus() {
    if (typeof MutationObserver === 'undefined') return;
    var modals = document.querySelectorAll('.modal');
    if (!modals.length) return;
    var obs = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.attributeName !== 'hidden') continue;
        var el = m.target;
        if (el.hidden) continue; // 只处理打开事件
        var focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length) {
          try { focusable[0].focus(); } catch (e) {}
        }
      }
    });
    for (var j = 0; j < modals.length; j++) {
      obs.observe(modals[j], { attributes: true, attributeFilter: ['hidden'] });
    }
  })();

})();
