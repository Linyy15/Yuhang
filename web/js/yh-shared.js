/*
 * 屿航 · 功能页共享工具（todo / ip / story / index 通用）
 * --------------------------------------------------
 * 零依赖、UMD、经典 <script defer> 加载。依赖 window.YHThemeSync（theme-sync.js）。
 * 提供：
 *   YHToast.show(msg)            轻量提示
 *   YHMobileNav.mount(opts)      挂载与主站一致的移动端底部导航 + "更多"抽屉
 *   YHThemePicker.mount(el)      9 风格 × 7 强调色选择器（同步 nav_theme_v1/nav_color_v1）
 *   YHTodoBridge.push({title,url})   主站卡片 → 屿事待办收件箱（localStorage）
 *   YHTodoBridge.pending() / clear()
 *   YHGrowth.awardBrowse(id) / awardFav(id) / snapshot()  行为授 XP（与 ip.html 成就打通）
 *   YHCompanion.mount(opts)      主站右下角屿咪伴随小组件（读成长/屿事状态）
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) { module.exports = factory(); }
  else if (typeof define === 'function' && define.amd) { define([], factory); }
  else { root.YHShared = factory(); }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window), function () {
  'use strict';

  var GROW_KEY = 'yuhang_yumi_grow_v1';
  var TODO_INBOX_KEY = 'yuhang_todo_inbox_v1';
  var BEHAVIOR_KEY = 'yuhang_behavior_v1';
  // 浏览/收藏里程碑：达到该 distinct 数量时一次性发放 bonus XP
  var BROWSE_MILESTONES = [1, 5, 15, 30, 60, 100];
  var FAV_MILESTONES = [1, 5, 15, 30];
  var XP_BROWSE = 20, XP_FAV = 30;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  // ---------- Toast ----------
  var toastEl = null, toastTimer = null;
  var YHToast = {
    show: function (msg, ms) {
      try {
        if (!toastEl) {
          toastEl = document.createElement('div');
          toastEl.className = 'yh-toast';
          toastEl.setAttribute('role', 'status');
          toastEl.setAttribute('aria-live', 'polite');
          document.body.appendChild(toastEl);
          var s = document.createElement('style');
          s.textContent = '.yh-toast{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:400;max-width:86vw;padding:9px 16px;border-radius:999px;background:var(--glass-bg-strong);border:1px solid var(--glass-border);box-shadow:var(--glass-shadow);color:var(--text);font:600 12.5px var(--font);opacity:0;transition:opacity .2s ease,transform .2s ease;pointer-events:none}@media(max-width:980px){.yh-toast{bottom:144px}}';
          document.head.appendChild(s);
        }
        toastEl.textContent = msg;
        toastEl.style.opacity = '1';
        toastEl.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { toastEl.style.opacity = '0'; toastEl.style.transform = 'translateX(-50%) translateY(8px)'; }, ms || 1800);
      } catch (e) {}
    }
  };

  // ---------- 成长 XP（与 ip.html 共用 yuhang_yumi_grow_v1） ----------
  function readGrowth() {
    try { var r = JSON.parse(localStorage.getItem(GROW_KEY)); if (r && typeof r === 'object') return r; } catch (e) {}
    return { xp: 0, peakDone: 0, achv: {}, voiceUsed: false, storyRead: false, todayAllDone: false };
  }
  function writeGrowth(g) { try { localStorage.setItem(GROW_KEY, JSON.stringify(g)); } catch (e) {} }
  function readBehavior() {
    try { var b = JSON.parse(localStorage.getItem(BEHAVIOR_KEY)); if (b && typeof b === 'object') return b; } catch (e) {}
    return { browsed: {}, favs: {}, awarded: {} };
  }
  function writeBehavior(b) { try { localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(b)); } catch (e) {} }

  var YHGrowth = {
    snapshot: function () {
      var g = readGrowth();
      return { xp: g.xp || 0, peakDone: g.peakDone || 0, todayAllDone: !!g.todayAllDone };
    },
    awardBrowse: function (id) {
      if (!id) return false;
      var b = readBehavior();
      if (b.browsed[id]) return false;
      b.browsed[id] = Date.now();
      var count = Object.keys(b.browsed).length;
      var leveled = false;
      for (var i = 0; i < BROWSE_MILESTONES.length; i++) {
        var m = BROWSE_MILESTONES[i];
        if (count >= m && !b.awarded['browse_' + m]) {
          b.awarded['browse_' + m] = Date.now();
          var g = readGrowth(); g.xp = (g.xp || 0) + XP_BROWSE; writeGrowth(g); leveled = true;
        }
      }
      writeBehavior(b);
      return leveled;
    },
    awardFav: function (id) {
      if (!id) return false;
      var b = readBehavior();
      if (b.favs[id]) return false;
      b.favs[id] = Date.now();
      var count = Object.keys(b.favs).length;
      var leveled = false;
      for (var i = 0; i < FAV_MILESTONES.length; i++) {
        var m = FAV_MILESTONES[i];
        if (count >= m && !b.awarded['fav_' + m]) {
          b.awarded['fav_' + m] = Date.now();
          var g = readGrowth(); g.xp = (g.xp || 0) + XP_FAV; writeGrowth(g); leveled = true;
        }
      }
      writeBehavior(b);
      return leveled;
    }
  };

  // ---------- 主站 → 屿事 待办收件箱 ----------
  var YHTodoBridge = {
    push: function (item) {
      try {
        var arr = JSON.parse(localStorage.getItem(TODO_INBOX_KEY) || '[]');
        if (!Array.isArray(arr)) arr = [];
        arr.push({ title: String(item.title || '').slice(0, 120), url: String(item.url || '').slice(0, 500), ts: Date.now() });
        if (arr.length > 50) arr = arr.slice(-50);
        localStorage.setItem(TODO_INBOX_KEY, JSON.stringify(arr));
      } catch (e) {}
    },
    pending: function () {
      try { var a = JSON.parse(localStorage.getItem(TODO_INBOX_KEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
    },
    clear: function () { try { localStorage.removeItem(TODO_INBOX_KEY); } catch (e) {} }
  };

  // ---------- 主题选择器 ----------
  var THEME_META = [
    { id: 'glass', ico: '🪟', label: '玻璃' }, { id: 'brutalism', ico: '🧱', label: '粗野' },
    { id: 'magazine', ico: '📰', label: '杂志' }, { id: 'terminal', ico: '⌨️', label: '终端' },
    { id: 'cyber', ico: '🌃', label: '赛博' }, { id: 'pixel', ico: '👾', label: '像素' },
    { id: 'swiss', ico: '⬜', label: '瑞士' }, { id: 'journal', ico: '📔', label: '手帐' },
    { id: 'space', ico: '🌌', label: '空间' }
  ];
  var COLOR_META = [
    { id: 'blue', hex: '#5b6cff' }, { id: 'violet', hex: '#8b5cf6' }, { id: 'pink', hex: '#ec4899' },
    { id: 'mint', hex: '#0ea5a0' }, { id: 'orange', hex: '#f97316' }, { id: 'green', hex: '#22c55e' }, { id: 'red', hex: '#ef4444' }
  ];
  var YHThemePicker = {
    mount: function (el, options) {
      if (!el) return;
      options = options || {};
      var host = el;
      if (options.compact) {
        host.innerHTML = '<button type="button" class="yh-tp-trigger" aria-expanded="false">🎨 主题</button><div class="yh-tp-pop" hidden></div>';
        el = host.querySelector('.yh-tp-pop');
      }
      var cur = (window.YHThemeSync && window.YHThemeSync.get()) || { theme: 'brutalism', color: 'blue' };
      var styles = THEME_META.map(function (t) {
        var on = t.id === cur.theme ? ' active' : '';
        return '<button type="button" class="yh-tp-style' + on + '" data-theme="' + t.id + '" title="' + esc(t.label) + '"><span class="yh-tp-ico">' + t.ico + '</span><span class="yh-tp-l">' + esc(t.label) + '</span></button>';
      }).join('');
      var colors = COLOR_META.map(function (c) {
        var on = c.id === cur.color ? ' active' : '';
        return '<button type="button" class="yh-tp-color' + on + '" data-color="' + c.id + '" title="' + esc(c.id) + '" style="background:' + c.hex + '"></button>';
      }).join('');
      el.innerHTML = '<div class="yh-tp"><div class="yh-tp-label">风格</div><div class="yh-tp-styles">' + styles + '</div><div class="yh-tp-label">强调色</div><div class="yh-tp-colors">' + colors + '</div></div>';
      ensurePickerStyle();
       if (options.compact) {
         var trigger = host.querySelector('.yh-tp-trigger');
         trigger.addEventListener('click', function () {
           var open = el.hidden;
           el.hidden = !open;
           trigger.setAttribute('aria-expanded', String(open));
         });
       }
      el.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('button[data-theme], button[data-color]') : null;
        if (!b) return;
        if (b.hasAttribute('data-theme')) { var r = window.YHThemeSync.set(b.getAttribute('data-theme')); syncActive(el, r); YHToast.show('已切换风格：' + (THEME_META.filter(function(t){return t.id===r.theme;})[0]||{}).label); }
        else { var r2 = window.YHThemeSync.set(null, b.getAttribute('data-color')); syncActive(el, r2); YHToast.show('已切换强调色'); }
      });
      if (options.compact) {
        document.addEventListener('click', function (e) {
          if (!el.hidden && !host.contains(e.target)) { el.hidden = true; host.querySelector('.yh-tp-trigger').setAttribute('aria-expanded', 'false'); }
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape' && !el.hidden) { el.hidden = true; host.querySelector('.yh-tp-trigger').setAttribute('aria-expanded', 'false'); host.querySelector('.yh-tp-trigger').focus(); }
        });
      }
      if (window.YHThemeSync && window.YHThemeSync.onChange) window.YHThemeSync.onChange(function (c) { syncActive(el, c); });
    }
  };
  function syncActive(el, cur) {
    el.querySelectorAll('.yh-tp-style').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-theme') === cur.theme); });
    el.querySelectorAll('.yh-tp-color').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-color') === cur.color); });
  }
  var pickerStyleEnsured = false;
  function ensurePickerStyle() {
    if (pickerStyleEnsured) return; pickerStyleEnsured = true;
    var s = document.createElement('style');
    s.textContent = '.yh-tp-trigger{border:1px solid var(--glass-border);border-radius:var(--radius-sm);background:var(--glass-bg);color:var(--text);padding:8px 12px;font:700 12px var(--font);cursor:pointer}.yh-tp-pop{position:absolute;right:0;top:calc(100% + 8px);z-index:220;width:280px;padding:8px;border:1px solid var(--glass-border);border-radius:var(--radius-md);background:var(--glass-bg-strong);box-shadow:var(--glass-shadow)}.yh-tp-pop[hidden]{display:none}.yh-tp-label{font:700 11px var(--font);color:var(--text-faint);letter-spacing:.5px;margin:10px 2px 6px}.yh-tp-styles{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.yh-tp-style{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 4px;border:1px solid var(--glass-border);border-radius:var(--radius-sm);background:var(--glass-bg);color:var(--text-sub);font:inherit;cursor:pointer;transition:transform .15s,border-color .15s,box-shadow .15s}.yh-tp-style:hover{transform:translateY(-2px)}.yh-tp-style.active{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft);color:var(--accent)}.yh-tp-ico{font-size:16px}.yh-tp-l{font-size:10px;font-weight:700}.yh-tp-colors{display:flex;gap:10px;flex-wrap:wrap;padding:2px}.yh-tp-color{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,.85);box-shadow:0 2px 6px rgba(0,0,0,.18);cursor:pointer;transition:transform .15s}.yh-tp-color:hover{transform:scale(1.1)}.yh-tp-color.active{transform:scale(1.18);box-shadow:0 0 0 3px var(--accent-soft),0 2px 6px rgba(0,0,0,.2)}';
    document.head.appendChild(s);
  }

  // ---------- 移动端底部导航 ----------
  var YHMobileNav = {
    mount: function (opts) {
      opts = opts || {};
      var existing = document.querySelector('.yh-mobile-nav');
      if (existing) return existing;
      var active = opts.active || '';
      var items = opts.items || [
        { id: 'home', label: '屿航', ico: '🏝️', href: 'index.html' },
        { id: 'todo', label: '屿事', ico: '📋', href: 'todo.html' },
        { id: 'ip', label: '屿咪', ico: '🐱', href: 'ip.html' }
      ];
      var moreItems = opts.moreItems || [
        { id: 'story', label: '世界观', desc: '屿咪长篇故事', ico: '📖', href: 'story.html' },
        { id: 'top', label: '回到顶部', desc: '回到页面顶端', ico: '⬆', action: 'top' },
        { id: 'theme', label: '主题换肤', desc: '风格与强调色', ico: '🎨', action: 'theme' }
      ];
      var nav = document.createElement('nav');
      nav.className = 'yh-mobile-nav'; nav.setAttribute('aria-label', '底部导航');
      nav.innerHTML = items.map(function (it) {
        var on = it.id === active ? ' active' : '';
        var tag = it.href ? 'a' : 'button';
        var attr = it.href ? ' href="' + esc(it.href) + '"' : ' type="button"';
        return '<' + tag + ' class="yh-nav-item' + on + '"' + attr + ' data-bn="' + it.id + '"><span class="yh-nav-icon">' + it.ico + '</span><span>' + esc(it.label) + '</span></' + tag + '>';
      }).join('') + '<button class="yh-nav-item" type="button" data-bn="more" aria-expanded="false" aria-controls="yh-mobile-more"><span class="yh-nav-icon">⋯</span><span>更多</span></button>';
      var more = document.createElement('div');
      more.className = 'yh-mobile-more'; more.id = 'yh-mobile-more'; more.hidden = true; more.setAttribute('aria-label', '更多入口');
      more.innerHTML = '<div class="yh-more-head"><span>更多入口</span><button type="button" data-more-close aria-label="关闭">✕</button></div>' +
        moreItems.map(function (m) {
          var tag = m.href ? 'a' : 'button';
          var attr = m.href ? ' href="' + esc(m.href) + '"' : ' type="button" data-more-action="' + esc(m.action || '') + '"';
          return '<' + tag + ' class="yh-more-item"' + attr + '><span class="yh-nav-icon">' + m.ico + '</span><span>' + esc(m.label) + '</span><small>' + esc(m.desc || '') + '</small></' + tag + '>';
        }).join('') + '<div class="yh-tp-host" id="yh-tp-host"></div>';
      document.body.appendChild(nav);
      document.body.appendChild(more);
      document.body.classList.add('yh-has-mobile-nav');

      var pickerMounted = false;
      function toggleMore(open) {
        var willOpen = open == null ? more.hidden : open;
        more.hidden = !willOpen;
        var btn = nav.querySelector('[data-bn="more"]');
        if (btn) { btn.setAttribute('aria-expanded', String(willOpen)); btn.classList.toggle('active', willOpen); }
        if (willOpen && !pickerMounted) { YHThemePicker.mount(document.getElementById('yh-tp-host')); pickerMounted = true; }
        if (willOpen) { requestAnimationFrame(function () { var a = more.querySelector('.yh-more-item'); if (a) a.focus(); }); }
      }
      nav.addEventListener('click', function (e) {
        var b = e.target.closest ? e.target.closest('[data-bn]') : null; if (!b) return;
        var id = b.getAttribute('data-bn');
        if (id === 'more') { toggleMore(); return; }
      });
      more.addEventListener('click', function (e) {
        if (e.target.closest('[data-more-close]')) { toggleMore(false); return; }
        var item = e.target.closest ? e.target.closest('[data-more-action]') : null;
        if (!item) return;
        var act = item.getAttribute('data-more-action');
        if (act === 'top') { toggleMore(false); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) { window.scrollTo(0, 0); } }
        else if (act === 'theme') {
          var host = document.getElementById('yh-tp-host');
          if (host) { host.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
        }
      });
      document.addEventListener('click', function (e) {
        if (more.hidden) return;
        if (e.target.closest && e.target.closest('.yh-mobile-more, [data-bn="more"]')) return;
        toggleMore(false);
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !more.hidden) toggleMore(false); });
      window.addEventListener('storage', function (e) {
        if (e.key === 'nav_theme_v1' || e.key === 'nav_color_v1') {
          var c = (window.YHThemeSync && window.YHThemeSync.get()) || {};
          syncActive(document.getElementById('yh-tp-host'), c);
        }
      });
    }
  };

  // ---------- 主站屿咪伴随小组件 ----------
  var MASCOT_SVG = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<defs><linearGradient id="yhcm-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6d86ff"/><stop offset="1" stop-color="#a78bfa"/></linearGradient></defs>'
    + '<circle cx="100" cy="110" r="64" fill="url(#yhcm-g)"/>'
    + '<path d="M52 70 L60 30 L86 58 Z" fill="url(#yhcm-g)"/><path d="M148 70 L140 30 L114 58 Z" fill="url(#yhcm-g)"/>'
    + '<circle cx="82" cy="104" r="9" fill="#fff"/><circle cx="118" cy="104" r="9" fill="#fff"/><circle cx="82" cy="106" r="4.5" fill="#1c2333"/><circle cx="118" cy="106" r="4.5" fill="#1c2333"/>'
    + '<path d="M88 124 Q100 134 112 124" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/>'
    + '<path d="M150 60 q18 6 14 26 q-14 6 -22 -10 z" fill="#a78bfa"/><path d="M172 70 q4 10 -8 12" fill="#ffd23f"/>'
    + '</svg>';
  var YHCompanion = {
    mount: function (opts) {
      opts = opts || {};
      var host = document.createElement('div');
      host.className = 'yh-companion'; host.setAttribute('aria-label', '屿咪伴随');
      host.innerHTML = '<button type="button" class="yh-cp-btn" title="屿咪">' + MASCOT_SVG + '<span class="yh-cp-badge" hidden>0</span></button><div class="yh-cp-bubble" hidden></div>';
      var st = document.createElement('style');
      st.textContent = '.yh-companion{position:fixed;right:18px;bottom:84px;z-index:90;display:flex;flex-direction:column;align-items:flex-end;gap:8px;pointer-events:none}@media(max-width:980px){.yh-companion{bottom:148px;right:14px}}.yh-cp-btn{position:relative;width:64px;height:64px;border:0;background:transparent;cursor:pointer;pointer-events:auto;animation:yhCpFloat 3.6s ease-in-out infinite;filter:drop-shadow(0 6px 16px var(--ip-glow))}.yh-cp-btn svg{width:100%;height:100%}.yh-cp-badge{position:absolute;top:-2px;right:-2px;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:linear-gradient(135deg,var(--accent),var(--accent-2));color:#fff;font:700 10px var(--font);display:grid;place-items:center;box-shadow:0 2px 6px rgba(0,0,0,.2)}.yh-cp-bubble{max-width:220px;padding:9px 13px;border-radius:14px;background:var(--glass-bg-strong);border:1px solid var(--glass-border);box-shadow:var(--glass-shadow);color:var(--text);font:600 12px var(--font);line-height:1.5;pointer-events:auto;transform-origin:bottom right;animation:yhCpPop .22s ease}@keyframes yhCpFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes yhCpPop{from{opacity:0;transform:scale(.9) translateY(6px)}to{opacity:1;transform:none}}';
      document.head.appendChild(st); document.body.appendChild(host);
      var btn = host.querySelector('.yh-cp-btn'); var badge = host.querySelector('.yh-cp-badge'); var bubble = host.querySelector('.yh-cp-bubble');
      var bubbleTimer = null;
      function say(msg, ms) { bubble.textContent = msg; bubble.hidden = false; clearTimeout(bubbleTimer); bubbleTimer = setTimeout(function () { bubble.hidden = true; }, ms || 4200); }
      function refresh() {
        var snap = YHGrowth.snapshot();
        var pending = YHTodoBridge.pending().length;
        var expr = snap.todayAllDone ? '🎉' : (pending ? '📋' : '✨');
        btn.setAttribute('title', '屿咪 · Lv ' + snap.xp + ' XP · 待导入 ' + pending);
        if (pending) { badge.hidden = false; badge.textContent = String(pending); } else { badge.hidden = true; }
      }
      btn.addEventListener('click', function () { if (typeof opts.onClick === 'function') opts.onClick(); else { window.location.href = 'ip.html'; } });
      btn.addEventListener('mouseenter', function () {
        var snap = YHGrowth.snapshot(); var p = YHTodoBridge.pending().length;
        var lines = ['我是屿咪，你的数字岛屿领航员 🐱'];
        if (snap.xp) lines.push('当前 Lv 经验 ' + snap.xp + ' XP');
        if (p) lines.push('屿事收件箱有 ' + p + ' 条待导入');
        else lines.push('今日屿事 ' + (snap.todayAllDone ? '已清零，干得漂亮' : '还有未完成哦'));
        say(lines.join(' · '));
      });
      refresh();
      setInterval(refresh, 8000);
      window.addEventListener('storage', function (e) { if (e.key === GROW_KEY || e.key === TODO_INBOX_KEY) refresh(); });
      return { say: say, refresh: refresh };
    }
  };

  return { YHToast: YHToast, YHMobileNav: YHMobileNav, YHThemePicker: YHThemePicker, YHTodoBridge: YHTodoBridge, YHGrowth: YHGrowth, YHCompanion: YHCompanion };
});
