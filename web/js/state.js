/*
 * 屿航 · 状态管理模块（浏览器 + Node 双端可用）
 * ------------------------------------------------------------
 * 把全站应用状态收口到单一 State 对象：账户数据、UI 设置、历史记录、视图标记。
 * 浏览器经 window.YHState 使用，Node 经 require 使用（供测试）。
 * localStorage 相关字段在 Node 下优雅降级为默认值。纯容器，不含业务逻辑与 DOM 操作。
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    root.YHState = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window), function () {
  'use strict';

  // ============ 1. localStorage 键（唯一权威定义，app.js 不再重复声明） ============
  var CLICKS_KEY = 'nav_click_count_v1';
  var FAVS_KEY = 'nav_favs_v1';
  var THEME_KEY = 'nav_theme_v1';
  var COLOR_KEY = 'nav_color_v1';
  var SIZE_KEY = 'nav_grid_size';
  var SETTINGS_KEY = 'nav_settings_v1';
  var WORKSPACES_KEY = 'nav_workspaces_v1';
  var CLICK_LOG_KEY = 'nav_click_log_v1';
  var LANG_KEY = 'nav_lang_v1';
  var ENGINE_KEY = 'nav_engine_v1';
  var ACCOUNTS_KEY = 'nav_accounts_v1';
  var PERSONAL_KEY = 'nav_personal_v1';
  var RECENT_KEY = 'nav_recent_v1';
  var HOTWORDS_KEY = 'nav_hotwords_v1';
  var SEARCH_HISTORY_KEY = 'nav_search_hist_v1';

  // ============ 2. 工具函数 ============
  var hasStorage = typeof localStorage !== 'undefined';
  function readJSON(key, fallback) {
    if (!hasStorage) return fallback;
    try {
      var v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    if (!hasStorage) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function writeString(key, value) {
    if (!hasStorage) return;
    try { localStorage.setItem(key, value); } catch (e) {}
  }
  function readThemeValue(key, fallback) {
    if (!hasStorage) return fallback;
    try {
      var raw = localStorage.getItem(key);
      if (raw == null || raw === '') return fallback;
      try { return JSON.parse(raw); } catch (e) { return raw; }
    } catch (e) { return fallback; }
  }

  // ============ 3. State 对象（唯一事实来源） ============
  var State = {
    // --- 账号隔离持久数据（localStorage，按账号分桶） ---
    clicksAll: readJSON(CLICKS_KEY, {}),           // 账号 -> { siteId: 次数 }
    favsAll: readJSON(FAVS_KEY, {}),               // 账号 -> [siteId]
    workspacesAll: readJSON(WORKSPACES_KEY, {}),   // 账号 -> { wsId: {name, ids} }
    clickLogAll: readJSON(CLICK_LOG_KEY, {}),      // 账号 -> [{ id, ts }]（近 7 日频次）

    // --- 当前账号视图数据（由 loadAccountData 加载 / saveAccountData 持久化） ---
    clicks: {},                // 当前账号 { siteId: 次数 }
    clickLog: [],              // 当前账号点击流水 [{ id, ts }]
    favs: new Set(),           // 当前账号收藏 siteId 集合
    workspaces: {},            // 当前账号 { wsId: {name, ids} }
    currentUser: null,         // 登录后为邮箱/用户ID
    accounts: readJSON(ACCOUNTS_KEY, {}),
    personalSites: readJSON(PERSONAL_KEY, {}),     // 账号 -> [personalSite]

    // --- UI 设置 ---
    theme: readThemeValue(THEME_KEY, 'brutalism') || 'brutalism',
    color: readThemeValue(COLOR_KEY, 'blue') || 'blue',
    gridSize: readJSON(SIZE_KEY, 'md') || 'md',
    settings: Object.assign(
      { petals: true, snow: true, cursorFx: false, showIntro: true, shareStats: true, cardIcon: 'favicon', misclickLock: false },
      readJSON(SETTINGS_KEY, {})
    ),
    lang: readJSON(LANG_KEY, 'zh') || 'zh',
    engine: readJSON(ENGINE_KEY, 'local') || 'local',

    // --- 轻量本地历史（游客也可用，不随账号走） ---
    recentIds: readJSON(RECENT_KEY, []),
    hotWords: readJSON(HOTWORDS_KEY, {}),           // { 词: 次数 }
    searchHistory: readJSON(SEARCH_HISTORY_KEY, []), // [{ q, ts }]

    // --- 视图 / 选择（瞬时，不持久化） ---
    favSel: new Set(),      // 批量选中的收藏 id
    rankMode: 'fav',        // 'fav' | 'click'
    rankActive: false,
    hotActive: false,
    toolsActive: false,

    // --- 热搜 ---
    hotPlatform: 'wbHot',
    hotCache: {},           // 平台 -> [{title,url,hot}]
    hotUpdatedAt: {},       // 平台 -> 时间戳
    hotRows: [],            // 当前平台完整榜单

    // --- 工具内部状态 ---
    pomoState: { total: 25 * 60, left: 25 * 60, timer: null },
    calcState: { disp: '0', acc: null, op: null, fresh: true },

    // --- Supabase 认证内部 ---
    supabaseClient: null,
    supabasePromise: null,
    supabaseUser: null,
    authMode: 'login',      // 'login' | 'register' | 'reset'

    // --- 定时器句柄 ---
    cloudTimer: null,
    hideTimer: null,
    searchTimer: null,
  };

  // ============ 4. 纯持久化助手（无云副作用；app.js 自行追加 scheduleCloudPush） ============
  State.persist = {
    accountData: function () { writeJSON(CLICKS_KEY, State.clicksAll); writeJSON(CLICK_LOG_KEY, State.clickLogAll); writeJSON(FAVS_KEY, State.favsAll); writeJSON(WORKSPACES_KEY, State.workspacesAll); },
    settings: function () { writeJSON(SETTINGS_KEY, State.settings); },
    accounts: function () { writeJSON(ACCOUNTS_KEY, State.accounts); },
    personal: function () { writeJSON(PERSONAL_KEY, State.personalSites); },
    recent: function () { writeJSON(RECENT_KEY, State.recentIds); },
    hotWords: function () { writeJSON(HOTWORDS_KEY, State.hotWords); },
    searchHistory: function () { writeJSON(SEARCH_HISTORY_KEY, State.searchHistory); },
    theme: function () { writeString(THEME_KEY, State.theme); },
    color: function () { writeString(COLOR_KEY, State.color); },
    gridSize: function () { writeString(SIZE_KEY, State.gridSize); },
    lang: function () { writeString(LANG_KEY, State.lang); },
    engine: function () { writeString(ENGINE_KEY, State.engine); },
  };

  return State;
});
