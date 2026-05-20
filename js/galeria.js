(() => {
  const grid = document.getElementById('galleryGrid'); // Contenedor principal de la galería
  if (!grid) return; // Si no existe, no ejecuta nada más

  const items = Array.from(grid.querySelectorAll('.g-item')); // Todas las tarjetas de la galería
  const chips = Array.from(document.querySelectorAll('.gallery-filters .chip')); // Botones de filtro

  /* ====== Filtros ====== */
  const applyFilter = (cat) => {
    items.forEach((el) => {
      const show = cat === '*' ? true : el.classList.contains(cat); // Muestra todo (*) o solo la categoría
      el.style.display = show ? '' : 'none'; // Oculta o muestra el item
    });
  };

  chips.forEach((btn) => {
    btn.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('is-active')); // Quita estado activo a todos
      btn.classList.add('is-active'); // Marca el chip clicado
      applyFilter(btn.dataset.filter); // Aplica el filtro según data-filter
    });
  });

  /* ====== Lightbox ====== */
  const lb = document.getElementById('lightbox'); // Contenedor del lightbox
  const lbImg = document.getElementById('lbImg'); // Imagen grande
  const lbCap = document.getElementById('lbCap'); // Texto de la descripción
  const btnC = lb.querySelector('.lb-close'); // Botón cerrar
  const btnP = lb.querySelector('.lb-prev'); // Botón anterior
  const btnN = lb.querySelector('.lb-next'); // Botón siguiente

  let currentIndex = 0; // Índice actual dentro de los elementos visibles

  const visibleItems = () =>
    items.filter(el => el.style.display !== 'none'); // Solo items que no están ocultos por filtros

  const open = (indexFromDOM) => {
    const list = visibleItems(); // Lista filtrada

    currentIndex = list.indexOf(items[indexFromDOM]); // Convierte índice DOM → índice dentro de visibles

    if (currentIndex < 0) currentIndex = 0; // Seguridad por si no encuentra

    render(); // Carga imagen y caption

    lb.classList.add('is-open'); // Muestra lightbox
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden'; // Bloquea scroll del body
  };

  const close = () => {
    lb.classList.remove('is-open'); // Oculta lightbox
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = ''; // Restaura scroll
  };

  const render = () => {
    const list = visibleItems(); // Items visibles
    const el = list[currentIndex] || list[0]; // Item actual o fallback

    if (!el) return;

    const img = el.querySelector('img'); // Imagen del item
    const cap = el.querySelector('figcaption')?.textContent || ''; // Caption del item

    /* ===== ARREGLO ===== */
    lbImg.src = img.src; // Usa la misma imagen del item (antes usabas dataset.large)
    lbImg.alt = img.alt || cap; // Accesibilidad
    lbCap.textContent = cap; // Texto del caption
  };

  const next = () => {
    const list = visibleItems();
    if (!list.length) return;

    currentIndex = (currentIndex + 1) % list.length; // Avanza circularmente
    render();
  };

  const prev = () => {
    const list = visibleItems();
    if (!list.length) return;

    currentIndex = (currentIndex - 1 + list.length) % list.length; // Retrocede circularmente
    render();
  };

  /* ===== Abrir al click ===== */
  items.forEach((el) => {
    el.addEventListener('click', () => {
      open(Number(el.dataset.index)); // Abre según el índice guardado en data-index
    });
  });

  /* ===== Controles ===== */
  btnC.addEventListener('click', close); // Cerrar
  btnN.addEventListener('click', next); // Siguiente
  btnP.addEventListener('click', prev); // Anterior

  /* ===== Teclado ===== */
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('is-open')) return; // Solo si está abierto

    if (e.key === 'Escape') close(); // Cerrar con ESC
    if (e.key === 'ArrowRight') next(); // Flecha derecha → siguiente
    if (e.key === 'ArrowLeft') prev(); // Flecha izquierda → anterior
  });

  /* ===== Cerrar al click de fondo ===== */
  lb.addEventListener('click', (e) => {
    if (e.target === lb) close(); // Si clicas fuera de la imagen, cierra
  });
})();
