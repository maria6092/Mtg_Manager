// FASE 2: mueve aquí renderStats y gráficos.
import { state } from '../core/state.js';

export function renderStats() {
  const totalCards = state.cards.reduce((sum, c) => sum + (c.quantity || 0), 0);
  const uniqueCards = state.cards.length;
  const totalValue = state.cards.reduce((sum, c) => sum + ((c.quantity || 0) * (c.price || 0)), 0);
  const foilsCount = state.cards
    .filter(c => c.foil === 'Sí')
    .reduce((sum, c) => sum + (c.quantity || 0), 0);

  const statTotal = document.getElementById('statTotal');
  const statUnique = document.getElementById('statUnique');
  const statValue = document.getElementById('statValue');
  const statFoils = document.getElementById('statFoils');

  if (statTotal) statTotal.textContent = totalCards;
  if (statUnique) statUnique.textContent = uniqueCards;
  if (statValue) statValue.textContent = totalValue.toFixed(2) + '€';
  if (statFoils) statFoils.textContent = foilsCount;

  const langMap = {};
  state.cards.forEach(c => {
    const lang = c.lang || 'Desconocido';
    langMap[lang] = (langMap[lang] || 0) + (c.quantity || 0);
  });

  const condMap = {};
  state.cards.forEach(c => {
    const cond = c.condition || 'Desconocido';
    condMap[cond] = (condMap[cond] || 0) + (c.quantity || 0);
  });

  const ctxLang = document.getElementById('chartLang');
  if (ctxLang) {
    if (window.chartLangInst) window.chartLangInst.destroy();
    window.chartLangInst = new Chart(ctxLang, {
      type: 'pie',
      data: {
        labels: Object.keys(langMap),
        datasets: [{
          data: Object.values(langMap),
          backgroundColor: ['#f06292','#f8bbd0','#d81b60','#ec407a','#f48fb1','#fce4ec']
        }]
      },
      options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
  }

  const ctxCond = document.getElementById('chartCond');
  if (ctxCond) {
    if (window.chartCondInst) window.chartCondInst.destroy();
    window.chartCondInst = new Chart(ctxCond, {
      type: 'bar',
      data: {
        labels: Object.keys(condMap),
        datasets: [{
          label: 'Cantidad',
          data: Object.values(condMap),
          backgroundColor: '#ec4899'
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }
}

export function initStatsUI() {}