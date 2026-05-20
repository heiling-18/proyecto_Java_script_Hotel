(() => {
  // Track del carrusel: puede ser roomsTrack o hotelsTrack
  const track =
    document.getElementById("roomsTrack") ||
    document.getElementById("hotelsTrack");
  if (!track) return;

  // Datos por defecto de habitaciones (se usan si no hay datos en localStorage)
  const DEFAULT_ROOMS = [
    {
      id: "r1",
      name: "Suite Vista al Mar",
      type: "Suite",
      capacity: 2,        
      rating: 9.2,
      stars: 5,
      image: "/image/habitacion1.jpg",
      features: { beds: 1, wifi: true, minibar: true, hotTub: true, balcony: true, ac: true, breakfast: true },
      sizeM2: 48,
      view: "Mar",
      priceNow: 612000, priceOld: 1020000, discount: 40,
      refDate: "25 octubre 2025"
    },
    {
      id: "r2",
      name: "Junior Suite Jardín",
      type: "Junior Suite",
      capacity: 3,
      rating: 8.6,
      stars: 4,
      image: "/image/habitacion2.jpg",
      features: { beds: 2, wifi: true, minibar: true, hotTub: false, balcony: true, ac: true, breakfast: true },
      sizeM2: 40,
      view: "Jardín",
      priceNow: 429000, priceOld: 858000, discount: 50,
      refDate: "8 octubre 2025"
    },
    {
      id: "r3",
      name: "Deluxe King",
      type: "Deluxe",
      capacity: 2,
      rating: 8.9,
      stars: 4,
      image: "/image/habitacion3.jpg",
      features: { beds: 1, wifi: true, minibar: true, hotTub: false, balcony: false, ac: true, breakfast: false },
      sizeM2: 32,
      view: "Ciudad",
      priceNow: 355000, priceOld: 718000, discount: 51,
      refDate: "20 diciembre 2025"
    },
    {
      id: "r4",
      name: "Doble Estándar",
      type: "Estándar",
      capacity: 4,
      rating: 8.1,
      stars: 3,
      image: "/image/habitacion4.jpg",
      features: { beds: 2, wifi: true, minibar: false, hotTub: false, balcony: false, ac: true, breakfast: false },
      sizeM2: 28,
      view: "Patio",
      priceNow: 299000, priceOld: 598000, discount: 50,
      refDate: "17 octubre 2025"
    }
  ];

  // Sincroniza DEFAULT_ROOMS con localStorage sin sobrescribir ediciones del admin
  (function syncToStorage() {
    try {
      const stored = JSON.parse(localStorage.getItem("erc_rooms") || "[]");
      const storedIds = new Set(stored.map((r) => r.id));

      // Solo agrega las habitaciones que no existan aún
      const toAdd = DEFAULT_ROOMS.filter((r) => !storedIds.has(r.id));
      if (toAdd.length > 0 || stored.length === 0) {
        const merged = stored.length === 0 ? DEFAULT_ROOMS : [...stored, ...toAdd];
        localStorage.setItem("erc_rooms", JSON.stringify(merged));
      }
    } catch (e) {
      console.warn("[hotel.js] No se pudo sincronizar erc_rooms:", e);
    }
  })();

  /* ── Leer habitaciones desde storage (incluye ediciones del admin) ── */
  let rooms;
  try {
    const stored = JSON.parse(localStorage.getItem("erc_rooms") || "[]");
    rooms = stored.length > 0 ? stored : DEFAULT_ROOMS; // Usa storage si existe
  } catch {
    rooms = DEFAULT_ROOMS;
  }

  /* ===== Helpers ===== */

  // Formatea números como moneda COP
  const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  // Genera estrellas ★★★☆☆
  const starsHTML = (n) => "★".repeat(n) + "☆".repeat(5 - n);

  const nextBtn = track.querySelector(".track-arrow.next");
  const prevBtn = track.querySelector(".track-arrow.prev");

  /* ===== Render ===== */

  // Genera el HTML de cada tarjeta de habitación
  const makeCard = (r) => {
    const f = r.features || {};
    const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? "cama" : "camas"}`;
    const paxTxt = `${r.capacity} ${r.capacity === 1 ? "huésped" : "huéspedes"}`;

    // Calcula descuento si no viene explícito
    const discount = r.discount || (r.priceOld > r.priceNow
      ? Math.round((1 - r.priceNow / r.priceOld) * 100)
      : 0);

    const refDate = r.refDate || "";
    const rating  = r.rating  || "";

    return `
      <article class="hotel-card room-card" data-id="${r.id}">
        <div class="hotel-media">
          <img src="${r.image}" alt="${r.name}" loading="lazy">
          ${rating ? `<span class="hotel-chip chip-score" title="Calificación">${Number(r.rating).toFixed(1)}</span>` : ""}
          <span class="hotel-chip chip-stars" title="Categoría">${starsHTML(r.stars)}</span>
          <span class="hotel-chip chip-view" title="Vista">${r.view}</span>
        </div>

        <div class="hotel-body">
          <h3 class="hotel-title">${r.name}</h3>
          <p class="hotel-sub">${r.type} · ${paxTxt} · ${r.sizeM2} m²</p>

          <div class="hotel-features">
            <span class="feature"><i class="fi fi-bed"></i>${bedsTxt}</span>
            ${f.wifi      ? `<span class="feature"><i class="fi fi-wifi"></i>Wi-Fi</span>`        : ""}
            ${f.minibar   ? `<span class="feature"><i class="fi fi-mini"></i>Minibar</span>`      : ""}
            ${f.hotTub    ? `<span class="feature"><i class="fi fi-hot-tub"></i>Jacuzzi</span>`   : ""}
            ${f.balcony   ? `<span class="feature"><i class="fi fi-balcony"></i>Balcón</span>`    : ""}
            ${f.ac        ? `<span class="feature"><i class="fi fi-ac"></i>A/A</span>`            : ""}
            ${f.breakfast ? `<span class="feature"><i class="fi fi-breakfast"></i>Desayuno</span>`: ""}
          </div>

          <div class="price-block">
            <div>
              <div class="price-now">${formatCOP(r.priceNow)}</div>
              ${r.priceOld && r.priceOld > r.priceNow
                ? `<div class="price-old">${formatCOP(r.priceOld)}</div>` : ""}
            </div>
            ${discount ? `<div class="discount-badge">-${discount}%</div>` : ""}
          </div>

          <div class="card-actions">
            ${refDate ? `<div class="ref-date">Fecha de referencia: ${refDate}</div>` : ""}
            <button class="btn-card" data-book="${r.id}">Reservar</button>
          </div>
        </div>
      </article>`;
  };

  // Inserta todas las tarjetas en el carrusel
  const frag = document.createDocumentFragment();
  const insertBeforeNode = nextBtn || null;

  rooms.forEach((r) => {
    const wrap = document.createElement("div");
    wrap.innerHTML = makeCard(r);
    frag.appendChild(wrap.firstElementChild);
  });

  track.insertBefore(frag, insertBeforeNode);

  /* ===== Arrows / Navegación ===== */

  // Calcula cuánto desplazar el carrusel por clic
  const getStep = () => {
    const card = track.querySelector(".hotel-card");
    if (!card) return 320;
    return Math.round(card.getBoundingClientRect().width + 16);
  };

  // Habilita/deshabilita flechas según scroll
  const updateArrows = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const x = Math.round(track.scrollLeft);
    prevBtn?.classList.toggle("is-disabled", x <= 2);
    nextBtn?.classList.toggle("is-disabled", x >= maxScroll - 2);
  };

  prevBtn?.addEventListener("click", () => track.scrollBy({ left: -getStep(), behavior: "smooth" }));
  nextBtn?.addEventListener("click", () => track.scrollBy({ left:  getStep(), behavior: "smooth" }));
  track.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  updateArrows();

  /* ===== Arrastre con inercia ===== */

  let dragging = false, startX = 0, startLeft = 0;
  let lastX = 0, lastT = 0, velocity = 0;
  let cancelClick = false, rafMomentum = 0;

  const now  = () => performance.now();
  const getX = (ev) => ("touches" in ev ? ev.touches[0].clientX : ev.clientX);

  // Inicio del arrastre
  const onDown = (ev) => {
    dragging = true; cancelClick = false; velocity = 0;
    startX = getX(ev); startLeft = track.scrollLeft;
    lastX = startX; lastT = now();
    track.classList.add("is-dragging");
    if (rafMomentum) { cancelAnimationFrame(rafMomentum); rafMomentum = 0; }
  };

  // Movimiento del arrastre
  const onMove = (ev) => {
    if (!dragging) return;
    const x = getX(ev);
    track.scrollLeft = startLeft - (x - startX);

    const t = now(), dt = Math.max(1, t - lastT);
    velocity = (x - lastX) / dt; // Velocidad para inercia
    lastX = x; lastT = t;

    if (Math.abs(x - startX) > 4) cancelClick = true;
  };

  // Inercia al soltar
  const momentum = () => {
    const step = () => {
      velocity *= 0.95; // Frenado gradual
      if (Math.abs(velocity) < 0.02) { rafMomentum = 0; updateArrows(); return; }
      track.scrollLeft -= velocity * 16;
      rafMomentum = requestAnimationFrame(step);
    };
    rafMomentum = requestAnimationFrame(step);
  };

  // Fin del arrastre
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-dragging");
    if (Math.abs(velocity) > 0.04) momentum();
    updateArrows();
    setTimeout(() => { cancelClick = false; }, 0);
  };

  // Eventos de arrastre
  track.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  track.addEventListener("touchstart", onDown, { passive: true });
  track.addEventListener("touchmove",  onMove, { passive: true });
  track.addEventListener("touchend",   onUp);

  // Evita clics accidentales durante arrastre
  track.addEventListener("click", (e) => {
    if (cancelClick) { e.stopPropagation(); e.preventDefault(); }
  }, true);

  /* ===== Accesibilidad: teclado ===== */
  track.setAttribute("tabindex", "0");
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") nextBtn?.click();
    if (e.key === "ArrowLeft")  prevBtn?.click();
  });

  /* ===== CTA Reservar ===== */
  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-book]");
    if (!btn) return;

    const id   = btn.getAttribute("data-book");
    const room = rooms.find((r) => r.id === id);
    if (!room) return;

    // Guarda la habitación seleccionada para precargar en reservas.html
    localStorage.setItem("rb_preselect", JSON.stringify({
      id: room.id, name: room.name, type: room.type,
      capacity: room.capacity, rating: room.rating, stars: room.stars,
      image: room.image, features: room.features, sizeM2: room.sizeM2,
      view: room.view, priceNow: room.priceNow, priceOld: room.priceOld,
      discount: room.discount, refDate: room.refDate
    }));

    window.location.href = "reservas.html#preselect";
  });
})();
