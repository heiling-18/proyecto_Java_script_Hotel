(() => {
  // Gestión de búsqueda y reserva en la página de reservas.
  const form = document.getElementById("bookingForm"); // busca el formulario principal de reservas
  if (!form) return; // si no existe el formulario, no ejecuta nada

  // Referencias a los campos y elementos de la interfaz de búsqueda.
  const checkin    = document.getElementById("checkin"); // fecha de entrada
  const checkout   = document.getElementById("checkout"); // fecha de salida
  const guests     = document.getElementById("guests"); // número de huéspedes
  const citySel    = document.getElementById("city"); // selector de ciudad

  const nightsChip = document.getElementById("rbNights"); // elemento que muestra noches calculadas
  const grid       = document.getElementById("resultsGrid"); // contenedor de resultados
  const resMsg     = document.getElementById("resMsg"); // mensaje de estado en resultados
  const resTitle   = document.getElementById("resTitle"); // título de resultados
  const resSubtitle= document.getElementById("resSubtitle"); // subtítulo de resultados

  const overlay    = document.getElementById("resOverlay"); // overlay del drawer de reserva
  const drawer     = overlay?.querySelector(".res-drawer"); // panel lateral de reserva
  const bodyDrawer = document.getElementById("resvBody"); // cuerpo del drawer para inyectar HTML
  const btnClose   = document.getElementById("resClose"); // botón cerrar drawer
  const btnCancel  = document.getElementById("resCancel"); // botón cancelar drawer
  const btnConfirm = document.getElementById("resConfirm"); // botón confirmar reserva
  if (btnConfirm) btnConfirm.textContent = "Sí"; // cambia el texto del botón a "Sí"

  // Si el usuario no está autenticado, muestra el drawer y abre el modal de login.
  function showLoginOverDrawer(){
    overlay?.classList.add('auth-on-top'); // marca el drawer para poner la auth encima
    window.ErcAuth?.openLogin?.(); // abre el modal de login global
    const cleanup = () => overlay?.classList.remove('auth-on-top'); // limpia el estilo al cerrar
    window.addEventListener('auth:login',  cleanup, { once:true }); // al loguearse, limpia
    window.addEventListener('auth:logout', cleanup, { once:true }); // al cerrar sesión, limpia
    const auth = document.getElementById('luxeAuth'); // busca el modal de auth
    if (auth) {
      const closes = auth.querySelectorAll('[data-close], .luxe-auth__overlay'); // elementos que cierran modal
      closes.forEach(el => el.addEventListener('click', cleanup, { once:true }));
    }
  }

  // Lista de habitaciones de demostración que siempre están disponibles.
  // Cada habitación tiene propiedades de precio, capacidad y características.
  const demoRooms = [
    { id:"r1", city:"Cartagena",   name:"Suite Vista al Mar", type:"Suite", capacity:2, stars:5, image:"/image/habitacion1.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:true, balcony:true, ac:true, breakfast:true },
      sizeM2:48, view:"Mar", priceNow:612000, priceOld:1020000 },
    { id:"r2", city:"Medellín",    name:"Junior Suite Jardín", type:"Junior Suite", capacity:3, stars:4, image:"/image/habitacion2.jpg",
      features:{ beds:2, wifi:true, minibar:true, hotTub:false, balcony:true, ac:true, breakfast:true },
      sizeM2:40, view:"Jardín", priceNow:429000, priceOld:858000 },
    { id:"r3", city:"Bogotá",      name:"Deluxe King", type:"Deluxe", capacity:2, stars:4, image:"/image/habitacion3.jpg",
      features:{ beds:1, wifi:true, minibar:true, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:32, view:"Ciudad", priceNow:355000, priceOld:718000 },
    { id:"r4", city:"Santa Marta", name:"Doble Estándar", type:"Estándar", capacity:4, stars:3, image:"/image/habitacion4.jpg",
      features:{ beds:2, wifi:true, minibar:false, hotTub:false, balcony:false, ac:true, breakfast:false },
      sizeM2:28, view:"Patio", priceNow:299000, priceOld:598000 }
  ];

  // Fechas ocupadas fijas usadas para comprobar disponibilidad en demo.
  const busy = [
    { roomId:"r1", start:"2025-10-07", end:"2025-10-09" },
    { roomId:"r1", start:"2025-12-24", end:"2025-12-27" },
    { roomId:"r2", start:"2025-10-10", end:"2025-10-14" },
    { roomId:"r3", start:"2025-10-08", end:"2025-10-09" },
    { roomId:"r4", start:"2025-10-20", end:"2025-10-23" }
  ];

  // Lee habitaciones guardadas en localStorage además de las de demo.
  const LS_ROOMS = 'erc_rooms';
  const getLSRooms = () => {
    try {
      const v = JSON.parse(localStorage.getItem(LS_ROOMS) || "[]"); // obtiene el arreglo guardado o array vacío
      return Array.isArray(v) ? v : []; // asegura que sea un arreglo
    } catch { return []; } // si la lectura falla, devuelve arreglo vacío
  };

  // Unifica las habitaciones demo y las que están en localStorage, eliminando duplicados.
  function allRooms(){
    const raw = [...demoRooms, ...getLSRooms()]; // concatena ambas listas
    const map = new Map(); // usa Map para evitar duplicados por id o nombre+ciudad
    for (const r of raw) {
      if (!r || typeof r !== 'object') continue; // ignora valores inválidos
      const id  = String(r.id || '').trim(); // identificador de habitación
      const key = id || `${String(r.city||'').trim()}|${String(r.name||'').trim()}`; // usa id o combinación ciudad+nombre
      if (!map.has(key)) map.set(key, r); // guarda solo la primera ocurrencia
    }
    return [...map.values()]; // devuelve array de habitaciones únicas
  }

  window.__ERC_ROOMS = allRooms(); // exporta la lista global unificada de habitaciones

  /* ========== PRESELECCIÓN QUE VIENE DESDE HOTEL.JS ========== */
  // Normaliza una habitación preseleccionada para que siempre tenga campos esperados.
  function upsertPreselectRoom(pre) {
    if (!pre || typeof pre !== 'object') return null;
    const normalized = {
      id: pre.id || `pre_${Date.now()}`, // genera id propia si no existe
      city: pre.city || '-',
      name: pre.name || 'Habitación',
      type: pre.type || '',
      capacity: Number(pre.capacity || 1),
      stars: Number(pre.stars || 0),
      image: pre.image || '/image/habitacion1.jpg',
      features: pre.features || {},
      sizeM2: Number(pre.sizeM2 || 0),
      view: pre.view || '',
      priceNow: Number(pre.priceNow || 0),
      priceOld: Number(pre.priceOld || pre.priceNow || 0)
    };
    const found = allRooms().find(r => r.id === normalized.id); // busca si ya existe en la lista global
    return found || normalized; // devuelve el existente o el normalizado nuevo
  }

  // Si se abrió la página desde un preseleccionado, carga esa habitación y la muestra.
  function handlePreselectIfAny() {
    const raw = localStorage.getItem('rb_preselect'); // lee preselección guardada
    if (!raw) return;

    let pre = null;
    try { pre = JSON.parse(raw); } catch { pre = null; } // parsea JSON con defensa
    localStorage.removeItem('rb_preselect'); // borra la preselección después de usarla
    if (!pre) return;

    const r = upsertPreselectRoom(pre); // obtiene habitación normalizada
    if (!r) return;

    const today = new Date(); today.setHours(12,0,0,0); // hoy al mediodía para evitar cambios de zona
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1); // mañana

    if (!checkin.value)  checkin.value  = toISO(today); // si no hay checkin, pone hoy
    if (!checkout.value) checkout.value = toISO(tomorrow); // si no hay checkout, pone mañana

    (function syncMins(){
      const inD = parseLocal(checkin.value); // parsea fecha de entrada
      if (inD) {
        const minOut = new Date(inD); minOut.setDate(minOut.getDate() + 1); // salida mínima 1 día después
        checkout.min = toISO(minOut);
      }
      renderNightsChip(); // actualiza chip de noches
    })();

    const inD  = parseLocal(checkin.value);
    const outD = parseLocal(checkout.value);
    if (!inD || !outD || outD <= inD) return; // no continúa si fechas inválidas

    const nights = diffDays(inD, outD);
    resTitle.textContent = 'Disponibilidad';
    resSubtitle.textContent = `Del ${toISO(inD)} al ${toISO(outD)} · ${nights} noche${nights>1?"s":""} · ${guests.value || 1} persona${(parseInt(guests.value||"1",10)>1)?"s":""}`;

    renderResults([r], nights); // muestra solo la habitación preseleccionada

    if (location.hash.includes('preselect')) {
      setTimeout(() => grid?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); // baja al grid si viene de hash
    }
  }

  /* ========== STORAGE RESERVAS ========== */
  // Persistencia de reservas confirmadas en localStorage.
  const LS_BOOKINGS = "erc_reservas";
  const getBookings   = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || "[]"); // lee reservas guardadas
  const saveBookings  = (arr) => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr)); // guarda reservas

  /* ========== HELPERS ========== */
  // Convierte fechas a formato ISO local yyyy-mm-dd para inputs de tipo date.
  const toISO = (d) => {
    const dt = new Date(d); // crea fecha desde valor recibido
    dt.setHours(12,0,0,0); // se fija al mediodía para evitar desfases por zona horaria
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,"0");
    const day = String(dt.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };
  const parseLocal  = (s) => (s ? new Date(`${s}T12:00:00`) : null); // parsea string yyyy-mm-dd como fecha local
  const diffDays    = (a,b) => Math.round((b-a) / 86400000); // diferencia de días entre fechas
  const formatCOP   = (n) => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n); // formatea pesos colombianos
  const starsHTML   = (n) => "★".repeat(n) + "☆".repeat(5-n); // transforma rating en estrellas
  const overlap     = (A,B,C,D) => (A < D) && (C < B); // calcula si dos rangos de fechas se solapan

  // Verifica si una habitación está libre en un rango de fechas comparando con ocupaciones conocidas.
  function isRoomFree(roomId, start, end){
    // revisa bloqueos fijos del demo
    for (const b of busy.filter(x=>x.roomId===roomId)){
      if (overlap(start, end, parseLocal(b.start), parseLocal(b.end))) return false;
    }
    // revisa reservas ya guardadas en localStorage
    for (const r of getBookings().filter(x=>x.roomId===roomId)){
      const rs = new Date(r.start), re = new Date(r.end);
      if (overlap(start, end, rs, re)) return false;
    }
    return true; // si no hubo solapamientos, está libre
  }

  // Comprueba si el usuario ya tiene otra reserva que se cruza con el rango seleccionado.
  function userHasBookingOverlap(email, start, end){
    if (!email) return false;
    return getBookings().some(b =>
      b.userEmail === email &&
      overlap(start, end, new Date(b.start), new Date(b.end))
    );
  }

  // Muestra un chip con el número de noches calculado entre checkin y checkout.
  function renderNightsChip(){
    const a = parseLocal(checkin.value);
    const b = parseLocal(checkout.value);
    const n = (a && b) ? diffDays(a,b) : 0;
    if(n > 0){
      nightsChip.hidden = false;
      nightsChip.textContent = `${n} noche${n>1?"s":""}`;
    } else {
      nightsChip.hidden = true;
      nightsChip.textContent = "—";
    }
  }

  // Establece fechas mínimas válidas para los inputs de reserva.
  const today = new Date(); today.setHours(12,0,0,0);
  const isoToday = toISO(today);
  checkin.min  = isoToday;
  checkout.min = isoToday;

  checkin.addEventListener("change", () => {
    const inD = parseLocal(checkin.value);
    if(inD){
      const minOut = new Date(inD); minOut.setDate(minOut.getDate()+1);
      checkout.min = toISO(minOut);
      const outD = parseLocal(checkout.value);
      if(!outD || outD <= inD){ checkout.value = checkout.min; }
    }
    renderNightsChip();
  });
  checkout.addEventListener("change", renderNightsChip);
  renderNightsChip();

  /* ========== POBLAR SELECT DE CIUDADES (seguro) ========== */
  // Llena el selector de ciudades con valores únicos de las habitaciones disponibles.
  function populateCities(){
    if (!citySel) return;

    const cityList = window.__ERC_ROOMS
      .map(r => String(r.city ?? '').trim())
      .filter(Boolean);

    const cities = [...new Set(cityList)]
      .sort((a,b)=>a.localeCompare(b,'es'));

    citySel.innerHTML =
      `<option value="all" selected>Todas las ciudades</option>` +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
  }
  populateCities();

  // Procesa preselección si venimos desde el carrusel.
  handlePreselectIfAny();

  /* ========== UI RENDER ========== */
  // Crea el HTML de la tarjeta de habitación para mostrar resultados.
  const makeCard = (r, nights) => {
    const f = r.features || {};
    const total = r.priceNow * nights;
    const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? "cama" : "camas"}`;
    const paxTxt  = `${r.capacity} ${r.capacity === 1 ? "huésped" : "huéspedes"}`;

    return `
      <article class="res-card" data-id="${r.id}">
        <div class="res-media">
          <img src="${r.image}" alt="${r.name}" loading="lazy" />
          <span class="res-badge">${starsHTML(r.stars)}</span>
        </div>
        <div class="res-body">
          <h3 class="res-title">${r.name}</h3>
          <p class="res-sub">📍 ${r.city || '-'} · ${r.type} · ${paxTxt} · ${r.sizeM2} m² · Vista ${r.view}</p>
          <div class="res-features">
            <span>🛏️ ${bedsTxt}</span>
            ${f.wifi ? `<span>📶 Wi-Fi</span>` : ""}
            ${f.minibar ? `<span>🥤 Minibar</span>` : ""}
            ${f.hotTub ? `<span>🛁 Jacuzzi</span>` : ""}
            ${f.balcony ? `<span>🌿 Balcón</span>` : ""}
            ${f.ac ? `<span>❄️ A/A</span>` : ""}
            ${f.breakfast ? `<span>🍽️ Desayuno</span>` : ""}
          </div>
          <div class="res-price">
            <div>
              <div class="price-now">${formatCOP(r.priceNow)} / noche</div>
              <div class="price-old">${formatCOP(r.priceOld)}</div>
            </div>
            <button class="res-cta" type="button" data-book="${r.id}" data-nights="${nights}">
              Reservar · ${formatCOP(total)}
            </button>
          </div>
        </div>
      </article>`;
  };

  // Renderiza la lista de habitaciones disponibles dentro del grid de resultados.
  function renderResults(list, nights){
    grid.innerHTML = "";
    resMsg.textContent = "";

    if(!list.length){
      resMsg.textContent = "No hay disponibilidad para esas fechas. Prueba con otras fechas o cambia de ciudad.";
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(r => {
      const wrap = document.createElement("div");
      wrap.innerHTML = makeCard(r, nights);
      frag.appendChild(wrap.firstElementChild);
    });
    grid.appendChild(frag);

    bindReserveButtonsDirect(); // activa el comportamiento de los botones de reservar
  }

  /* ========== BÚSQUEDA ========== */
  // Busca habitaciones libres según fechas, huéspedes y ciudad seleccionada.
  function searchAvailability(e){
    e?.preventDefault();

    const inD  = parseLocal(checkin.value);
    const outD = parseLocal(checkout.value);
    const pax  = parseInt(guests.value || "1", 10);
    const cty  = citySel?.value || "all";

    if(!inD || !outD){ resMsg.textContent = "Selecciona fechas de entrada y salida."; return; }
    const nights = diffDays(inD, outD);
    if(nights <= 0){ resMsg.textContent = "La fecha de salida debe ser posterior a la de entrada."; return; }

    const cityTxt = (cty === "all" ? "todas las ciudades" : cty);
    resTitle.textContent = "Disponibilidad";
    resSubtitle.textContent = `Del ${toISO(inD)} al ${toISO(outD)} · ${nights} noche${nights>1?"s":""} · ${pax} persona${pax>1?"s":""} · en ${cityTxt}`;

    const avail = window.__ERC_ROOMS.filter(r =>
      r.capacity >= pax &&
      (cty === "all" || r.city === cty) &&
      isRoomFree(r.id, inD, outD)
    );
    renderResults(avail, nights);
  }
  form.addEventListener("submit", searchAvailability);
  citySel?.addEventListener('change', () => {
    if (checkin.value && checkout.value) searchAvailability();
  });

  /* ========== TOAST ========== */
  // Muestra un mensaje pequeño en pantalla tipo toast.
  function showToast(msg){
    let t = document.getElementById("appToast");
    if(!t){
      t = document.createElement("div");
      t.id = "appToast";
      t.className = "toast";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._hide);
    t._hide = setTimeout(()=> t.classList.remove("show"), 2200);
  }

  /* ========== RESERVAR (Drawer) ========== */
  // Estado temporal de la reserva que está por confirmar.
  let selected = null;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-book]");
    if (!btn) return;
    e.preventDefault();
    openDrawerFor(btn);
  }, { capture:true });

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest?.("[data-book]");
    if (!btn) return;
    e.preventDefault();
    openDrawerFor(btn);
  });

  function bindReserveButtonsDirect(){
    grid.querySelectorAll("[data-book]").forEach(b => {
      if (b.__bound) return;
      b.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openDrawerFor(b);
      });
      b.__bound = true;
      b.style.pointerEvents = "auto";
      b.tabIndex = 0;
      b.setAttribute("role","button");
    });
  }

  // Abre el panel lateral con los datos de la habitación seleccionada.
  function openDrawerFor(btn){
    const id = btn.getAttribute("data-book");
    const nights = parseInt(btn.getAttribute("data-nights"), 10) || 1;
    const room = window.__ERC_ROOMS.find(r => r.id === id);
    if(!room || !overlay || !drawer || !bodyDrawer) return;

    const inD  = parseLocal(checkin.value);
    const outD = parseLocal(checkout.value);
    if (!inD || !outD) { showToast("Selecciona fechas antes de reservar."); return; }

    selected = {
      room,
      nights,
      inD,
      outD,
      pax:  parseInt(guests.value || "1", 10),
      total: room.priceNow * nights
    };

    bodyDrawer.innerHTML = `
      <div class="resv-room">
        <img class="resv-img" src="${room.image}" alt="${room.name}" />
        <div class="resv-info">
          <h4>${room.name}</h4>
          <p>📍 ${room.city} · ${room.type} · ${room.capacity} huésped(es) · ${room.sizeM2} m² · Vista ${room.view}</p>
          <ul class="resv-feat">
            <li>🛏 ${room.features?.beds || 1} cama(s)</li>
            ${room.features?.wifi?'<li>📶 Wi-Fi</li>':''}
            ${room.features?.minibar?'<li>🥤 Minibar</li>':''}
            ${room.features?.hotTub?'<li>🛁 Jacuzzi</li>':''}
            ${room.features?.balcony?'<li>🌿 Balcón</li>':''}
            ${room.features?.ac?'<li>❄️ A/A</li>':''}
            ${room.features?.breakfast?'<li>🍽️ Desayuno</li>':''}
          </ul>
        </div>
      </div>

      <div class="resv-summary">
        <div><span>Entrada</span><strong>${checkin.value}</strong></div>
        <div><span>Salida</span><strong>${checkout.value}</strong></div>
        <div><span>Ciudad</span><strong>${room.city}</strong></div>
        <div><span>Huéspedes</span><strong>${selected.pax}</strong></div>
        <div><span>Noches</span><strong>${selected.nights}</strong></div>
        <div class="total">
          <span>Total a pagar</span>
          <span class="resv-total">${formatCOP(selected.total)} COP</span>
        </div>
      </div>
    `;

    overlay.hidden = false;
    requestAnimationFrame(()=> drawer.classList.add("is-open"));
  }

  // Cierra el drawer de reserva y limpia el estado seleccionado.
  function closeDrawer(){
    drawer?.classList.remove("is-open");
    setTimeout(()=> overlay.hidden = true, 160);
    overlay?.classList.remove('auth-on-top');
    selected = null;
  }
  btnClose?.addEventListener("click", closeDrawer);
  btnCancel?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", (e)=> { if (e.target === overlay) closeDrawer(); });

  // Confirma la reserva tras validar login y disponibilidad.
  btnConfirm?.addEventListener("click", () => {
    if (!selected) return;

    const ses = window.ErcAuth?.getSession?.();
    if (!ses) {
      showToast("Debes iniciar sesión para confirmar tu reserva.");
      showLoginOverDrawer();
      return;
    }

    if (userHasBookingOverlap(ses.email, selected.inD, selected.outD)) {
      resMsg.textContent = "Ya tienes una reserva en ese rango de fechas.";
      showToast("Ya tienes una reserva para esas fechas.");
      closeDrawer();
      return;
    }

    if (!isRoomFree(selected.room.id, selected.inD, selected.outD)) {
      resMsg.textContent = "Lo sentimos, la habitación ya no está disponible en esas fechas.";
      closeDrawer();
      searchAvailability();
      return;
    }

    // Snapshot incluye ciudad y características para mantener datos aunque cambie la habitación original.
    const r = selected.room;
    const snap = (({id, city, name, type, sizeM2, view, stars, image, features}) =>
      ({id, city, name, type, sizeM2, view, stars, image, features}))(r);

    const booking = {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      roomId: r.id,
      roomName: r.name,
      snapshot: snap,
      userEmail: ses?.email || null,
      userName:  ses?.name  || null,
      pricePerNight: r.priceNow,
      total: selected.total,
      guests: selected.pax,
      start: selected.inD.toISOString(),
      end:   selected.outD.toISOString(),
      createdAt: new Date().toISOString(),
      status: "confirmada"
    };

    const all = getBookings();
    all.push(booking);
    saveBookings(all);

    showToast("¡Reserva confirmada!");
    resMsg.textContent = "¡Reserva confirmada! La verás en “Mis reservas”.";
    closeDrawer();
    searchAvailability();
    window.dispatchEvent(new Event('booking:changed'));
  });

  window.addEventListener('booking:changed', () => {
    if (checkin.value && checkout.value) searchAvailability();
  });

  if(checkin.value && checkout.value) searchAvailability();

  // Exporta utilidades para que otros módulos accedan a reservas y funciones relacionadas.
  window.Resv = {
    getBookings, saveBookings, toISO, parseLocal, diffDays, overlap,
    isRoomFree, busy, showToast, rooms: window.__ERC_ROOMS
  };
})();

/* ===================== MIS RESERVAS (solo del usuario) ===================== */
(() => {
  // Sección que muestra y edita solo las reservas del usuario autenticado.
  const LS_BOOKINGS = 'erc_reservas';
  const getBookings = () => JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]'); // lee todas las reservas
  const saveBookings = arr => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr)); // guarda reservas actualizadas
  const toISO = (d) => { const dt = new Date(d); dt.setHours(12,0,0,0); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
  const parseLocal = (s) => (s ? new Date(`${s}T12:00:00`) : null);
  const diffDays = (a,b) => Math.round((b-a)/86400000);
  const overlap  = (A,B,C,D) => (A < D) && (C < B);
  const formatCOP = n => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
  const starsHTML = n => '★'.repeat(n||0) + '☆'.repeat(Math.max(0,5-(n||0)));

  // IMPORTANTE: Usar SOLO la lista unificada expuesta por el primer IIFE
  // Obtiene la lista de habitaciones global para usar en el historial del usuario.
  const allRooms = () => {
    const base = Array.isArray(window.__ERC_ROOMS) ? window.__ERC_ROOMS : [];
    const map = new Map(); // dedup para evitar duplicados inesperados
    for (const r of base) {
      if (!r || typeof r !== 'object') continue;
      const id  = String(r.id || '').trim();
      const key = id || `${String(r.city||'').trim()}|${String(r.name||'').trim()}`;
      if (!map.has(key)) map.set(key, r);
    }
    return [...map.values()];
  };

  const sec   = document.getElementById('myBookingsSec'); // sección de reservas del usuario
  const list  = document.getElementById('myBookingsList');

  const editOverlay = document.getElementById('editOverlay');
  const editDrawer  = editOverlay?.querySelector('.res-drawer');
  const eIn   = document.getElementById('editCheckin');
  const eOut  = document.getElementById('editCheckout');
  const eSave = document.getElementById('editSave');
  const eClose= document.getElementById('editClose');
  const nEl  = document.getElementById('editNights');
  const tEl  = document.getElementById('editTotal');

  let editing = null;

  // Renderiza las reservas del usuario que abrió sesión.
  function renderMyBookings(){
    if (!sec || !list) return;
    const ses = window.ErcAuth?.getSession?.();
    if (!ses){
      sec.hidden = true;
      list.innerHTML = '';
      return;
    }

    const mine = getBookings()
      .filter(b => b.userEmail === ses.email)
      .sort((a,b) => new Date(a.start) - new Date(b.start));

    sec.hidden = false;

    if (!mine.length){
      list.innerHTML = `<p class="res-note">Aún no tienes reservas.</p>`;
      return;
    }

    list.innerHTML = mine.map(b => {
      const snap = b.snapshot || allRooms().find(r => r.id === b.roomId) || {};
      const f       = snap.features || {};
      const bedsTxt = `${f.beds || 1} ${f.beds === 1 ? 'cama' : 'camas'}`;
      const nights  = diffDays(new Date(b.start), new Date(b.end));

      return `
        <article class="res-card" data-id="${b.id}">
          <div class="res-media">
            <img src="${snap.image || '/image/habitacion1.jpg'}" alt="${b.roomName}" loading="lazy" />
            <span class="res-badge">${starsHTML(snap.stars || 0)}</span>
          </div>

          <div class="res-body">
            <h3 class="res-title">${b.roomName}</h3>
            <p class="res-sub">📍 ${snap.city || '-'} · ${snap.type || ''} · ${b.guests} huésped(es) · ${snap.sizeM2 || '-'} m² · Vista ${snap.view || '-'}</p>

            <div class="res-features">
              <span>📅 ${toISO(new Date(b.start))} → ${toISO(new Date(b.end))} (${nights} noche${nights>1?'s':''})</span>
              <span>🛏️ ${bedsTxt}</span>
              ${f.wifi ? `<span>📶 Wi-Fi</span>` : ``}
              ${f.minibar ? `<span>🥤 Minibar</span>` : ``}
              ${f.hotTub ? `<span>🛁 Jacuzzi</span>` : ``}
              ${f.balcony ? `<span>🌿 Balcón</span>` : ``}
              ${f.ac ? `<span>❄️ A/A</span>` : ``}
              ${f.breakfast ? `<span>🍽️ Desayuno</span>` : ``}
            </div>

            <div class="res-price">
              <div>
                <div class="price-now">${formatCOP(b.pricePerNight)} / noche</div>
                <div class="price-old">&nbsp;</div>
              </div>

              <div class="card-actions">
                <button class="btn-card" data-edit="${b.id}">Editar fechas</button>
                <button class="btn-card btn-card--danger" data-cancel="${b.id}">Cancelar</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Cancelar reserva: elimina la reserva del usuario.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-cancel]');
    if (!btn) return;
    const id = btn.getAttribute('data-cancel');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    const all = getBookings().filter(b => b.id !== id);
    saveBookings(all);
    if (window.Resv?.showToast) window.Resv.showToast('Reserva cancelada.');
    renderMyBookings();
    window.dispatchEvent(new Event('booking:changed'));
  });

  // Abrir editor de fechas para una reserva existente.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-edit]');
    if (!btn) return;
    const id = btn.getAttribute('data-edit');
    const b = getBookings().find(x => x.id === id);
    if (!b) return;

    editing = b;
    eIn.value  = toISO(new Date(b.start));
    eOut.value = toISO(new Date(b.end));
    const hoy = toISO(new Date());
    eIn.min = hoy; eOut.min = hoy;

    editOverlay.hidden = false;
    requestAnimationFrame(() => editDrawer.classList.add('is-open'));
    updateEditPreview();
  });

  // Cierra el drawer de edición de reserva.
  function closeEdit(){
    editDrawer?.classList.remove('is-open');
    setTimeout(() => editOverlay.hidden = true, 160);
    editing = null;
    eSave?.classList.remove('is-loading','is-done');
  }
  eClose?.addEventListener('click', closeEdit);
  editOverlay?.addEventListener('click', (e) => { if (e.target === editOverlay) closeEdit(); });

  // Actualiza la vista previa de noches y total durante la edición.
  function updateEditPreview(){
    if (!nEl || !tEl || !editing) return;
    const s = parseLocal(eIn.value);
    const t = parseLocal(eOut.value);
    if (!s || !t || t <= s){ nEl.textContent='—'; tEl.textContent='—'; return; }
    const nights = diffDays(s, t);
    nEl.textContent = String(nights);
    const total = (editing.pricePerNight || 0) * nights;
    tEl.textContent = new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(total);
  }
  eIn?.addEventListener('input', updateEditPreview);
  eOut?.addEventListener('input', updateEditPreview);

  function isRoomFreeForEdit(roomId, start, end, excludeId){
    for (const b of (window.Resv?.busy || [])){
      if (b.roomId === roomId && overlap(start, end, new Date(b.start), new Date(b.end))) return false;
    }
    for (const r of getBookings().filter(x => x.roomId === roomId && x.id !== excludeId)){
      if (overlap(start, end, new Date(r.start), new Date(r.end))) return false;
    }
    return true;
  }
  function userOverlapExcept(email, start, end, excludeId){
    return getBookings().some(b =>
      b.id !== excludeId && b.userEmail === email &&
      overlap(start, end, new Date(b.start), new Date(b.end))
    );
  }

  // Guarda cambios en la reserva editada después de validar fechas y disponibilidad.
  eSave?.addEventListener('click', () => {

    const s = parseLocal(eIn.value);
    const t = parseLocal(eOut.value);
    if (!s || !t || t <= s){ alert('Revisa las fechas.'); return; }

    if (!isRoomFreeForEdit(editing.roomId, s, t, editing.id)){
      alert('La habitación no está disponible en esas fechas.');
      return;
    }
    if (userOverlapExcept(editing.userEmail, s, t, editing.id)){
      alert('Ya tienes otra reserva que se cruza con esas fechas.');
      return;
    }

    eSave.classList.add('is-loading');

    const all = getBookings();
    const i   = all.findIndex(x => x.id === editing.id);
    const nights = diffDays(s, t);

    all[i] = {
      ...editing,
      start: s.toISOString(),
      end:   t.toISOString(),
      total: nights * (editing.pricePerNight || 0),
      updatedAt: new Date().toISOString()
    };
    saveBookings(all);

    eSave.classList.remove('is-loading');
    eSave.classList.add('is-done');

    setTimeout(() => {
      if (window.Resv?.showToast) window.Resv.showToast('Reserva actualizada.');
      closeEdit();
      renderMyBookings();
      window.dispatchEvent(new Event('booking:changed'));
    }, 650);
  });

  window.addEventListener('auth:login',  renderMyBookings);
  window.addEventListener('auth:logout', renderMyBookings);
  window.addEventListener('booking:changed', renderMyBookings);
  document.addEventListener('DOMContentLoaded', renderMyBookings);
})();
