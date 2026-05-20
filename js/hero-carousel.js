/* /js/hero-carousel.js */
(() => {
  const slider = document.querySelector('.hero-slider'); // Contenedor principal del slider
  if (!slider) return; // Si no existe, no ejecuta nada

  const track = slider.querySelector('#heroTrack'); // Contenedor que agrupa los slides
  const slides = Array.from(slider.querySelectorAll('.hero-slide')); // Lista de slides
  const prevBtn = slider.querySelector('.hero-arrow.prev'); // Flecha izquierda
  const nextBtn = slider.querySelector('.hero-arrow.next'); // Flecha derecha
  const dotsWrap = slider.querySelector('#heroDots'); // Contenedor de los dots

  if (!track || slides.length === 0) return; // Si no hay track o slides, no continúa

  const AUTOPLAY_MS = 6000;       // Tiempo entre slides en autoplay
  const SWIPE_THRESHOLD = 40;     // Distancia mínima para detectar swipe
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; // Respeta accesibilidad

  let index = 0; // Slide actual
  let timer = null; // Timer del autoplay

  // Construye los dots dinámicamente según cantidad de slides
  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir a slide ${i + 1}`);
      dot.addEventListener('click', () => goTo(i, true)); // Ir al slide al hacer clic
      dotsWrap.appendChild(dot);
    });
  }

  // Marca el slide activo y actualiza accesibilidad
  function setActive(i) {
    slides.forEach((s, si) => {
      const active = si === i;
      s.classList.toggle('is-active', active); // Clase visual
      s.setAttribute('aria-hidden', active ? 'false' : 'true'); // Accesibilidad
      s.tabIndex = active ? 0 : -1; // Navegación por teclado
    });

    // Actualiza dots
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((d, di) => {
        d.setAttribute('aria-selected', di === i ? 'true' : 'false');
      });
    }

    // Si solo hay un slide, oculta flechas y dots
    const single = slides.length <= 1;
    prevBtn && (prevBtn.style.display = single ? 'none' : '');
    nextBtn && (nextBtn.style.display = single ? 'none' : '');
    dotsWrap && (dotsWrap.style.display = single ? 'none' : '');
  }

  // Cambia al slide indicado
  function goTo(i, userAction = false) {
    index = (i + slides.length) % slides.length; // Permite loop infinito
    setActive(index);
    if (userAction) restartAutoplay(); // Si el usuario interactúa, reinicia autoplay
  }

  function next() { goTo(index + 1); } // Siguiente slide
  function prev() { goTo(index - 1); } // Slide anterior

  // Inicia autoplay
  function startAutoplay() {
    if (reduceMotion || AUTOPLAY_MS <= 0 || slides.length <= 1) return; // Respeta accesibilidad
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }

  // Detiene autoplay
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // Reinicia autoplay
  function restartAutoplay() { stopAutoplay(); startAutoplay(); }

  // Eventos: flechas
  prevBtn?.addEventListener('click', () => prev());
  nextBtn?.addEventListener('click', () => next());

  // Navegación con teclado (flechas)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  // Pausa autoplay al pasar el mouse
  track.addEventListener('mouseenter', stopAutoplay);
  track.addEventListener('mouseleave', startAutoplay);

  // Swipe táctil
  let startX = 0, swiping = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX; // Punto inicial del toque
    swiping = true;
    stopAutoplay();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!swiping) return;
    const dx = e.touches[0].clientX - startX; // Distancia horizontal
    if (Math.abs(dx) > SWIPE_THRESHOLD) { // Si supera el umbral, se considera swipe
      swiping = false;
      dx < 0 ? next() : prev(); // Swipe izquierda → next, derecha → prev
    }
  }, { passive: true });

  track.addEventListener('touchend', () => {
    swiping = false;
    startAutoplay();
  });

  // Pausa autoplay si la pestaña no está visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // Inicialización
  buildDots();
  setActive(index);
  startAutoplay();
})();
