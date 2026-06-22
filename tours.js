// tours.js - Passeios tab (refatorado com filtros melhorados)
let tourFilter = 'all';
let tourCountryFilter = 'all';

function renderTours() {
  renderTourFilterBar();
  const container = document.getElementById('toursContent');
  if (!tours.length) {
    container.innerHTML = `<div class="empty-state"><i class="ti ti-map empty-icon"></i><div class="empty-title">Nenhum passeio cadastrado</div><div class="empty-sub">Adicione passeios com descrição, horário, links e vincule a um dia da viagem.</div></div><button class="add-link-btn" onclick="addTour()"><i class="ti ti-plus"></i> Adicionar passeio</button>`;
    return;
  }
  
  let visible = [...tours];
  
  // Aplicar filtro por dia
  if (tourFilter !== 'all') {
    visible = visible.filter(t => t.linkedDay === tourFilter);
  }
  
  // Aplicar filtro por país
  if (tourCountryFilter !== 'all') {
    visible = visible.filter(t => {
      if (!t.linkedDay || !data[t.linkedDay]) return false;
      return data[t.linkedDay].some(country => 
        (country.name || 'País sem nome') === tourCountryFilter
      );
    });
  }
  
  if (!visible.length) {
    container.innerHTML = `<div class="empty-state"><i class="ti ti-filter-off empty-icon"></i><div class="empty-title">Nenhum passeio encontrado</div><div class="empty-sub">Tente outros filtros ou adicione um novo passeio.</div></div><button class="add-link-btn" onclick="addTour()"><i class="ti ti-plus"></i> Adicionar passeio</button>`;
    return;
  }
  
  container.innerHTML = visible.map((t) => {
    const realIdx = tours.indexOf(t);
    return renderTourCard(t, realIdx);
  }).join('') + `<button class="add-link-btn" onclick="addTour()"><i class="ti ti-plus"></i> Adicionar passeio</button>`;
  
  bindTourEvents();
}

function renderTourCard(t, realIdx) {
  const hasPin = t.lat && t.lng;
  const href = t.url && (t.url.startsWith('http') ? t.url : 'https://'+t.url);
  const dayLabel = t.linkedDay ? fmtDate(t.linkedDay) : '—';
  const fields = ENTITY_CONFIG.tour.getFields(realIdx);
  
  // Buscar países do dia vinculado
  let countryNames = '';
  if (t.linkedDay && data[t.linkedDay]) {
    countryNames = data[t.linkedDay].map(c => c.name || 'País').join(', ');
  }
  
  return `<div class="tour-card">
    <div class="tour-top-row">
      <div class="tour-icon"><i class="ti ti-map"></i></div>
      <input class="tour-name-input" id="${fields.name}" value="${escHtml(t.name)}" placeholder="Nome do passeio" />
      <div class="tour-actions">
        <a class="link-open-btn" id="${fields.href}" href="${escHtml(href||'#')}" target="_blank" rel="noopener" ${!t.url?'style="opacity:.3;pointer-events:none"':''} title="Abrir link"><i class="ti ti-external-link"></i></a>
        <button class="btn-icon" id="${fields.delete}" title="Remover"><i class="ti ti-trash"></i></button>
      </div>
    </div>
    <div class="tour-field-row">
      <i class="ti ti-clock"></i>
      <input type="time" class="tour-time-input" id="${fields.time}" value="${escHtml(t.time||'')}" />
      <i class="ti ti-calendar-event" style="margin-left:8px"></i>
      <select class="tour-day-select${t.linkedDay?' has-day':''}" id="${fields.day}">${getAllDayOptions(t.linkedDay||'')}</select>
      <span style="font-size:11px;color:var(--muted);margin-left:4px">Dia: ${dayLabel}</span>
      ${countryNames ? `<span style="font-size:11px;color:var(--muted);margin-left:8px">🌍 ${escHtml(countryNames)}</span>` : ''}
    </div>
    <div class="tour-field-row">
      <i class="ti ti-link"></i>
      <input class="tour-link-input" id="${fields.url}" value="${escHtml(t.url||'')}" placeholder="Link do passeio (ex: reserva, mapa)" />
    </div>
    <div class="tour-field-row">
      <i class="ti ti-map-pin" style="color:${hasPin?'var(--accent)':'var(--muted)'}"></i>
      <input class="tour-text-input" id="${fields.location}" value="${escHtml(t.location||'')}" placeholder="Localização (cidade, ponto de encontro)" />
      <button class="geo-btn" id="${fields.geo}"><i class="ti ti-pin" style="font-size:12px"></i> Fixar pin</button>
      <span class="geo-status" id="${fields.geoStatus}"></span>
    </div>
    <div class="tour-field-row" style="align-items:flex-start">
      <i class="ti ti-notes" style="margin-top:6px"></i>
      <textarea class="tour-note-input" id="${fields.note}" placeholder="Descrição detalhada do passeio, informações importantes…" rows="2">${escHtml(t.note||'')}</textarea>
    </div>
  </div>`;
}

