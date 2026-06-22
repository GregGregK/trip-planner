// hotels.js - Hotéis tab (refatorado com filtros melhorados)
let hotelFilter = 'all';
let hotelCountryFilter = 'all';

function renderHotels() {
  renderHotelFilterBar();
  const container = document.getElementById('hotelsContent');
  if (!hotels.length) {
    container.innerHTML = `<div class="empty-state"><i class="ti ti-bed empty-icon"></i><div class="empty-title">Nenhum hotel salvo</div><div class="empty-sub">Adicione hotéis com endereço, link e vincule o check-in/check-out a um dia da viagem.</div></div><button class="add-link-btn" onclick="addHotel()"><i class="ti ti-plus"></i> Adicionar hotel</button>`;
    return;
  }
  
  let visible = [...hotels];
  
  // Aplicar filtro por dia
  if (hotelFilter !== 'all') {
    visible = visible.filter(h => h.checkinDay === hotelFilter || h.checkoutDay === hotelFilter);
  }
  
  // Aplicar filtro por país
  if (hotelCountryFilter !== 'all') {
    visible = visible.filter(h => {
      // Verificar países no dia de check-in
      if (h.checkinDay && data[h.checkinDay]) {
        return data[h.checkinDay].some(country => 
          (country.name || 'País sem nome') === hotelCountryFilter
        );
      }
      // Verificar países no dia de check-out
      if (h.checkoutDay && data[h.checkoutDay]) {
        return data[h.checkoutDay].some(country => 
          (country.name || 'País sem nome') === hotelCountryFilter
        );
      }
      return false;
    });
  }
  
  if (!visible.length) {
    container.innerHTML = `<div class="empty-state"><i class="ti ti-filter-off empty-icon"></i><div class="empty-title">Nenhum hotel encontrado</div><div class="empty-sub">Tente outros filtros ou adicione um novo hotel.</div></div><button class="add-link-btn" onclick="addHotel()"><i class="ti ti-plus"></i> Adicionar hotel</button>`;
    return;
  }
  
  container.innerHTML = visible.map((h) => {
    const realIdx = hotels.indexOf(h);
    return renderHotelCard(h, realIdx);
  }).join('') + `<button class="add-link-btn" onclick="addHotel()"><i class="ti ti-plus"></i> Adicionar hotel</button>`;
  
  bindHotelEvents();
}

