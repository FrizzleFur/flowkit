/* fs-progress 阅读进度 — 章级 visited 打点 + 侧栏/path 完成标记 + 可重置
 * 存储: localStorage fs-progress-v1 { chapterId: firstVisitedTs }
 * 语义: 打开即记（svelte tutorial 同款 visited）; 不做锁章节（bp 反模式 1）; 可重置（反模式 9）
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };
  var KEY = 'fs-progress-v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  function chapterId() {
    var m = location.hash.match(/(?:principles|mechanisms)\/(ch\d+[a-z-]*?)(?:\.md)?(?:#|$|\/)/i);
    return m ? m[1] : null;
  }
  function decorate(d) {
    Array.prototype.forEach.call(document.querySelectorAll('.sidebar a'), function (a) {
      var m = (a.getAttribute('href') || '').match(/(?:principles|mechanisms)\/(ch\d+[a-z-]*?)(?:\.md)?(?:#|$)/i);
      if (!m) return;
      if (d[m[1]]) a.setAttribute('data-done', '1'); else a.removeAttribute('data-done');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.fs-pv-card'), function (card) {
      var link = card.querySelector('a[href*="/ch"]');
      var m = (link ? link.getAttribute('href') : '').match(/(?:principles|mechanisms)\/(ch\d+[a-z-]*?)(?:\.md)?(?:#|$)/i);
      if (m && d[m[1]]) card.setAttribute('data-done', '1'); else card.removeAttribute('data-done');
    });
  }
  function mark() {
    var id = chapterId();
    var d = load();
    if (id && !d[id]) { d[id] = Date.now(); save(d); }
    decorate(d);
  }
  function onRoute() { setTimeout(mark, 500); }
  window.addEventListener('hashchange', onRoute);
  if (document.readyState === 'complete') onRoute(); else window.addEventListener('load', onRoute);

  // path 页底部注入重置钮（进度可重置）
  FlowSite.fns.push(function () {
    if (!/path\.md/.test(location.hash)) return;
    if (document.querySelector('.fs-progress-reset')) return;
    var host = document.querySelector('.markdown-section');
    if (!host) return;
    var bar = document.createElement('div');
    bar.className = 'fs-progress-reset';
    var btn = document.createElement('button');
    btn.className = 'fs-btn'; btn.textContent = '重置阅读进度';
    btn.onclick = function () {
      localStorage.removeItem(KEY); decorate(load());
      btn.textContent = '已重置';
      setTimeout(function () { btn.textContent = '重置阅读进度'; }, 1500);
    };
    bar.appendChild(btn); host.appendChild(bar);
  });
})();
