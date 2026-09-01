  // ---------- 登录 / 注册（邮箱 + 密码 + 确认密码 + 密码强度与风险提示） ----------
  var supabaseClient = null;
  if (window.supabase && window.APP_CONFIG && window.APP_CONFIG.supabaseUrl) {
    try { supabaseClient = window.supabase.createClient(window.APP_CONFIG.supabaseUrl, window.APP_CONFIG.supabaseAnonKey); }
    catch (e) { supabaseClient = null; }
  }
  var supabaseUser = null;
  var authMode = 'login'; // 'login' | 'register'

  function setLoginMsg(html) { if (loginMsg) loginMsg.innerHTML = html; }
  function updateLoginBtn() {
    if (btnLogin) btnLogin.innerHTML = currentUser ? '👤 ' + escapeHtml(currentUser) : t('login');
  }
  function loginDone() {
    closeLogin();
    updateLoginBtn();
    renderCats();
    renderFilterBar();
    renderGrid();
  }
  function logout() {
    currentUser = null;
    if (supabaseClient) supabaseClient.auth.signOut().catch(function () {});
    if (activeCat === MY_CAT) activeCat = '全部';
    updateLoginBtn();
    renderCats();
    renderFilterBar();
    renderGrid();
  }
  function openLogin() {
    setLoginMsg('');
    loginModal.hidden = false;
    renderAuthForm();
  }
  function closeLogin() { loginModal.hidden = true; }

  // 密码强度评分
  function passwordStrength(p) {
    var score = 0, tips = [];
    if (!p) return { score: 0, label: '', tips: [] };
    if (p.length < 8) tips.push(t('pw_short')); else score += 1;
    if (/[a-z]/.test(p)) score += 1; else tips.push(t('pw_lower'));
    if (/[A-Z]/.test(p)) score += 1; else tips.push(t('pw_upper'));
    if (/[0-9]/.test(p)) score += 1; else tips.push(t('pw_num'));
    if (/[^A-Za-z0-9]/.test(p)) score += 1; else tips.push(t('pw_special'));
    var label = score >= 5 ? t('pw_strong') : (score >= 3 ? t('pw_medium') : t('pw_weak'));
    return { score: Math.min(score, 5), label: label, tips: tips };
  }

  function renderAuthForm() {
    if (!loginBody) return;
    setLoginMsg('');
    var isReg = authMode === 'register';
    loginBody.innerHTML =
      '<div class="form">' +
        '<input id="au-email" type="email" placeholder="' + t('email_ph') + '" autocomplete="off">' +
        '<input id="au-pass" type="password" placeholder="' + t('pass_ph') + '">' +
        (isReg
          ? '<div class="pw-meter" id="au-meter">' +
              '<div class="pw-bar"><i id="au-bar"></i></div>' +
              '<div class="pw-meta"><span id="au-strength" class="pw-strength"></span><span id="au-hints" class="pw-hints"></span></div>' +
            '</div>' +
            '<input id="au-pass2" type="password" placeholder="' + t('login_pass2_ph') + '">'
          : '') +
        '<div class="form-actions">' +
          '<button id="au-submit" class="btn btn-primary">' + (isReg ? t('email_register') : t('email_login')) + '</button>' +
          '<button id="au-toggle" class="btn btn-ghost">' + (isReg ? t('to_login') : t('to_register')) + '</button>' +
        '</div>' +
        '<div class="form-hint">' + t('login_hint') + '</div>' +
      '</div>';
    var emailEl = loginBody.querySelector('#au-email');
    var passEl = loginBody.querySelector('#au-pass');
    var pass2El = loginBody.querySelector('#au-pass2');
    var barEl = loginBody.querySelector('#au-bar');
    var strengthEl = loginBody.querySelector('#au-strength');
    var hintsEl = loginBody.querySelector('#au-hints');
    var submitEl = loginBody.querySelector('#au-submit');
    var toggleEl = loginBody.querySelector('#au-toggle');

    if (passEl && isReg) passEl.addEventListener('input', function () {
      var st = passwordStrength(passEl.value);
      if (!barEl) return;
      barEl.style.width = (st.score * 20) + '%';
      barEl.className = 'bar-' + (st.score >= 5 ? 'strong' : (st.score >= 3 ? 'medium' : 'weak'));
      if (strengthEl) strengthEl.textContent = st.label ? (t('pw_strength_label') + '：' + st.label) : '';
      if (hintsEl) hintsEl.textContent = st.tips.map(function (x) { return x; }).join(' · ');
    });
    if (toggleEl) toggleEl.addEventListener('click', function () {
      authMode = isReg ? 'login' : 'register';
      renderAuthForm();
    });
    if (submitEl) submitEl.addEventListener('click', function () {
      var email = (emailEl.value || '').trim();
      var pass = passEl.value;
      if (!email || !pass) { setLoginMsg(t('login_need')); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setLoginMsg(t('email_invalid')); return; }
      if (isReg) {
        if (pass.length < 8) { setLoginMsg(t('pw_short_err')); return; }
        if (pass !== pass2El.value) { setLoginMsg(t('login_mismatch')); return; }
        if (!supabaseClient) { setLoginMsg(t('no_supabase')); return; }
        supabaseClient.auth.signUp({ email: email, password: pass }).then(function (res) {
          if (res.error) { setLoginMsg(t('auth_err') + ': ' + res.error.message); return; }
          if (res.data && res.data.session) loginDone();
          else setLoginMsg(t('confirm_email'));
        });
      } else {
        if (!supabaseClient) { setLoginMsg(t('no_supabase')); return; }
        supabaseClient.auth.signInWithPassword({ email: email, password: pass }).then(function (res) {
          if (res.error) { setLoginMsg(t('auth_err') + ': ' + res.error.message); return; }
          loginDone();
        });
      }
    });
  }

  on(loginClose, 'click', closeLogin);
  on(loginModal, 'click', function (e) { if (e.target === loginModal) closeLogin(); });
  on(btnLogin, 'click', function () {
    if (!currentUser) { openLogin(); return; }
    loginMenu.hidden = !loginMenu.hidden;
  });
  on(loginMenu, 'click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-login-action]') : null;
    if (!b) return;
    var act = b.getAttribute('data-login-action');
    loginMenu.hidden = true;
    if (act === 'my') {
      activeCat = MY_CAT;
      selectedTags.clear();
      activeWs = null;
      renderCats();
      renderFilterBar();
      renderGrid();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (act === 'add') {
      openAdd();
    } else if (act === 'logout') {
      logout();
    }
  });
  document.addEventListener('click', function (e) {
    if (loginMenu && !loginMenu.hidden && !(e.target.closest && e.target.closest('.theme-wrap'))) loginMenu.hidden = true;
  });
  // Supabase 会话初始化与状态监听
  function initSupabase() {
    if (!supabaseClient) return;
    supabaseClient.auth.getSession().then(function (res) {
      if (res && res.data && res.data.session && res.data.session.user) {
        supabaseUser = res.data.session.user;
        currentUser = supabaseUser.email || supabaseUser.id;
        updateLoginBtn();
        renderCats();
        renderFilterBar();
        renderGrid();
      }
    });
    supabaseClient.auth.onAuthStateChange(function (event, session) {
      if (session && session.user) {
        supabaseUser = session.user;
        currentUser = supabaseUser.email || session.user.id;
      } else {
        supabaseUser = null;
        currentUser = null;
      }
      updateLoginBtn();
      renderCats();
      renderFilterBar();
      renderGrid();
    });
  }
