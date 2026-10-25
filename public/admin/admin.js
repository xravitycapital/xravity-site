(function () {
  'use strict';
  var byId = function (id) { return document.getElementById(id); };
  var prompt = byId('login-prompt'), workspace = byId('adminWorkspace'), editorShell = byId('editorShell');
  var login = byId('loginBtn'), retry = byId('retryBtn'), editorBtn = byId('editorBtn');
  var overviewBtn = byId('overviewBtn'), logout = byId('logoutBtn');
  var identityUrl = document.body.dataset.identityUrl;
  var hasAccountToken = /(invite_token|recovery_token|confirmation_token)=/.test(location.hash);
  var authenticated = false, identityBound = false, cmsStarted = false, cmsLoading = false, cmsInitialized = false;
  var identityTimer, sessionCheck = 0;
  function status(id, message, tone) { var el = byId(id); el.textContent = message; el.dataset.tone = tone || ''; }
  function failure(message) {
    authenticated = false; prompt.hidden = false; workspace.hidden = true; editorShell.hidden = true;
    overviewBtn.hidden = true; logout.hidden = true; login.disabled = false; retry.hidden = false;
    status('status-text', message, 'error');
  }
  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      var timer = setTimeout(function () { script.remove(); reject(new Error('script timeout')); }, 30000);
      script.src = url; script.async = true;
      script.onload = function () { clearTimeout(timer); resolve(); };
      script.onerror = function () { clearTimeout(timer); script.remove(); reject(new Error('script unavailable')); };
      document.head.appendChild(script);
    });
  }
  async function checkSecurity() {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 10000);
    try {
      var response = await fetch(identityUrl + '/settings', { cache:'no-store', signal:controller.signal });
      if (!response.ok) throw new Error('settings unavailable');
      var settings = await response.json();
      status('security-status', settings.disable_signup === true ? '已核实：仅邀请注册，已有账号不受影响' : '注意：当前允许公开注册，请在注册设置中改为仅邀请', settings.disable_signup === true ? 'success' : 'error');
    } catch (_) { status('security-status', '暂时无法核实注册策略，请到注册设置中检查', 'error'); }
    finally { clearTimeout(timer); }
  }
  async function acceptSession(user) {
    var attempt = ++sessionCheck;
    clearTimeout(identityTimer);
    if (!user) {
      authenticated = false; prompt.hidden = false; workspace.hidden = true; editorShell.hidden = true;
      login.disabled = false; retry.hidden = true; overviewBtn.hidden = true; logout.hidden = true;
      status('status-text', '使用已受邀的账号登录即可开始创作');
      return;
    }
    try {
      await window.netlifyIdentity.refresh();
      if (attempt !== sessionCheck) return;
      authenticated = true; prompt.hidden = true; workspace.hidden = false; editorShell.hidden = true;
      overviewBtn.hidden = false; logout.hidden = false; retry.hidden = true;
      window.netlifyIdentity.close();
      checkSecurity();
    } catch (_) { if (attempt === sessionCheck) failure('会话已失效，请重新登录。未向公开页面开放编辑权限。'); }
  }
  async function initializeIdentity() {
    login.disabled = true; retry.hidden = true; status('status-text', '正在连接登录服务…');
    identityTimer = setTimeout(function () { failure('登录服务响应较慢，可以重新连接；页面不会一直停留在黑屏。'); }, 15000);
    try {
      if (!window.netlifyIdentity) {
        try { await loadScript('https://cdn.jsdelivr.net/npm/netlify-identity-widget@2.0.3/build/netlify-identity-widget.js'); }
        catch (_) { await loadScript('https://unpkg.com/netlify-identity-widget@2.0.3/build/netlify-identity-widget.js'); }
      }
      var widget = window.netlifyIdentity;
      if (!widget) throw new Error('identity missing');
      if (identityBound) { await acceptSession(widget.currentUser()); return; }
      identityBound = true;
      var initReceived = false;
      function ready(user) {
        clearTimeout(identityTimer);
        if (hasAccountToken) {
          login.disabled = false; status('status-text', '请在登录窗口中完成账号确认或密码设置'); widget.open(); return;
        }
        acceptSession(user);
      }
      widget.on('init', function (user) { initReceived = true; ready(user); });
      widget.on('login', acceptSession);
      widget.on('logout', function () { sessionCheck++; authenticated = false; location.reload(); });
      widget.on('error', function () { clearTimeout(identityTimer); failure('登录暂未成功，请检查账号或重新连接。'); });
      widget.init({ APIUrl:identityUrl, locale:'zhCN', logo:false });
      // The CDN script can auto-initialize before onload. Do not wait for an
      // already-fired init event; setLocale also works on an existing widget.
      widget.setLocale('zhCN');
      if (!initReceived) ready(widget.currentUser());
    } catch (_) { clearTimeout(identityTimer); failure('登录组件未能加载，请检查网络后重新连接。'); }
  }
  async function startCMS() {
    if (!authenticated || cmsLoading) return;
    if (cmsStarted) { workspace.hidden = true; editorShell.hidden = false; return; }
    cmsLoading = true; editorBtn.disabled = true; status('editor-status', '正在加载编辑器，首次打开可能需要一些时间…');
    try {
      window.CMS_MANUAL_INIT = true;
      if (!window.CMS) {
        try { await loadScript('https://unpkg.com/decap-cms@3.17.1/dist/decap-cms.js'); }
        catch (_) { await loadScript('https://cdn.jsdelivr.net/npm/decap-cms@3.17.1/dist/decap-cms.js'); }
      }
      if (!window.CMS || !authenticated) throw new Error('editor unavailable');
      await loadScript('/admin/preview.js');
      // Keep the existing Git Gateway backend and its server-side write authorization.
      if (!cmsInitialized) { await window.CMS.init(); cmsInitialized = true; }
      await new Promise(function (resolve, reject) {
        var root = byId('nc-root');
        var ready = function () { return !!root.querySelector('button, a, input, [role="navigation"]'); };
        if (ready()) { resolve(); return; }
        var observer = new MutationObserver(function () { if (ready()) { clearTimeout(timer); observer.disconnect(); resolve(); } });
        var timer = setTimeout(function () { observer.disconnect(); reject(new Error('editor render timeout')); }, 20000);
        observer.observe(root, { childList:true, subtree:true });
      });
      if (!authenticated) return;
      cmsStarted = true; workspace.hidden = true; editorShell.hidden = false;
    } catch (_) { status('editor-status', '编辑器暂未就绪。请再次点击进入，或检查网络与构建状态；维护入口仍可使用。', 'error'); }
    finally { cmsLoading = false; editorBtn.disabled = false; }
  }
  login.addEventListener('click', function () { if (window.netlifyIdentity) window.netlifyIdentity.open('login'); });
  retry.addEventListener('click', initializeIdentity);
  editorBtn.addEventListener('click', startCMS);
  overviewBtn.addEventListener('click', function () { if (authenticated) { workspace.hidden = false; editorShell.hidden = true; } });
  logout.addEventListener('click', function () { if (window.netlifyIdentity) window.netlifyIdentity.logout(); });
  initializeIdentity();
})();
