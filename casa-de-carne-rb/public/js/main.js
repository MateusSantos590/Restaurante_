/* ==========================================================================
   Casa de Carne RB — script principal (sem dependências)
   Nunca usa innerHTML com dados do usuário: só textContent e atributos.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIGURAÇÃO
     ------------------------------------------------------------------ */
  var CONFIG = Object.freeze({
    phone: "+551125665264",
    phoneLabel: "(11) 2566-5264",
    // EDITAR: número do WhatsApp com DDI e DDD, só dígitos (ex.: "5511999998888").
    // Vazio = todos os botões de pedido viram "Ligar". Preenchido = viram WhatsApp
    // com a mensagem pronta.
    whatsapp: "",
    timeZone: "America/Sao_Paulo",
    hours: { 0: ["08:00", "14:00"], 1: ["08:00", "20:00"], 2: ["08:00", "20:00"], 3: ["08:00", "20:00"], 4: ["08:00", "20:00"], 5: ["08:00", "20:00"], 6: ["08:00", "20:00"] },
    // Gramas por pessoa no churrasco (estimativa usual)
    gramsAdult: 400,
    gramsChild: 200,
    // Divisão entre as carnes marcadas (pesos relativos)
    share: { boi: 50, porco: 20, frango: 15, linguica: 15 },
    names: { boi: "Carne bovina", porco: "Carne suína", frango: "Frango", linguica: "Linguiça" }
  });

  var HAS_WA = /^\d{12,13}$/.test(CONFIG.whatsapp);
  function waLink(msg) { return "https://wa.me/" + CONFIG.whatsapp + (msg ? "?text=" + encodeURIComponent(msg) : ""); }
  function track(name, params) { if (window.hrTrack) window.hrTrack(name, params || {}); }

  /* Abre um link externo com segurança (nova aba sem acesso a esta página) */
  function openLink(url) {
    var a = document.createElement("a");
    a.href = url;
    if (/^https:/.test(url)) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ------------------------------------------------------------------
     1. Botões de contato: telefone por padrão, WhatsApp se configurado
     ------------------------------------------------------------------ */
  function initContact() {
    if (!HAS_WA) return;
    document.querySelectorAll("a[data-contact]").forEach(function (a) {
      a.href = waLink(a.getAttribute("data-wa"));
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      var use = a.querySelector("use");
      if (use) use.setAttribute("href", "#i-whatsapp");
      var label = a.querySelector("[data-contact-label]");
      if (label && /Ligar|\(11\)/.test(label.textContent)) label.textContent = "Pedir no WhatsApp";
    });
    var calcLabel = document.querySelector("[data-calc-label]");
    if (calcLabel) calcLabel.textContent = "Pedir essa lista no WhatsApp";
  }

  /* ------------------------------------------------------------------
     2. Aberto agora / fechado, no fuso de São Paulo
     ------------------------------------------------------------------ */
  function nowSP() {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: CONFIG.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
    var m = {}; parts.forEach(function (p) { m[p.type] = p.value; });
    return { day: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[m.weekday], min: +m.hour * 60 + +m.minute };
  }
  function toMin(t) { var p = t.split(":"); return +p[0] * 60 + +p[1]; }
  function fmt(t) { return t.replace(/^0/, "").replace(":", "h").replace("h00", "h"); }

  function initStatus() {
    var el = document.querySelector("[data-status]"), txt = document.querySelector("[data-status-text]");
    if (!el || !txt) return;
    var n = nowSP(), h = CONFIG.hours[n.day];
    if (h && n.min >= toMin(h[0]) && n.min < toMin(h[1])) { el.classList.add("is-open"); txt.textContent = "Aberto agora · até " + fmt(h[1]); }
    else if (h && n.min < toMin(h[0])) { el.classList.add("is-closed"); txt.textContent = "Fechado · abre hoje às " + fmt(h[0]); }
    else {
      var d = (n.day + 1) % 7;
      el.classList.add("is-closed");
      txt.textContent = "Fechado · abre amanhã às " + fmt(CONFIG.hours[d][0]);
    }
    document.querySelectorAll("[data-hours] tr[data-weekday='" + n.day + "']").forEach(function (tr) { tr.classList.add("is-today"); tr.setAttribute("aria-current", "date"); });
  }

  /* ------------------------------------------------------------------
     3. Cabeçalho, menu e barra fixa do celular
     ------------------------------------------------------------------ */
  function initHeader() {
    var header = document.querySelector("[data-header]"), toggle = document.querySelector("[data-nav-toggle]"), nav = document.querySelector("[data-nav]"), bar = document.querySelector("[data-mobile-bar]");
    function setOpen(o) {
      toggle.setAttribute("aria-expanded", String(o));
      toggle.querySelector(".sr-only").textContent = o ? "Fechar menu" : "Abrir menu";
      nav.classList.toggle("is-open", o);
    }
    if (toggle && nav) {
      toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
      nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (header) header.classList.toggle("is-stuck", y > 40);
        if (bar) bar.classList.toggle("is-visible", y > 500);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     4. Abas de cortes (padrão WAI-ARIA) + botão "preço" em cada corte
     ------------------------------------------------------------------ */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (root) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll("[role=tab]"));
      function select(tab, focus, user) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", String(on)); t.tabIndex = on ? 0 : -1;
          var p = document.getElementById(t.getAttribute("aria-controls")); if (p) p.hidden = !on;
        });
        if (focus) tab.focus();
        if (user) track("cut_tab_view", { tab: tab.textContent.trim() });
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(tab, false, true); });
        tab.addEventListener("keydown", function (e) {
          var k = { ArrowRight: tabs[(i + 1) % tabs.length], ArrowLeft: tabs[(i - 1 + tabs.length) % tabs.length], Home: tabs[0], End: tabs[tabs.length - 1] }[e.key];
          if (k) { e.preventDefault(); select(k, true, true); }
        });
      });
    });
  }

  function initPriceLinks() {
    document.querySelectorAll("[data-cuts] li").forEach(function (li) {
      var name = li.querySelector("h3").textContent.trim();
      var a = document.createElement("a");
      a.className = "price-link";
      a.setAttribute("data-price", name);
      if (HAS_WA) {
        a.href = waLink("Olá! Qual o preço do kg de " + name.toLowerCase() + " hoje?");
        a.target = "_blank"; a.rel = "noopener noreferrer";
      } else {
        a.href = "tel:" + CONFIG.phone;
      }
      a.textContent = "Preço de hoje";
      var sr = document.createElement("span"); sr.className = "sr-only"; sr.textContent = ": " + name;
      a.appendChild(sr);
      li.appendChild(a);
    });
  }

  /* ------------------------------------------------------------------
     5. Calculadora de churrasco → pedido pronto
     ------------------------------------------------------------------ */
  function initCalc() {
    var form = document.querySelector("[data-calc]");
    if (!form) return;
    var totalEl = form.querySelector("[data-calc-total]"), listEl = form.querySelector("[data-calc-list]"), status = form.querySelector("[data-calc-status]");
    var used = false, lastSent = 0;

    function intVal(name) {
      var n = Math.floor(Number(form.elements[name].value));
      return Number.isFinite(n) ? Math.min(200, Math.max(0, n)) : 0;
    }
    function kg(g) { return (Math.round(g / 100) / 10).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

    function compute() {
      var adults = intVal("adultos"), kids = intVal("criancas");
      var total = adults * CONFIG.gramsAdult + kids * CONFIG.gramsChild;
      var types = Array.prototype.filter.call(form.querySelectorAll("input[name=tipo]"), function (c) { return c.checked; }).map(function (c) { return c.value; });
      var weight = types.reduce(function (s, t) { return s + CONFIG.share[t]; }, 0);
      var items = types.map(function (t) { return { name: CONFIG.names[t], grams: weight ? total * CONFIG.share[t] / weight : 0 }; });
      return { adults: adults, kids: kids, total: types.length ? total : 0, items: items };
    }

    function render() {
      var r = compute();
      if (totalEl.textContent !== kg(r.total)) {
        totalEl.textContent = kg(r.total);
        var box = totalEl.parentNode;
        box.classList.remove("is-bump"); void box.offsetWidth; box.classList.add("is-bump"); // reinicia a animação
      }
      listEl.replaceChildren.apply(listEl, r.items.map(function (it) {
        var li = document.createElement("li");
        var a = document.createElement("span"); a.textContent = it.name;
        var b = document.createElement("strong"); b.textContent = kg(it.grams) + " kg";
        li.appendChild(a); li.appendChild(b); return li;
      }));
      if (!r.items.length) {
        var li = document.createElement("li"); li.textContent = "Marque pelo menos um tipo de carne."; listEl.appendChild(li);
      }
      return r;
    }

    form.addEventListener("input", function () {
      render();
      if (!used) { used = true; track("bbq_calc_used", {}); }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = render();
      if (!r.total) { status.textContent = "Coloque quantas pessoas vão e marque as carnes."; return; }
      if (Date.now() - lastSent < 10000) { status.textContent = "Aguarde alguns segundos antes de enviar de novo."; return; }
      lastSent = Date.now();
      track("generate_lead", { form: "calculadora_churrasco", kg_total: Math.round(r.total / 100) / 10, pessoas: r.adults + r.kids });

      if (HAS_WA) {
        var msg = ["Olá! Vim pelo site. Quero separar carne para um churrasco:", "",
          "Pessoas: " + r.adults + " adultos e " + r.kids + " crianças"]
          .concat(r.items.map(function (it) { return "- " + it.name + ": " + kg(it.grams) + " kg"; }))
          .concat(["", "Total: " + kg(r.total) + " kg. Quais cortes vocês sugerem?"]);
        openLink(waLink(msg.join("\n")));
        status.textContent = "Lista pronta no WhatsApp. Confira e toque em enviar.";
      } else {
        status.textContent = "Anote a lista acima e ligue para " + CONFIG.phoneLabel + ". Abrindo a ligação…";
        openLink("tel:" + CONFIG.phone);
      }
    });

    render();
  }

  /* ------------------------------------------------------------------
     6. Pausa o selo giratório fora da tela; ano no rodapé
     ------------------------------------------------------------------ */
  function initStampPause() {
    var art = document.querySelector(".hero-art");
    if (!art || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (en) { art.classList.toggle("is-paused", !en[0].isIntersecting); }).observe(art);
  }
  /* ------------------------------------------------------------------
     7. Animação ao rolar, com itens de lista em sequência
     ------------------------------------------------------------------ */
  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    // Itens de lista entram um depois do outro (--i define o atraso)
    ["[data-cuts]", ".steps-grid", ".faq-list", ".gallery"].forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (list) {
        Array.prototype.forEach.call(list.children, function (el, i) {
          el.setAttribute("data-reveal", "");
          el.style.setProperty("--i", String(i % 4)); // CSSOM: permitido pela CSP
        });
      });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove("is-pending"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    var vh = window.innerHeight;
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      // Só esconde o que está abaixo da tela agora: nada "pisca" no carregamento
      if (el.getBoundingClientRect().top > vh) { el.classList.add("is-pending"); io.observe(el); }
    });
  }

  /* ------------------------------------------------------------------
     8. Menu marca a seção que está na tela
     ------------------------------------------------------------------ */
  function initScrollSpy() {
    if (!("IntersectionObserver" in window)) return;
    var links = {};
    document.querySelectorAll(".nav ul a[href^='#']").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (current) current.removeAttribute("aria-current");
        current = links[e.target.id];
        if (current) current.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  function initYear() { var y = document.querySelector("[data-year]"); if (y) y.textContent = String(new Date().getFullYear()); }

  function boot() {
    [initContact, initStatus, initHeader, initTabs, initPriceLinks, initCalc, initStampPause, initReveal, initScrollSpy, initYear].forEach(function (fn) {
      try { fn(); } catch (err) { console.error(err); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