function renderHotelCard(h, hi) {
  const hasPin = h.lat && h.lng;
  const href = h.url && (h.url.startsWith('http') ? h.url : 'https://'+h.url);
  const fields = ENTITY_CONFIG.hotel.getFields(hi);
  
  // Buscar países do dia de check-in
  let countryNames = '';
  if (h.checkinDay && data[h.checkinDay]) {
    countryNames = data[h.checkinDay].map(c => c.name || 'País').join(', ');
  } else if (h.checkoutDay && data[h.checkoutDay]) {
    countryNames = data[h.checkoutDay].map(c => c.name || 'País').join(', ');
  }
  
  return `<div class="hotel-card">
    <div class="hotel-top-row">
      <div class="hotel-icon"><i class="ti ti-bed"></i></div>
      <input class="hotel-name-input" id="${fields.name}" value="${escHtml(h.name)}" placeholder="Nome do hotel" />
      <div class="hotel-actions">
        <a class="link-open-btn" id="${fields.href}" href="${escHtml(href||'#')}" target="_blank" rel="noopener" ${!h.url?'style="opacity:.3;pointer-events:none"':''} title="Abrir site"><i class="ti ti-external-link"></i></a>
        <button class="btn-icon" id="${fields.delete}" title="Remover"><i class="ti ti-trash"></i></button>
      </div>
    </div>
    <div class="hotel-field-row">
      <i class="ti ti-map-pin" style="color:${hasPin?'var(--accent)':'var(--muted)'}"></i>
      <input class="hotel-text-input" id="${fields.address}" value="${escHtml(h.address||'')}" placeholder="Endereço (rua, cidade, país…)" />
      <button class="geo-btn" id="${fields.geo}"><i class="ti ti-pin" style="font-size:12px"></i> Fixar pin</button>
      <span class="geo-status" id="${fields.geoStatus}"></span>
    </div>
    <div class="hotel-field-row">
      <i class="ti ti-link"></i>
      <input class="hotel-text-input url" id="${fields.url}" value="${escHtml(h.url||'')}" placeholder="https://site-do-hotel.com" />
    </div>
    ${countryNames ? `<div class="hotel-field-row" style="font-size:11px;color:var(--muted);padding:4px 0">
      <i class="ti ti-flag"></i>
      <span>🌍 ${escHtml(countryNames)}</span>
    </div>` : ''}
    <div class="hotel-checkblock">
      <div class="hotel-check-col">
        <span class="hotel-check-label checkin"><i class="ti ti-login-2"></i> Check-in</span>
        <div class="hotel-check-fields">
          <select class="hotel-day-select${h.checkinDay?' has-day':''}" id="hcheckinday-${hi}">${getAllDayOptions(h.checkinDay||'')}</select>
          <input type="time" class="hotel-time-input" id="hcheckintime-${hi}" value="${escHtml(h.checkinTime||'')}" />
        </div>
      </div>
      <div class="hotel-check-col">
        <span class="hotel-check-label checkout"><i class="ti ti-logout-2"></i> Check-out</span>
        <div class="hotel-check-fields">
          <select class="hotel-day-select${h.checkoutDay?' has-day':''}" id="hcheckoutday-${hi}">${getAllDayOptions(h.checkoutDay||'')}</select>
          <input type="time" class="hotel-time-input" id="hcheckouttime-${hi}" value="${escHtml(h.checkoutTime||'')}" />
        </div>
      </div>
    </div>
    <textarea class="hotel-note-input" id="${fields.note}" placeholder="Anotação (número da reserva, código de acesso…)" rows="1">${escHtml(h.note||'')}</textarea>
  </div>`;
}

function bindHotelEvents() {
  hotels.forEach((h, hi) => {
    const fields = ENTITY_CONFIG.hotel.getFields(hi);
    
    const nEl = document.getElementById(fields.name);
    if (nEl) nEl.oninput = e => { hotels[hi].name = e.target.value; save(); renderDaysList(); renderGuide(); };

    const aEl = document.getElementById(fields.address);
    if (aEl) aEl.oninput = e => { hotels[hi].address = e.target.value; save(); };

    const uEl = document.getElementById(fields.url);
    if (uEl) uEl.oninput = e => { hotels[hi].url = e.target.value; save(); updateEntityHref('hotel', hi); };

    const geoBtn = document.getElementById(fields.geo);
    const geoStatus = document.getElementById(fields.geoStatus);
    if (geoBtn) geoBtn.onclick = () => applyGeocodeToEntity(hotels[hi], 'address', geoStatus);

    const delBtn = document.getElementById(fields.delete);
if (delBtn) delBtn.onclick = async () => { 
  const confirmed = await confirmDelete(`Tem certeza que deseja remover o hotel "${h.name || 'Sem nome'}"?`);
  if (confirmed) {
    hotels.splice(hi, 1); save(); renderHotels(); renderMain(); renderGuide(); 
  }
};

    const noteEl = document.getElementById(fields.note);
    if (noteEl) noteEl.oninput = e => { hotels[hi].note = e.target.value; save(); };

    const cinDay = document.getElementById(`hcheckinday-${hi}`);
    if (cinDay) cinDay.onchange = e => { hotels[hi].checkinDay = e.target.value; save(); renderHotels(); renderMain(); renderGuide(); };
    const cinTime = document.getElementById(`hcheckintime-${hi}`);
    if (cinTime) cinTime.oninput = e => { hotels[hi].checkinTime = e.target.value; save(); renderMain(); };

    const coutDay = document.getElementById(`hcheckoutday-${hi}`);
    if (coutDay) coutDay.onchange = e => { hotels[hi].checkoutDay = e.target.value; save(); renderHotels(); renderMain(); renderGuide(); };
    const coutTime = document.getElementById(`hcheckouttime-${hi}`);
    if (coutTime) coutTime.oninput = e => { hotels[hi].checkoutTime = e.target.value; save(); renderMain(); };
  });
}

