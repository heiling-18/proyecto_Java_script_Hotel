(() => {
  'use strict';
 
  const LS_REAL = 'erc_reservas';
  const LS_DEMO = 'erc_ocupacion_demo';
  const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                 'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 
  function getBookings() {
    try { return JSON.parse(localStorage.getItem(LS_REAL) || '[]'); } catch { return []; }
  }
 
  // Demo en clave propia para no chocar con reservas reales
  function getDemo() {
    const cached = localStorage.getItem(LS_DEMO);
    if (cached) return JSON.parse(cached);
 
    const data = [];
    let id = 1;
    [2020, 2021, 2022, 2023, 2024, 2025, 2026].forEach(year => {
      for (let m = 0; m < 12; m++) {
        const res = Math.floor(Math.random() * 8) + 1;
        const can = Math.floor(Math.random() * 3);
        for (let i = 0; i < res; i++)
          data.push({ id: `demo${id++}`, start: new Date(year, m, 5).toISOString(), status: 'confirmada' });
        for (let i = 0; i < can; i++)
          data.push({ id: `demo${id++}`, start: new Date(year, m, 10).toISOString(), status: 'cancelada' });
      }
    });
    localStorage.setItem(LS_DEMO, JSON.stringify(data));
    return data;
  }
 
  // Combina reservas reales + demo histórico
  function allBookings() {
    const real = getBookings();
    const demo = getDemo();
    // Los años que ya tienen datos reales no se complementan con demo
    const realYears = new Set(real.map(b => new Date(b.start).getFullYear()));
    const demoFiltrado = demo.filter(b => !realYears.has(new Date(b.start).getFullYear()));
    return [...real, ...demoFiltrado];
  }
 
  function getYears() {
    const years = new Set(allBookings().map(b => new Date(b.start).getFullYear()));
    return [...years].sort((a, b) => b - a);
  }
 
  function calcular(year) {
    const result = Array.from({ length: 12 }, () => ({ ocupacion: 0, cancelaciones: 0 }));
    allBookings().forEach(b => {
      const d = new Date(b.start);
      if (d.getFullYear() !== year) return;
      const m = d.getMonth();
      if (b.status === 'cancelada') result[m].cancelaciones++;
      else result[m].ocupacion++;
    });
    return result;
  }
 
  function render(year) {
    const datos = calcular(year);
    const maxOc = Math.max(...datos.map(d => d.ocupacion), 1);
    const totalOc  = datos.reduce((s, d) => s + d.ocupacion, 0);
    const totalCan = datos.reduce((s, d) => s + d.cancelaciones, 0);
    const mesActual = new Date().getFullYear() === year ? new Date().getMonth() : -1;
 
    document.getElementById('yearTitle').textContent = `Año ${year}`;
    document.getElementById('totalOc').textContent = totalOc;
    document.getElementById('totalCan').textContent = totalCan;
 
    document.getElementById('tbody').innerHTML = datos.map((d, i) => {
      const pct = Math.round((d.ocupacion / maxOc) * 100);
      const color = pct >= 70 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#cbd5e1';
      return `<tr class="${i === mesActual ? 'mes-actual' : ''}">
        <td>${MESES[i]}${i === mesActual ? ' ←' : ''}</td>
        <td>
          <div style="display:flex;align-items:center;gap:.5rem">
            <div style="width:${pct}%;height:18px;background:${color};border-radius:4px;min-width:4px;max-width:200px"></div>
            <span>${d.ocupacion}</span>
          </div>
        </td>
        <td>${d.cancelaciones}</td>
      </tr>`;
    }).join('');
 
    document.getElementById('tabla').hidden = false;
  }
 
  document.addEventListener('DOMContentLoaded', () => {
    const years = getYears();
    const sel = document.getElementById('selectAnio');
 
    sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
 
    document.getElementById('btnBuscar').addEventListener('click', () => {
      render(parseInt(sel.value));
    });
 
    if (years.length) render(years[0]);
  });
})();