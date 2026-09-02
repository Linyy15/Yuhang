/*
 * 屿航 · 认证模块（登录/注册/改密 + 收藏管理 + 云端同步）
 * ------------------------------------------------------------
 * 暴露 window.YHAuth { init, openLogin, loginDone, logout, ensureSupabase,
 *   scheduleCloudPush, pullFromCloud, updateLoginBtn, setSupabaseUser,
 *   supabaseClient, supabaseUser }。
 * Supabase 按需懒加载（离线可用，使用时才在 head 注入 supabase-js UMD）。
 * 收藏（S.favs）与工作区（S.workspaces）的写入由本模块经 scheduleCloudPush 触发云同步，
 * app.js 的 saveAccountData / savePersonal 调用它。
 */
(function (root) {
  'use strict';
  var $ = document.getElementById.bind(document);
  var opts = null;

  // ============ 1. Supabase 按需懒加载 ============
  var SUPABASE_CDNS = [
    'https://registry.npmmirror.com/@supabase/supabase-js/2/files/dist/umd/supabase.min.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://unpkg.com/@supabase/supabase-js@2',
  ];
  var supabaseClient = null;
  var _supabasePromise = null;
  function loadSupabaseLib() {
    if (_supabasePromise) return _supabasePromise;
    _supabasePromise = new Promise(function (resolve) {
      if (window.supabase) return resolve();
      var urls = SUPABASE_CDNS.slice();
      function tryNext() {
        if (!urls.length || !document || !document.createElement) return resolve();
        var s = document.createElement('script');
        s.src = urls.shift();
        s.onload = function () { if (window.supabase) resolve(); else tryNext(); };
        s.onerror = function () { tryNext(); };
        if (document.head) document.head.appendChild(s); else tryNext();
      }
      tryNext();
    });
    return _supabasePromise;
  }
  function ensureSupabase() {
    return loadSupabaseLib().then(function () {
      if (supabaseClient) return supabaseClient;
      if (window.supabase && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
        try { supabaseClient = window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseAnonKey); }
        catch (e) { supabaseClient = null; }
      }
      return supabaseClient;
    });
  }
  var supabaseUser = null;
  var authMode = 'login'; // 'login' | 'register' | 'reset'

  // ============ 2. 登录表单 / 密码强度 ============
  function setLoginMsg(html) { if (opts && opts.dom.loginMsg) opts.dom.loginMsg.innerHTML = html; }
  function authErrorMsg(err) {
    var m = (err && err.message) || '';
    if (/invalid login credentials/i.test(m)) return opts.t('err_bad_creds');
    if (/email not confirmed/i.test(m)) return opts.t('err_not_confirmed');
    if (/already registered/i.test(m)) return opts.t('err_already_registered');
    if (/rate limit/i.test(m)) return opts.t('err_rate_limit');
    return m;
  }
  function passwordStrength(p) {
    var score = 0, tips = [];
    if (!p) return { score: 0, label: '', tips: [] };
    if (p.length < 8) tips.push(opts.t('pw_short')); else score += 1;
    if (/[a-z]/.test(p)) score += 1; else tips.push(opts.t('pw_lower'));
    if (/[A-Z]/.test(p)) score += 1; else tips.push(opts.t('pw_upper'));
    if (/[0-9]/.test(p)) score += 1; else tips.push(opts.t('pw_num'));
    if (/[^A-Za-z0-9]/.test(p)) score += 1; else tips.push(opts.t('pw_special'));
    var label = score >= 5 ? opts.t('pw_strong') : (score >= 3 ? opts.t('pw_medium') : opts.t('pw_weak'));
    return { score: Math.min(score, 5), label: label, tips: tips };
  }

  function renderAuthForm() {
    var dom = opts.dom;
    if (!dom.loginBody) return;
    setLoginMsg('');
    var isReg = authMode === 'register';
    var isReset = authMode === 'reset';
    if (isReset) {
      dom.loginBody.innerHTML =
        '<div class="form">' +
          '<input id="rs-email" type="email" placeholder="' + opts.t('email_ph') + '" autocomplete="off">' +
          '<button id="rs-send" class="btn btn-primary">' + opts.t('send_reset') + '</button>' +
          '<button id="rs-back" class="btn btn-ghost">' + opts.t('back_login') + '</button>' +
        '</div>';
      var rsEmail = dom.loginBody.querySelector('#rs-email');
      var rsSend = dom.loginBody.querySelector('#rs-send');
      var rsBack = dom.loginBody.querySelector('#rs-back');
      if (rsSend) rsSend.addEventListener('click', function () {
        var email = (rsEmail.value || '').trim();
        if (!email) { setLoginMsg(opts.t('login_need')); return; }
        ensureSupabase().then(function (client) {
          if (!client) { setLoginMsg(opts.t('no_supabase')); return; }
          client.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname
          }).then(function (res) {
            if (res.error) { setLoginMsg(opts.t('auth_err') + ': ' + authErrorMsg(res.error)); return; }
            setLoginMsg(opts.t('reset_sent'));
          });
        });
      });
      if (rsBack) rsBack.addEventListener('click', function () {
        authMode = 'login';
        renderAuthForm();
      });
      return;
    }
    if (isReg) {
      var ownerMail = 'jubei516206@163.com';
      var mailto = 'mailto:' + ownerMail +
        '?subject=' + encodeURIComponent('屿航注册申请') +
        '&body=' + encodeURIComponent('用户名：\n密码：\n\n（请按以上格式填写，等待官方添加账号后即可登录）');
      dom.loginBody.innerHTML =
        '<div class="reg-mail">' +
          '<div class="reg-mail-icon">📮</div>' +
          '<p class="reg-mail-title">' + opts.t('reg_mail_title') + '</p>' +
          '<p class="reg-mail-text">' + opts.t('reg_mail_text') + '</p>' +
          '<div class="reg-mail-fmt">' + opts.t('reg_mail_fmt') + '</div>' +
          '<div class="reg-mail-mail">' + ownerMail + '</div>' +
          '<div class="form-actions">' +
            '<a class="btn btn-primary" href="' + mailto + '">' + opts.t('reg_mail_btn') + '</a>' +
            '<button id="au-copy-mail" class="btn btn-ghost">' + opts.t('reg_mail_copy') + '</button>' +
            '<button id="au-copy-content" class="btn btn-ghost">' + opts.t('reg_mail_copy_content') + '</button>' +
          '</div>' +
          '<button id="au-toggle" class="btn btn-ghost">' + opts.t('to_login') + '</button>' +
        '</div>';
      var toggleEl2 = dom.loginBody.querySelector('#au-toggle');
      if (toggleEl2) toggleEl2.addEventListener('click', function () {
        authMode = 'login';
        renderAuthForm();
      });
      var copyMailEl = dom.loginBody.querySelector('#au-copy-mail');
      if (copyMailEl) copyMailEl.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(ownerMail).catch(function () {});
        }
        setLoginMsg(opts.t('reg_mail_copied'));
      });
      var copyContentEl = dom.loginBody.querySelector('#au-copy-content');
      if (copyContentEl) copyContentEl.addEventListener('click', function () {
        var content = '屿航注册申请\n\n用户名：你的用户名\n密码：你的密码\n\n（请按以上格式填写，等待官方添加账号后即可登录）';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(content).catch(function () {});
        }
        setLoginMsg(opts.t('reg_mail_content_copied'));
      });
      return;
    }
    dom.loginBody.innerHTML =
      '<div class="form">' +
        '<input id="au-email" type="email" placeholder="' + opts.t('email_ph') + '" autocomplete="off">' +
        '<div class="pw-field">' +
          '<input id="au-pass" type="password" placeholder="' + opts.t('pass_ph') + '" autocomplete="new-password">' +
          '<button type="button" class="pw-eye" data-target="au-pass" title="' + opts.t('pw_show') + '">👁</button>' +
        '</div>' +
        (isReg
          ? '<div class="pw-meter" id="au-meter">' +
              '<div class="pw-bar"><i id="au-bar"></i></div>' +
              '<div class="pw-meta"><span id="au-strength" class="pw-strength"></span><span id="au-hints" class="pw-hints"></span></div>' +
            '</div>' +
            '<div class="pw-field">' +
              '<input id="au-pass2" type="password" placeholder="' + opts.t('login_pass2_ph') + '" autocomplete="new-password">' +
              '<button type="button" class="pw-eye" data-target="au-pass2" title="' + opts.t('pw_show') + '">👁</button>' +
            '</div>'
          : '') +
        '<div class="form-actions">' +
          '<button id="au-submit" class="btn btn-primary">' + (isReg ? opts.t('email_register') : opts.t('email_login')) + '</button>' +
          '<button id="au-toggle" class="btn btn-ghost">' + (isReg ? opts.t('to_login') : opts.t('to_register')) + '</button>' +
        '</div>' +
        (!isReg ? '<button id="au-forgot" class="link-btn">' + opts.t('forgot_pass') + '</button>' : '') +
        '<div class="form-hint">' + opts.t('login_hint') + '</div>' +
      '</div>';
    var emailEl = dom.loginBody.querySelector('#au-email');
    var passEl = dom.loginBody.querySelector('#au-pass');
    var pass2El = dom.loginBody.querySelector('#au-pass2');
    var barEl = dom.loginBody.querySelector('#au-bar');
    var strengthEl = dom.loginBody.querySelector('#au-strength');
    var hintsEl = dom.loginBody.querySelector('#au-hints');
    var submitEl = dom.loginBody.querySelector('#au-submit');
    var toggleEl = dom.loginBody.querySelector('#au-toggle');
    var forgotEl = dom.loginBody.querySelector('#au-forgot');
    if (passEl && isReg) passEl.addEventListener('input', function () {
      var st = passwordStrength(passEl.value);
      if (!barEl) return;
      barEl.style.width = (st.score * 20) + '%';
      barEl.className = 'bar-' + (st.score >= 5 ? 'strong' : (st.score >= 3 ? 'medium' : 'weak'));
      if (strengthEl) strengthEl.textContent = st.label ? (opts.t('pw_strength_label') + '：' + st.label) : '';
      if (hintsEl) hintsEl.textContent = st.tips.map(function (x) { return x; }).join(' · ');
    });
    if (forgotEl) forgotEl.addEventListener('click', function () {
      authMode = 'reset';
      renderAuthForm();
    });
    if (toggleEl) toggleEl.addEventListener('click', function () {
      authMode = isReg ? 'login' : 'register';
      renderAuthForm();
    });
    if (submitEl) submitEl.addEventListener('click', function () {
      var email = (emailEl.value || '').trim();
      var pass = passEl.value;
      if (!email || !pass) { setLoginMsg(opts.t('login_need')); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLoginMsg(opts.t('email_invalid')); return; }
      if (isReg) {
        if (pass.length < 8) { setLoginMsg(opts.t('pw_short_err')); return; }
        if (pass !== pass2El.value) { setLoginMsg(opts.t('login_mismatch')); return; }
        ensureSupabase().then(function (client) {
          if (!client) { setLoginMsg(opts.t('no_supabase')); return; }
          client.auth.signUp({ email: email, password: pass }).then(function (res) {
            if (res.error) { setLoginMsg(opts.t('auth_err') + ': ' + authErrorMsg(res.error)); return; }
            if (res.data && res.data.session) loginDone();
            else setLoginMsg(opts.t('confirm_email'));
          });
        });
      } else {
        ensureSupabase().then(function (client) {
          if (!client) { setLoginMsg(opts.t('no_supabase')); return; }
          client.auth.signInWithPassword({ email: email, password: pass }).then(function (res) {
            if (res.error) { setLoginMsg(opts.t('auth_err') + ': ' + authErrorMsg(res.error)); return; }
            loginDone();
          });
        });
      }
    });
  }

  // ============ 3. 登录态 / 按钮 ============
  function updateLoginBtn() {
    if (!opts) return;
    var dom = opts.dom;
    dom.btnLogin.forEach(function (b) { b.innerHTML = opts.S.currentUser ? '👤 ' + opts.escapeHtml(opts.S.currentUser) : opts.t('login'); });
    if (dom.btnChangePass) dom.btnChangePass.hidden = !opts.S.currentUser;
  }
  function loginDone() {
    if (!opts) return;
    opts.loadAccountData();
    closeLogin();
    updateLoginBtn();
    opts.renderCats();
    opts.renderFilterBar();
    opts.YHCards.render();
  }
  function logout() {
    if (!opts) return;
    opts.S.currentUser = null;
    if (supabaseClient) supabaseClient.auth.signOut().catch(function () {});
    var activeCat = opts.getActiveCat();
    if (activeCat === opts.MY_CAT || activeCat === opts.FAV_CAT || activeCat === opts.HOT_CAT || activeCat === opts.WS_CAT || activeCat === opts.RECENT_CAT) opts.setActiveCat('全部');
    opts.setActiveWs(null);
    opts.loadAccountData();
    updateLoginBtn();
    opts.renderCats();
    opts.renderFilterBar();
    opts.YHCards.render();
  }
  function openLogin(hint) {
    if (!opts) return;
    setLoginMsg('');
    opts.dom.loginModal.hidden = false;
    renderAuthForm();
    if (hint && opts.dom.loginMsg) opts.dom.loginMsg.innerHTML = hint;
  }
  function closeLogin() { if (opts && opts.dom.loginModal) opts.dom.loginModal.hidden = true; }

  // ============ 4. 修改密码 ============
  // （事件绑定在 init 中，纯函数保持行为）

  // ============ 5. 收藏管理（含批量操作） ============
  var favSel = new Set();
  function renderFavList() {
    var dom = opts && opts.dom;
    if (!dom || !dom.favList) return;
    var ids = Array.from(opts.S.favs);
    if (!ids.length) { dom.favList.innerHTML = '<div class="ws-empty">' + opts.t('empty_fav') + '</div>'; updateFavBatchUI(); return; }
    dom.favList.innerHTML = ids.map(function (id) {
      var s = opts.siteOf(id);
      var nm = s ? opts.nameLabel(s) : id;
      var checked = favSel.has(id) ? ' checked' : '';
      return '<div class="fav-item' + (checked ? ' sel' : '') + '"><input type="checkbox" class="fav-check" data-fav-check="' + opts.escapeHtml(id) + '"' + checked + '><span class="fav-name">' + opts.escapeHtml(nm) + '</span>' +
        '<button class="btn btn-ghost" data-fav-rm="' + opts.escapeHtml(id) + '">✕</button></div>';
    }).join('');
    updateFavBatchUI();
  }
  function updateFavBatchUI() {
    var dom = opts && opts.dom;
    if (!dom) return;
    var countEl = dom.favSelCount;
    if (countEl) countEl.textContent = favSel.size ? opts.t('fav_sel_n').replace('{n}', favSel.size) : '';
    var selAll = dom.favSelAll;
    if (selAll) { selAll.checked = opts.S.favs.size > 0 && favSel.size === opts.S.favs.size; }
    var wsSel = dom.favBatchWs;
    if (wsSel) {
      var o = '<option value="__new">' + opts.t('fav_batch_ws_new') + '</option>' +
        Object.keys(opts.S.workspaces).map(function (id) {
          return '<option value="' + opts.escapeHtml(id) + '">' + opts.escapeHtml(opts.S.workspaces[id].name) + '</option>';
        }).join('');
      if (wsSel.innerHTML !== o) { wsSel.innerHTML = o; }
    }
  }
  function openFavManage() {
    if (!opts) return;
    if (!opts.S.currentUser) { openLogin(opts.t('need_login_fav')); return; }
    renderFavList();
    opts.dom.favModal.hidden = false;
  }
  function openSitesInTabs(list) {
    var urls = [];
    list.forEach(function (s) { if (s && s.url) urls.push(s.url); });
    if (!urls.length) return;
    if (urls.length > 8 && !window.confirm(opts.t('open_all_confirm').replace('{n}', urls.length))) return;
    urls.forEach(function (u) { window.open(u, '_blank'); });
  }

  // ============ 6. 云端同步 ============
  var cloudTimer = null;
  function cloudUid() { return supabaseUser ? supabaseUser.id : null; }
  function pullFromCloud() {
    if (!supabaseClient || !opts.S.currentUser || !cloudUid()) return Promise.resolve(false);
    var u = cloudUid();
    return Promise.all([
      supabaseClient.from('favorites').select('site_id').eq('user_id', u),
      supabaseClient.from('clicks').select('site_id,count').eq('user_id', u),
      supabaseClient.from('personal_sites').select('*').eq('user_id', u)
    ]).then(function (res) {
      opts.S.favsAll[opts.S.currentUser] = (res[0].data || []).map(function (r) { return r.site_id; });
      var c = {};
      (res[1].data || []).forEach(function (r) { c[r.site_id] = r.count; });
      opts.S.clicksAll[opts.S.currentUser] = c;
      opts.S.personalSites[opts.S.currentUser] = (res[2].data || []).map(function (r) {
        return { id: r.id, owner: opts.S.currentUser, name: r.name, fullName: r.name, url: r.url, brief: r.brief || '', detail: '', category: '', tags: r.tags || [], vpn: false, source: 'personal' };
      });
      opts.loadAccountData();
      return true;
    }).catch(function () { return false; });
  }
  function pushFavs() {
    if (!supabaseClient || !opts.S.currentUser || !cloudUid() || !opts.S.settings.shareStats) return Promise.resolve();
    var u = cloudUid();
    return supabaseClient.from('favorites').delete().eq('user_id', u).then(function () {
      var rows = Array.from(opts.S.favs).map(function (sid) { return { user_id: u, site_id: sid }; });
      return rows.length ? supabaseClient.from('favorites').insert(rows) : Promise.resolve();
    }).catch(function () {});
  }
  function pushClicks() {
    if (!supabaseClient || !opts.S.currentUser || !cloudUid() || !opts.S.settings.shareStats) return Promise.resolve();
    var u = cloudUid();
    return supabaseClient.from('clicks').delete().eq('user_id', u).then(function () {
      var rows = Object.keys(opts.S.clicks).map(function (sid) { return { user_id: u, site_id: sid, count: opts.S.clicks[sid] }; });
      return rows.length ? supabaseClient.from('clicks').insert(rows) : Promise.resolve();
    }).catch(function () {});
  }
  function pushPersonal() {
    if (!supabaseClient || !opts.S.currentUser || !cloudUid()) return Promise.resolve();
    var u = cloudUid();
    var mine = opts.S.personalSites[opts.S.currentUser] || [];
    return supabaseClient.from('personal_sites').delete().eq('user_id', u).then(function () {
      var rows = mine.map(function (s) { return { user_id: u, name: s.name, url: s.url, brief: s.brief || '', tags: s.tags || [] }; });
      return rows.length ? supabaseClient.from('personal_sites').insert(rows) : Promise.resolve();
    }).catch(function () {});
  }
  function pushAllToCloud() { pushFavs(); pushClicks(); pushPersonal(); }
  function scheduleCloudPush() {
    if (cloudTimer) clearTimeout(cloudTimer);
    cloudTimer = setTimeout(pushAllToCloud, 600);
  }

  function setSupabaseUser(u) { supabaseUser = u; }

  // ============ 7. init（事件绑定） ============
  function init(o) {
    opts = o;
    var dom = o.dom;
    updateLoginBtn();
    renderAuthForm();

    o.on(dom.loginClose, 'click', closeLogin);
    document.addEventListener('click', function (e) {
      var eye = e.target.closest ? e.target.closest('.pw-eye') : null;
      if (!eye) return;
      var target = document.getElementById(eye.getAttribute('data-target'));
      if (!target) return;
      var show = target.type === 'password';
      target.type = show ? 'text' : 'password';
      eye.textContent = show ? '🙈' : '👁';
      eye.title = show ? opts.t('pw_hide') : opts.t('pw_show');
    });
    o.on(dom.loginModal, 'click', function (e) { if (e.target === dom.loginModal) closeLogin(); });
    dom.btnLogin.forEach(function (b) { o.on(b, 'click', function () {
      if (!opts.S.currentUser) { openLogin(); return; }
      dom.loginMenu.hidden = !dom.loginMenu.hidden;
    }); });
    o.on(dom.loginMenu, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-login-action]') : null;
      if (!b) return;
      var act = b.getAttribute('data-login-action');
      dom.loginMenu.hidden = true;
      if (act === 'my') {
        o.setActiveCat(o.MY_CAT);
        o.getSelectedTags().clear();
        o.setActiveWs(null);
        o.renderCats();
        o.renderFilterBar();
        o.YHCards.render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (act === 'add') {
        o.openAdd();
      } else if (act === 'logout') {
        logout();
      }
    });
    document.addEventListener('click', function (e) {
      if (dom.loginMenu && !dom.loginMenu.hidden && !(e.target.closest && e.target.closest('.theme-wrap'))) dom.loginMenu.hidden = true;
    });

    // 修改密码
    o.on(dom.btnChangePass, 'click', function () {
      if (!opts.S.currentUser) { openLogin(opts.t('need_login_fav')); return; }
      dom.passNew.value = '';
      dom.passNew2.value = '';
      dom.passMsg.innerHTML = '';
      dom.passBar.style.width = '0';
      dom.passBar.className = '';
      dom.passStrength.textContent = '';
      dom.passHints.textContent = '';
      dom.passModal.hidden = false;
    });
    o.on(dom.passClose, 'click', function () { dom.passModal.hidden = true; });
    o.on(dom.passModal, 'click', function (e) { if (e.target === dom.passModal) dom.passModal.hidden = true; });
    o.on(dom.passNew, 'input', function () {
      var st = passwordStrength(dom.passNew.value);
      dom.passBar.style.width = (st.score * 20) + '%';
      dom.passBar.className = 'bar-' + (st.score >= 5 ? 'strong' : (st.score >= 3 ? 'medium' : 'weak'));
      dom.passStrength.textContent = st.label ? (opts.t('pw_strength_label') + '：' + st.label) : '';
      dom.passHints.textContent = st.tips.join(' · ');
    });
    o.on(dom.passSubmit, 'click', function () {
      var p = dom.passNew.value;
      if (p.length < 8) { dom.passMsg.innerHTML = opts.t('pw_short_err'); return; }
      if (p !== dom.passNew2.value) { dom.passMsg.innerHTML = opts.t('login_mismatch'); return; }
      ensureSupabase().then(function (client) {
        if (!client) { dom.passMsg.innerHTML = opts.t('no_supabase'); return; }
        client.auth.updateUser({ password: p }).then(function (res) {
          if (res.error) { dom.passMsg.innerHTML = opts.t('auth_err') + ': ' + authErrorMsg(res.error); return; }
          dom.passMsg.innerHTML = opts.t('pass_changed');
          setTimeout(function () { dom.passModal.hidden = true; }, 1200);
        });
      });
    });

    // 收藏管理
    o.on(dom.favClose, 'click', function () { dom.favModal.hidden = true; });
    o.on(dom.favModal, 'click', function (e) { if (e.target === dom.favModal) dom.favModal.hidden = true; });
    o.on(dom.favList, 'click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-fav-rm]') : null;
      if (!b) return;
      opts.S.favs.delete(b.getAttribute('data-fav-rm'));
      o.saveAccountData();
      renderFavList();
      o.renderCats();
      o.YHCards.render();
    });
    o.on(dom.favClear, 'click', function () {
      if (!window.confirm(opts.t('clear_confirm'))) return;
      opts.S.favs.clear();
      o.saveAccountData();
      renderFavList();
      o.renderCats();
      o.YHCards.render();
    });
    o.on(dom.favList, 'change', function (e) {
      var cb = e.target && e.target.matches && e.target.matches('[data-fav-check]') ? e.target : null;
      if (!cb) return;
      var id = cb.getAttribute('data-fav-check');
      if (cb.checked) favSel.add(id); else favSel.delete(id);
      renderFavList();
    });
    o.on(dom.favSelAll, 'change', function (e) {
      if (e.target.checked) {
        Array.from(opts.S.favs).forEach(function (id) { favSel.add(id); });
      } else {
        favSel.clear();
      }
      renderFavList();
    });
    o.on(dom.favBatchRemove, 'click', function () {
      if (!favSel.size) { o.showMsg(opts.t('fav_sel_empty')); return; }
      if (!window.confirm(opts.t('fav_batch_remove_confirm').replace('{n}', favSel.size))) return;
      favSel.forEach(function (id) { opts.S.favs.delete(id); });
      favSel.clear();
      o.saveAccountData();
      renderFavList();
      o.renderCats();
      o.YHCards.render();
      o.showMsg(opts.t('fav_batch_done'));
    });
    o.on(dom.favBatchExport, 'click', function () {
      if (!favSel.size) { o.showMsg(opts.t('fav_sel_empty')); return; }
      var chosen = new Set(favSel);
      function exportSelBookmarks() {
        var items = o.allSites().filter(function (s) { return chosen.has(s.id); });
        var lines = items.map(function (s) {
          return '    <DT><A HREF="' + opts.escapeHtml(s.url || '') + '">' + opts.escapeHtml(opts.nameLabel(s)) + '</A>';
        });
        var html =
          '<!DOCTYPE NETSCAPE-Bookmark-file-1>\n' +
          '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n' +
          '<TITLE>' + opts.t('export_bm') + '</TITLE>\n' +
          '<H1>' + opts.t('export_bm') + '</H1>\n' +
          '<DL><p>\n  <DT><H3>' + opts.t('export_bm') + '</H3>\n  <DL><p>\n' +
          lines.join('\n') +
          '\n  </DL><p>\n</DL><p>\n';
        o.downloadText('yuhang-bookmarks.html', html, 'text/html');
        o.showMsg(opts.t('bm_exported'));
      }
      exportSelBookmarks();
    });
    o.on(dom.favBatchWs, 'change', function (e) {
      var val = e.target.value;
      if (!val || !favSel.size) { e.target.value = '__new'; return; }
      var targetId = val;
      if (val === '__new') {
        var name = window.prompt(opts.t('fav_batch_ws_prompt'));
        if (!name || !name.trim()) { return; }
        targetId = 'w' + Date.now();
        opts.S.workspaces[targetId] = { name: name.trim(), ids: [] };
      }
      var ws = opts.S.workspaces[targetId];
      if (!ws) return;
      favSel.forEach(function (id) {
        if (ws.ids.indexOf(id) === -1) ws.ids.push(id);
      });
      o.saveAccountData();
      o.renderCats();
      o.YHCards.render();
      o.showMsg(opts.t('fav_batch_ws_done').replace('{n}', favSel.size));
      e.target.value = '__new';
    });
    if (dom.favOpenAll) dom.favOpenAll.addEventListener('click', function () {
      openSitesInTabs(o.allSites().filter(function (s) { return opts.S.favs.has(s.id); }));
    });
  }

  root.YHAuth = {
    init: init, openLogin: openLogin, loginDone: loginDone, logout: logout,
    ensureSupabase: ensureSupabase, scheduleCloudPush: scheduleCloudPush,
    get supabaseClient() { return supabaseClient; },
    get supabaseUser() { return supabaseUser; },
    setSupabaseUser: setSupabaseUser,
    updateLoginBtn: updateLoginBtn,
    pullFromCloud: pullFromCloud,
  };
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : window));
