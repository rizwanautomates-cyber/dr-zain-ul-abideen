/* Dr Zain Ul Abideen clinic — AI chat widget.
   Drop-in: <script src="chat-widget.js"></script> before </body>.
   Talks to POST /api/chat (Vercel serverless). If the backend is not
   configured, it falls back to a WhatsApp CTA. */
(function () {
  "use strict";

  var WHATSAPP_URL = "https://wa.me/923450731166";
  var API_URL = "/api/chat";
  var TEAL = "#14b8a6";
  var AVATAR = "logo.png";

  var CSS = [
    "#zain-chat-btn{position:fixed;right:22px;bottom:22px;z-index:99990;width:64px;height:64px;border-radius:50%;",
    "background:#0a1628;border:2px solid " + TEAL + ";cursor:pointer;display:flex;align-items:center;justify-content:center;padding:6px;overflow:hidden;",
    "box-shadow:0 10px 30px rgba(20,184,166,.35);transition:transform .18s ease}",
    "#zain-chat-btn:hover{transform:scale(1.07)}",
    "#zain-chat-btn img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}",
    "#zain-chat-panel{position:fixed;right:22px;bottom:94px;z-index:99990;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 140px);",
    "background:#0a1628;border:1px solid rgba(255,255,255,.12);border-radius:18px;display:none;flex-direction:column;overflow:hidden;",
    "box-shadow:0 30px 90px rgba(0,0,0,.55);font-family:Manrope,system-ui,sans-serif}",
    "#zain-chat-panel.open{display:flex}",
    "#zain-chat-head{background:linear-gradient(135deg,#0e2a28,#0a1628);padding:14px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.08)}",
    "#zain-chat-dot{width:10px;height:10px;border-radius:50%;background:#3ddc84;box-shadow:0 0 8px #3ddc84}",
    "#zain-chat-ava{width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid " + TEAL + ";background:#fff}",
    "#zain-chat-title{color:#f2f7fb;font-weight:700;font-size:15px}",
    "#zain-chat-sub{color:#a9bdd2;font-size:12px}",
    "#zain-chat-close{margin-left:auto;background:none;border:none;color:#a9bdd2;font-size:20px;cursor:pointer;line-height:1}",
    "#zain-chat-msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}",
    ".zain-msg{max-width:82%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.45;word-wrap:break-word}",
    ".zain-msg.bot{background:#101f36;color:#f2f7fb;align-self:flex-start;border-bottom-left-radius:4px}",
    ".zain-msg.user{background:linear-gradient(135deg,#2dd4bf,#0d9488);color:#062a26;align-self:flex-end;border-bottom-right-radius:4px;font-weight:500}",
    ".zain-msg a{color:" + TEAL + ";font-weight:700}",
    ".zain-msg.user a{color:#062a26}",
    ".zain-typing{align-self:flex-start;background:#101f36;padding:12px 16px;border-radius:14px;border-bottom-left-radius:4px}",
    ".zain-typing span{display:inline-block;width:7px;height:7px;margin-right:4px;border-radius:50%;background:#a9bdd2;animation:zainblink 1.2s infinite}",
    ".zain-typing span:nth-child(2){animation-delay:.2s}.zain-typing span:nth-child(3){animation-delay:.4s}",
    "@keyframes zainblink{0%,80%,100%{opacity:.25}40%{opacity:1}}",
    "#zain-chat-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(255,255,255,.08);background:#081222}",
    "#zain-chat-input{flex:1;background:#101f36;border:1px solid rgba(255,255,255,.1);border-radius:12px;color:#f2f7fb;",
    "padding:10px 12px;font-size:14px;font-family:inherit;outline:none}",
    "#zain-chat-input:focus{border-color:" + TEAL + "}",
    "#zain-chat-send{background:linear-gradient(135deg,#2dd4bf,#0d9488);border:none;border-radius:12px;color:#062a26;",
    "font-weight:700;padding:0 16px;cursor:pointer;font-size:14px}",
    "#zain-chat-send:disabled{opacity:.5;cursor:default}",
    ".zain-wa-btn{display:inline-block;margin-top:8px;background:#25d366;color:#062b16;font-weight:700;font-size:13px;",
    "padding:9px 14px;border-radius:10px;text-decoration:none}"
  ].join("\n");

  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html !== undefined) d.innerHTML = html;
    return d;
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function linkify(s) {
    return esc(s).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function init() {
    var style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    var btn = el("button", null, '<img src="' + AVATAR + '" alt="Chat with the clinic"/>');
    btn.id = "zain-chat-btn";
    btn.setAttribute("aria-label", "Chat with the clinic");

    var panel = el("div"); panel.id = "zain-chat-panel";
    panel.innerHTML =
      '<div id="zain-chat-head"><img id="zain-chat-ava" src="' + AVATAR + '" alt=""/>' +
      '<div><div id="zain-chat-title">Dr Zain Ul Abideen</div>' +
      '<div id="zain-chat-sub">Clinic assistant — replies instantly</div></div>' +
      '<div id="zain-chat-dot"></div>' +
      '<button id="zain-chat-close" aria-label="Close chat">&times;</button></div>' +
      '<div id="zain-chat-msgs"></div>' +
      '<form id="zain-chat-form"><input id="zain-chat-input" type="text" placeholder="Ask about hours, services..." autocomplete="off" maxlength="500"/>' +
      '<button id="zain-chat-send" type="submit">Send</button></form>';

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    var msgs = panel.querySelector("#zain-chat-msgs");
    var form = panel.querySelector("#zain-chat-form");
    var input = panel.querySelector("#zain-chat-input");
    var sendBtn = panel.querySelector("#zain-chat-send");
    var history = [];
    var greeted = false;
    var busy = false;

    function addMsg(text, who) {
      var m = el("div", "zain-msg " + who, linkify(text));
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
      return m;
    }

    function addWhatsAppFallback() {
      var m = el("div", "zain-msg bot");
      m.innerHTML = "I'm not connected yet — but the clinic replies fast on WhatsApp." +
        '<br><a class="zain-wa-btn" href="' + WHATSAPP_URL + '" target="_blank" rel="noopener">Chat on WhatsApp</a>';
      msgs.appendChild(m);
      msgs.scrollTop = msgs.scrollHeight;
    }

    function setTyping(on) {
      var t = msgs.querySelector(".zain-typing");
      if (on && !t) {
        t = el("div", "zain-typing", "<span></span><span></span><span></span>");
        msgs.appendChild(t);
        msgs.scrollTop = msgs.scrollHeight;
      } else if (!on && t) {
        t.remove();
      }
    }

    function toggle(open) {
      panel.classList.toggle("open", open);
      if (open && !greeted) {
        greeted = true;
        addMsg("Assalam-o-Alaikum! I'm the clinic's assistant. Ask me about our services, clinic hours, or locations — or tap below to chat on WhatsApp.", "bot");
      }
      if (open) setTimeout(function () { input.focus(); }, 150);
    }

    btn.addEventListener("click", function () { toggle(!panel.classList.contains("open")); });
    panel.querySelector("#zain-chat-close").addEventListener("click", function () { toggle(false); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      busy = true;
      sendBtn.disabled = true;
      addMsg(text, "user");
      history.push({ role: "user", content: text });
      input.value = "";
      setTyping(true);

      fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(-12) })
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          setTyping(false);
          if (res.ok && res.body.reply) {
            addMsg(res.body.reply, "bot");
            history.push({ role: "assistant", content: res.body.reply });
          } else {
            addWhatsAppFallback();
          }
        })
        .catch(function () {
          setTyping(false);
          addWhatsAppFallback();
        })
        .then(function () {
          busy = false;
          sendBtn.disabled = false;
          input.focus();
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
