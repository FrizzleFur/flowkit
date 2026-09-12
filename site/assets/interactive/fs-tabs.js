/* fs-tabs 章内分区容器 — 把线性长流切成「读 / 玩 / 看 / 深挖」标签区（learncc 四标签式）
 * 用法: 章 md 里插分隔标记 <div class="fs-tabsep" data-label="标签名"></div>,
 *       标记之后的兄弟内容归入该标签 pane, 直到下一个标记; 结束用 <div class="fs-tabsep" data-end="1"></div>
 *       （终点标记保留在 DOM 作边界, 仅隐藏）。首个标记之前的公共区（页头/金句/持久演示）不动。
 * 背景: docsify-tabs 1.6.3 与 docsify@5 不兼容（HTML 注释标记被渲染管线吞掉）——回退 T1 备选自写方案;
 *       pane 用 display:none 隐藏, pane 内 replay 组件走 pause-on-exit 自动暂停（与 P0-1 联动）。
 * 生命周期: 纯 DOM 重排无 timer, 无需 _fsClear; data-fstab-ready 防重入。
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  function build(host) {
    var seps = Array.prototype.filter.call(host.children, function (e) { return e.classList.contains('fs-tabsep'); });
    if (!seps.length) return;
    var bar = document.createElement('div'); bar.className = 'fs-tabbar';
    var panes = [];
    var endSep = null;
    seps.forEach(function (sep) {
      if (sep.hasAttribute('data-end')) { endSep = sep; sep.style.display = 'none'; return; }
      var pane = document.createElement('div'); pane.className = 'fs-tabpane';
      var btn = document.createElement('button'); btn.type = 'button';
      btn.className = 'fs-tabbtn'; btn.textContent = sep.getAttribute('data-label') || '标签';
      (function (i) { btn.onclick = function () { select(i); }; })(bar.children.length);
      bar.appendChild(btn); panes.push(pane);
      sep.parentNode.replaceChild(pane, sep);
    });
    if (!panes.length) return;
    // 把每个 pane 标记之后的兄弟节点搬进 pane（边界 = 下一 pane / 终点标记 / 文档尾）
    panes.forEach(function (pane, i) {
      var boundary = i < panes.length - 1 ? panes[i + 1] : endSep;
      var el = pane.nextSibling;
      while (el && el !== boundary) {
        var nx = el.nextSibling;
        pane.appendChild(el);
        el = nx;
      }
    });
    host.insertBefore(bar, panes[0]);
    function select(i) {
      panes.forEach(function (p, j) { p.style.display = j === i ? '' : 'none'; });
      Array.prototype.forEach.call(bar.children, function (b, j) { b.classList.toggle('fs-tab-on', j === i); });
    }
    select(0);
  }

  FlowSite.fns.push(function initAll() {
    var nodes = document.querySelectorAll('.markdown-section:not([data-fstab-ready])');
    Array.prototype.forEach.call(nodes, function (host) { host.setAttribute('data-fstab-ready', '1'); build(host); });
  });
})();
