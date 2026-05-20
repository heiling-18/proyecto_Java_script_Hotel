// app.js — utilidades globales de la UI
(() => { // IIFE para aislar el código y no contaminar el scope global
  'use strict'; // Activa modo estricto para evitar errores silenciosos

  const doc = document; // Alias corto para document
  const $  = (s, root = doc) => root.querySelector(s); // Selector rápido de un elemento
  const $$ = (s, root = doc) => Array.from(root.querySelectorAll(s)); // Selector rápido de varios elementos

  /* ========== CSS var: --header-height (para hero 100vh real) ========== */
  const header = $('.site-header'); // Obtiene el header del sitio
  const setHeaderHeight = () => { // Función para actualizar la variable CSS con la altura real del header
    const h = header ? header.offsetHeight : 64; // Si no existe header, usa 64px por defecto
    document.documentElement.style.setProperty('--header-height', `${h}px`); // Setea la variable CSS
  };
  setHeaderHeight(); // Ejecuta al cargar
  window.addEventListener('resize', setHeaderHeight, { passive: true }); // Recalcula al redimensionar la ventana

  /* ========== Menú móvil (accesible) ========== */
  const toggle = $('.nav-toggle'); // Botón del menú móvil
  const nav    = $('.nav'); // Contenedor del menú

  if (toggle && nav) { // Solo si existen ambos elementos
    const closeNav = () => { // Función para cerrar el menú
      nav.classList.remove('open'); // Quita clase de menú abierto
      toggle.setAttribute('aria-expanded', 'false'); // Accesibilidad
      document.body.classList.remove('nav-open'); // Quita clase del body
    };
    const openNav = () => { // Función para abrir el menú
      nav.classList.add('open'); // Agrega clase de menú abierto
      toggle.setAttribute('aria-expanded', 'true'); // Accesibilidad
      document.body.classList.add('nav-open'); // Agrega clase al body
    };
    const toggleNav = () => (nav.classList.contains('open') ? closeNav() : openNav()); // Alterna entre abrir/cerrar

    toggle.addEventListener('click', toggleNav); // Clic en el botón → abre/cierra
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); }); // ESC → cierra menú
    $$('.nav a').forEach((a) => a.addEventListener('click', closeNav)); // Clic en un link → cierra menú
  }

  /* ========== Marcar link activo por URL (si no está seteado) ========== */
  (() => {
    const links = $$('.nav a'); // Obtiene todos los links del menú
    if (!links.length) return; // Si no hay links, termina

    if (links.some((a) => a.getAttribute('data-active') === 'true')) return; // Si ya hay uno marcado manualmente, no hace nada

    const path = location.pathname.split('/').pop() || 'index.html'; // Obtiene el archivo actual
    let found = false; // Bandera para saber si encontró coincidencia

    links.forEach((a) => {
      const href = a.getAttribute('href') || ''; // Obtiene href del link
      const match = href === path || (path === '' && /index\.html$/i.test(href)); // Compara con la URL actual
      if (match) {
        a.setAttribute('data-active', 'true'); // Marca como activo
        found = true;
      } else {
        a.removeAttribute('data-active'); // Desmarca otros
      }
    });

    if (!found) links[0]?.setAttribute('data-active', 'true'); // Si no encontró, marca el primero
  })();

  /* ========== Animación “reveal” para servicios ========== */
  (() => {
    const cards = $$('.service-card'); // Selecciona las tarjetas de servicios
    if (!cards.length || !('IntersectionObserver' in window)) return; // Si no hay tarjetas o no soporta IO, termina

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((ent) => {
          if (ent.isIntersecting) { // Si la tarjeta entra al viewport
            ent.target.classList.add('is-visible'); // Agrega clase para animación
            io.unobserve(ent.target); // Deja de observarla (solo se anima una vez)
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' } // Configuración del observer
    );

    cards.forEach((el) => io.observe(el)); // Observa cada tarjeta
  })();
})();

/* ========= Footer: utilidades (año, newsletter, país, to-top) ========= */
(() => {
  const yearEl = document.getElementById('copyYear'); // Elemento del año
  if (yearEl) yearEl.textContent = new Date().getFullYear(); // Inserta el año actual

  // Newsletter (demo a localStorage; cambia por tu API si la tienes)
  const form = document.getElementById('newsForm'); // Formulario
  const email = document.getElementById('newsEmail'); // Input email
  const msg = document.getElementById('newsMsg'); // Mensaje de feedback
  form?.addEventListener('submit', (e) => { // Evento submit
    e.preventDefault(); // Evita recargar página
    const val = (email?.value || '').trim(); // Obtiene valor del email
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); // Valida email
    if (!ok){
      if (msg) { msg.textContent = 'Ingresa un correo válido.'; msg.style.color = '#fca5a5'; } // Error
      return;
    }
    const key = 'erc_newsletter'; // Clave en localStorage
    const list = JSON.parse(localStorage.getItem(key) || '[]'); // Obtiene lista guardada
    if (!list.includes(val)) list.push(val); // Agrega si no existe
    localStorage.setItem(key, JSON.stringify(list)); // Guarda lista
    if (msg) { msg.textContent = '¡Gracias por suscribirte! 🎉'; msg.style.color = '#86efac'; } // Éxito
    form.reset(); // Limpia formulario
  });

  // Selector de país (persistencia simple)
  const cSel = document.getElementById('countrySelect'); // Selector de país
  if (cSel){
    const saved = localStorage.getItem('erc_country'); // País guardado
    if (saved) cSel.value = saved; // Lo aplica
    cSel.addEventListener('change', () => {
      localStorage.setItem('erc_country', cSel.value); // Guarda nuevo país
    });
  }

  // Volver arriba
  document.querySelector('.to-top')?.addEventListener('click', (e) => {
    e.preventDefault(); // Evita salto brusco
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll suave al inicio
  });
})();

