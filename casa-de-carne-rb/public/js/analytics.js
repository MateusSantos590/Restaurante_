/* ==========================================================================
   Casa de Carne RB — rastreamento de conversões
   Como funciona:
   1. Cada ação importante vira um evento (whatsapp_click, phone_click...).
   2. Os eventos sempre vão para window.dataLayer (formato do Google Tag Manager)
      e para o evento do navegador "hr:track". Isso não envia nada para a internet.
   3. Para MEDIR de verdade, coloque o ID do Google Analytics 4 em GA4_ID abaixo
      (formato "G-XXXXXXXXXX") e libere o Google na CSP (veja docs/MARKETING.md).
      Com o ID preenchido, aparece um aviso de cookies e o GA4 só carrega se o
      visitante aceitar (LGPD). Sem ID, não há aviso e nada é medido.
   ========================================================================== */
(function () {
  "use strict";

  var GA4_ID = ""; // EDITAR: ex. "G-ABC123DEF4". Vazio = nenhum envio a terceiros.
  var CONSENT_KEY = "hr-consent";

  window.dataLayer = window.dataLayer || [];
  var gaReady = false;

  function gtag() { window.dataLayer.push(arguments); }

  /** Registra um evento. params: objeto simples com texto/número. */
  function track(name, params) {
    var data = {};
    Object.keys(params || {}).forEach(function (k) {
      var v = params[k];
      data[k] = typeof v === "string" ? v.slice(0, 100) : v;
    });
    window.dataLayer.push(Object.assign({ event: name }, data));
    try { document.dispatchEvent(new CustomEvent("hr:track", { detail: { event: name, params: data } })); } catch (e) { /* navegador antigo */ }
    if (gaReady) gtag("event", name, data);
  }
  window.hrTrack = track;

  /* ---------- Cliques: um único listener para a página inteira ---------- */
  function where(el) {
    if (el.closest(".mobile-bar")) return "barra_celular";
    if (el.closest(".ig-float")) return "botao_flutuante";
    if (el.closest(".topbar")) return "faixa_topo";
    if (el.closest(".site-header")) return "cabecalho";
    if (el.closest(".site-footer")) return "rodape";
    var sec = el.closest("section");
    return (sec && (sec.id || sec.className.split(" ")[0])) || "pagina";
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    var p = { link_location: where(a), link_text: (a.textContent || "").replace(/\s+/g, " ").trim() };

    if (a.hasAttribute("data-price")) track("price_request_click", Object.assign(p, { corte: a.getAttribute("data-price"), canal: /^tel:/.test(href) ? "telefone" : "whatsapp" }));
    else if (/instagram\.com/.test(href)) track("instagram_click", p);
    else if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) track("whatsapp_click", p);
    else if (/^tel:/.test(href)) track("phone_click", p);
    else if (/google\.com\/maps\/dir\//.test(href)) track("directions_click", p);
    else if (/google\.com\/maps/.test(href)) track("maps_profile_click", p);
  }, true);

  /* ---------- GA4 opcional, só com consentimento ---------- */
  function loadGA() {
    if (gaReady || !/^G-[A-Z0-9]{6,12}$/.test(GA4_ID)) return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA4_ID);
    document.head.appendChild(s);
    gtag("js", new Date());
    gtag("config", GA4_ID, { anonymize_ip: true, allow_google_signals: false });
    gaReady = true;
  }

  function readConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
  function saveConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* modo privado */ } }

  function showBanner() {
    var box = document.createElement("div");
    box.className = "consent";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Aviso de cookies");
    var p = document.createElement("p");
    p.textContent = "Usamos o Google Analytics para saber quantas pessoas ligam, pedem preço ou o trajeto. Isso grava cookies no seu aparelho. Pode recusar, o site funciona igual. ";
    var more = document.createElement("a");
    more.href = "/politica-de-privacidade.html";
    more.textContent = "Política de privacidade";
    p.appendChild(more);
    var actions = document.createElement("div");
    actions.className = "consent-actions";
    [["Aceitar", "granted", "btn btn-primary btn-sm"], ["Recusar", "denied", "btn btn-outline-light btn-sm"]].forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button"; b.className = d[2]; b.textContent = d[0];
      b.addEventListener("click", function () {
        saveConsent(d[1]);
        if (d[1] === "granted") loadGA();
        box.remove();
      });
      actions.appendChild(b);
    });
    box.appendChild(p); box.appendChild(actions);
    document.body.appendChild(box);
  }

  function init() {
    if (!GA4_ID) return;
    var c = readConsent();
    if (c === "granted") loadGA();
    else if (c !== "denied") showBanner();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