function renderHotelFilterBar() {
  const bar = document.getElementById('hotelFilterBar');
  if (!hotels.length) { bar.innerHTML = ''; return; }
  
  let html = '<div class="filter-bar" style="flex-wrap:wrap;gap:8px">';
  html += '<span class="filter-bar-label">Filtrar:</span>';
  
  // Filtro por dia com modal de calendário
  const dayLabel = hotelFilter === 'all' ? 'Todos os dias' : fmtDate(hotelFilter);
  html += `<button class="filter-chip ${hotelFilter==='all'?'active':''}" id="hf-day" style="gap:4px">
    <i class="ti ti-calendar" style="font-size:13px"></i> ${dayLabel}
    ${hotelFilter !== 'all' ? '<span style="cursor:pointer;margin-left:4px" id="hf-clear-day" title="Limpar filtro de dia"><i class="ti ti-x" style="font-size:10px"></i></span>' : ''}
  </button>`;
  
  // Filtro por país
  const countryCounts = getHotelCountries();
  const countries = Object.keys(countryCounts).sort();
  const countryLabel = hotelCountryFilter === 'all' ? 'Todos os países' : hotelCountryFilter;
  html += `<button class="filter-chip ${hotelCountryFilter==='all'?'active':''}" id="hf-country" style="gap:4px">
    <i class="ti ti-flag" style="font-size:13px"></i> ${escHtml(countryLabel)}
    ${hotelCountryFilter !== 'all' ? '<span style="cursor:pointer;margin-left:4px" id="hf-clear-country" title="Limpar filtro de país"><i class="ti ti-x" style="font-size:10px"></i></span>' : ''}
  </button>`;
  
  // Contador
  const filteredCount = hotels.filter(h => {
    if (hotelFilter !== 'all' && h.checkinDay !== hotelFilter && h.checkoutDay !== hotelFilter) return false;
    if (hotelCountryFilter !== 'all') {
      const days = [h.checkinDay, h.checkoutDay].filter(Boolean);
      return days.some(day => 
        data[day] && data[day].some(c => (c.name || 'País sem nome') === hotelCountryFilter)
      );
    }
    return true;
  }).length;
  
  html += `<span class="fc-count" style="font-size:11px;color:var(--muted);margin-left:4px">${filteredCount} hotel${filteredCount !== 1 ? 's' : ''}</span>`;
  html += '</div>';
  
  // Só criar barra se não existir
  if (!document.getElementById('hotelFilterBar')) {
    const hotelsContent = document.getElementById('hotelsContent');
    const filterDiv = document.createElement('div');
    filterDiv.id = 'hotelFilterBar';
    hotelsContent.parentNode.insertBefore(filterDiv, hotelsContent);
  }
  
  bar.innerHTML = html;
  
  // Evento do botão de filtro por dia (abre modal)
  const dayBtn = document.getElementById('hf-day');
  if (dayBtn) {
    dayBtn.onclick = (e) => {
      if (e.target.closest('#hf-clear-day')) return;
      openHotelDayFilterModal();
    };
  }
  
  // Limpar filtro de dia
  const clearDayBtn = document.getElementById('hf-clear-day');
  if (clearDayBtn) {
    clearDayBtn.onclick = (e) => {
      e.stopPropagation();
      hotelFilter = 'all';
      renderHotels();
    };
  }
  
  // Evento do botão de filtro por país (abre modal)
  const countryBtn = document.getElementById('hf-country');
  if (countryBtn && countries.length > 0) {
    countryBtn.onclick = (e) => {
      if (e.target.closest('#hf-clear-country')) return;
      openHotelCountryFilterModal(countries, countryCounts);
    };
  }
  
  // Limpar filtro de país
  const clearCountryBtn = document.getElementById('hf-clear-country');
  if (clearCountryBtn) {
    clearCountryBtn.onclick = (e) => {
      e.stopPropagation();
      hotelCountryFilter = 'all';
      renderHotels();
    };
  }
}