function bindTourEvents() {
  tours.forEach((t, ti) => {
    const fields = ENTITY_CONFIG.tour.getFields(ti);
    
    const nEl = document.getElementById(fields.name);
    if (nEl) nEl.oninput = e => { tours[ti].name = e.target.value; save(); renderDaysList(); renderGuide(); };
    
    const tEl = document.getElementById(fields.time);
    if (tEl) tEl.oninput = e => { tours[ti].time = e.target.value; save(); renderMain(); renderGuide(); };
    
    const dEl = document.getElementById(fields.day);
    if (dEl) dEl.onchange = e => { tours[ti].linkedDay = e.target.value; save(); renderTours(); renderMain(); renderGuide(); };
    
    const uEl = document.getElementById(fields.url);
    if (uEl) uEl.oninput = e => { tours[ti].url = e.target.value; save(); updateEntityHref('tour', ti); };
    
    const locEl = document.getElementById(fields.location);
    if (locEl) locEl.oninput = e => { tours[ti].location = e.target.value; save(); };
    
    const noteEl = document.getElementById(fields.note);
    if (noteEl) noteEl.oninput = e => { tours[ti].note = e.target.value; save(); };
    
    const geoBtn = document.getElementById(fields.geo);
    const geoStatus = document.getElementById(fields.geoStatus);
    if (geoBtn) geoBtn.onclick = () => applyGeocodeToEntity(tours[ti], 'location', geoStatus);
    
    const delBtn = document.getElementById(fields.delete);
if (delBtn) delBtn.onclick = async () => { 
  const confirmed = await confirmDelete(`Tem certeza que deseja remover o passeio "${t.name || 'Sem nome'}"?`);
  if (confirmed) {
    tours.splice(ti, 1); save(); renderTours(); renderMain(); renderGuide(); 
  }
};
  });
}

function renderTourFilterBar() {
  const bar = document.getElementById('tourFilterBar');
  if (!tours.length) { bar.innerHTML = ''; return; }
  
  let html = '<div class="filter-bar" style="flex-wrap:wrap;gap:8px">';
  html += '<span class="filter-bar-label">Filtrar:</span>';
  
  // Filtro por dia com modal de calendário
  const dayLabel = tourFilter === 'all' ? 'Todos os dias' : fmtDate(tourFilter);
  html += `<button class="filter-chip ${tourFilter==='all'?'active':''}" id="tf-day" style="gap:4px">
    <i class="ti ti-calendar" style="font-size:13px"></i> ${dayLabel}
    ${tourFilter !== 'all' ? '<span style="cursor:pointer;margin-left:4px" id="tf-clear-day" title="Limpar filtro de dia"><i class="ti ti-x" style="font-size:10px"></i></span>' : ''}
  </button>`;
  
  // Filtro por país
  const countryCounts = getTourCountries();
  const countries = Object.keys(countryCounts).sort();
  const countryLabel = tourCountryFilter === 'all' ? 'Todos os países' : tourCountryFilter;
  html += `<button class="filter-chip ${tourCountryFilter==='all'?'active':''}" id="tf-country" style="gap:4px">
    <i class="ti ti-flag" style="font-size:13px"></i> ${escHtml(countryLabel)}
    ${tourCountryFilter !== 'all' ? '<span style="cursor:pointer;margin-left:4px" id="tf-clear-country" title="Limpar filtro de país"><i class="ti ti-x" style="font-size:10px"></i></span>' : ''}
  </button>`;
  
  // Contador
  const filteredCount = tours.filter(t => {
    if (tourFilter !== 'all' && t.linkedDay !== tourFilter) return false;
    if (tourCountryFilter !== 'all') {
      if (!t.linkedDay || !data[t.linkedDay]) return false;
      return data[t.linkedDay].some(c => (c.name || 'País sem nome') === tourCountryFilter);
    }
    return true;
  }).length;
  
  html += `<span class="fc-count" style="font-size:11px;color:var(--muted);margin-left:4px">${filteredCount} passeio${filteredCount !== 1 ? 's' : ''}</span>`;
  html += '</div>';
  
  bar.innerHTML = html;
  
  // Evento do botão de filtro por dia (abre modal)
  const dayBtn = document.getElementById('tf-day');
  if (dayBtn) {
    dayBtn.onclick = (e) => {
      // Não abrir modal se clicou no X de limpar
      if (e.target.closest('#tf-clear-day')) return;
      openDayFilterModal();
    };
  }
  
  // Limpar filtro de dia
  const clearDayBtn = document.getElementById('tf-clear-day');
  if (clearDayBtn) {
    clearDayBtn.onclick = (e) => {
      e.stopPropagation();
      tourFilter = 'all';
      renderTours();
    };
  }
  
  // Evento do botão de filtro por país (abre modal)
  const countryBtn = document.getElementById('tf-country');
  if (countryBtn && countries.length > 0) {
    countryBtn.onclick = (e) => {
      if (e.target.closest('#tf-clear-country')) return;
      openCountryFilterModal(countries, countryCounts);
    };
  }
  
  // Limpar filtro de país
  const clearCountryBtn = document.getElementById('tf-clear-country');
  if (clearCountryBtn) {
    clearCountryBtn.onclick = (e) => {
      e.stopPropagation();
      tourCountryFilter = 'all';
      renderTours();
    };
  }
}

