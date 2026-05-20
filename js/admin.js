(() => {
  'use strict';

  // Módulo administrativo para gestión de habitaciones y reservas.
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ================== Storage ================== */
  const LS_ROOMS    = 'erc_rooms';
  const LS_BOOKINGS = 'erc_reservas';

  // Lectura/escritura de datos de habitaciones y reservas en localStorage.
  const getRoomsRaw  = () => { try { return JSON.parse(localStorage.getItem(LS_ROOMS) || '[]'); } catch { return []; } };
  const saveRoomsRaw = (arr) => localStorage.setItem(LS_ROOMS, JSON.stringify(arr));
  const getBookings  = () => { try { return JSON.parse(localStorage.getItem(LS_BOOKINGS) || '[]'); } catch { return []; } };
  const saveBookings = (arr) => localStorage.setItem(LS_BOOKINGS, JSON.stringify(arr));


  const SEED_ROOMS = [
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

  // Rellena datos iniciales de habitaciones si no hay nada guardado.
  // Esto permite arrancar la sección admin con contenido de ejemplo.
  (function seedNow() {
    try {
      const existing = getRoomsRaw();
      if (existing.length === 0) {
        saveRoomsRaw(SEED_ROOMS);
        console.info('[Admin] erc_rooms inicializado con habitaciones por defecto.');
      }
    } catch(e) {
      console.warn('[Admin] seed falló:', e);
    }
  })();

  /* ================== Utils ================== */
  // Funciones utilitarias para formateo, fechas y cálculo de reservas.
  const formatCOP = (n) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
  const toISO     = (d) => { const dt = new Date(d); dt.setHours(12,0,0,0); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`; };
  const fmtDate   = (iso) => { try { return toISO(new Date(iso)); } catch { return iso || '—'; } };
  const uid       = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()));
  const parseLocal= (s) => (s ? new Date(`${s}T12:00:00`) : null);
  const diffDays  = (a,b) => Math.round((b-a)/86400000);
  const overlap   = (A,B,C,D) => (A < D) && (C < B);

  const normalizeRoom = (r={}) => ({
    id:       r.id || r.roomId || '',
    city:     r.city ?? r.ciudad ?? r.City ?? '',
    name:     r.name ?? r.nombre ?? r.roomName ?? '',
    type:     r.type ?? r.tipo ?? '',
    capacity: Number(r.capacity ?? r.capacidad ?? 0),
    stars:    Number(r.stars ?? r.estrellas ?? 0),
    sizeM2:   Number(r.sizeM2 ?? r.m2 ?? r.metros ?? 0),
    view:     r.view ?? r.vista ?? '',
    priceNow: Number(r.priceNow ?? r.precio ?? r.price ?? 0),
    priceOld: Number(r.priceOld ?? r.precioAntes ?? r.priceBefore ?? r.priceNow ?? r.precio ?? 0),
    image:    r.image ?? r.img ?? r.foto ?? '',
    features: r.features ?? r.caracteristicas ?? {},
  });

  const denormalize = (nr) => ({
    id: nr.id, city: nr.city, name: nr.name, type: nr.type,
    capacity: nr.capacity, stars: nr.stars, sizeM2: nr.sizeM2,
    view: nr.view, priceNow: nr.priceNow, priceOld: nr.priceOld ?? nr.priceNow,
    image: nr.image,
    features: nr.features || { beds:1, wifi:true, minibar:false, hotTub:false, balcony:false, ac:true, breakfast:false }
  });

  const getRooms  = () => getRoomsRaw().map(normalizeRoom);
  const saveRooms = (arr) => saveRoomsRaw(arr.map(denormalize));

  /* ================== Tabs / Secciones ================== */
  // Controla las pestañas de la interfaz admin: habitaciones, reservas y quejas.
  const tabButtons = $$('.tabs .tab');
  const sections   = { rooms: $('#tab-rooms'), bookings: $('#tab-bookings'), quejas: $('#tab-quejas') };

  const roomsTbody    = $('#roomsTable tbody');
  const bookingsTbody = $('#bookingsTable tbody');
  const fCityRooms    = $('#fCityRooms');
  const qRooms        = $('#qRooms');
  const fCityBookings = $('#fCityBookings');
  const qBookings     = $('#qBookings');
  const btnNewRoom    = $('#btnNewRoom');

  function activateTab(name){
    tabButtons.forEach(b=>{
      const on = b.dataset.tab === name;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    Object.entries(sections).forEach(([key,sec])=>{
      sec?.classList.toggle('is-active', key===name);
    });
  }
  tabButtons.forEach(btn=> btn.addEventListener('click', ()=> activateTab(btn.dataset.tab)));

  /* ================== Filtros ciudad ================== */
  function uniqueCities(){
    return [...new Set(getRooms().map(r=>(r.city||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
  }
  function fillCityFilters(){
    const opts = (list) => ['<option value="all">Todas las ciudades</option>', ...list.map(c=>`<option value="${c}">${c}</option>`)].join('');
    const cities = uniqueCities();
    if (fCityRooms)    fCityRooms.innerHTML    = opts(cities);
    if (fCityBookings) fCityBookings.innerHTML = opts(cities);
  }

  /* ================== Toast ================== */
  function showToast(msg, type='success'){
    let t = document.getElementById('admToast');
    if(!t){
      t = document.createElement('div');
      t.id = 'admToast';
      t.style.cssText = `position:fixed;right:16px;bottom:16px;z-index:9999;
        padding:10px 16px;border-radius:10px;
        font:600 14px/1 Inter,system-ui,sans-serif;
        box-shadow:0 10px 30px rgba(0,0,0,.3);
        transform:translateY(20px);opacity:0;transition:.25s ease;`;
      document.body.appendChild(t);
    }
    t.style.background = type==='error' ? '#ef4444' : '#10b981';
    t.style.color      = type==='error' ? '#fff'     : '#0b1321';
    t.textContent = msg;
    requestAnimationFrame(()=>{ t.style.opacity=1; t.style.transform='translateY(0)'; });
    clearTimeout(t._h);
    t._h = setTimeout(()=>{ t.style.opacity=0; t.style.transform='translateY(20px)'; }, 2400);
  }

  /* ================== Modal Habitación ================== */
  function ensureRoomModal(){
    if (document.getElementById('roomOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div class="adm-overlay" id="roomOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true" aria-labelledby="roomModalTitle">
        <header class="adm-modal__head">
          <h3 id="roomModalTitle">Nueva habitación</h3>
          <button class="adm-close" data-close>×</button>
        </header>
        <form id="roomForm" class="adm-form">
          <div class="adm-grid-2">
            <label>Ciudad <input type="text" id="rmCity" required></label>
            <label>Nombre <input type="text" id="rmName" required></label>
            <label>Tipo <input type="text" id="rmType" placeholder="Suite, Deluxe, Estándar…"></label>
            <label>Capacidad <input type="number" id="rmCap" min="1" value="2" required></label>
            <label>Estrellas <input type="number" id="rmStars" min="0" max="5" value="4"></label>
            <label>Metros (m²) <input type="number" id="rmM2" min="0" value="30"></label>
            <label>Vista <input type="text" id="rmView" placeholder="Mar, Ciudad, Jardín…"></label>
            <label>Precio /noche (COP) <input type="number" id="rmPrice" min="0" value="300000" required></label>
            <label class="adm-grid-span">Imagen (URL) <input type="url" id="rmImg" placeholder="https://…"></label>
          </div>
          <fieldset class="adm-feats">
            <legend>Características</legend>
            <label><span>Camas</span><input type="number" id="rmBeds" min="1" value="1"></label>
            <label><input type="checkbox" id="rmWifi" checked> Wi-Fi</label>
            <label><input type="checkbox" id="rmMinibar"> Minibar</label>
            <label><input type="checkbox" id="rmHotTub"> Jacuzzi</label>
            <label><input type="checkbox" id="rmBalcony"> Balcón</label>
            <label><input type="checkbox" id="rmAC" checked> A/A</label>
            <label><input type="checkbox" id="rmBreakfast"> Desayuno</label>
          </fieldset>
          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--primary">Guardar</button>
          </footer>
        </form>
      </section>
    </div>`);
    const ov = document.getElementById('roomOverlay');
    ov.addEventListener('click', e=>{ if(e.target===ov||e.target.closest('[data-close]')) closeRoomModal(); });
    document.addEventListener('keydown', ev=>{ if(ov.classList.contains('is-open')&&ev.key==='Escape') closeRoomModal(); });
  }

  function openRoomModal(mode, room, onSave){
    ensureRoomModal();
    const ov    = document.getElementById('roomOverlay');
    const title = document.getElementById('roomModalTitle');
    const form  = document.getElementById('roomForm');
    const r = room || { id:null,city:'',name:'',type:'',capacity:2,stars:4,sizeM2:30,view:'',priceNow:300000,image:'',
      features:{beds:1,wifi:true,minibar:false,hotTub:false,balcony:false,ac:true,breakfast:false} };

    $('#rmCity').value        = r.city      || '';
    $('#rmName').value        = r.name      || '';
    $('#rmType').value        = r.type      || '';
    $('#rmCap').value         = r.capacity  ?? 2;
    $('#rmStars').value       = r.stars     ?? 0;
    $('#rmM2').value          = r.sizeM2    ?? 0;
    $('#rmView').value        = r.view      || '';
    $('#rmPrice').value       = r.priceNow  ?? 0;
    $('#rmImg').value         = r.image     || '';
    $('#rmBeds').value        = r.features?.beds ?? 1;
    $('#rmWifi').checked      = !!r.features?.wifi;
    $('#rmMinibar').checked   = !!r.features?.minibar;
    $('#rmHotTub').checked    = !!r.features?.hotTub;
    $('#rmBalcony').checked   = !!r.features?.balcony;
    $('#rmAC').checked        = !!r.features?.ac;
    $('#rmBreakfast').checked = !!r.features?.breakfast;

    title.textContent = mode==='edit' ? 'Editar habitación' : 'Nueva habitación';
    ov.style.display = 'block';
    requestAnimationFrame(()=> ov.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';

    form.onsubmit = (ev)=>{
      ev.preventDefault();
      onSave?.({
        id: r.id,
        city:     $('#rmCity').value.trim(),
        name:     $('#rmName').value.trim(),
        type:     $('#rmType').value.trim(),
        capacity: Number($('#rmCap').value   || 0),
        stars:    Number($('#rmStars').value || 0),
        sizeM2:   Number($('#rmM2').value    || 0),
        view:     $('#rmView').value.trim(),
        priceNow: Number($('#rmPrice').value || 0),
        image:    $('#rmImg').value.trim(),
        features: {
          beds:      Number($('#rmBeds').value||1),
          wifi:      $('#rmWifi').checked,
          minibar:   $('#rmMinibar').checked,
          hotTub:    $('#rmHotTub').checked,
          balcony:   $('#rmBalcony').checked,
          ac:        $('#rmAC').checked,
          breakfast: $('#rmBreakfast').checked
        }
      });
      closeRoomModal();
    };
  }

  function closeRoomModal(){
    const ov = document.getElementById('roomOverlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    setTimeout(()=> ov.style.display='none', 160);
    document.documentElement.style.overflow = '';
  }

  /* ================== Modal Eliminar Habitación ================== */
  function ensureDelRoomModal(){
    if (document.getElementById('delRoomOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div class="adm-overlay" id="delRoomOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true">
        <header class="adm-modal__head">
          <h3>Eliminar habitación</h3>
          <button class="adm-close" data-close>×</button>
        </header>
        <form class="adm-form" id="delRoomForm">
          <div class="adm-grid-2">
            <label>Nombre <input type="text" id="drName" disabled></label>
            <label>Ciudad <input type="text" id="drCity" disabled></label>
          </div>
          <p style="margin-top:.5rem;color:var(--adm-soft)">¿Eliminar esta habitación y sus reservas asociadas? No se puede deshacer.</p>
          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--danger">Eliminar</button>
          </footer>
        </form>
      </section>
    </div>`);
    const ov = document.getElementById('delRoomOverlay');
    ov.addEventListener('click', e=>{ if(e.target===ov||e.target.closest('[data-close]')) closeDelRoom(false); });
    document.addEventListener('keydown', ev=>{ if(ov.classList.contains('is-open')&&ev.key==='Escape') closeDelRoom(false); });
  }

  function openDelRoomModal(room){
    ensureDelRoomModal();
    const ov   = document.getElementById('delRoomOverlay');
    const form = document.getElementById('delRoomForm');
    $('#drName').value = room.name || '—';
    $('#drCity').value = room.city || '—';
    ov.style.display = 'block';
    requestAnimationFrame(()=> ov.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    return new Promise(resolve=>{
      ov._res = resolve;
      form.onsubmit = ev=>{ ev.preventDefault(); closeDelRoom(true); };
    });
  }

  function closeDelRoom(result){
    const ov = document.getElementById('delRoomOverlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    setTimeout(()=> ov.style.display='none', 160);
    document.documentElement.style.overflow = '';
    if (ov._res){ ov._res(result===true); ov._res=null; }
  }

  /* ================== Modal Editar Reserva ================== */
  function ensureBookingModal(){
    if (document.getElementById('bookingOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div class="adm-overlay" id="bookingOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true">
        <header class="adm-modal__head">
          <h3>Editar reserva</h3>
          <button class="adm-close" data-close>×</button>
        </header>
        <form id="bookingForm" class="adm-form">
          <div class="adm-grid-2">
            <label>Huésped   <input type="text"  id="bkName"   required placeholder="Nombre y apellido"></label>
            <label>Correo    <input type="email" id="bkEmail"  required placeholder="correo@ejemplo.com"></label>
            <label>Entrada   <input type="date"  id="bkIn"     required></label>
            <label>Salida    <input type="date"  id="bkOut"    required></label>
            <label>Habitación<input type="text"  id="bkRoom"   disabled></label>
            <label>Ciudad    <input type="text"  id="bkCity"   disabled></label>
            <label>Noches    <input type="number" id="bkNights" disabled></label>
            <label>Total COP <input type="text"  id="bkTotal"  disabled></label>
          </div>
          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--primary">Guardar</button>
          </footer>
        </form>
      </section>
    </div>`);
    const ov = document.getElementById('bookingOverlay');
    ov.addEventListener('click', e=>{ if(e.target===ov||e.target.closest('[data-close]')) closeBookingModal(); });
    document.addEventListener('keydown', ev=>{ if(ov.classList.contains('is-open')&&ev.key==='Escape') closeBookingModal(); });
  }

  function openBookingModal(booking, room, onSave){
    ensureBookingModal();
    const ov   = document.getElementById('bookingOverlay');
    const form = document.getElementById('bookingForm');
    $('#bkName').value  = booking.userName  || '';
    $('#bkEmail').value = booking.userEmail || '';
    $('#bkIn').value    = toISO(new Date(booking.start));
    $('#bkOut').value   = toISO(new Date(booking.end));
    $('#bkRoom').value  = room.name || '—';
    $('#bkCity').value  = room.city || '—';
    const price = Number(room.priceNow || 0);
    const recalc = () => {
      const s = parseLocal($('#bkIn').value), e = parseLocal($('#bkOut').value);
      const n = (s&&e) ? Math.max(0,diffDays(s,e)) : 0;
      $('#bkNights').value = n;
      $('#bkTotal').value  = formatCOP(n*price);
    };
    $('#bkIn').onchange = $('#bkOut').onchange = recalc;
    recalc();
    ov.style.display = 'block';
    requestAnimationFrame(()=> ov.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    form.onsubmit = (ev)=>{
      ev.preventDefault();
      const s=parseLocal($('#bkIn').value), e2=parseLocal($('#bkOut').value);
      if(!s||!e2||e2<=s){ showToast('Fechas inválidas','error'); return; }
      const all = getBookings();
      if(all.some(x=>x.id!==booking.id&&x.roomId===booking.roomId&&overlap(s,e2,new Date(x.start),new Date(x.end)))){
        showToast('Se cruza con otra reserva','error'); return;
      }
      const nights=diffDays(s,e2);
      onSave?.({...booking,userName:$('#bkName').value.trim(),userEmail:$('#bkEmail').value.trim(),
        start:s.toISOString(),end:e2.toISOString(),total:nights*price,updatedAt:new Date().toISOString()});
      closeBookingModal();
    };
  }

  function closeBookingModal(){
    const ov = document.getElementById('bookingOverlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    setTimeout(()=> ov.style.display='none', 160);
    document.documentElement.style.overflow = '';
  }

  /* ================== Modal Eliminar Reserva ================== */
  function ensureDelBookingModal(){
    if (document.getElementById('delBkOverlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
    <div class="adm-overlay" id="delBkOverlay" style="display:none">
      <section class="adm-modal" role="dialog" aria-modal="true">
        <header class="adm-modal__head">
          <h3>Eliminar reserva</h3>
          <button class="adm-close" data-close>×</button>
        </header>
        <form class="adm-form" id="delBkForm">
          <div class="adm-grid-2">
            <label>Habitación <input type="text" id="dbkRoom"   disabled></label>
            <label>Ciudad     <input type="text" id="dbkCity"   disabled></label>
            <label>Huésped    <input type="text" id="dbkGuest"  disabled></label>
            <label>Correo     <input type="text" id="dbkEmail"  disabled></label>
            <label>Entrada    <input type="text" id="dbkIn"     disabled></label>
            <label>Salida     <input type="text" id="dbkOut"    disabled></label>
            <label>Noches     <input type="text" id="dbkNights" disabled></label>
            <label>Total      <input type="text" id="dbkTotal"  disabled></label>
          </div>
          <p style="margin-top:.4rem;color:var(--adm-soft)">¿Eliminar esta reserva? No se puede deshacer.</p>
          <footer class="adm-modal__foot">
            <button type="button" class="adm-btn" data-close>Cancelar</button>
            <button type="submit" class="adm-btn adm-btn--danger">Eliminar</button>
          </footer>
        </form>
      </section>
    </div>`);
    const ov = document.getElementById('delBkOverlay');
    ov.addEventListener('click', e=>{ if(e.target===ov||e.target.closest('[data-close]')) closeDelBk(false); });
    document.addEventListener('keydown', ev=>{ if(ov.classList.contains('is-open')&&ev.key==='Escape') closeDelBk(false); });
  }

  function openDelBookingModal(bk, room){
    ensureDelBookingModal();
    const ov   = document.getElementById('delBkOverlay');
    const form = document.getElementById('delBkForm');
    const nights=(()=>{ try{ return diffDays(new Date(bk.start),new Date(bk.end)); }catch{ return 0; }})();
    $('#dbkRoom').value   = room.name       || '—';
    $('#dbkCity').value   = room.city       || '—';
    $('#dbkGuest').value  = bk.userName     || '—';
    $('#dbkEmail').value  = bk.userEmail    || '—';
    $('#dbkIn').value     = fmtDate(bk.start);
    $('#dbkOut').value    = fmtDate(bk.end);
    $('#dbkNights').value = String(nights);
    $('#dbkTotal').value  = formatCOP(bk.total||0);
    ov.style.display = 'block';
    requestAnimationFrame(()=> ov.classList.add('is-open'));
    document.documentElement.style.overflow = 'hidden';
    return new Promise(resolve=>{
      ov._res = resolve;
      form.onsubmit = ev=>{ ev.preventDefault(); closeDelBk(true); };
    });
  }

  function closeDelBk(result){
    const ov = document.getElementById('delBkOverlay');
    if (!ov) return;
    ov.classList.remove('is-open');
    setTimeout(()=> ov.style.display='none', 160);
    document.documentElement.style.overflow = '';
    if (ov._res){ ov._res(result===true); ov._res=null; }
  }

  /* ================== Render Habitaciones ================== */
  // Genera la tabla de habitaciones según filtros y búsqueda.
  function renderRooms(){
    if (!roomsTbody) return;
    const rooms  = getRooms();
    const q      = (qRooms?.value||'').toLowerCase().trim();
    const city   = fCityRooms?.value||'all';
    const list   = rooms.filter(r=>{
      const ok1 = city==='all' || r.city===city;
      const ok2 = !q || `${r.name} ${r.type}`.toLowerCase().includes(q);
      return ok1 && ok2;
    });
    roomsTbody.innerHTML = list.length
      ? list.map(r=>`
        <tr>
          <td title="${r.id}">${(r.id||'').slice(0,8)||'—'}</td>
          <td>${r.city||'—'}</td>
          <td>${r.name||'—'}</td>
          <td>${r.type||'—'}</td>
          <td>${r.capacity||'—'}</td>
          <td>${r.stars?'★'.repeat(r.stars):'—'}</td>
          <td>${r.sizeM2||'—'}</td>
          <td>${r.view||'—'}</td>
          <td>${formatCOP(r.priceNow)}</td>
          <td>
            <button class="adm-btn adm-btn--sm" data-edit="${r.id}">Editar</button>
            <button class="adm-btn adm-btn--sm adm-btn--danger" data-del="${r.id}">Eliminar</button>
          </td>
        </tr>`).join('')
      : `<tr><td colspan="10" style="text-align:center;padding:1.5rem;opacity:.5">No hay habitaciones</td></tr>`;
  }

  /* ================== CRUD Habitaciones ================== */
  btnNewRoom?.addEventListener('click', ()=>{
    openRoomModal('new', null, nr=>{
      const rooms = getRooms();
      nr.id = uid();
      rooms.push(nr);
      saveRooms(rooms);
      fillCityFilters(); renderRooms();
      showToast('Habitación creada ✓');
    });
  });

  roomsTbody?.addEventListener('click', e=>{
    const btnEdit = e.target.closest('[data-edit]');
    const btnDel  = e.target.closest('[data-del]');
    if (btnEdit){
      const id = btnEdit.getAttribute('data-edit');
      const rooms = getRooms();
      const idx = rooms.findIndex(r=>r.id===id);
      if (idx===-1) return;
      openRoomModal('edit', rooms[idx], edited=>{
        rooms[idx]={...rooms[idx],...edited};
        saveRooms(rooms); fillCityFilters(); renderRooms();
        showToast('Habitación actualizada ✓');
      });
    }
    if (btnDel){
      const id = btnDel.getAttribute('data-del');
      const room = getRooms().find(r=>r.id===id);
      if (!room) return;
      openDelRoomModal(room).then(ok=>{
        if (!ok) return;
        saveRooms(getRooms().filter(r=>r.id!==id));
        saveBookings(getBookings().filter(b=>b.roomId!==id));
        fillCityFilters(); renderRooms(); renderBookings();
        showToast('Habitación eliminada');
      });
    }
  });

  /* ================== Render Reservas ================== */
  function renderBookings(){
    if (!bookingsTbody) return;
    const rooms    = getRooms();
    const bookings = getBookings();
    const q        = (qBookings?.value||'').toLowerCase().trim();
    const city     = fCityBookings?.value||'all';
    const list     = bookings.filter(b=>{
      const room = rooms.find(r=>r.id===b.roomId)||{};
      const ok1  = city==='all' || room.city===city;
      const ok2  = !q || `${b.userName||''} ${b.userEmail||''}`.toLowerCase().includes(q);
      return ok1 && ok2;
    });
    bookingsTbody.innerHTML = list.length
      ? list.map(b=>{
          const r=rooms.find(x=>x.id===b.roomId)||{};
          const nights=(()=>{ try{ return diffDays(new Date(b.start),new Date(b.end)); }catch{ return '—'; }})();
          return `
            <tr>
              <td title="${b.id}">${b.id.slice(0,8)}</td>
              <td>${r.name||b.roomName||'—'}</td>
              <td>${r.city||b.snapshot?.city||'—'}</td>
              <td>${b.userName||'—'}</td>
              <td>${b.userEmail||'—'}</td>
              <td>${fmtDate(b.start)}</td>
              <td>${fmtDate(b.end)}</td>
              <td>${nights}</td>
              <td>${formatCOP(b.total)}</td>
              <td>
                <button class="adm-btn adm-btn--sm" data-bkedit="${b.id}">Editar</button>
                <button class="adm-btn adm-btn--sm adm-btn--danger" data-bkdel="${b.id}">Eliminar</button>
              </td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="10" style="text-align:center;padding:1.5rem;opacity:.5">No hay reservas</td></tr>`;
  }

  /* ================== CRUD Reservas ================== */
  bookingsTbody?.addEventListener('click', e=>{
    const btnEdit = e.target.closest('[data-bkedit]');
    const btnDel  = e.target.closest('[data-bkdel]');
    if (!btnEdit && !btnDel) return;
    const rooms = getRooms();
    const all   = getBookings();
    if (btnDel){
      const id=btnDel.getAttribute('data-bkdel');
      const bk=all.find(x=>x.id===id);
      const room=rooms.find(r=>r.id===bk?.roomId)||{};
      if (!bk){ showToast('Reserva no encontrada','error'); return; }
      openDelBookingModal(bk,room).then(ok=>{
        if (!ok) return;
        saveBookings(all.filter(x=>x.id!==id));
        renderBookings(); showToast('Reserva eliminada');
      });
      return;
    }
    if (btnEdit){
      const id=btnEdit.getAttribute('data-bkedit');
      const idx=all.findIndex(x=>x.id===id);
      if (idx===-1) return;
      const b=all[idx];
      const room=rooms.find(r=>r.id===b.roomId)||{};
      openBookingModal(b,room,updated=>{
        all[idx]=updated; saveBookings(all); renderBookings();
        showToast('Reserva actualizada ✓');
      });
    }
  });

  /* ================== Init ================== */
  document.addEventListener('DOMContentLoaded', ()=>{
    activateTab('rooms');
    fillCityFilters();
    renderRooms();
    renderBookings();
    qRooms?.addEventListener('input', renderRooms);
    fCityRooms?.addEventListener('change', renderRooms);
    qBookings?.addEventListener('input', renderBookings);
    fCityBookings?.addEventListener('change', renderBookings);

    // Re-renderizar si otro script cambia erc_rooms o erc_reservas
    window.addEventListener('storage', e=>{
      if (e.key===LS_ROOMS)    { fillCityFilters(); renderRooms(); }
      if (e.key===LS_BOOKINGS) renderBookings();
    });
  });

})();