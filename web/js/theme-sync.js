/*
 * 屿航 · 主题同步（四页共用）
 * --------------------------------------------------
 * 从 localStorage 读取主站主题/配色（键 nav_theme_v1 / nav_color_v1，
 * 主站以裸字符串写入），同步到 <html data-theme data-color>。
 * 该脚本应在 <head> 中、body 渲染前同步执行，避免主题闪烁（FOUC）。
 * 暴露 window.YHThemeSync，供功能页挂载主题切换器与跨标签同步。
 */
(function () {
  'use strict';
  var THEME_KEY = 'nav_theme_v1';
  var COLOR_KEY = 'nav_color_v1';
  var VALID_THEMES = ['terminal','magazine','brutalism','cyber','pixel','swiss','glass','journal','space'];
  var VALID_COLORS = ['blue','violet','pink','mint','orange','green','red'];
  var STYLE_COLOR = { terminal:'green', magazine:'red', brutalism:'orange', cyber:'mint', pixel:'orange', swiss:'red', glass:'blue', journal:'orange', space:'blue' };

  function readRaw(k) {
    try {
      var v = localStorage.getItem(k);
      if (v == null) return null;
      // 兼容两种写入格式：主站 writeString 写裸串，本模块写 JSON 串。
      try { return JSON.parse(v); } catch (e) { return v; }
    } catch (e) { return null; }
  }
  function writeRaw(k, v) {
    // 主站 State.persist 使用裸字符串写入；这里也保持同一格式，避免主站 readJSON 读取失败后回退默认主题。
    try { localStorage.setItem(k, String(v)); } catch (e) {}
  }
  function sanitizeTheme(v) {
    if (!v) return 'brutalism';
    if (VALID_THEMES.indexOf(v) !== -1) return v;
    // 兼容历史旧风格名（与主站 migrateTheme 对齐）
    var old = ['light','dark','aurora','sunset','forest','mono','violet','mint'];
    if (old.indexOf(v) !== -1) return 'brutalism';
    return 'brutalism';
  }
  function sanitizeColor(v) { return VALID_COLORS.indexOf(v) !== -1 ? v : 'blue'; }

  function apply() {
    var theme = sanitizeTheme(readRaw(THEME_KEY));
    var color = sanitizeColor(readRaw(COLOR_KEY));
    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-color', color);
    return { theme: theme, color: color };
  }
  function set(theme, color) {
    try {
      if (theme) { writeRaw(THEME_KEY, sanitizeTheme(theme)); }
      if (color) { writeRaw(COLOR_KEY, sanitizeColor(color)); }
      else if (theme && STYLE_COLOR[theme]) { writeRaw(COLOR_KEY, STYLE_COLOR[theme]); }
    } catch (e) {}
    last = apply();
    fireChange();
    return last;
  }

  var last = apply();
  // 跨标签/跨页面同步：主站改了主题，功能页实时跟随
  window.addEventListener('storage', function (e) {
    if (e.key === THEME_KEY || e.key === COLOR_KEY) { last = apply(); fireChange(); }
  });

  var listeners = [];
  function fireChange() { for (var i = 0; i < listeners.length; i++) { try { listeners[i](last); } catch (err) {} } }

  window.YHThemeSync = {
    apply: apply,
    set: set,
    get: function () { return last; },
    VALID_THEMES: VALID_THEMES,
    VALID_COLORS: VALID_COLORS,
    STYLE_COLOR: STYLE_COLOR,
    onChange: function (fn) { if (typeof fn === 'function') listeners.push(fn); }
  };
})();
