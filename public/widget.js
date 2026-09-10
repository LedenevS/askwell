/* Askwell embeddable widget — https://askwell.app
 * <script src="https://YOUR-APP/widget.js" data-askwell="PUBLIC_KEY" async></script>
 */
(function () {
  if (window.__askwellLoaded) return;
  window.__askwellLoaded = true;

  var script = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    for (var i = s.length - 1; i >= 0; i--) if (s[i].getAttribute("data-askwell")) return s[i];
    return null;
  })();
  if (!script) return;

  var key = script.getAttribute("data-askwell");
  if (!key) return;
  var base = new URL(script.src).origin;
  var position = script.getAttribute("data-position") === "left" ? "left" : "right";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(function () {
    fetch(base + "/api/public/bots/" + encodeURIComponent(key))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) { if (cfg) mount(cfg); })
      .catch(function () {});
  });

  function mount(cfg) {
    var color = cfg.primaryColor || "#0f766e";
    var open = false;

    var style = document.createElement("style");
    style.textContent =
      ".aw-launcher{position:fixed;bottom:20px;" + position + ":20px;z-index:2147483000;display:flex;align-items:center;gap:8px;padding:12px 18px;border:0;border-radius:999px;background:" + color + ";color:#fff;font:600 14px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;box-shadow:0 10px 30px -10px rgba(0,0,0,.4),0 2px 8px rgba(0,0,0,.12);cursor:pointer;transition:transform .15s ease}" +
      ".aw-launcher:hover{transform:translateY(-1px)}" +
      ".aw-launcher svg{width:18px;height:18px}" +
      ".aw-frame{position:fixed;bottom:84px;" + position + ":20px;z-index:2147483001;width:380px;height:min(600px,calc(100vh - 110px));border:0;border-radius:16px;box-shadow:0 20px 60px -20px rgba(0,0,0,.45),0 4px 16px rgba(0,0,0,.12);background:#fff;opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;transition:opacity .18s ease,transform .18s ease}" +
      ".aw-frame.aw-open{opacity:1;transform:none;pointer-events:auto}" +
      "@media (max-width:480px){.aw-frame{left:0;right:0;bottom:0;width:100%;height:100%;border-radius:0}.aw-launcher span{display:none}.aw-launcher{padding:14px}}";
    document.head.appendChild(style);

    var btn = document.createElement("button");
    btn.className = "aw-launcher";
    btn.setAttribute("aria-label", cfg.launcherLabel || "Ask a question");
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v10H9l-5 4z"/></svg><span></span>';
    btn.querySelector("span").textContent = cfg.launcherLabel || "Ask a question";

    var frame = document.createElement("iframe");
    frame.className = "aw-frame";
    frame.title = cfg.name || "Chat";
    frame.setAttribute("allow", "clipboard-write");
    frame.src = base + "/embed/" + encodeURIComponent(key) + "?mode=widget";

    function setOpen(v) {
      open = v;
      frame.classList.toggle("aw-open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) frame.focus();
    }
    btn.addEventListener("click", function () { setOpen(!open); });
    window.addEventListener("message", function (e) {
      if (e.origin !== base) return;
      if (e.data && e.data.type === "askwell:close") setOpen(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setOpen(false); });

    document.body.appendChild(frame);
    document.body.appendChild(btn);

    window.Askwell = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, toggle: function () { setOpen(!open); } };
  }
})();
