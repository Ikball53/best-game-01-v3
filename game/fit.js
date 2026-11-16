// fit.js — scales the fixed 1280x720 stage to fit any viewport (desktop or phone landscape).
// Classic script, no dependencies. Scale = min(vw/1280, vh/720), centered via flexbox on body.
(function () {
  var W = 1280, H = 720;
  function fit() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var s = Math.min(vw / W, vh / H);
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fit);
  } else {
    fit();
  }
  fit();
})();
