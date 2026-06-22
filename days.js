// days.js - Dias, países, atividades e cards (com grid de dias)
let dayTypeFilter = 'all';

function renderDaysList() {
  const container = document.getElementById('daysListItems');
  container.innerHTML = '';
  const keys = Object.keys(data).filter(k => data[k]&&data[k].length>0).sort();
  const tourKeys = tours.filter(t => t.linkedDay).map(t => t.linkedDay);
  const hotelKeys = hotels.filter(h => h.checkinDay || h.checkoutDay).flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean));
  const allKeys = [...new Set([...keys, ...tourKeys, ...hotelKeys])].sort();
  
  if (!allKeys.length) { container.innerHTML='<div class="day-empty-hint">Ainda sem dias planejados.</div>'; return; }
  
  allKeys.forEach(key => {
    const [y,m,d] = key.split('-').map(Number);
    const countryNames = data[key] ? data[key].map(c=>c.name||'País').join(', ') : '';
    const tourNames = tours.filter(t => t.linkedDay === key).map(t => t.name).join(', ');
    const hotelNames = hotels.filter(h => h.checkinDay === key || h.checkoutDay === key).map(h => h.name).join(', ');
    let label = countryNames || tourNames || hotelNames || 'Sem itens';
    if (countryNames && tourNames) label = countryNames + ' · ' + tourNames;
    else if (!countryNames && tourNames) label = '🚶‍♂️ ' + tourNames;
    else if (!countryNames && !tourNames && hotelNames) label = '🏨 ' + hotelNames;
    
    const wrapper = document.createElement('div');
    wrapper.className = 'day-pill-wrapper';
    
    const btn = document.createElement('button');
    btn.className = 'day-pill'+(key===selectedDate?' active':'');
    btn.innerHTML = `<span class="day-pill-date">${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}</span><span class="day-pill-countries">${escHtml(label)}</span>`;
    btn.onclick = () => selectDate(y,m-1,d);
    
    const delBtn = document.createElement('button');
    delBtn.className = 'day-delete-btn';
    delBtn.innerHTML = '<i class="ti ti-x"></i>';
    delBtn.title = 'Apagar este dia';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      const confirmed = await confirmDelete(`Tem certeza que deseja apagar todos os itens do dia ${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}?`);
      if (confirmed) {
        delete data[key];
        tours.forEach(t => { if (t.linkedDay === key) t.linkedDay = ''; });
        hotels.forEach(h => { if (h.checkinDay === key) h.checkinDay = ''; if (h.checkoutDay === key) h.checkoutDay = ''; });
        save();
        if (selectedDate === key) { selectedDate = null; renderMain(); }
        renderDaysList();
        renderCalendar();
        renderTours();
        renderHotels();
        renderGuide();
      }
    };
    
    wrapper.appendChild(btn);
    wrapper.appendChild(delBtn);
    container.appendChild(wrapper);
  });
}

function countActivityTypesForDay() {
  const counts = {};
  DAY_TYPE_LIST.forEach(t => counts[t]=0);
  if (!selectedDate || !data[selectedDate]) return counts;
  data[selectedDate].forEach(c => (c.activities||[]).forEach(a => {
    const t = a.type || 'tour';
    counts[t] = (counts[t] || 0) + 1;
  }));
  return counts;
}

function renderDayFilterBar() {
  const bar = document.getElementById('dayFilterBar');
  if (!selectedDate || !data[selectedDate] || !data[selectedDate].length) { bar.innerHTML=''; return; }
  const totalActs = data[selectedDate].reduce((sum,c)=>sum+(c.activities||[]).length,0);
  if (!totalActs) { bar.innerHTML=''; return; }
  const counts = countActivityTypesForDay();
  let html = `<div class="filter-bar"><span class="filter-bar-label">Filtrar:</span>`;
  html += `<button class="filter-chip ${dayTypeFilter==='all'?'active':''}" id="dft-all">Todos <span class="fc-count">${totalActs}</span></button>`;
  DAY_TYPE_LIST.forEach(t => {
    if (!counts[t]) return;
    html += `<button class="filter-chip ${dayTypeFilter===t?'active':''}" id="dft-${t}">${DAY_TYPE_LABELS[t]} <span class="fc-count">${counts[t]}</span></button>`;
  });
  html += `</div>`;
  bar.innerHTML = html;
  document.getElementById('dft-all').onclick = () => { dayTypeFilter='all'; renderMain(); };
  DAY_TYPE_LIST.forEach(t => {
    const el = document.getElementById(`dft-${t}`);
    if (el) el.onclick = () => { dayTypeFilter=t; renderMain(); };
  });
}

