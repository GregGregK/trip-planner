// tabs.js - Controle de abas e estado global
let currentTab = 'days';

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('panel-'+tab).classList.add('active');
  
  if (tab === 'days') {
    // Resetar selectedDate para null ao clicar na aba Dias
    // Isso fará com que mostre o grid de visão geral
    selectedDate = null;
    renderCalendar();
    renderDaysList();
    renderMain();
  }
  if (tab === 'links') renderLinks();
  if (tab === 'hotels') renderHotels();
  if (tab === 'tours') renderTours();
  if (tab === 'map') { setTimeout(initMap, 80); }
  if (tab === 'guide') renderGuide();
}