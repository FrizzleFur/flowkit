/* fs-motion 入场动效体系 — learncc whileInView once 的 zinc 化适配（语义总账层级②）
 * 范围（NN/g 克制, 只做主块级件）: callout / 交互组件容器 / 代码卡 / prevnext 双卡——正文段落、表格、path 卡（pathview 自带入场）不参与
 * 规则: IO once → .fs-in; 淡入 + 8px 上移 .35s ease-out（animation 实现避免与 hover transition 打架）; 同批入视口按序 60ms 错峰
 * 降级: prefers-reduced-motion → 不武装, 元素直出; 无 JS → 无 fs-m 类, 元素照常显示（渐进增强）
 * 生命周期: 页面服务类, hashchange 重武装; 无 timer
 */
(function () {
  window.FlowSite = window.FlowSite || { fns: [] };
  var SELECTOR = '.fs-callout, .fs-replay, .fs-autodecide, .fs-johari, .fs-funnel, .fs-budget, .fs-switch, .fs-constquiz, .fs-feedsplit, .fs-codecard, .fs-prevnext';

  function arm() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.body.classList.add('fs-motion-armed');
    var els = [].slice.call(document.querySelectorAll(SELECTOR + ':not(.fs-m)'));
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('fs-m', 'fs-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var e = en.target;
        io.unobserve(e);
        e.style.animationDelay = (batch++ * 60) + 'ms';
        e.classList.add('fs-in');
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.05 });
    els.forEach(function (e) { e.classList.add('fs-m'); io.observe(e); });
  }

  FlowSite.fns.push(function initAll() { arm(); });
  window.addEventListener('hashchange', function () { setTimeout(arm, 300); });
})();