function renderMain() {
  const mainContent = document.getElementById('mainContent');
  const addBtn = document.getElementById('addCountryBtn');
  
  if (!selectedDate) {
    addBtn.style.display = 'none';
    document.getElementById('mainDate').textContent = 'Todos os dias';
    document.getElementById('mainWeekday').textContent = 'Visão geral da viagem';
    document.getElementById('dayFilterBar').innerHTML = '';
    document.getElementById('hotelBanners').innerHTML = '';
    document.getElementById('tourBanners').innerHTML = '';
    
    // Renderizar grid de dias
    renderDaysGrid();
    return;
  }
  
  const [y,m,d] = selectedDate.split('-').map(Number);
  const dateObj = new Date(y,m-1,d);
  document.getElementById('mainDate').textContent = `${d} de ${MONTHS[m-1]} de ${y}`;
  document.getElementById('mainWeekday').textContent = WEEKDAYS[dateObj.getDay()];
  addBtn.style.display = 'flex';
  if (!data[selectedDate]) data[selectedDate] = [];
  const countries = data[selectedDate];
  
  // Usar função unificada de banners
  renderEntityBanners('tourBanners', BANNER_CONFIGS.tour);
  renderEntityBanners('hotelBanners', BANNER_CONFIGS.hotel);
  
  renderDayFilterBar();
  if (!countries.length) {
    mainContent.innerHTML = `<div class="empty-state"><i class="ti ti-map-pin empty-icon"></i><div class="empty-title">Nenhum país adicionado</div><div class="empty-sub">Adicione um país para planejar os passeios.</div></div><button class="add-country-btn" id="addCountryInline"><i class="ti ti-plus"></i> Adicionar país</button>`;
    document.getElementById('addCountryInline').onclick = addCountry; 
    return;
  }
  mainContent.innerHTML = `<div class="countries">${countries.map((c,ci) => renderCountryCard(c,ci)).join('')}</div><button class="add-country-btn" id="addCountryBottom" style="margin-top:12px"><i class="ti ti-plus"></i> Adicionar país</button>`;
  document.getElementById('addCountryBottom').onclick = addCountry;
  bindCountryEvents(countries);
}

