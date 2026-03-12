// FASE 2: mueve aquí switchTab.
export function setSectionVisibility(tabName, allSections) {
  allSections.forEach(t => {
    const sec = document.getElementById('tab_' + t);
    if (sec) sec.style.display = t === tabName ? 'block' : 'none';
  });

  document.querySelectorAll('.tabbtn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
}