function getTourCountries() {
  const countryCounts = {};
  tours.forEach(t => {
    if (!t.linkedDay || !data[t.linkedDay]) return;
    data[t.linkedDay].forEach(country => {
      const name = country.name || 'País sem nome';
      countryCounts[name] = (countryCounts[name] || 0) + 1;
    });
  });
  return countryCounts;
}

function openDayFilterModal() {
  const existingModal = document.querySelector('.modal-backdrop');
  if (existingModal) existingModal.remove();
  
  // Dias que têm passeios
  const tourDays = [...new Set(tours.filter(t => t.linkedDay).map(t => t.linkedDay))].sort();
  const counts = {};
  tours.forEach(t => {
    if (t.linkedDay) {
      counts[t.linkedDay] = (counts[t.linkedDay] || 0) + 1;
    }
  });
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <button class="modal-close" id="modalCloseBtn"><i class="ti ti-x"></i></button>
      <div class="modal-title">
        <i class="ti ti-calendar"></i>
        <span>Filtrar por dia</span>
      </div>
      <div class="modal-sub">Selecione um dia específico ou veja todos</div>
      <div class="modal-divider"></div>
      
      <div style="margin-bottom:16px">
        <button class="filter-chip ${tourFilter==='all'?'active':''}" id="modal-day-all" style="width:100%;justify-content:center;padding:10px">
          <i class="ti ti-calendar"></i> Todos os dias (${tours.length} passeios)
        </button>
      </div>
      
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">
        Dias com passeios
      </div>
      
      <div style="max-height:300px;overflow-y:auto">
        ${tourDays.length ? tourDays.map(day => {
          const [y,m,d] = day.split('-').map(Number);
          const weekday = WEEKDAYS[new Date(y,m-1,d).getDay()];
          const countryNames = data[day] ? data[day].map(c => c.name || 'País').join(', ') : '';
          return `
            <div class="tour-filter-day-item ${tourFilter===day?'active':''}" data-day="${day}" style="
              display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius-sm);
              cursor:pointer;transition:background .12s;margin-bottom:4px;
              ${tourFilter===day?'background:var(--accent-light);border:1px solid var(--accent-mid)':'border:1px solid transparent'}
            " onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='${tourFilter===day?'var(--accent-light)':''}'">
              <div style="text-align:center;min-width:40px">
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${String(d).padStart(2,'0')}</div>
                <div style="font-size:10px;color:var(--muted)">${MONTHS[m-1].substring(0,3)}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:500">${weekday}-feira</div>
                <div style="font-size:11px;color:var(--muted)">${countryNames || 'Sem países'}</div>
              </div>
              <div style="background:var(--accent-light);color:var(--accent);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">
                ${counts[day]} passeio${counts[day] !== 1 ? 's' : ''}
              </div>
            </div>
          `;
        }).join('') : '<div style="text-align:center;padding:20px;color:var(--muted)">Nenhum dia com passeios</div>'}
      </div>
    </div>
  `;
  
  document.body.appendChild(backdrop);
  
  const closeModal = () => backdrop.remove();
  backdrop.querySelector('#modalCloseBtn').onclick = closeModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
  
  // Selecionar "Todos"
  backdrop.querySelector('#modal-day-all').onclick = () => {
    tourFilter = 'all';
    closeModal();
    renderTours();
  };
  
  // Selecionar dia específico
  backdrop.querySelectorAll('.tour-filter-day-item').forEach(item => {
    item.onclick = () => {
      tourFilter = item.dataset.day;
      closeModal();
      renderTours();
    };
  });
  
  // Fechar com ESC
  const onEsc = (e) => { 
    if (e.key === 'Escape') { 
      closeModal(); 
      document.removeEventListener('keydown', onEsc); 
    } 
  };
  document.addEventListener('keydown', onEsc);
}

function openCountryFilterModal(countries, counts) {
  const existingModal = document.querySelector('.modal-backdrop');
  if (existingModal) existingModal.remove();
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <button class="modal-close" id="modalCloseBtn"><i class="ti ti-x"></i></button>
      <div class="modal-title">
        <i class="ti ti-flag"></i>
        <span>Filtrar por país</span>
      </div>
      <div class="modal-sub">Selecione um país para filtrar os passeios</div>
      <div class="modal-divider"></div>
      
      <div style="margin-bottom:16px">
        <button class="filter-chip ${tourCountryFilter==='all'?'active':''}" id="modal-country-all" style="width:100%;justify-content:center;padding:10px">
          <i class="ti ti-flag"></i> Todos os países (${tours.length} passeios)
        </button>
      </div>
      
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">
        Países com passeios
      </div>
      
      <div style="max-height:300px;overflow-y:auto">
        ${countries.map(country => {
          const flag = getCountryFlag(country);
          return `
            <div class="tour-filter-country-item ${tourCountryFilter===country?'active':''}" data-country="${escHtml(country)}" style="
              display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius-sm);
              cursor:pointer;transition:background .12s;margin-bottom:4px;
              ${tourCountryFilter===country?'background:var(--accent-light);border:1px solid var(--accent-mid)':'border:1px solid transparent'}
            " onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='${tourCountryFilter===country?'var(--accent-light)':''}'">
              <span style="font-size:24px">${flag}</span>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:500">${escHtml(country)}</div>
              </div>
              <div style="background:var(--accent-light);color:var(--accent);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">
                ${counts[country]} passeio${counts[country] !== 1 ? 's' : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
  
  document.body.appendChild(backdrop);
  
  const closeModal = () => backdrop.remove();
  backdrop.querySelector('#modalCloseBtn').onclick = closeModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
  
  // Selecionar "Todos"
  backdrop.querySelector('#modal-country-all').onclick = () => {
    tourCountryFilter = 'all';
    closeModal();
    renderTours();
  };
  
  // Selecionar país específico
  backdrop.querySelectorAll('.tour-filter-country-item').forEach(item => {
    item.onclick = () => {
      tourCountryFilter = item.dataset.country;
      closeModal();
      renderTours();
    };
  });
  
  // Fechar com ESC
  const onEsc = (e) => { 
    if (e.key === 'Escape') { 
      closeModal(); 
      document.removeEventListener('keydown', onEsc); 
    } 
  };
  document.addEventListener('keydown', onEsc);
}

function getCountryFlag(countryName) {
  // Buscar a flag do país nos dados
  for (const dayKey in data) {
    const country = data[dayKey].find(c => (c.name || 'País sem nome') === countryName);
    if (country && country.flag) return country.flag;
  }
  return '🌍';
}

function getTourEventsForDay(dayKey) {
  return tours.filter(t => t.linkedDay === dayKey);
}

function addTour() {
  tours.push({name:'', time:'', linkedDay:'', url:'', location:'', note:'', lat:null, lng:null});
  save(); renderTours();
  setTimeout(()=>{ const i=document.querySelectorAll('.tour-name-input'); if(i.length) i[i.length-1].focus(); },50);
}