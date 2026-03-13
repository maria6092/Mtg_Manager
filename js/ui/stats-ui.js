import { state } from '../core/state.js';

export function renderStats() {
  const totalCards = state.cards.reduce((sum, card) => sum + (card.quantity || 0), 0);
  const uniqueCards = state.cards.length;
  const totalValue = state.cards.reduce((sum, card) => sum + ((card.quantity || 0) * (card.price || 0)), 0);
  const foilsCount = state.cards
    .filter(card => card.foil === 'Sí')
    .reduce((sum, card) => sum + (card.quantity || 0), 0);

  document.getElementById('statTotal').textContent = String(totalCards);
  document.getElementById('statUnique').textContent = String(uniqueCards);
  document.getElementById('statValue').textContent = `${totalValue.toFixed(2)}€`;
  document.getElementById('statFoils').textContent = String(foilsCount);

  const langMap = {};
  const condMap = {};
  state.cards.forEach(card => {
    const lang = card.lang || 'Desconocido';
    const condition = card.condition || 'Desconocido';
    langMap[lang] = (langMap[lang] || 0) + (card.quantity || 0);
    condMap[condition] = (condMap[condition] || 0) + (card.quantity || 0);
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
          backgroundColor: ['#f06292', '#f8bbd0', '#d81b60', '#ec407a', '#f48fb1', '#fce4ec']
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
