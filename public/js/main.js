/* ==========================================================================
   Hora do Rango — script principal
   - Sem dependências externas (nada de CDN = nada de terceiros injetando código).
   - Nunca usa innerHTML com dados do usuário: só textContent / atributos.
   - Tudo dentro de uma IIFE + "use strict" para não poluir o escopo global.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     CONFIGURAÇÃO — edite aqui (e confira também o HTML e o JSON-LD).
     ---------------------------------------------------------------------- */
  var CONFIG = Object.freeze({
    // EDITAR: número real com DDI+DDD, só dígitos. Ex.: 5511987654321
    whatsapp: "5511965666268",
    timeZone: "America/Sao_Paulo",
    // Horários por dia da semana (0 = domingo). null = fechado. Formato "HH:MM".
    // EDITAR: confirme o horário real.
    hours: {
      0: null,
      1: ["07:30", "18:20"],
      2: ["07:30", "18:20"],
      3: ["07:30", "18:20"],
      4: ["07:30", "18:20"],
      5: ["07:30", "18:20"],
      6: ["07:30", "18:20"]
    },
    mapEmbed: "https://www.google.com/maps?q=" +
      encodeURIComponent("Hora do Rango Restaurante, R. Daniel Bernardo, 180 - São Miguel Paulista, São Paulo - SP, 08010-100") +
      "&output=embed"
  });

  var WA_PATTERN = /^\d{12,13}$/;
  if (!WA_PATTERN.test(CONFIG.whatsapp)) {
    // Falha segura: se alguém digitar o número errado, não gera link quebrado silenciosamente.
    console.warn("CONFIG.whatsapp inválido. Use só dígitos com DDI e DDD.");
  }

  function waLink(message) {
    var base = "https://wa.me/" + CONFIG.whatsapp;
    return message ? base + "?text=" + encodeURIComponent(message) : base;
  }

  /* ----------------------------------------------------------------------
     Data/hora no fuso de São Paulo (independe do fuso do aparelho do visitante)
     ---------------------------------------------------------------------- */
  function nowInSaoPaulo() {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: CONFIG.timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var map = {};
    parts.forEach(function (p) { map[p.type] = p.value; });
    var days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: days[map.weekday], minutes: parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10) };
  }
  function toMinutes(hhmm) { var p = hhmm.split(":"); return +p[0] * 60 + +p[1]; }
  function fmt(hhmm) { return hhmm.replace(/^0/, "").replace(":", "h").replace("h00", "h"); }

  function nextOpening(day) {
    var names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7;
      if (CONFIG.hours[d]) return (i === 1 ? "amanhã" : names[d]) + " às " + fmt(CONFIG.hours[d][0]);
    }
    return "";
  }

  /* ----------------------------------------------------------------------
     1. Status "aberto agora / fechado" + destaques do dia
     ---------------------------------------------------------------------- */
  function initStatus() {
    var el = document.querySelector("[data-status]");
    var text = document.querySelector("[data-status-text]");
    if (!el || !text) return;
    var now = nowInSaoPaulo();
    var today = CONFIG.hours[now.day];

    if (today && now.minutes >= toMinutes(today[0]) && now.minutes < toMinutes(today[1])) {
      el.classList.add("is-open");
      text.textContent = "Aberto agora · até " + fmt(today[1]);
    } else if (today && now.minutes < toMinutes(today[0])) {
      el.classList.add("is-closed");
      text.textContent = "Fechado · abre hoje às " + fmt(today[0]);
    } else {
      el.classList.add("is-closed");
      text.textContent = "Fechado · abre " + nextOpening(now.day);
    }

    document.querySelectorAll("[data-hours] tr[data-weekday='" + now.day + "']").forEach(function (tr) {
      tr.classList.add("is-today");
      tr.setAttribute("aria-current", "date");
    });

    // Prato do dia: no domingo (fechado) mostramos o de segunda.
    var dishDay = CONFIG.hours[now.day] ? now.day : 1;
    var item = document.querySelector("#painel-dia .menu-item[data-weekday='" + dishDay + "']");
    if (item) {
      item.classList.add("is-today");
      var dish = item.querySelector("h3");
      var target = document.querySelector("[data-today-dish]");
      if (dish && target) target.textContent = dish.textContent;
      if (dishDay !== now.day) {
        var label = document.querySelector(".today-label");
        if (label) label.textContent = "Na segunda tem";
      }
    }
  }

  /* ----------------------------------------------------------------------
     2. Links de WhatsApp gerados a partir de um único número (CONFIG)
     ---------------------------------------------------------------------- */
  function initWhatsAppLinks() {
    if (!WA_PATTERN.test(CONFIG.whatsapp)) return;
    document.querySelectorAll("a[data-wa]").forEach(function (a) {
      a.href = waLink(a.getAttribute("data-wa"));
    });
  }

  /* ----------------------------------------------------------------------
     3. Cabeçalho, menu mobile e botão flutuante
     ---------------------------------------------------------------------- */
  function initHeader() {
    var header = document.querySelector("[data-header]");
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.querySelector("[data-nav]");
    var fab = document.querySelector(".wa-float");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.querySelector(".sr-only").textContent = open ? "Fechar menu" : "Abrir menu";
      nav.classList.toggle("is-open", open);
    }
    if (toggle && nav) {
      toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
      nav.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
      });
    }

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (header) header.classList.toggle("is-scrolled", y > 8);
        if (fab) fab.classList.toggle("is-visible", y > 480);
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ----------------------------------------------------------------------
     4. Abas do cardápio (padrão WAI-ARIA: setas, Home e End)
     ---------------------------------------------------------------------- */
  function initTabs() {
    document.querySelectorAll("[data-tabs]").forEach(function (root) {
      var tabs = Array.prototype.slice.call(root.querySelectorAll("[role='tab']"));
      function select(tab, focus) {
        tabs.forEach(function (t) {
          var on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          var panel = document.getElementById(t.getAttribute("aria-controls"));
          if (panel) panel.hidden = !on;
        });
        if (focus) tab.focus();
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener("click", function () { select(tab, false); });
        tab.addEventListener("keydown", function (e) {
          var next = null;
          if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
          else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === "Home") next = tabs[0];
          else if (e.key === "End") next = tabs[tabs.length - 1];
          if (next) { e.preventDefault(); select(next, true); }
        });
      });
    });
  }

  /* ----------------------------------------------------------------------
     5. Formulário de encomendas → mensagem pronta no WhatsApp
        Segurança: validação + limpeza de texto + honeypot + tempo mínimo
        de preenchimento + intervalo entre envios. Nada é salvo nem enviado
        a um servidor nosso.
     ---------------------------------------------------------------------- */
  function clean(value, max) {
    return String(value || "")
      .normalize("NFC")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "") // controles e caracteres invisíveis/bidi
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max);
  }

  function todayISO() {
    var d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  function initOrderForm() {
    var form = document.querySelector("[data-order-form]");
    if (!form) return;
    var status = form.querySelector("[data-form-status]");
    var date = form.elements.data;
    var startedAt = Date.now();
    var lastSent = 0;
    var MIN_FILL_MS = 2500;   // robôs costumam enviar em milissegundos
    var COOLDOWN_MS = 15000;  // evita cliques repetidos abrindo várias abas

    if (date) {
      date.min = todayISO();
      var max = new Date(); max.setFullYear(max.getFullYear() + 1);
      date.max = max.toISOString().slice(0, 10);
    }

    var rules = {
      nome: function (v) {
        if (v.length < 2) return "Digite seu nome.";
        if (!/^[\p{L}\p{M}' .-]+$/u.test(v)) return "Use apenas letras no nome.";
        return "";
      },
      tipo: function (v) { return v ? "" : "Escolha o tipo de pedido."; },
      quantidade: function (v) {
        var n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 500 ? "" : "Informe um número entre 1 e 500.";
      },
      data: function (v) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "Escolha uma data.";
        if (v < date.min) return "Escolha hoje ou uma data futura.";
        if (v > date.max) return "Escolha uma data dentro de 1 ano.";
        return "";
      }
    };

    function showError(name, msg) {
      var input = form.elements[name];
      var out = form.querySelector("[data-error-for='" + name + "']");
      if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
      if (out) out.textContent = msg;
    }

    Object.keys(rules).forEach(function (name) {
      var input = form.elements[name];
      if (!input) return;
      input.addEventListener("blur", function () {
        if (input.value) showError(name, rules[name](clean(input.value, 60)));
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") showError(name, rules[name](clean(input.value, 60)));
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";

      // Robô detectado: finge sucesso, não faz nada.
      if (form.elements.site.value || Date.now() - startedAt < MIN_FILL_MS) {
        status.textContent = "Tudo certo!";
        return;
      }
      if (Date.now() - lastSent < COOLDOWN_MS) {
        status.textContent = "Aguarde alguns segundos antes de enviar de novo.";
        return;
      }

      var data = {
        nome: clean(form.elements.nome.value, 60),
        tipo: clean(form.elements.tipo.value, 40),
        quantidade: clean(form.elements.quantidade.value, 3),
        data: clean(form.elements.data.value, 10),
        detalhes: clean(form.elements.detalhes.value, 400)
      };

      var firstInvalid = null;
      Object.keys(rules).forEach(function (name) {
        var msg = rules[name](data[name]);
        showError(name, msg);
        if (msg && !firstInvalid) firstInvalid = form.elements[name];
      });
      // Só aceitamos valores que existem no <select> (impede valor forjado via DevTools).
      var allowed = Array.prototype.map.call(form.elements.tipo.options, function (o) { return o.value || o.text; }).filter(Boolean);
      if (allowed.indexOf(data.tipo) === -1) { showError("tipo", "Escolha o tipo de pedido."); firstInvalid = firstInvalid || form.elements.tipo; }
      if (firstInvalid) { firstInvalid.focus(); return; }

      var parts = data.data.split("-");
      var msg = [
        "Olá! Vim pelo site do Hora do Rango.",
        "",
        "Nome: " + data.nome,
        "Assunto: " + data.tipo,
        "Pessoas/marmitas: " + data.quantidade,
        "Data: " + parts[2] + "/" + parts[1] + "/" + parts[0]
      ];
      if (data.detalhes) msg.push("Detalhes: " + data.detalhes);

      lastSent = Date.now();
      // Link temporário com rel="noopener noreferrer": a nova aba não ganha acesso a esta página.
      var a = document.createElement("a");
      a.href = waLink(msg.join("\n"));
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      status.textContent = "Mensagem pronta! Confira no WhatsApp e toque em enviar.";
    });
  }

  /* ----------------------------------------------------------------------
     6. Mapa sob demanda (privacidade + performance)
     ---------------------------------------------------------------------- */
  function initMap() {
    var box = document.querySelector("[data-map]");
    var btn = document.querySelector("[data-map-load]");
    if (!box || !btn) return;
    btn.addEventListener("click", function () {
      var iframe = document.createElement("iframe");
      iframe.src = CONFIG.mapEmbed;
      iframe.title = "Mapa: Hora do Rango, R. Daniel Bernardo, 180, São Miguel Paulista";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      // sandbox limita o que o iframe pode fazer na nossa página
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox");
      iframe.setAttribute("allowfullscreen", "");
      box.replaceChildren(iframe);
      iframe.focus();
    }, { once: true });
  }

  /* ----------------------------------------------------------------------
     7. Animação de entrada ao rolar (só transform/opacity)
     ---------------------------------------------------------------------- */
  function initReveal() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.remove("is-pending"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add("is-pending");
        io.observe(el);
      }
    });
  }

  function initYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  function boot() {
    [initWhatsAppLinks, initStatus, initHeader, initTabs, initOrderForm, initMap, initReveal, initYear]
      .forEach(function (fn) {
        try { fn(); } catch (err) { console.error(err); } // uma falha não derruba o resto
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
