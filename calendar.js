// calendar.js - Calendário e seleção de datas
let viewYear, viewMonth, selectedDate = null;

function renderCalendar() {
  const calGrid = document.getElementById('calGrid');
  
  // Renderizar cabeçalho com seletores
  renderCalendarHeader();
  
  calGrid.querySelectorAll('.cal-day').forEach(d => d.remove());
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();
  const todayKey = today();
  
  for (let i = 0; i < firstDay; i++) { 
    const el = document.createElement('button'); 
    el.className = 'cal-day empty'; 
    el.disabled = true; 
    calGrid.appendChild(el); 
  }
  
  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('button');
    el.className = 'cal-day'; 
    el.textContent = d;
    const key = dateKey(viewYear, viewMonth, d);
    if (key === todayKey) el.classList.add('today');
    if (key === selectedDate) el.classList.add('selected');
    const hasData = (data[key] && data[key].length > 0) || 
                    getHotelEventsForDay(key).length > 0 || 
                    getTourEventsForDay(key).length > 0;
    if (hasData) el.classList.add('has-data');
    el.onclick = () => selectDate(viewYear, viewMonth, d);
    calGrid.appendChild(el);
  }
}

function renderCalendarHeader() {
  const calNav = document.querySelector('.cal-nav');
  
  calNav.innerHTML = `
    <button class="cal-btn" id="prevMonth" title="Mês anterior">
      <i class="ti ti-chevron-left"></i>
    </button>
    
    <div class="cal-selectors">
      <div class="cal-selector-wrapper">
        <button class="cal-selector-btn" id="monthSelector">
          ${MONTHS[viewMonth]}
          <i class="ti ti-chevron-down" style="font-size:10px;margin-left:4px"></i>
        </button>
        <div class="cal-dropdown" id="monthDropdown" style="display:none">
          <div class="cal-dropdown-grid">
            ${MONTHS.map((month, index) => `
              <button class="cal-dropdown-item ${index === viewMonth ? 'active' : ''}" 
                      onclick="selectMonth(${index})">
                ${month.substring(0, 3)}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      
      <div class="cal-selector-wrapper">
        <button class="cal-selector-btn" id="yearSelector">
          ${viewYear}
          <i class="ti ti-chevron-down" style="font-size:10px;margin-left:4px"></i>
        </button>
        <div class="cal-dropdown" id="yearDropdown" style="display:none">
          <div class="cal-dropdown-year-nav">
            <button class="cal-dropdown-year-btn" id="prevYearRange">
              <i class="ti ti-chevron-left"></i>
            </button>
            <span id="yearRangeLabel"></span>
            <button class="cal-dropdown-year-btn" id="nextYearRange">
              <i class="ti ti-chevron-right"></i>
            </button>
          </div>
          <div class="cal-dropdown-grid" id="yearDropdownGrid">
            <!-- Anos serão gerados dinamicamente -->
          </div>
        </div>
      </div>
    </div>
    
    <button class="cal-btn" id="nextMonth" title="Próximo mês">
      <i class="ti ti-chevron-right"></i>
    </button>
  `;
  
  // Eventos de navegação
  document.getElementById('prevMonth').onclick = () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    updateCalendarView();
  };
  
  document.getElementById('nextMonth').onclick = () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    updateCalendarView();
  };
  
  // Eventos dos seletores
  setupMonthSelector();
  setupYearSelector();
  
  // Fechar dropdowns ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cal-selector-wrapper')) {
      document.getElementById('monthDropdown').style.display = 'none';
      document.getElementById('yearDropdown').style.display = 'none';
    }
  });
}

function setupMonthSelector() {
  const monthSelector = document.getElementById('monthSelector');
  const monthDropdown = document.getElementById('monthDropdown');
  
  monthSelector.onclick = (e) => {
    e.stopPropagation();
    const isVisible = monthDropdown.style.display === 'block';
    document.getElementById('yearDropdown').style.display = 'none';
    monthDropdown.style.display = isVisible ? 'none' : 'block';
  };
}

function setupYearSelector() {
  const yearSelector = document.getElementById('yearSelector');
  const yearDropdown = document.getElementById('yearDropdown');
  
  yearSelector.onclick = (e) => {
    e.stopPropagation();
    const isVisible = yearDropdown.style.display === 'block';
    document.getElementById('monthDropdown').style.display = 'none';
    yearDropdown.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      renderYearRange(viewYear);
    }
  };
}

let yearRangeStart = null;

function renderYearRange(centerYear) {
  // Mostrar um range de 12 anos (4x3 grid), centralizado no ano atual
  const rangeSize = 12;
  let start = centerYear - Math.floor(rangeSize / 2);
  
  // Ajustar para começar em um múltiplo de 4 (para grade 4x3)
  start = Math.floor(start / 4) * 4;
  
  yearRangeStart = start;
  const end = start + rangeSize - 1;
  
  document.getElementById('yearRangeLabel').textContent = `${start} - ${end}`;
  
  const grid = document.getElementById('yearDropdownGrid');
  grid.innerHTML = '';
  
  for (let year = start; year <= end; year++) {
    const btn = document.createElement('button');
    btn.className = `cal-dropdown-item ${year === viewYear ? 'active' : ''}`;
    btn.textContent = year;
    btn.onclick = (e) => {
      e.stopPropagation();
      selectYear(year);
    };
    grid.appendChild(btn);
  }
  
  // Navegação entre ranges
  document.getElementById('prevYearRange').onclick = (e) => {
    e.stopPropagation();
    renderYearRange(yearRangeStart - rangeSize);
  };
  
  document.getElementById('nextYearRange').onclick = (e) => {
    e.stopPropagation();
    renderYearRange(yearRangeStart + rangeSize);
  };
}

function selectMonth(monthIndex) {
  viewMonth = monthIndex;
  updateCalendarView();
}

function selectYear(year) {
  viewYear = year;
  document.getElementById('yearDropdown').style.display = 'none';
  updateCalendarView();
}

function updateCalendarView() {
  renderCalendar();
  renderDaysList();
  
  // Se o dia selecionado não estiver no mês/ano atual, manter seleção mas não mostrar
  if (selectedDate) {
    const [y, m] = selectedDate.split('-').map(Number);
    if (y === viewYear && m - 1 === viewMonth) {
      // Dia está visível, manter
    }
  }
}

function selectDate(y, m, d) {
  selectedDate = dateKey(y, m, d);
  if (currentTab !== 'days') switchTab('days');
  renderCalendar(); 
  renderDaysList(); 
  renderMain();
}

// Toggle do calendário no mobile
function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const collapsible = document.getElementById('sidebarCollapsible');
  
  if (!toggleBtn || !collapsible) return;
  
  // Verificar se está no modo mobile
  const isMobile = () => window.innerWidth <= 768;
  
  // Estado inicial: recolhido no mobile
  if (isMobile()) {
    collapsible.classList.remove('expanded');
    toggleBtn.classList.add('collapsed');
  }
  
  toggleBtn.onclick = () => {
    const expanded = collapsible.classList.toggle('expanded');
    
    if (expanded) {
      toggleBtn.classList.remove('collapsed');
      toggleBtn.querySelector('i').className = 'ti ti-chevron-up';
    } else {
      toggleBtn.classList.add('collapsed');
      toggleBtn.querySelector('i').className = 'ti ti-chevron-down';
    }
  };
  
  // Atualizar ao redimensionar
  window.addEventListener('resize', () => {
    if (!isMobile() && !collapsible.classList.contains('expanded')) {
      // Em desktop, sempre expandido
      collapsible.classList.add('expanded');
      toggleBtn.classList.remove('collapsed');
      toggleBtn.querySelector('i').className = 'ti ti-chevron-up';
    } else if (isMobile() && collapsible.classList.contains('expanded')) {
      // Em mobile, mantém o estado atual
    }
  });
}

// Inicializar o toggle quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  setupSidebarToggle();
});

// Também inicializar quando a página carregar
setupSidebarToggle();