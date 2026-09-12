/* fs-pathview — Learning Path 学习路径时间线（learncc /timeline 模式的零依赖复刻）
 *
 * 数据: assets/scripts/path-data.json（11 章: 编号/文件/标题/一句话/域/锚点数/金句）
 * 用法: <div class="fs-pathview"></div>
 * 结构: 垂直编号轨道（01-11 圆点 + 连接线）× 章卡片（域徽章 / 标题 / 副题 /
 *       锚点数进度条（宽度 = 该章锚点数 / 全站最大锚点数）/ 金句 / 阅读链接）+ 顶部域色图例
 * 生命周期: root._fsClear 解绑 IntersectionObserver（防泄漏）;
 *           入场动画走 IO + transition, reduce-motion 用户直接显示（无过渡）
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };

  /* 九域配色表（R3 机制地图域 A-I; Tailwind 500 系, 与 zinc 深色主题同族） */
  var DOMAINS = {
    A: { name: '编排与治理', color: '#3b82f6' },
    B: { name: '目标与输入质量', color: '#eab308' },
    C: { name: '思考与规划', color: '#8b5cf6' },
    D: { name: '评审与决策', color: '#ec4899' },
    E: { name: '执行与并发', color: '#22c55e' },
    F: { name: '上下文工程', color: '#06b6d4' },
    G: { name: '验证与迭代', color: '#ef4444' },
    H: { name: '跨会话记忆', color: '#14b8a6' },
    I: { name: '质量自举', color: '#f97316' }
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function build(root, data) {
    root.textContent = '';
    var chapters = data.chapters || [];
    var maxA = 1;
    chapters.forEach(function (c) { maxA = Math.max(maxA, c.anchors || 0); });

    /* 顶部域色图例（九域固定 A-I 顺序） */
    var legend = el('div', 'fs-pv-legend');
    Object.keys(DOMAINS).forEach(function (k) {
      var item = el('span', 'fs-pv-legend-item');
      var dot = el('i', 'fs-pv-legend-dot');
      dot.style.background = DOMAINS[k].color;
      item.appendChild(dot);
      item.appendChild(document.createTextNode(k + ' · ' + DOMAINS[k].name));
      legend.appendChild(item);
    });
    root.appendChild(legend);

    /* 垂直轨道 × 章卡片 */
    var track = el('div', 'fs-pv-track');
    chapters.forEach(function (c, i) {
      var dom = DOMAINS[c.domain] || { name: c.domain || '', color: '#71717a' };

      var row = el('div', 'fs-pv-row');
      row.style.transitionDelay = Math.min(i, 4) * 80 + 'ms'; // 同屏多卡依次淡入（封顶防滚读延迟）

      /* 左列: 编号圆点 + 连接线 */
      var node = el('div', 'fs-pv-node');
      var dot = el('span', 'fs-pv-dot', pad(c.num));
      dot.style.borderColor = dom.color;
      node.appendChild(dot);
      if (i < chapters.length - 1) node.appendChild(el('span', 'fs-pv-line'));
      row.appendChild(node);

      /* 章卡片 */
      var card = el('div', 'fs-pv-card');
      card.style.setProperty('--fs-pv-dom', dom.color);

      var badge = el('span', 'fs-pv-badge', 's' + pad(c.num) + ' · ' + dom.name);
      badge.style.borderColor = dom.color;
      badge.style.color = dom.color;
      card.appendChild(badge);

      card.appendChild(el('h3', 'fs-pv-title', c.title));
      card.appendChild(el('p', 'fs-pv-sub', c.sub));

      /* 锚点数进度条: 宽度 = 该章锚点数 / 最大锚点数 */
      var meter = el('div', 'fs-pv-meter');
      var meterHead = el('div', 'fs-pv-meter-head');
      meterHead.appendChild(el('span', 'fs-pv-meter-label', '源码锚点'));
      meterHead.appendChild(el('span', 'fs-pv-meter-num', String(c.anchors || 0)));
      meter.appendChild(meterHead);
      var bar = el('div', 'fs-pv-bar');
      var fill = el('span', 'fs-pv-fill');
      fill.style.width = Math.round((c.anchors || 0) / maxA * 100) + '%';
      bar.appendChild(fill);
      meter.appendChild(bar);
      card.appendChild(meter);

      if (c.quote) card.appendChild(el('blockquote', 'fs-pv-quote', c.quote));

      var link = el('a', 'fs-pv-link', '阅读 →');
      link.href = c.file;
      card.appendChild(link);

      row.appendChild(card);
      track.appendChild(row);
    });
    root.appendChild(track);

    /* 入场动画: 卡片进入视口依次淡入; reduce-motion / 无 IO 时直接显示 */
    var rows = track.querySelectorAll('.fs-pv-row');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Array.prototype.forEach.call(rows, function (r) { r.classList.add('fs-pv-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('fs-pv-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    Array.prototype.forEach.call(rows, function (r) { io.observe(r); });
    root._fsClear = function () { io.disconnect(); };
  }

  function initAll() {
    var nodes = document.querySelectorAll('.fs-pathview:not([data-ready])');
    Array.prototype.forEach.call(nodes, function (root) {
      root.setAttribute('data-ready', '1');
      fetch(root.getAttribute('data-src') || 'assets/scripts/path-data.json').then(function (r) { return r.json(); })
        .then(function (data) {
          // 清理旧引擎（若 data 重挂载）
          if (root._fsClear) root._fsClear();
          build(root, data);
        })
        .catch(function (err) {
          root.textContent = '';
          var d = el('div', 'fs-replay-err');
          d.appendChild(document.createTextNode('路径数据加载失败: ' + err.message + '（需通过 HTTP 服务预览，file:// 不支持 fetch）'));
          root.appendChild(d);
        });
    });
  }

  FlowSite.fns.push(initAll);
})();