function getHotelCountries() {
  const countryCounts = {};
  hotels.forEach(h => {
    const days = [h.checkinDay, h.checkoutDay].filter(Boolean);
    const processedCountries = new Set();
    
    days.forEach(day => {
      if (data[day]) {
        data[day].forEach(country => {
          const name = country.name || 'País sem nome';
          if (!processedCountries.has(name)) {
            countryCounts[name] = (countryCounts[name] || 0) + 1;
            processedCountries.add(name);
          }
        });
      }
    });
  });
  return countryCounts;
}

function openHotelDayFilterModal() {
  const existingModal = document.querySelector('.modal-backdrop');
  if (existingModal) existingModal.remove();
  
  // Dias que têm hotéis (check-in ou check-out)
  const hotelDays = [...new Set(hotels.flatMap(h => [h.checkinDay, h.checkoutDay]).filter(Boolean))].sort();
  const counts = {};
  hotels.forEach(h => {
    if (h.checkinDay) counts[h.checkinDay] = (counts[h.checkinDay] || 0) + 1;
    if (h.checkoutDay && h.checkoutDay !== h.checkinDay) {
      counts[h.checkoutDay] = (counts[h.checkoutDay] || 0) + 1;
    }
  });
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <button class="modal-close" id="modalCloseBtn"><i class="ti ti-x"></i></button>
      <div class="modal-title">
        <i class="ti ti-calendar"></i>
        <span>Filtrar hotéis por dia</span>
      </div>
      <div class="modal-sub">Selecione um dia específico ou veja todos os hotéis</div>
      <div class="modal-divider"></div>
      
      <div style="margin-bottom:16px">
        <button class="filter-chip ${hotelFilter==='all'?'active':''}" id="modal-day-all" style="width:100%;justify-content:center;padding:10px">
          <i class="ti ti-calendar"></i> Todos os dias (${hotels.length} hotéis)
        </button>
      </div>
      
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">
        Dias com check-in/check-out
      </div>
      
      <div style="max-height:300px;overflow-y:auto">
        ${hotelDays.length ? hotelDays.map(day => {
          const [y,m,d] = day.split('-').map(Number);
          const weekday = WEEKDAYS[new Date(y,m-1,d).getDay()];
          const countryNames = data[day] ? data[day].map(c => c.name || 'País').join(', ') : '';
          
          // Verificar quantos check-ins e check-outs neste dia
          const checkins = hotels.filter(h => h.checkinDay === day).length;
          const checkouts = hotels.filter(h => h.checkoutDay === day).length;
          let eventLabel = '';
          if (checkins > 0 && checkouts > 0) {
            eventLabel = `${checkins} check-in, ${checkouts} check-out`;
          } else if (checkins > 0) {
            eventLabel = `${checkins} check-in`;
          } else if (checkouts > 0) {
            eventLabel = `${checkouts} check-out`;
          }
          
          return `
            <div class="hotel-filter-day-item ${hotelFilter===day?'active':''}" data-day="${day}" style="
              display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius-sm);
              cursor:pointer;transition:background .12s;margin-bottom:4px;
              ${hotelFilter===day?'background:var(--accent-light);border:1px solid var(--accent-mid)':'border:1px solid transparent'}
            " onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='${hotelFilter===day?'var(--accent-light)':''}'">
              <div style="text-align:center;min-width:40px">
                <div style="font-size:18px;font-weight:700;color:var(--accent)">${String(d).padStart(2,'0')}</div>
                <div style="font-size:10px;color:var(--muted)">${MONTHS[m-1].substring(0,3)}</div>
              </div>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:500">${weekday}-feira</div>
                <div style="font-size:11px;color:var(--muted)">${countryNames || 'Sem países'}</div>
              </div>
              <div style="text-align:right">
                <div style="background:var(--danger-light);color:var(--danger);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">
                  ${eventLabel}
                </div>
              </div>
            </div>
          `;
        }).join('') : '<div style="text-align:center;padding:20px;color:var(--muted)">Nenhum dia com hotéis</div>'}
      </div>
    </div>
  `;
  
  document.body.appendChild(backdrop);
  
  const closeModal = () => backdrop.remove();
  backdrop.querySelector('#modalCloseBtn').onclick = closeModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
  
  // Selecionar "Todos"
  backdrop.querySelector('#modal-day-all').onclick = () => {
    hotelFilter = 'all';
    closeModal();
    renderHotels();
  };
  
  // Selecionar dia específico
  backdrop.querySelectorAll('.hotel-filter-day-item').forEach(item => {
    item.onclick = () => {
      hotelFilter = item.dataset.day;
      closeModal();
      renderHotels();
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

function openHotelCountryFilterModal(countries, counts) {
  const existingModal = document.querySelector('.modal-backdrop');
  if (existingModal) existingModal.remove();
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-box" style="max-width:480px">
      <button class="modal-close" id="modalCloseBtn"><i class="ti ti-x"></i></button>
      <div class="modal-title">
        <i class="ti ti-flag"></i>
        <span>Filtrar hotéis por país</span>
      </div>
      <div class="modal-sub">Selecione um país para filtrar os hotéis</div>
      <div class="modal-divider"></div>
      
      <div style="margin-bottom:16px">
        <button class="filter-chip ${hotelCountryFilter==='all'?'active':''}" id="modal-country-all" style="width:100%;justify-content:center;padding:10px">
          <i class="ti ti-flag"></i> Todos os países (${hotels.length} hotéis)
        </button>
      </div>
      
      <div style="font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">
        Países com hotéis
      </div>
      
      <div style="max-height:300px;overflow-y:auto">
        ${countries.map(country => {
          const flag = getCountryFlag(country);
          return `
            <div class="hotel-filter-country-item ${hotelCountryFilter===country?'active':''}" data-country="${escHtml(country)}" style="
              display:flex;align-items:center;gap:12px;padding:12px;border-radius:var(--radius-sm);
              cursor:pointer;transition:background .12s;margin-bottom:4px;
              ${hotelCountryFilter===country?'background:var(--accent-light);border:1px solid var(--accent-mid)':'border:1px solid transparent'}
            " onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='${hotelCountryFilter===country?'var(--accent-light)':''}'">
              <span style="font-size:24px">${flag}</span>
              <div style="flex:1">
                <div style="font-size:13px;font-weight:500">${escHtml(country)}</div>
              </div>
              <div style="background:var(--danger-light);color:var(--danger);padding:2px 8px;border-radius:12px;font-size:11px;font-weight:600">
                ${counts[country]} hotel${counts[country] !== 1 ? 's' : ''}
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
    hotelCountryFilter = 'all';
    closeModal();
    renderHotels();
  };
  
  // Selecionar país específico
  backdrop.querySelectorAll('.hotel-filter-country-item').forEach(item => {
    item.onclick = () => {
      hotelCountryFilter = item.dataset.country;
      closeModal();
      renderHotels();
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

function getHotelEventsForDay(dayKey) {
  const events = [];
  hotels.forEach((h, hi) => {
    if (h.checkinDay === dayKey) events.push({ hotelIdx: hi, hotel: h, kind: 'checkin', time: h.checkinTime });
    if (h.checkoutDay === dayKey) events.push({ hotelIdx: hi, hotel: h, kind: 'checkout', time: h.checkoutTime });
  });
  return events;
}

function addHotel() {
  hotels.push({name:'',address:'',url:'',note:'',checkinDay:'',checkinTime:'',checkoutDay:'',checkoutTime:'',lat:null,lng:null});
  save(); renderHotels();
  setTimeout(()=>{ const i=document.querySelectorAll('.hotel-name-input'); if(i.length) i[i.length-1].focus(); },50);
}