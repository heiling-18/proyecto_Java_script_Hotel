(() => {
  // Información centralizada del hotel para usar en enlaces y textos dinámicos.
  const HOTEL = {
    lat: 10.3910,
    lng: -75.4794,
    name: 'El Rincón del Carmen',
    address: 'Calle 123 # 4-56, Barrio Centro Histórico',
    phone: '+573001112233',
    email: 'hola@rincondelcarmen.com'
  };

  // Función de notificación estilo "toast" para mostrar mensajes breves al usuario.
  function toast(msg) {
    let t = document.getElementById('appToast');
    if (!t) {
      // Si no existe el contenedor, lo crea una sola vez.
      t = document.createElement('div');
      t.id = 'appToast';
      document.body.appendChild(t);
    }

    t.textContent = msg; // Asigna el texto de la notificación.
    t.classList.add('show'); // Muestra la notificación con animación.
    clearTimeout(t._h); // Cancela cualquier timeout previo para evitar parpadeos.
    t._h = setTimeout(() => t.classList.remove('show'), 2200); // Oculta después de 2.2 segundos.
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Obtiene referencias a los elementos del DOM que pueden existir en la página.
    const icHowTo = document.getElementById('icHowTo');
    const telLink = document.getElementById('telLink');
    const waLink = document.getElementById('waLink');
    const mailLink = document.getElementById('mailLink');
    const addrTxt = document.getElementById('addrTxt');
    const gmapsLink = document.getElementById('gmapsLink');
    const wazeLink = document.getElementById('wazeLink');
    const btnDirections = document.getElementById('btnDirections');

    // Configura los enlaces dinámicamente según la información del hotel.
    if (icHowTo) {
      icHowTo.href = `https://www.google.com/maps/dir/?api=1&destination=${HOTEL.lat},${HOTEL.lng}`;
    }
    if (telLink) {
      telLink.href = `tel:${HOTEL.phone}`;
    }
    if (waLink) {
      // Elimina caracteres no numéricos antes de construir el enlace de WhatsApp.
      waLink.href = `https://wa.me/${HOTEL.phone.replace(/\D/g, '')}`;
    }
    if (mailLink) {
      mailLink.href = `mailto:${HOTEL.email}`;
    }
    if (addrTxt) {
      addrTxt.textContent = HOTEL.address;
    }
    if (gmapsLink) {
      gmapsLink.href = `https://www.google.com/maps/search/?api=1&query=${HOTEL.lat},${HOTEL.lng}`;
    }
    if (wazeLink) {
      wazeLink.href = `https://waze.com/ul?ll=${HOTEL.lat},${HOTEL.lng}&navigate=yes`;
    }

    // Si existe el botón de direcciones, abre Google Maps en una pestaña nueva.
    if (btnDirections) {
      btnDirections.addEventListener('click', () => {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${HOTEL.lat},${HOTEL.lng}`,
          '_blank',
          'noopener'
        );
      });
    }

    // Botones con data-copy copian texto de otro elemento al portapapeles.
    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const selector = btn.getAttribute('data-copy'); // Selector CSS del elemento a copiar.
        const target = selector && document.querySelector(selector);
        const value = target?.textContent?.trim();
        if (!value) return;
        navigator.clipboard?.writeText(value).then(() => toast('Copiado'));
      });
    });
  });

  // Referencias al formulario de contacto y elementos relacionados.
  const f = document.getElementById('contactForm');
  const m = document.getElementById('cfMsg');
  const b = document.getElementById('cfSubmit');

  document.addEventListener('DOMContentLoaded', () => {
    // Si el usuario está autenticado, autocompleta nombre y correo.
    const session = window.ErcAuth?.getSession?.();
    if (session) {
      const nameInput = document.getElementById('cfName');
      const emailInput = document.getElementById('cfEmail');
      if (nameInput && !nameInput.value) nameInput.value = session.name || '';
      if (emailInput && !emailInput.value) emailInput.value = session.email || '';
    }
  });

  // Clave para almacenar mensajes en localStorage.
  const LS_CONTACT = 'erc_contact_msgs';
  const getMsgs = () => JSON.parse(localStorage.getItem(LS_CONTACT) || '[]');
  const saveMsgs = arr => localStorage.setItem(LS_CONTACT, JSON.stringify(arr));

  // Maneja el envío del formulario de contacto.
  f?.addEventListener('submit', async e => {
    e.preventDefault();
    if (m) m.textContent = '';

    const fd = new FormData(f);
    const data = Object.fromEntries(fd.entries()); // Convierte FormData a objeto simple.
    const consent = document.getElementById('cfConsent')?.checked;

    // Valida campos obligatorios y consentimiento.
    if (!data.name || !data.email || !data.subject || !data.message || !consent) {
      if (m) {
        m.textContent = 'Por favor completa los campos requeridos.';
        m.style.color = '#b00020';
      }
      return;
    }

    // Cambia el estado del botón mientras se procesa el envío.
    if (b) {
      b.disabled = true;
      b.textContent = 'Enviando…';
    }

    // Crea el objeto de mensaje que se guardará.
    const payload = {
      ...data,
      phone: data.phone || null,
      ts: new Date().toISOString(), // Fecha y hora del envío.
      sessionEmail: window.ErcAuth?.getSession?.()?.email || null
    };

    // Guarda el mensaje en localStorage.
    const all = getMsgs();
    all.push(payload);
    saveMsgs(all);

    // Restaura el botón al estado normal.
    if (b) {
      b.disabled = false;
      b.textContent = 'Enviar';
    }

    f.reset(); // Limpia los campos del formulario.
    toast('¡Mensaje enviado! Te contactaremos pronto.');

    if (m) {
      m.textContent = '¡Gracias! Hemos recibido tu mensaje.';
      m.style.color = 'green';
    }
  });
})();

// Animación de aparición en scroll para elementos con el atributo data-reveal.
(() => {
  const els = [...document.querySelectorAll('[data-reveal]')];
  if (!els.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed'); // Agrega clase para animar.
        io.unobserve(entry.target); // Deja de observar una vez que ya se reveló.
      }
    });
  }, { threshold: 0.14 }); // Se activa cuando al menos el 14% del elemento es visible.

  els.forEach(el => io.observe(el));
})();