function renderDaysGrid() {
  const mainContent = document.getElementById('mainContent');
  
  // Coletar todos os dias com conteúdo
  const dayKeysWithCountries = Object.keys(data).filter(k => data[k] && data[k].length > 0);
  const tourKeys = tours.filter(t => t.linkedDay).map(t => t.linkedDay);
  const hotelKeys = hotels.filter(h => h.checkinDay || h.checkoutDay).flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean));
  const allKeys = [...new Set([...dayKeysWithCountries, ...tourKeys, ...hotelKeys])].sort();
  
  if (!allKeys.length) {
    mainContent.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-calendar-event empty-icon"></i>
        <div class="empty-title">Nenhum dia planejado</div>
        <div class="empty-sub">Clique em um dia no calendário para começar a planejar sua viagem.</div>
      </div>`;
    return;
  }
  
  // Agrupar por mês
  const groupedByMonth = {};
  allKeys.forEach(key => {
    const [y, m] = key.split('-').map(Number);
    const monthKey = `${y}-${String(m).padStart(2, '0')}`;
    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = {
        year: y,
        month: m,
        label: `${MONTHS[m-1]} de ${y}`,
        days: []
      };
    }
    groupedByMonth[monthKey].days.push(key);
  });
  
  let html = '<div class="days-grid-container">';
  
  // Ordenar meses
  const sortedMonths = Object.values(groupedByMonth).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
  
  sortedMonths.forEach(monthData => {
    html += `
      <div class="days-grid-month">
        <div class="days-grid-month-title">
          <i class="ti ti-calendar-month"></i> ${monthData.label}
          <span class="days-grid-month-count">${monthData.days.length} dia${monthData.days.length > 1 ? 's' : ''}</span>
        </div>
        <div class="days-grid">`;
    
    monthData.days.forEach(key => {
      const [y, m, d] = key.split('-').map(Number);
      const weekday = WEEKDAYS[new Date(y, m-1, d).getDay()];
      const countries = data[key] || [];
      const dayTours = tours.filter(t => t.linkedDay === key);
      const dayHotels = hotels.filter(h => h.checkinDay === key || h.checkoutDay === key);
      
      // Contar atividades
      const totalActivities = countries.reduce((sum, c) => sum + (c.activities || []).length, 0);
      const totalItems = totalActivities + dayTours.length + dayHotels.length;
      
      // Coletar países
      const countryFlags = countries.map(c => c.flag || '🌍').slice(0, 3);
      const countryNames = countries.map(c => c.name || 'País').slice(0, 2);
      
      // Coletar passeios
      const tourNames = dayTours.map(t => t.name || 'Passeio').slice(0, 2);
      
      // Coletar hotéis
      const hotelEvents = [];
      dayHotels.forEach(h => {
        if (h.checkinDay === key) hotelEvents.push({ type: 'checkin', name: h.name || 'Hotel' });
        if (h.checkoutDay === key) hotelEvents.push({ type: 'checkout', name: h.name || 'Hotel' });
      });
      
      // Determinar cor do destaque
      let highlightColor = 'var(--accent)';
      if (dayTours.length > 0 && countries.length === 0) highlightColor = 'var(--purple)';
      else if (dayHotels.length > 0 && countries.length === 0 && dayTours.length === 0) highlightColor = '#993556';
      
      html += `
        <div class="day-grid-card" onclick="selectDate(${y}, ${m-1}, ${d})" style="border-left: 3px solid ${highlightColor}">
          <div class="day-grid-card-header">
            <div class="day-grid-card-date">
              <span class="day-grid-card-day">${String(d).padStart(2, '0')}</span>
              <span class="day-grid-card-weekday">${weekday}</span>
            </div>
            <div class="day-grid-card-badge">
              ${totalItems} item${totalItems !== 1 ? 's' : ''}
            </div>
          </div>
          
          <div class="day-grid-card-content">
            ${countries.length > 0 ? `
              <div class="day-grid-card-row">
                <span class="day-grid-card-icon">${countryFlags.join(' ')}</span>
                <span class="day-grid-card-text">${escHtml(countryNames.join(', '))}${countries.length > 2 ? ` +${countries.length - 2}` : ''}</span>
              </div>
            ` : ''}
            
            ${dayTours.length > 0 ? `
              <div class="day-grid-card-row">
                <span class="day-grid-card-icon">🚶‍♂️</span>
                <span class="day-grid-card-text">${escHtml(tourNames.join(', '))}${dayTours.length > 2 ? ` +${dayTours.length - 2}` : ''}</span>
              </div>
            ` : ''}
            
            ${hotelEvents.length > 0 ? `
              <div class="day-grid-card-row">
                <span class="day-grid-card-icon">🏨</span>
                <span class="day-grid-card-text">
                  ${hotelEvents.map(ev => `${ev.type === 'checkin' ? 'Entrada' : 'Saída'}: ${escHtml(ev.name)}`).join(' · ')}
                </span>
              </div>
            ` : ''}
            
            ${totalItems === 0 ? `
              <div class="day-grid-card-row">
                <span class="day-grid-card-text" style="color:var(--muted);font-style:italic">Nenhum item adicionado</span>
              </div>
            ` : ''}
          </div>
          
          <div class="day-grid-card-footer">
            <span class="day-grid-card-link">Ver detalhes <i class="ti ti-arrow-right"></i></span>
          </div>
        </div>`;
    });
    
    html += `
        </div>
      </div>`;
  });
  
  html += '</div>';
  mainContent.innerHTML = html;
}

function renderCountryCard(c,ci) {
  let acts = c.activities||[];
  const hasPin = c.lat && c.lng;
  const noneVisible = dayTypeFilter!=='all' && !acts.some(a => (a.type||'tour')===dayTypeFilter);
  const fields = ENTITY_CONFIG.country.getFields(ci);
  
  return `<div class="country-card">
    <div class="country-header">
      <button class="btn-icon" id="${fields.flag}" style="font-size:22px;padding:2px 4px;background:none;border:none;border-radius:4px;line-height:1.2;cursor:pointer;">${c.flag||'🌍'}</button>
      <input class="country-name" id="${fields.name}" value="${escHtml(c.name)}" placeholder="Nome do país / cidade" />
      <button class="btn-icon" id="${fields.delete}" title="Remover" aria-label="Remover país"><i class="ti ti-trash"></i></button>
    </div>
    <div class="country-location-row">
      <i class="ti ti-map-pin" style="font-size:14px;color:${hasPin?'var(--accent)':'var(--muted)'};flex-shrink:0"></i>
      <input class="location-input" id="${fields.location}" value="${escHtml(c.location||c.name||'')}" placeholder="Localização para o mapa (cidade, país…)" />
      <button class="geo-btn" id="${fields.geo}"><i class="ti ti-pin" style="font-size:12px"></i> Fixar pin</button>
      <span class="geo-status" id="${fields.geoStatus}"></span>
    </div>
    <div class="activities">
      ${!acts.length?`<div style="font-size:12px;color:var(--muted);font-style:italic;padding:4px 2px">Nenhum item — adicione passeios, ônibus ou refeições.</div>`:
        noneVisible?`<div style="font-size:12px;color:var(--muted);font-style:italic;padding:4px 2px">Nenhum item de "${DAY_TYPE_LABELS[dayTypeFilter]}" neste país.</div>`:
        acts.map((a)=>renderActivity(c,ci,a)).join('')}
    </div>
    <div class="country-footer">
      <button class="btn btn-sm" id="${fields.addActivity}"><i class="ti ti-plus"></i> Adicionar item</button>
      <button class="btn btn-sm" id="${fields.duplicate}"><i class="ti ti-copy"></i> Duplicar para os próximos dias</button>
    </div>
  </div>`;
}

function renderActivity(c,ci,a) {
  const aid = a.id;
  const typeBtns=['tour','bus','food','hotel'].map(k=>{
    const label={tour:'Passeio',bus:'Ônibus',food:'Refeição',hotel:'Hotel'}[k];
    return `<button class="type-sel ${a.type===k?'active-'+k:''}" id="type-${ci}-${aid}-${k}">${label}</button>`;
  }).join('');
  const cVis=a.type==='custom'?'visible':'';
  const thisType = a.type||'tour';
  const isDimmed = dayTypeFilter!=='all' && thisType!==dayTypeFilter;
  return `<div class="activity-row${isDimmed?' dimmed':''}" id="arow-${ci}-${aid}" draggable="true">
    <span class="drag-handle" title="Arrastar para reordenar"><i class="ti ti-grip-vertical"></i></span>
    <input class="activity-time" id="atime-${ci}-${aid}" type="time" value="${escHtml(a.time||'')}" />
    <input class="activity-name" id="aname-${ci}-${aid}" value="${escHtml(a.name||'')}" placeholder="Descrição…" />
    <button class="btn-icon" id="del-act-${ci}-${aid}" style="font-size:14px"><i class="ti ti-x"></i></button>
    <div class="type-row">
      ${typeBtns}
      <button class="type-sel ${a.type==='custom'?'active-custom':''}" id="type-${ci}-${aid}-custom">Outro</button>
      <input class="custom-type-input ${cVis}" id="customtype-${ci}-${aid}" value="${escHtml(a.customType||'')}" placeholder="ex: Trem…" maxlength="20" />
    </div>
  </div>`;
}

function bindCountryEvents(countries) {
  countries.forEach((c,ci) => {
    const fields = ENTITY_CONFIG.country.getFields(ci);
    
    const nameEl = document.getElementById(fields.name);
    if (nameEl) nameEl.oninput = e => { data[selectedDate][ci].name=e.target.value; save(); renderDaysList(); };

    const locEl = document.getElementById(fields.location);
    if (locEl) locEl.oninput = e => { data[selectedDate][ci].location=e.target.value; save(); };

    const geoBtn = document.getElementById(fields.geo);
    const geoStatus = document.getElementById(fields.geoStatus);
    if (geoBtn) geoBtn.onclick = () => applyGeocodeToEntity(data[selectedDate][ci], 'location', geoStatus);

    const dupBtn = document.getElementById(fields.duplicate);
    if (dupBtn) dupBtn.onclick = () => openDuplicatePopover(ci);

    const flagEl = document.getElementById(fields.flag);
    if (flagEl) flagEl.onclick = () => {
      const flags=['🇧🇷','🇦🇷','🇺🇸','🇫🇷','🇮🇹','🇯🇵','🇵🇹','🇪🇸','🇩🇪','🇬🇧','🇦🇺','🇨🇦','🇲🇽','🇨🇴','🇨🇱','🇵🇪','🇳🇿','🇨🇳','🇮🇳','🇹🇭','🌍','🌎','🌏'];
      const cur=flags.indexOf(c.flag||'🌍');
      data[selectedDate][ci].flag=flags[(cur+1)%flags.length]; save(); renderMain();
    };

    const delEl = document.getElementById(fields.delete);
    if (delEl) delEl.onclick = async () => { 
      const confirmed = await confirmDelete('Tem certeza que deseja remover este país e todos os seus itens?');
      if (confirmed) {
        data[selectedDate].splice(ci,1); save(); renderMain(); renderDaysList(); renderCalendar(); 
      }
    };

    const addAct = document.getElementById(fields.addActivity);
    if (addAct) addAct.onclick = () => addActivity(ci);

    // Bind de atividades
    (c.activities||[]).forEach((a) => {
      const aid = a.id;
      const tEl=document.getElementById(`atime-${ci}-${aid}`);
      if(tEl) tEl.oninput=e=>{ const f=findActivity(ci,aid); if(f) f.act.time=e.target.value; save(); };
      const nEl=document.getElementById(`aname-${ci}-${aid}`);
      if(nEl) nEl.oninput=e=>{ const f=findActivity(ci,aid); if(f) f.act.name=e.target.value; save(); };
      const dEl=document.getElementById(`del-act-${ci}-${aid}`);
      if(dEl) dEl.onclick=async ()=>{ 
        const confirmed = await confirmDelete('Tem certeza que deseja remover esta atividade?');
        if (confirmed) {
          const f=findActivity(ci,aid); 
          if(f) data[selectedDate][ci].activities.splice(f.idx,1); 
          save(); 
          renderMain(); 
        }
      };
      ['tour','bus','food','hotel'].forEach(type=>{
        const tBtn=document.getElementById(`type-${ci}-${aid}-${type}`);
        if(tBtn) tBtn.onclick=()=>{ const f=findActivity(ci,aid); if(f){ f.act.type=type; f.act.customType=''; } save(); renderMain(); };
      });
      const cBtn=document.getElementById(`type-${ci}-${aid}-custom`);
      const cInp=document.getElementById(`customtype-${ci}-${aid}`);
      if(cBtn&&cInp){
        cBtn.onclick=()=>{ const f=findActivity(ci,aid); if(f) f.act.type='custom'; save(); cInp.classList.add('visible'); cInp.focus(); };
        cInp.oninput=e=>{ const f=findActivity(ci,aid); if(f) f.act.customType=e.target.value; save(); };
        cInp.onblur=()=>{ const f=findActivity(ci,aid); if(f && !f.act.customType){ f.act.type='tour'; save(); renderMain(); } };
        if(a.type==='custom') cInp.classList.add('visible');
      }

      const rowEl = document.getElementById(`arow-${ci}-${aid}`);
      if (rowEl) {
        const stopProp = (e) => e.stopPropagation();
        rowEl.querySelectorAll('input, button').forEach(el => el.addEventListener('click', stopProp));
        rowEl.addEventListener('click', (e) => {
          if (e.target.closest('input') || e.target.closest('button')) return;
          openActivityModal(ci, aid);
        });
        
        rowEl.addEventListener('dragstart', e => {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', aid);
          rowEl.classList.add('dragging');
        });
        rowEl.addEventListener('dragend', () => rowEl.classList.remove('dragging'));
        rowEl.addEventListener('dragover', e => {
          e.preventDefault();
          rowEl.classList.add('drag-over');
        });
        rowEl.addEventListener('dragleave', () => rowEl.classList.remove('drag-over'));
        rowEl.addEventListener('drop', e => {
          e.preventDefault();
          rowEl.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          if (!draggedId || draggedId === aid) return;
          const acts = data[selectedDate][ci].activities;
          const fromIdx = acts.findIndex(x => x.id === draggedId);
          const toIdx = acts.findIndex(x => x.id === aid);
          if (fromIdx === -1 || toIdx === -1) return;
          const [moved] = acts.splice(fromIdx, 1);
          acts.splice(toIdx, 0, moved);
          save(); renderMain();
        });
      }
    });
  });
}

function findActivity(ci, actId) {
  const acts = data[selectedDate] && data[selectedDate][ci] && data[selectedDate][ci].activities;
  if (!acts) return null;
  const idx = acts.findIndex(a => a.id === actId);
  if (idx === -1) return null;
  return { idx, act: acts[idx] };
}

function openActivityModal(ci, aid) {
  const f = findActivity(ci, aid);
  if (!f) return;
  const act = f.act;
  const country = data[selectedDate][ci];
  
  const typeLabel = act.type === 'custom' ? (act.customType || 'Outro') : (DAY_TYPE_LABELS[act.type] || 'Passeio');
  const timeStr = act.time || '—';
  const nameStr = act.name || '(sem descrição)';
  const countryName = country.name || 'País sem nome';
  const flag = country.flag || '🌍';
  
  const linkedTours = tours.filter(t => 
    t.linkedDay === selectedDate && 
    t.name && act.name && 
    t.name.toLowerCase().includes(act.name.toLowerCase())
  );
  
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-box">
      <button class="modal-close" id="modalCloseBtn"><i class="ti ti-x"></i></button>
      <div class="modal-title">
        <span>${flag}</span>
        <span>${escHtml(nameStr)}</span>
      </div>
      <div class="modal-sub">
        <span class="modal-tag">${escHtml(typeLabel)}</span>
        <span style="margin-left:12px;color:var(--muted)">${escHtml(countryName)} · ${escHtml(fmtDate(selectedDate))}</span>
      </div>
      <div class="modal-divider"></div>
      
      <div class="modal-field">
        <span class="modal-field-label"><i class="ti ti-clock" style="margin-right:4px"></i> Horário</span>
        <div class="modal-field-value">${escHtml(timeStr)}</div>
      </div>
      
      <div class="modal-field">
        <span class="modal-field-label"><i class="ti ti-map-pin" style="margin-right:4px"></i> País / Local</span>
        <div class="modal-field-value">${escHtml(countryName)}${country.location ? ` · ${escHtml(country.location)}` : ''}</div>
      </div>
      
      ${linkedTours.length ? `
        <div class="modal-field">
          <span class="modal-field-label"><i class="ti ti-map" style="margin-right:4px"></i> Passeios vinculados</span>
          <div class="modal-field-value">${linkedTours.map(t => 
            `<div style="padding:4px 0;cursor:pointer;color:var(--accent);" onclick="goToEntity('tour', ${tours.indexOf(t)})">🚶‍♂️ ${escHtml(t.name)}${t.time ? ` — ${escHtml(t.time)}` : ''}</div>`
          ).join('')}</div>
        </div>
      ` : ''}
      
      <div class="modal-field">
        <span class="modal-field-label"><i class="ti ti-notes" style="margin-right:4px"></i> Descrição</span>
        <div class="modal-field-value" style="min-height:40px;">${escHtml(act.description || 'Sem descrição adicional.')}</div>
      </div>
      
      <div class="modal-actions">
        <button class="btn btn-sm" id="modalEditBtn"><i class="ti ti-edit"></i> Editar descrição</button>
        <button class="btn btn-sm btn-accent" id="modalCloseBtn2">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(backdrop);
  
  const closeModal = () => backdrop.remove();
  backdrop.querySelector('#modalCloseBtn').onclick = closeModal;
  backdrop.querySelector('#modalCloseBtn2').onclick = closeModal;
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
  
  const editBtn = backdrop.querySelector('#modalEditBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      const valEl = backdrop.querySelector('.modal-field-value');
      const newDesc = prompt('Editar descrição da atividade:', act.description || '');
      if (newDesc !== null) {
        act.description = newDesc.trim() || '';
        save();
        valEl.textContent = act.description || 'Sem descrição adicional.';
      }
    };
  }
  
  const onEsc = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); } };
  document.addEventListener('keydown', onEsc);
}

function openDuplicatePopover(ci) {
  const country = data[selectedDate][ci];
  if (!country) return;
  const [y,m,d] = selectedDate.split('-').map(Number);
  const nextDate = new Date(y, m-1, d+1);
  const defaultEnd = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,'0')}-${String(nextDate.getDate()).padStart(2,'0')}`;

  const backdrop = document.createElement('div');
  backdrop.className = 'dup-popover-backdrop';
  backdrop.innerHTML = `
    <div class="dup-popover">
      <div class="dup-popover-title"><i class="ti ti-copy"></i> Duplicar "${escHtml(country.name||'País')}"</div>
      <div class="dup-popover-sub">Copia nome, localização, pin e itens para outros dias.</div>
      <div class="dup-quick-row">
        <button class="dup-quick-btn" data-n="1">+1 dia</button>
        <button class="dup-quick-btn" data-n="3">+3 dias</button>
        <button class="dup-quick-btn" data-n="7">+7 dias</button>
      </div>
      <label class="dup-field-label">Ou escolha a data final</label>
      <input type="date" class="dup-input" id="dupEndDate" value="${defaultEnd}" min="${selectedDate}" />
      <div class="dup-status" id="dupStatus"></div>
      <div class="dup-actions">
        <button class="btn btn-sm" id="dupCancel">Cancelar</button>
        <button class="btn btn-sm btn-accent" id="dupConfirm"><i class="ti ti-copy"></i> Duplicar</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  const endInput = backdrop.querySelector('#dupEndDate');
  const statusEl = backdrop.querySelector('#dupStatus');

  backdrop.querySelectorAll('.dup-quick-btn').forEach(btn => {
    btn.onclick = () => {
      const n = parseInt(btn.dataset.n, 10);
      const target = new Date(y, m-1, d+n);
      endInput.value = `${target.getFullYear()}-${String(target.getMonth()+1).padStart(2,'0')}-${String(target.getDate()).padStart(2,'0')}`;
    };
  });

  backdrop.querySelector('#dupCancel').onclick = () => backdrop.remove();
  backdrop.onclick = (e) => { if (e.target===backdrop) backdrop.remove(); };

  backdrop.querySelector('#dupConfirm').onclick = () => {
    const endVal = endInput.value;
    if (!endVal) { statusEl.textContent = 'Escolha uma data.'; return; }
    const [ey,em,ed] = endVal.split('-').map(Number);
    const startObj = new Date(y, m-1, d);
    const endObj = new Date(ey, em-1, ed);
    if (endObj <= startObj) { statusEl.textContent = 'A data precisa ser depois do dia atual.'; return; }
    const diffDays = Math.round((endObj - startObj) / 86400000);
    if (diffDays > 60) { statusEl.textContent = 'Intervalo muito grande (máx. 60 dias).'; return; }

    let count = 0;
    for (let i=1; i<=diffDays; i++) {
      const target = new Date(y, m-1, d+i);
      const key = dateKey(target.getFullYear(), target.getMonth(), target.getDate());
      if (!data[key]) data[key] = [];
      const clone = JSON.parse(JSON.stringify(country));
      (clone.activities||[]).forEach(a => { a.id = genId(); });
      data[key].push(clone);
      count++;
    }
    save();
    renderCalendar(); renderDaysList(); renderMain();
    statusEl.textContent = `✓ Duplicado para ${count} dia${count>1?'s':''}.`;
    setTimeout(() => backdrop.remove(), 700);
  };

  setTimeout(() => endInput.focus(), 50);
}

function addCountry() {
  if (!selectedDate) return;
  if (!data[selectedDate]) data[selectedDate]=[];
  data[selectedDate].push({name:'',flag:'🌍',location:'',activities:[]});
  save(); renderMain(); renderDaysList(); renderCalendar();
  setTimeout(()=>{ const i=document.querySelectorAll('.country-name'); if(i.length) i[i.length-1].focus(); },50);
}

function addActivity(ci) {
  if (!data[selectedDate]||!data[selectedDate][ci]) return;
  if (!data[selectedDate][ci].activities) data[selectedDate][ci].activities=[];
  const newId = genId();
  data[selectedDate][ci].activities.push({id:newId, time:'', name:'', type:'tour', customType:'', description:''});
  save(); renderMain();
  setTimeout(()=>{ const el=document.getElementById(`aname-${ci}-${newId}`); if(el) el.focus(); },50);
}