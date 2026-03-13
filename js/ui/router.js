export function setSectionVisibility(activeTab, allTabs) {
  allTabs.forEach(tab => {
    const section = document.getElementById(`tab_${tab}`);
    if (section) section.style.display = tab === activeTab ? '' : 'none';
  });
}