/* ===== Footer: construir mapa del sitio con lo que ya existe ===== */
(() => {
  const $ = (sel, ctx=document) => ctx.querySelector(sel); // Selector rápido local
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel)); // Selector múltiple local

  const pagesEl    = $('#footPages'); // Lista de páginas
  const sectionsEl = $('#footSections'); // Lista de secciones
  const quickEl    = $('#footQuick'); // Accesos rápidos

  // Normaliza texto: si el <a> no tiene texto, lo generamos a partir del slug
  const pretty = (str) => { // Convierte slug en texto legible
    if (!str) return '';
    return str
      .replace(/[-_]+/g, ' ') // Reemplaza guiones por espacios
      .replace(/\.\w+$/, '') // Quita extensión
      .replace(/^\//, '') // Quita slash inicial
      .replace(/(^|\s)\S/g, s => s.toUpperCase()) // Capitaliza palabras
      .trim();
  };

  // 1) Páginas (.html absolutas/relativas dentro del sitio)
  if (pagesEl) {
    const anchors = $$('a[href]'); // Obtiene todos los enlaces
    const sameHost = (href) => { // Verifica si pertenece al mismo dominio
      try {
        const u = new URL(href, location.origin);
        return u.origin === location.origin;
      } catch { return false; }
    };

    const pageSet = new Map(); // pathname -> {href, text}
    anchors.forEach(a => {
      const href = a.getAttribute('href'); // Obtiene href
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return; // Ignora especiales
      if (!sameHost(href)) return; // Ignora externos

      const u = new URL(href, location.origin); // Normaliza URL
      const isHtml = u.pathname.endsWith('.html') || u.pathname === '/' || u.pathname === '/index.html'; // Solo HTML
      if (!isHtml) return;

      const key = u.pathname === '/' ? '/index.html' : u.pathname; // Normaliza index
      if (!pageSet.has(key)) {
        const label = (a.textContent || pretty(u.pathname)).trim() || 'Página'; // Texto visible
        pageSet.set(key, { href: u.pathname, text: label }); // Guarda página
      }
    });

    // Asegurar páginas principales aunque no haya enlaces visibles
    [['/index.html','Inicio'], ['/reservas.html','Reservas'], ['/contacto.html','Contacto']]
      .forEach(([p,t]) => { if (!pageSet.has(p)) pageSet.set(p, {href:p, text:t}); });

    pagesEl.innerHTML = [...pageSet.values()]
      .sort((a,b)=> a.text.localeCompare(b.text,'es')) // Orden alfabético
      .map(it => `<li><a href="${it.href}">${it.text}</a></li>`) // Render
      .join('');
  }

  // 2) Secciones (busca <section id="..."> con un <h2> dentro)
  if (sectionsEl) {
    const sections = $$('section[id]'); // Todas las secciones con ID
    const items = sections.map(sec => {
      const h2 = $('h2, [role="heading"][aria-level="2"]', sec); // Busca título
      const text = (h2?.textContent || pretty(sec.id) || 'Sección').trim(); // Texto visible
      return { href: `#${sec.id}`, text }; // Link interno
    });

    // De-duplicar por href
    const uniq = [];
    const seen = new Set();
    for (const it of items) {
      if (seen.has(it.href)) continue; // Evita duplicados
      seen.add(it.href);
      uniq.push(it);
    }

    sectionsEl.innerHTML = uniq
      .map(it => `<li><a href="${it.href}">${it.text}</a></li>`) // Render
      .join('');
  }

  // 3) Accesos rápidos (clona el menú principal + chips de la galería si existen)
  if (quickEl) {
    const menuLinks = $$('.nav a[href]'); // Links del menú
    const chips     = $$('.gallery-filters .chip[data-filter]'); // Chips de filtros
    const fast = [];

    // Menú principal
    menuLinks.forEach(a => {
      const href = a.getAttribute('href'); // URL
      const txt  = (a.textContent || '').trim(); // Texto
      if (href && txt) fast.push({ href, text: txt }); // Agrega
    });

    // Filtros de galería (atajos a #galeria)
    chips.forEach(c => {
      const txt = (c.textContent || '').trim(); // Texto del chip
      fast.push({ href: '#galeria', text: txt }); // Enlace a galería
    });

    // De-duplicar por (href+text)
    const uniq = [];
    const seen = new Set();
    fast.forEach(it => {
      const key = `${it.href}|${it.text.toLowerCase()}`; // Clave única
      if (seen.has(key)) return; // Evita duplicados
      seen.add(key);
      uniq.push(it);
    });

    const blocked = new Set(['Spa & Wellness','Gastronomía','Exteriores','Eventos'].map(s=>s.toLowerCase())); // Palabras bloqueadas
    const cleaned = uniq.filter(it => !blocked.has(it.text.trim().toLowerCase())); // Filtra bloqueados

    quickEl.innerHTML = cleaned
      .map(it => `<li><a href="${it.href}">${it.text}</a></li>`) // Render
      .join('');
  }
})();
