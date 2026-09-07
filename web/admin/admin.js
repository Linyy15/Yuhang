/* 屿航 · 后台管理页逻辑（纯本地，双击 web/admin.html 使用） */
(function () {
  'use strict';

  // ---------- 依赖检查 ----------
  var YH = window.YH;
  var banner = document.getElementById('banner');
  function fail(msg) {
    banner.hidden = false;
    banner.className = 'banner error';
    banner.textContent = msg;
  }
  if (!YH) { fail('公共数据模块 js/sites-lib.js 加载失败（请确认文件存在）'); return; }
  if (!window.SITES) { fail('站点数据 data/sites.js 加载失败（请先运行 node scripts/build.mjs 生成）'); return; }

  // ---------- 状态 ----------
  var sites = JSON.parse(JSON.stringify(window.SITES)); // 深拷贝，编辑不影响源文件
  var issues = [];
  var editId = null; // null = 新增
  var SITE_TSV_ROWS = (window.SITES_META && typeof window.SITES_META.total === 'number')
    ? window.SITES_META.total : sites.length; // 从实际数据推导，不再硬编码
  var selected = new Set();   // 多选 id
  var lastDeleted = null;     // 撤销删除缓存 { items: [...] }
  var sortBy = 'default';     // default | name | cat
  var editCount = 0;          // 已修改/新增的站点数，用于保存摘要

  // ---------- Toast 提示 ----------
  function showToast(msg, type, actionLabel, actionFn) {
    var box = $('toasts');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');
    var text = document.createElement('span');
    text.textContent = msg;
    t.appendChild(text);
    if (actionLabel && actionFn) {
      var a = document.createElement('button');
      a.className = 'toast-act';
      a.textContent = actionLabel;
      a.addEventListener('click', function () { actionFn(); dismiss(t); });
      t.appendChild(a);
    }
    box.appendChild(t);
    setTimeout(function () { dismiss(t); }, 5000);
  }
  function dismiss(t) {
    if (!t || t.dataset.gone) return;
    t.dataset.gone = '1';
    t.classList.add('out');
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
  }
  // 公开版不含云端反馈后台或管理员身份配置。\n  var ADMIN_EMAIL = "";
  var supabaseClient = null;

  var $ = function (id) { return document.getElementById(id); };
  var tbody = $('tbody'), search = $('search'), fCat = $('filter-cat'), fTag = $('filter-tag'), fIssue = $('filter-issue');

  // ---------- 工具 ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function parseTags(str) {
    return String(str || '').split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean);
  }
  // 简易 URL 格式校验：必须有 http/https 头且能被 URL() 解析
  function validateUrl(url) {
    url = (url || '').trim();
    if (!url) return { ok: false, msg: '网址不能为空' };
    if (!/^(https?:\/\/)?[^\s/$.?#].[^\s]*$/i.test(url)) return { ok: false, msg: '网址格式不合法' };
    try {
      var u = new URL(url.indexOf('://') === -1 ? 'https://' + url : url);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return { ok: false, msg: '网址必须以 http:// 或 https:// 开头' };
      return { ok: true };
    } catch (e) {
      return { ok: false, msg: '网址格式不合法：' + e.message };
    }
  }

  // ---------- 校验 ----------
  var linkIssues = []; // 链接检测报告产生的问题（导入后与 validate 合并）
  function runValidate() {
    issues = YH.validate(sites).concat(linkIssues);
    var red = 0, yellow = 0;
    issues.forEach(function (i) { if (i.level === 'red') red++; else yellow++; });
    $('stat-red').textContent = red;
    $('stat-yellow').textContent = yellow;
    renderIssuesPanel();
  }
  function renderIssuesPanel() {
    var panel = $('issues-panel'), list = $('issues-list');
    if (!issues.length) { panel.hidden = true; list.innerHTML = ''; return; }
    panel.hidden = false;
    list.innerHTML = issues.slice(0, 200).map(function (i) {
      return '<li><span class="dot ' + i.level + '"></span>' +
        '<span class="issue-site">' + esc(i.name) + '</span>' +
        '<span class="issue-msg">' + esc(i.message) + '</span></li>';
    }).join('') + (issues.length > 200 ? '<li class="issue-msg">… 其余 ' + (issues.length - 200) + ' 条省略</li>' : '');
  }
  function siteIssues(id) {
    return issues.filter(function (i) { return i.siteId === id; });
  }
  function siteLevel(id) {
    var has = { red: false, yellow: false };
    siteIssues(id).forEach(function (i) { has[i.level] = true; });
    return has.red ? 'red' : (has.yellow ? 'yellow' : '');
  }

  // ---------- 过滤 + 渲染 ----------
  var aPage = 1;          // 后台分页
  var aPageSize = 10;
  var aSig = '';
  function currentFilter() {
    var kw = search.value.trim().toLowerCase();
    var cat = fCat.value, tag = fTag.value, issue = fIssue.value;
    return sites.filter(function (s) {
      if (kw) {
        var hit = YH.fuzzySearch(kw, s.name, 'fuzzy') !== null ||
          YH.fuzzySearch(kw, s.fullName, 'fuzzy') !== null ||
          YH.fuzzySearch(kw, (s.tags || []).join(' '), 'fuzzy') !== null ||
          YH.fuzzySearch(kw, s.category, 'fuzzy') !== null ||
          YH.fuzzySearch(kw, s.brief, 'exact') !== null ||
          YH.fuzzySearch(kw, s.detail, 'exact') !== null ||
          YH.fuzzySearch(kw, s.url, 'exact') !== null;
        if (!hit) return false;
      }
      if (cat && s.category !== cat) return false;
      if (tag && (s.tags || []).indexOf(tag) === -1) return false;
      if (issue) {
        var lv = siteLevel(s.id);
        if (issue === 'clean' && lv) return false;
        if (issue !== 'clean' && lv !== issue) return false;
      }
      return true;
    });
  }
  function renderAdminPager(total, pages) {
    var pg = $('admin-pager');
    if (!pg) return;
    if (pages <= 1) { pg.hidden = true; pg.innerHTML = ''; return; }
    pg.hidden = false;
    var html = '<button class="pg-btn" data-pg="prev"' + (aPage === 1 ? ' disabled' : '') + '>‹</button>';
    var from = Math.max(1, aPage - 2), to = Math.min(pages, aPage + 2);
    if (from > 1) html += '<span class="pg-ellipsis">…</span>';
    for (var i = from; i <= to; i++) {
      html += '<button class="pg-btn' + (i === aPage ? ' active' : '') + '" data-pg="' + i + '">' + i + '</button>';
    }
    if (to < pages) html += '<span class="pg-ellipsis">…</span>';
    html += '<button class="pg-btn" data-pg="next"' + (aPage === pages ? ' disabled' : '') + '>›</button>';
    html += '<span class="pg-info">共 ' + total + ' 条 · 第 ' + aPage + '/' + pages + ' 页</span>';
    html += '<select class="pg-size" data-pgsize="1">' +
      '<option value="10"' + (aPageSize === 10 ? ' selected' : '') + '>10/页</option>' +
      '<option value="20"' + (aPageSize === 20 ? ' selected' : '') + '>20/页</option>' +
      '<option value="50"' + (aPageSize === 50 ? ' selected' : '') + '>50/页</option>' +
    '</select>';
    pg.innerHTML = html;
  }
  $('admin-pager').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-pg]') : null;
    if (!b || b.disabled) return;
    var v = b.getAttribute('data-pg');
    var total = currentFilter().length;
    var pages = Math.max(1, Math.ceil(total / aPageSize));
    if (v === 'prev') aPage = Math.max(1, aPage - 1);
    else if (v === 'next') aPage = Math.min(pages, aPage + 1);
    else aPage = Math.max(1, Math.min(pages, parseInt(v, 10) || 1));
    renderTable();
  });
  $('admin-pager').addEventListener('change', function (e) {
    var sel = e.target.closest ? e.target.closest('[data-pgsize]') : null;
    if (!sel) return;
    aPageSize = parseInt(sel.value, 10) || 10;
    aPage = 1;
    renderTable();
  });
  function renderTable() {
    var list = currentFilter();
    var sig = search.value + '|' + fCat.value + '|' + fTag.value + '|' + fIssue.value + '|' + sortBy;
    if (sig !== aSig) { aSig = sig; aPage = 1; }
    if (sortBy === 'name') {
      list = list.slice().sort(function (a, b) { return (a.name || '').localeCompare(b.name || '', 'zh'); });
    } else if (sortBy === 'cat') {
      list = list.slice().sort(function (a, b) {
        return (a.category || '').localeCompare(b.category || '', 'zh') || (a.name || '').localeCompare(b.name || '', 'zh');
      });
    }
    var total = list.length;
    var pages = Math.max(1, Math.ceil(total / aPageSize));
    if (aPage > pages) aPage = pages;
    var slice = list.slice((aPage - 1) * aPageSize, aPage * aPageSize);
    $('count-show').textContent = total;
    $('count-total').textContent = sites.length;
    renderAdminPager(total, pages);
    tbody.innerHTML = slice.map(function (s) {
      var lv = siteLevel(s.id);
      var isSel = selected.has(s.id);
      var tags = (s.tags || []);
      var tagHtml = tags.slice(0, 4).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') +
        (tags.length > 4 ? '<span class="tag-more">+' + (tags.length - 4) + '</span>' : '');
      var hasBrief = !!(s.brief && s.brief.trim());
      var hasUrl = !!(s.url && s.url.trim());
      return '<tr class="' + (lv ? 'is-' + lv : '') + (isSel ? ' is-sel' : '') + '">' +
        '<td class="col-chk"><input type="checkbox" data-chk="' + esc(s.id) + '"' + (isSel ? ' checked' : '') + ' title="选择"></td>' +
        '<td class="col-flag">' + (lv ? '<span class="dot ' + lv + '" title="' + esc(lv === 'red' ? '红旗：严重问题' : '黄旗：提示') + '"></span>' : '') + '</td>' +
        '<td class="col-name"><span class="cell-name">' + esc(s.name) + '</span>' +
          (s.fullName && s.fullName !== s.name ? '<span class="cell-full">' + esc(s.fullName) + '</span>' : '') + '</td>' +
        '<td class="col-cat">' + esc(s.category) + '</td>' +
        '<td class="col-tags">' + (tagHtml || '<span class="cell-url missing">无标签</span>') + '</td>' +
        '<td class="col-brief"><span class="cell-brief' + (hasBrief ? '' : ' missing') + '" title="' + esc(s.brief || '') + '">' +
          esc(hasBrief ? s.brief : '（缺简介）') + '</span></td>' +
        '<td class="col-url"><span class="cell-url' + (hasUrl ? '' : ' missing') + '">' + esc(hasUrl ? s.url : '（缺网址）') + '</span></td>' +
        '<td class="col-vpn"><span class="vpn-badge ' + (s.vpn ? 'yes' : 'no') + '">' + (s.vpn ? '⚡是' : '—') + '</span></td>' +
        '<td class="col-ops"><span class="row-ops">' +
          (hasUrl ? '<button class="mini" data-open="' + esc(s.id) + '" title="在新标签页打开网站">🔗</button>' : '') +
          '<button class="mini" data-dup="' + esc(s.id) + '" title="复制此条为新条目">⧉</button>' +
          '<button class="mini" data-copy="' + esc(s.id) + '" title="复制网址">📋</button>' +
          '<button class="mini" data-edit="' + esc(s.id) + '">编辑</button>' +
          '<button class="mini danger" data-del="' + esc(s.id) + '">删除</button>' +
        '</span></td>' +
      '</tr>';
    }).join('');
    syncSelUI();
  }
  function syncSelUI() {
    $('count-sel').textContent = selected.size;
    $('batch-n').textContent = selected.size;
    $('batch-bar').hidden = selected.size === 0;
    var all = Array.prototype.slice.call(tbody.querySelectorAll('input[data-chk]'));
    var chkAll = $('chk-all');
    if (chkAll) chkAll.checked = all.length > 0 && all.every(function (c) { return c.checked; });
  }
  function refreshAll() {
    $('stat-sites').textContent = sites.length;
    runValidate();
    fillCatFilter();
    fillTagFilter();
    renderTable();
  }

  // ---------- 筛选下拉 ----------
  function fillCatFilter() {
    var cats = {};
    sites.forEach(function (s) { cats[s.category] = 1; });
    var keep = fCat.value;
    fCat.innerHTML = '<option value="">全部大类</option>' + Object.keys(cats).sort(function (a, b) { return a.localeCompare(b, 'zh'); })
      .map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join('');
    fCat.value = keep;
  }
  function fillTagFilter() {
    var counts = {};
    sites.forEach(function (s) { (s.tags || []).forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
    var keep = fTag.value;
    fTag.innerHTML = '<option value="">全部标签</option>' + Object.keys(counts).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b, 'zh');
    }).map(function (t) { return '<option value="' + esc(t) + '">' + esc(t) + '（' + counts[t] + '）</option>'; }).join('');
    fTag.value = keep;
  }

  // ---------- 编辑弹窗 ----------
  var editor = $('editor');
  function openEditor(site) {
    editId = site ? site.id : null;
    $('editor-title').textContent = site ? '编辑网站 · ' + site.id : '新增网站';
    $('f-name').value = site ? (site.name || '') : '';
    $('f-full').value = site ? (site.fullName || '') : '';
    $('f-cat').value = site ? (site.category || '') : '';
    $('f-tags').value = site ? (site.tags || []).join(',') : '';
    $('f-brief').value = site ? (site.brief || '') : '';
    $('f-detail').value = site ? (site.detail || '') : '';
    $('f-url').value = site ? (site.url || '') : '';
    $('f-vpn').checked = !!(site && site.vpn);
    setMsg('');
    var cats = {};
    sites.forEach(function (s) { cats[s.category] = 1; });
    $('cat-list').innerHTML = Object.keys(cats).map(function (c) { return '<option value="' + esc(c) + '"></option>'; }).join('');
    editor.hidden = false;
    $('f-name').focus();
  }
  function closeEditor() { editor.hidden = true; editId = null; }
  function setMsg(html, cls) {
    var m = $('f-msg');
    m.innerHTML = html || '';
    m.className = 'f-msg ' + (cls || '');
  }
  function saveEditor() {
    var name = $('f-name').value.trim();
    var cat = $('f-cat').value.trim();
    var url = $('f-url').value.trim();
    var tags = parseTags($('f-tags').value);
    if (!name) { setMsg('简称不能为空', 'err'); return; }
    if (!cat) { setMsg('大类不能为空', 'err'); return; }
    var urlCheck = validateUrl(url);
    if (!urlCheck.ok) { setMsg(urlCheck.msg, 'err'); return; }
    if (!tags.length) { setMsg('至少需要一个标签', 'err'); return; }
    var rec = {
      id: editId,
      name: name,
      fullName: $('f-full').value.trim(),
      category: cat,
      tags: tags,
      brief: $('f-brief').value.trim(),
      detail: $('f-detail').value.trim(),
      url: url,
      vpn: $('f-vpn').checked,
      internal: false,
    };
    var old = editId ? sites.find(function (s) { return s.id === editId; }) : null;
    if (old) {
      if (old.note) rec.note = old.note;
      Object.assign(old, rec);
      editCount++;
    } else {
      rec.id = nextId();
      sites.push(rec);
      editCount++;
      search.value = '';
      fCat.value = '';
      fTag.value = '';
      fIssue.value = '';
      aSig = '';
      aPage = Math.max(1, Math.ceil(sites.length / aPageSize));
    }
    sortSites();
    closeEditor();
    refreshAll();
    if (old) {
      showToast('✅ 已保存修改：' + rec.name, 'ok');
    } else {
      showToast('✅ 已添加：' + rec.name, 'ok');
      setTimeout(function () {
        var row = tbody.querySelector('[data-edit="' + rec.id + '"]');
        var tr = row && row.closest ? row.closest('tr') : null;
        if (tr) {
          tr.classList.add('flash');
          setTimeout(function () { tr.classList.remove('flash'); }, 1800);
        }
      }, 80);
    }
  }
  function nextId() {
    var max = 0;
    sites.forEach(function (s) {
      var m = /^s(\d+)$/.exec(s.id || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return 's' + String(max + 1).padStart(3, '0');
  }
  function sortSites() {
    var idx = {};
    sites.forEach(function (s, i) { idx[s.id] = i; });
    sites.sort(function (a, b) {
      return a.category === b.category
        ? (idx[a.id] - idx[b.id])
        : a.category.localeCompare(b.category, 'zh');
    });
  }

  // ---------- 事件 ----------
  function deleteSites(ids) {
    var delSet = new Set(ids);
    var removed = sites.filter(function (s) { return delSet.has(s.id); });
    if (!removed.length) return;
    sites = sites.filter(function (s) { return !delSet.has(s.id); });
    removed.forEach(function (r) { selected.delete(r.id); });
    lastDeleted = { items: removed };
    refreshAll();
    showToast('已删除 ' + removed.length + ' 项', 'ok', '撤销', function () {
      sites = sites.concat(lastDeleted.items);
      lastDeleted = null;
      refreshAll();
      showToast('已恢复删除', 'ok');
    });
  }
  tbody.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-edit],[data-del],[data-copy],[data-open],[data-dup]') : null;
    if (!b) return;
    var id = b.getAttribute('data-edit') || b.getAttribute('data-del') || b.getAttribute('data-copy')
      || b.getAttribute('data-open') || b.getAttribute('data-dup');
    var site = sites.find(function (s) { return s.id === id; });
    if (!site) return;
    if (b.hasAttribute('data-open')) {
      window.open(site.url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (b.hasAttribute('data-dup')) {
      var dup = {
        id: null,
        name: (site.name || '') + '（副本）',
        fullName: site.fullName || '',
        category: site.category || '',
        tags: (site.tags || []).slice(),
        brief: site.brief || '',
        detail: site.detail || '',
        url: site.url || '',
        vpn: !!site.vpn,
        internal: false,
      };
      openEditor(dup);
      return;
    }
    if (b.hasAttribute('data-copy')) {
      copyText(site.url);
      showToast('已复制网址：' + site.url, 'info');
      return;
    }
    if (b.hasAttribute('data-del')) {
      if (!confirm('确定删除「' + site.name + '」？\n（仅从导出数据中移除，不会改动源文件）')) return;
      deleteSites([id]);
    } else {
      openEditor(site);
    }
  });
  tbody.addEventListener('dblclick', function (e) {
    var row = e.target.closest ? e.target.closest('tr') : null;
    if (!row) return;
    var chk = row.querySelector('input[data-chk]');
    var id = chk ? chk.getAttribute('data-chk') : null;
    if (!id) return;
    var site = sites.find(function (s) { return s.id === id; });
    if (site) openEditor(site);
  });
  tbody.addEventListener('change', function (e) {
    var chk = e.target.closest ? e.target.closest('input[data-chk]') : null;
    if (!chk) return;
    var id = chk.getAttribute('data-chk');
    if (chk.checked) selected.add(id); else selected.delete(id);
    var row = chk.closest('tr');
    if (row) row.classList.toggle('is-sel', chk.checked);
    syncSelUI();
  });
  $('chk-all').addEventListener('change', function () {
    var checks = tbody.querySelectorAll('input[data-chk]');
    var on = this.checked;
    for (var i = 0; i < checks.length; i++) {
      var id = checks[i].getAttribute('data-chk');
      if (on) selected.add(id); else selected.delete(id);
      checks[i].checked = on;
      var r = checks[i].closest('tr');
      if (r) r.classList.toggle('is-sel', on);
    }
    syncSelUI();
  });
  $('batch-clear').addEventListener('click', function () {
    selected.clear();
    renderTable();
  });
  $('batch-del').addEventListener('click', function () {
    var applyAll = $('batch-applyall').checked;
    var ids = applyAll ? currentFilter().map(function (s) { return s.id; }) : Array.from(selected);
    if (!ids.length) return;
    if (!confirm('确定批量删除 ' + ids.length + ' 项' + (applyAll ? '（当前筛选结果）' : '（已选项）') + '？')) return;
    deleteSites(ids);
    selected.clear();
  });
  var batchModal = $('batch-modal');
  var batchMode = 'tags';
  function openBatchModal(mode) {
    batchMode = mode;
    var applyAll = $('batch-applyall').checked;
    var target = applyAll ? currentFilter() : Array.from(selected).map(function (id) {
      return sites.find(function (s) { return s.id === id; });
    }).filter(Boolean);
    $('batch-title').textContent = mode === 'tags'
      ? '批量修改标签（' + target.length + ' 项' + (applyAll ? '，应用当前筛选' : '，已选') + '）'
      : '批量修改大类（' + target.length + ' 项' + (applyAll ? '，应用当前筛选' : '，已选') + '）';
    $('batch-field-label').innerHTML = '<span>' + (mode === 'tags' ? '标签（逗号分隔，留空 = 不修改）' : '新大类（留空 = 不修改）') + '</span><input id="batch-field" placeholder="' + (mode === 'tags' ? '如：效率工具,在线学习' : '如：工具') + '">';
    $('batch-msg').innerHTML = '';
    batchModal.hidden = false;
    $('batch-field').focus();
  }
  $('batch-tags').addEventListener('click', function () { if (selected.size || $('batch-applyall').checked) openBatchModal('tags'); });
  $('batch-cat').addEventListener('click', function () { if (selected.size || $('batch-applyall').checked) openBatchModal('cat'); });
  $('batch-modal-close').addEventListener('click', function () { batchModal.hidden = true; });
  $('batch-cancel').addEventListener('click', function () { batchModal.hidden = true; });
  batchModal.addEventListener('click', function (e) { if (e.target === batchModal) batchModal.hidden = true; });
  $('batch-save').addEventListener('click', function () {
    var val = $('batch-field').value.trim();
    var applyAll = $('batch-applyall').checked;
    var ids = applyAll ? currentFilter().map(function (s) { return s.id; }) : Array.from(selected);
    if (!ids.length) { $('batch-msg').innerHTML = '没有可修改的条目'; return; }
    if (batchMode === 'tags') {
      var tags = val ? parseTags(val) : null;
      if (tags !== null && !tags.length) { $('batch-msg').innerHTML = '请输入至少一个标签'; return; }
      ids.forEach(function (id) {
        var s = sites.find(function (x) { return x.id === id; });
        if (s) s.tags = tags ? tags.slice() : s.tags;
      });
      showToast('已批量更新标签（' + ids.length + ' 项' + (applyAll ? '，应用当前筛选' : '') + '）', 'ok');
    } else {
      if (!val) { $('batch-msg').innerHTML = '请输入新大类'; return; }
      ids.forEach(function (id) {
        var s = sites.find(function (x) { return x.id === id; });
        if (s) s.category = val;
      });
      showToast('已批量更新大类为「' + val + '」（' + ids.length + ' 项' + (applyAll ? '，应用当前筛选' : '') + '）', 'ok');
    }
    batchModal.hidden = true;
    selected.clear();
    sortSites();
    refreshAll();
  });
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else if (window.prompt) {
      window.prompt('复制网址', text);
    }
  }
  var sortSel = $('sort-by');
  sortSel.addEventListener('change', function () {
    sortBy = sortSel.value;
    renderTable();
  });
  $('btn-add').addEventListener('click', function () { openEditor(null); });
  $('editor-close').addEventListener('click', closeEditor);
  $('editor-cancel').addEventListener('click', closeEditor);
  $('editor-save').addEventListener('click', saveEditor);
  editor.addEventListener('click', function (e) { if (e.target === editor) closeEditor(); });
  $('btn-autotag').addEventListener('click', function () {
    var tags = YH.classifyRow($('f-name').value, $('f-full').value, $('f-cat').value, $('f-tags').value);
    $('f-tags').value = tags.join(',');
    setMsg('已按分类规则生成标签', 'ok');
  });
  search.addEventListener('input', renderTable);
  fCat.addEventListener('change', renderTable);
  fTag.addEventListener('change', renderTable);
  fIssue.addEventListener('change', renderTable);
  $('btn-validate').addEventListener('click', function () {
    runValidate();
    renderTable();
    setMsg('');
    if (!issues.length) { banner.hidden = false; banner.className = 'banner'; banner.textContent = '✅ 校验通过：无红旗 / 黄旗问题'; }
  });
  // 链接健康报告导入
  $('btn-linkreport').addEventListener('click', function () { $('linkreport-file').click(); });
  $('linkreport-file').addEventListener('change', function (e) {
    var file = e.target && e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var rows = JSON.parse(reader.result);
        if (!Array.isArray(rows)) throw new Error('bad');
        linkIssues = rows.map(function (r) {
          var lv = (!r.status || r.status >= 400) ? 'red' : 'yellow';
          var msg = !r.status
            ? '链接异常：' + (r.error === 'timeout' ? '超时' : (r.error || '无法访问'))
            : (r.status >= 400 ? 'HTTP ' + r.status : (r.redirect ? '重定向 → ' + r.redirect : '响应偏慢 ' + r.ms + 'ms'));
          return { level: lv, siteId: r.id, name: r.name, message: msg };
        });
        runValidate();
        renderTable();
        showToast('已导入链接报告：' + linkIssues.length + ' 条（红=失效，黄=重定向/慢）', 'ok');
      } catch (err) {
        showToast('报告文件无效', 'err');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  });
  $('issues-close').addEventListener('click', function () { $('issues-panel').hidden = true; });

  // ---------- 批量导入 TSV / JSON ----------
  var impModal = $('import-modal');
  var impPreview = [];
  var impImportMode = 'file'; // 'file' | 'paste'
  $('btn-import').addEventListener('click', function () {
    impModal.hidden = false;
    $('imp-msg').innerHTML = '';
    $('imp-preview').hidden = true;
    $('imp-file-list').innerHTML = '';
    $('imp-paste').value = '';
    impPreview = [];
  });
  $('import-close').addEventListener('click', function () { impModal.hidden = true; });
  $('import-cancel').addEventListener('click', function () { impModal.hidden = true; });
  impModal.addEventListener('click', function (e) { if (e.target === impModal) impModal.hidden = true; });
  // 标签切换
  if (document.querySelectorAll) {
    document.querySelectorAll('.imp-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.imp-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var mode = tab.getAttribute('data-tab');
        impImportMode = mode;
        $('imp-file-panel').hidden = (mode !== 'file');
        $('imp-paste-panel').hidden = (mode !== 'paste');
        $('imp-msg').innerHTML = '';
        $('imp-preview').hidden = true;
      });
    });
  }
  $('import-file-btn').addEventListener('click', function () { $('import-file').click(); });
  $('import-file').addEventListener('change', function (e) {
    var files = e.target.files;
    if (!files.length) return;
    var names = [];
    for (var i = 0; i < files.length; i++) names.push(files[i].name);
    $('imp-file-list').innerHTML = '<span>已选：' + names.join('、') + '（' + files.length + ' 个）</span>';
    // 预览第一个文件
    previewImport(files);
  });
  $('imp-paste').addEventListener('input', function () {
    var text = $('imp-paste').value.trim();
    if (!text) { $('imp-msg').innerHTML = ''; $('imp-preview').hidden = true; impPreview = []; return; }
    parseImportText(text, $('imp-paste-skip').checked).then(function (result) {
      impPreview = result.entries;
      if (result.error) { $('imp-msg').innerHTML = result.error; $('imp-msg').className = 'f-msg err'; }
      else { $('imp-msg').innerHTML = '解析成功：' + result.entries.length + ' 条，跳过 ' + result.skipped + ' 条'; $('imp-msg').className = 'f-msg ok'; }
      renderImportPreview();
    });
  });
  function previewImport(files) {
    var reader = new FileReader();
    reader.onload = function () {
      var text = reader.result;
      parseImportText(text, $('imp-skip-dup').checked).then(function (result) {
        impPreview = result.entries;
        if (result.error) { $('imp-msg').innerHTML = result.error; $('imp-msg').className = 'f-msg err'; }
        else { $('imp-msg').innerHTML = '解析成功：' + result.entries.length + ' 条，跳过 ' + result.skipped + ' 条'; $('imp-msg').className = 'f-msg ok'; }
        renderImportPreview();
      });
    };
    reader.readAsText(files[0]);
  }
  function renderImportPreview() {
    var p = $('imp-preview'), list = $('imp-preview-list');
    if (!impPreview.length) { p.hidden = true; return; }
    p.hidden = false;
    list.innerHTML = impPreview.slice(0, 5).map(function (s) {
      return '<li><b>' + esc(s.name || s.fullName || s.id) + '</b> · ' + esc(s.category || '') + ' · ' + esc(s.url || '') + '</li>';
    }).join('');
  }
  function parseImportText(text, skipDup) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim() && !l.startsWith('网站简称'); });
    // 尝试 JSON
    try {
      var parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return resolveImportEntries(parsed, skipDup);
      }
      // 尝试 { sites: [...] }
      if (parsed && Array.isArray(parsed.sites)) {
        return resolveImportEntries(parsed.sites, skipDup);
      }
    } catch (e) {}
    // 解析 TSV
    var entries = [];
    lines.forEach(function (l) {
      var c = l.split('\t');
      entries.push({
        name: (c[0] || '').trim(),
        fullName: (c[1] || '').trim(),
        category: (c[2] || '').trim(),
        tags: parseTags(c[3] || ''),
        brief: (c[4] || '').trim(),
        detail: (c[5] || '').trim(),
        url: (c[6] || '').trim(),
        vpn: (c[7] || '').trim() === '是',
        internal: false,
      });
    });
    return resolveImportEntries(entries, skipDup);
  }
  function resolveImportEntries(entries, skipDup) {
    var added = [], skipped = 0;
    var seenUrls = {};
    sites.forEach(function (s) { seenUrls[YH.norm(s.url)] = true; });
    entries.forEach(function (e) {
      // 确保有 id（导入条目无 id，保存时生成）
      if (!e.id) e.id = null;
      var urlNorm = e.url ? YH.norm(e.url) : '';
      if (skipDup && urlNorm && seenUrls[urlNorm]) { skipped++; return; }
      added.push(e);
      if (urlNorm) seenUrls[urlNorm] = true;
    });
    return { entries: added, skipped: skipped, error: null };
  }
  $('import-confirm').addEventListener('click', function () {
    if (impImportMode === 'file') {
      var files = $('import-file').files;
      if (!files || !files.length) { $('imp-msg').innerHTML = '请先选择文件'; $('imp-msg').className = 'f-msg err'; return; }
      if (!impPreview.length) { $('imp-msg').innerHTML = '没有可导入的条目'; $('imp-msg').className = 'f-msg err'; return; }
      var toAdd = impPreview.slice();
      doImport(toAdd);
    } else {
      var text = $('imp-paste').value.trim();
      if (!text) { $('imp-msg').innerHTML = '请先粘贴文本'; $('imp-msg').className = 'f-msg err'; return; }
      parseImportText(text, $('imp-paste-skip').checked).then(function (result) {
        if (result.error) { $('imp-msg').innerHTML = result.error; $('imp-msg').className = 'f-msg err'; return; }
        impPreview = result.entries;
        doImport(impPreview);
      });
    }
  });
  function doImport(entries) {
    if (!entries.length) { showToast('没有可导入的条目', 'warn'); impModal.hidden = true; return; }
    var maxId = 0;
    sites.forEach(function (s) {
      var m = /^s(\d+)$/.exec(s.id || '');
      if (m) maxId = Math.max(maxId, parseInt(m[1], 10));
    });
    entries.forEach(function (e, i) {
      e.id = 's' + String(maxId + i + 1).padStart(3, '0');
      sites.push(e);
    });
    editCount += entries.length;
    sortSites();
    impModal.hidden = true;
    refreshAll();
    showToast('✅ 已导入 ' + entries.length + ' 个站点（跳过 ' + (impImportMode === 'file'
      ? ($('imp-file-list').textContent.match(/\（(\d+) 个）/) || ['','0'])[1]
      : 0) + ' 条）', 'ok');
  }

  // ---------- 反馈记录（站长可见） ----------
  function fbAuthErr(err) {
    var m = (err && err.message) || '未知错误';
    if (/invalid login credentials/i.test(m)) return '邮箱或密码错误';
    if (/rate limit/i.test(m)) return '尝试过于频繁，请稍后再试';
    if (/email not confirmed/i.test(m)) return '邮箱未确认';
    if (/network/i.test(m)) return '网络错误，请检查网络';
    return m;
  }
  function maskEmail(e) {
    if (!e) return '（匿名）';
    var at = e.indexOf('@');
    if (at <= 1) return e;
    return e.charAt(0) + '***' + e.slice(at);
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function setFbMsg(msg, cls) {
    var m = $('fb-login-msg');
    m.textContent = msg || '';
    m.className = 'f-msg ' + (cls || '');
  }
  function updateFbCount(n) {
    var b = $('btn-feedback');
    b.textContent = '📣 反馈记录' + (n ? ' (' + n + ')' : '');
  }
  function loadFeedback() {
    var list = $('fb-list');
    list.innerHTML = '<li class="fb-empty">加载中…</li>';
    if (!supabaseClient) { list.innerHTML = '<li class="fb-empty">⚠ 公开版不提供云端反馈后台</li>'; return; }
    supabaseClient.rpc('get_all_feedback').then(function (res) {
      if (res.error) { list.innerHTML = '<li class="fb-empty">加载失败：' + esc(fbAuthErr(res.error)) + '</li>'; return; }
      var rows = res.data || [];
      updateFbCount(rows.length);
      if (!rows.length) { list.innerHTML = '<li class="fb-empty">暂无反馈记录</li>'; return; }
      list.innerHTML = rows.map(function (r) {
        var s = sites.find(function (x) { return x.id === r.site_id; });
        var nm = s
          ? (s.name + (s.fullName && s.fullName !== s.name ? ' · ' + s.fullName : ''))
          : (r.site_id || '未知站点');
        return '<li class="fb-item">' +
          '<span class="fb-site">' + esc(nm) + '</span>' +
          '<span class="fb-text">' + esc(r.message) + '</span>' +
          '<span class="fb-meta">' + esc(maskEmail(r.user_email)) + ' · ' + esc(fmtDate(r.created_at)) + '</span>' +
          '<button class="mini danger" data-fb-del="' + esc(r.id) + '">删除</button>' +
        '</li>';
      }).join('');
    });
  }
  function openFbPanel() {
    $('fb-panel').hidden = false;
    $('fb-list').innerHTML = '';
    $('fb-logout').hidden = true;
    setFbMsg('');
    if (!supabaseClient) { $('fb-login').hidden = false; setFbMsg('⚠ 公开版不提供云端反馈后台', 'err'); return; }
    supabaseClient.auth.getSession().then(function (res) {
      var u = res && res.data && res.data.session ? res.data.session.user : null;
      if (u && u.email === ADMIN_EMAIL) {
        $('fb-login').hidden = true;
        $('fb-logout').hidden = false;
        loadFeedback();
      } else if (u) {
        $('fb-login').hidden = false;
        setFbMsg('当前账号「' + u.email + '」不是站长，请用 ' + ADMIN_EMAIL + ' 登录', 'err');
      } else {
        $('fb-login').hidden = false;
        setFbMsg('请登录后查看反馈记录');
      }
    });
  }
  $('btn-feedback').addEventListener('click', function () {
    if ($('fb-panel').hidden) openFbPanel(); else $('fb-panel').hidden = true;
  });
  $('fb-close').addEventListener('click', function () { $('fb-panel').hidden = true; });
  $('fb-refresh').addEventListener('click', function () {
    if (!supabaseClient) { setFbMsg('⚠ 公开版不提供云端反馈后台', 'err'); return; }
    supabaseClient.auth.getSession().then(function (res) {
      var u = res && res.data && res.data.session ? res.data.session.user : null;
      if (u && u.email === ADMIN_EMAIL) loadFeedback();
      else openFbPanel();
    });
  });
  $('fb-login-btn').addEventListener('click', function () {
    var em = $('fb-email').value.trim(), pw = $('fb-pass').value;
    if (!em || !pw) { setFbMsg('请输入邮箱和密码', 'err'); return; }
    if (!supabaseClient) { setFbMsg('⚠ 公开版不提供云端反馈后台', 'err'); return; }
    setFbMsg('登录中…');
    supabaseClient.auth.signInWithPassword({ email: em, password: pw }).then(function (res) {
      if (res.error) { setFbMsg('登录失败：' + fbAuthErr(res.error), 'err'); return; }
      var u = res.data.user;
      if (u && u.email === ADMIN_EMAIL) {
        $('fb-login').hidden = true;
        $('fb-logout').hidden = false;
        setFbMsg('');
        loadFeedback();
      } else {
        setFbMsg('该账号不是站长（' + ADMIN_EMAIL + '），无法查看反馈', 'err');
      }
    });
  });
  $('fb-logout').addEventListener('click', function () {
    if (!supabaseClient) return;
    supabaseClient.auth.signOut().then(function () {
      $('fb-login').hidden = false;
      $('fb-logout').hidden = true;
      $('fb-list').innerHTML = '';
      updateFbCount(0);
      setFbMsg('已退出登录');
    });
  });
  $('fb-list').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-fb-del]') : null;
    if (!b) return;
    var id = b.getAttribute('data-fb-del');
    if (!confirm('确定删除这条反馈？')) return;
    if (!supabaseClient) return;
    supabaseClient.rpc('delete_feedback', { fid: id }).then(function (res) {
      if (res.error) { alert('删除失败：' + fbAuthErr(res.error)); return; }
      loadFeedback();
    });
  });

  // ---------- 导出 ----------
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }
  $('btn-export-js').addEventListener('click', function () {
    var out = YH.renumberSites(sites);
    var meta = YH.metaFromSites(out);
    var text = YH.serializeSitesJs(meta, out);
    if (window.showSaveFilePicker) {
      window.showSaveFilePicker({
        suggestedName: 'sites.js',
        types: [{ description: 'JavaScript', accept: { 'application/javascript': ['.js'] } }],
      }).then(function (handle) {
        return handle.createWritable().then(function (w) {
          return w.write(text).then(function () { return w.close(); });
        });
      }).then(function () {
        var summary = '\u2705 已写入 sites.js (' + out.length + ' 个站点)';
        if (editCount > 0) summary += '，包含 ' + editCount + ' 项变更';
        summary += '。刷新主站即可看到修改';
        showToast(summary, 'ok');
        editCount = 0;
      }).catch(function () {
        download('sites.js', text, 'application/javascript');
        showToast('已下载 sites.js（' + out.length + ' 个站点）。请替换 web/data/sites.js 后刷新主站（若仍显示旧数据，请 Ctrl+F5）', 'ok');
        editCount = 0;
      });
    } else {
      download('sites.js', text, 'application/javascript');
      showToast('已下载 sites.js。当前为 file:// 打开，无法自动写文件：请用本地服务打开后再点此按钮即可直接写入', 'warn');
      editCount = 0;
    }
  });
  (function () {
    var hint = $('save-hint');
    if (!hint) return;
    var canWrite = typeof window.showSaveFilePicker === 'function';
    var isFile = !!(window.location && window.location.protocol === 'file:');
    if (canWrite) {
      hint.className = 'save-hint ok';
      hint.textContent = '💾 本环境支持直接写入文件：点上方「保存到 sites.js」后，在对话框选择 web/data/ 目录保存即可，主站刷新即生效。';
    } else if (isFile) {
      hint.className = 'save-hint warn';
      hint.textContent = '⚠ 当前以 file:// 打开，浏览器禁止网页直接写文件。请用本地服务打开再保存：在项目根目录运行  npx serve web  或  python -m http.server 8080 --directory web  ，然后访问 http://localhost:8080/admin.html 。或下载 sites.js 后手动替换 web/data/sites.js。';
    } else {
      hint.className = 'save-hint warn';
      hint.textContent = 'ℹ 当前环境不支持自动写文件，保存后会下载 sites.js，请手动替换 web/data/sites.js。';
    }
  })();
  $('btn-export-tsv').addEventListener('click', function () {
    var out = YH.renumberSites(sites);
    download('sites.tsv', YH.serializeTsv(out), 'text/tab-separated-values');
    showToast('已导出 sites.tsv（' + out.length + ' 个站点），可在 Excel 编辑或运行 build.mjs 重新生成', 'ok');
    editCount = 0;
  });
  function showBanner(msg) {
    banner.hidden = false;
    banner.className = 'banner';
    banner.textContent = msg;
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(function () { banner.hidden = true; }, 6000);
  }

  // ---------- 键盘快捷键 ----------
  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'Escape') {
      if (!editor.hidden) closeEditor();
      else if (!batchModal.hidden) batchModal.hidden = true;
      else if (!impModal.hidden) impModal.hidden = true;
    }
    if (e.key === '/' && !e.ctrlKey) { e.preventDefault(); search.focus(); }
    if (e.key === 's' && e.ctrlKey) { e.preventDefault(); $('btn-export-js').click(); }
    if (e.key === 'f' && e.ctrlKey) { /* Ctrl+F 留给浏览器原生查找 */ }
  });

  // ---------- 初始化 ----------
  $('stat-tsv').textContent = SITE_TSV_ROWS;
  sortSites();
  refreshAll();
})();
