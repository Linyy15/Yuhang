(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const form = $('#save-form');
  const DEFAULT_TARGET = form.dataset.target || 'http://localhost:8000/index.html';
  const titleInput = $('#title');
  const urlInput = $('#url');
  const targetInput = $('#target');
  const status = $('#status');
  const saveButton = $('#save');

  function showStatus(message, type = '') {
    status.textContent = message;
    status.className = type;
  }

  function record() {
    return {
      title: titleInput.value.trim(),
      url: urlInput.value.trim()
    };
  }

  function targetUrl() {
    const target = targetInput.value.trim();
    if (!target) throw new Error('请填写屿航 Web URL。');
    return new URL(target);
  }

  function yuhangLink() {
    const { title, url } = record();
    if (!title || !url) throw new Error('当前页面的标题或网址不可用。');
    const target = targetUrl();
    // 屿航 Web 可按需读取这两个参数；不向页面写入或覆盖任何数据。
    target.searchParams.set('title', title);
    target.searchParams.set('url', url);
    return target.toString();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('浏览器未允许写入剪贴板。');
  }

  async function load() {
    try {
      const stored = await chrome.storage.sync.get({ yuhangTarget: DEFAULT_TARGET });
      targetInput.value = stored.yuhangTarget;
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      titleInput.value = tab && tab.title ? tab.title : '';
      urlInput.value = tab && tab.url ? tab.url : '';
      if (!urlInput.value) showStatus('无法获取此页面的网址。', 'error');
    } catch (error) {
      showStatus(`初始化失败：${error.message}`, 'error');
    }
  }

  targetInput.addEventListener('change', async () => {
    try {
      const normalized = targetUrl().toString();
      targetInput.value = normalized;
      await chrome.storage.sync.set({ yuhangTarget: normalized });
      showStatus('屿航 Web URL 已保存。', 'success');
    } catch (error) {
      showStatus(`URL 无效：${error.message}`, 'error');
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      saveButton.disabled = true;
      const link = yuhangLink();
      await chrome.storage.sync.set({ yuhangTarget: targetUrl().toString() });
      await chrome.tabs.create({ url: link });
      showStatus('已打开屿航保存链接。', 'success');
    } catch (error) {
      showStatus(`无法保存：${error.message}`, 'error');
    } finally {
      saveButton.disabled = false;
    }
  });

  $('#copy').addEventListener('click', async () => {
    try {
      await copyText(JSON.stringify(record(), null, 2));
      showStatus('已复制当前页面 JSON。', 'success');
    } catch (error) {
      showStatus(`复制失败：${error.message}`, 'error');
    }
  });

  $('#open').addEventListener('click', async () => {
    try {
      const link = yuhangLink();
      await chrome.tabs.create({ url: link });
      showStatus('已打开屿航链接。', 'success');
    } catch (error) {
      showStatus(`无法打开：${error.message}`, 'error');
    }
  });

  load();
})();
