// utils.js - Funções utilitárias e unificadas
const WEEKDAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const LINK_TAG_LIST = ['transport','hotel','tour','info','other'];
const LINK_TAG_LABELS = { transport:'Transporte', hotel:'Hotel', tour:'Passeio', info:'Info', other:'Outro' };
const LINK_TAG_ICONS = { transport:'ti-plane', hotel:'ti-bed', tour:'ti-map', info:'ti-info-circle', other:'ti-link' };
const DAY_TYPE_LIST = ['tour','bus','food','hotel','custom'];
const DAY_TYPE_LABELS = { tour:'Passeio', bus:'Ônibus', food:'Refeição', hotel:'Hotel', custom:'Outro' };

// Configurações de entidades para operações unificadas
const ENTITY_CONFIG = {
  tour: {
    storeKey: 'tours',
    storage: () => tours,
    tabId: 'tours',
    nameField: 'name',
    locationField: 'location',
    linkedDayField: 'linkedDay',
    iconClass: 'ti-map',
    color: '#534ab7',
    emoji: '🚶‍♂️',
    label: 'Passeio',
    getElementPrefix: (idx) => `t`,
    getFields: (idx) => ({
      name: `tname-${idx}`,
      time: `ttime-${idx}`,
      day: `tday-${idx}`,
      url: `turl-${idx}`,
      location: `tloc-${idx}`,
      note: `tnote-${idx}`,
      geo: `tgeo-${idx}`,
      geoStatus: `tgeo-status-${idx}`,
      delete: `tdel-${idx}`,
      href: `thref-${idx}`
    })
  },
  hotel: {
    storeKey: 'hotels',
    storage: () => hotels,
    tabId: 'hotels',
    nameField: 'name',
    locationField: 'address',
    linkedDayField: 'checkinDay',
    iconClass: 'ti-bed',
    color: '#993556',
    emoji: '🛏️',
    label: 'Hotel',
    getElementPrefix: (idx) => `h`,
    getFields: (idx) => ({
      name: `hname-${idx}`,
      address: `haddr-${idx}`,
      url: `hurl-${idx}`,
      geo: `hgeo-${idx}`,
      geoStatus: `hgeo-status-${idx}`,
      delete: `hdel-${idx}`,
      href: `hhref-${idx}`,
      note: `hnote-${idx}`
    })
  },
  country: {
    storeKey: 'days',
    storage: () => data,
    nameField: 'name',
    locationField: 'location',
    iconClass: 'ti-map-pin',
    color: '#2d6a4f',
    emoji: '🌍',
    label: 'País',
    getElementPrefix: (ci) => `c`,
    getFields: (ci) => ({
      name: `cname-${ci}`,
      location: `cloc-${ci}`,
      geo: `cgeo-${ci}`,
      geoStatus: `cgeo-status-${ci}`,
      delete: `del-country-${ci}`,
      flag: `cflag-${ci}`,
      duplicate: `cdup-${ci}`,
      addActivity: `add-act-${ci}`
    })
  }
};

function dateKey(y,m,d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function today() { const t=new Date(); return dateKey(t.getFullYear(),t.getMonth(),t.getDate()); }
function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmtDate(key) {
  if (!key) return '';
  const [y,m,d] = key.split('-').map(Number);
  return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`;
}
function fmtFullDate(key) {
  if (!key) return '';
  const [y,m,d] = key.split('-').map(Number);
  return `${d} de ${MONTHS[m-1]} de ${y}`;
}
function genId() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); }

// Função unificada de geocodificação
async function geocodeLocation(query) {
  if (!query) return { success: false, message: 'Sem consulta', lat: null, lng: null };
  
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const results = await res.json();
    
    if (results && results.length) {
      const r = results[0];
      return { 
        success: true, 
        message: '✓ Pin salvo', 
        lat: parseFloat(r.lat), 
        lng: parseFloat(r.lon) 
      };
    } else {
      return { success: false, message: 'Não encontrado', lat: null, lng: null };
    }
  } catch(e) {
    return { success: false, message: 'Erro', lat: null, lng: null };
  }
}

// Aplicar geocodificação a qualquer entidade
async function applyGeocodeToEntity(entity, locationField, statusElement) {
  const query = entity[locationField] || entity.name || entity.title || '';
  if (!query) {
    if (statusElement) statusElement.textContent = 'Sem localização';
    return false;
  }
  
  if (statusElement) statusElement.textContent = 'Buscando…';
  
  const result = await geocodeLocation(query);
  
  if (result.success) {
    entity.lat = result.lat;
    entity.lng = result.lng;
    if (!entity[locationField]) entity[locationField] = query;
    save();
  }
  
  if (statusElement) {
    statusElement.textContent = result.message;
    setTimeout(() => { if(statusElement) statusElement.textContent = ''; }, 2000);
  }
  
  return result.success;
}

// Navegação unificada para entidades
function goToEntity(type, index) {
  const config = ENTITY_CONFIG[type];
  if (!config) return;
  
  switchTab(config.tabId);
  setTimeout(() => {
    const prefix = config.getElementPrefix(index);
    const el = document.getElementById(`${prefix}name-${index}`);
    if (el) { 
      el.scrollIntoView({behavior:'smooth', block:'center'}); 
      el.focus(); 
    }
  }, 80);
}

// Atualização unificada de href para links externos
function updateEntityHref(type, index) {
  const config = ENTITY_CONFIG[type];
  if (!config) return;
  
  const prefix = config.getElementPrefix(index);
  const el = document.getElementById(`${prefix}href-${index}`);
  if (!el) return;
  
  const storage = config.storage();
  const url = storage[index]?.url;
  
  if (url) { 
    const href = url.startsWith('http') ? url : 'https://'+url; 
    el.href = href; 
    el.style.opacity = ''; 
    el.style.pointerEvents = ''; 
  } else { 
    el.href = '#'; 
    el.style.opacity = '.3'; 
    el.style.pointerEvents = 'none'; 
  }
}

// Obter opções de dias unificadas
function getAllDayOptions(selectedKey) {
  const keys = Object.keys(data).filter(k => data[k]&&data[k].length>0).sort();
  const tourKeys = tours.filter(t => t.linkedDay).map(t => t.linkedDay);
  const hotelKeys = hotels.filter(h => h.checkinDay || h.checkoutDay).flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean));
  const allKeys = [...new Set([...keys, ...tourKeys, ...hotelKeys])].sort();
  
  let opts = `<option value="">— Sem vínculo —</option>`;
  allKeys.forEach(key => {
    const [,,d2] = key.split('-').map(Number);
    const names = data[key] ? data[key].map(c=>c.name||'País').join(', ') : '';
    const tourN = tours.filter(t => t.linkedDay === key).map(t => t.name).join(', ');
    const hotelN = hotels.filter(h => h.checkinDay === key || h.checkoutDay === key).map(h => h.name).join(', ');
    let label = names || tourN || hotelN || 'Dia';
    if (names && tourN) label = names + ' · ' + tourN;
    else if (!names && tourN) label = '🚶‍♂️ ' + tourN;
    else if (!names && !tourN && hotelN) label = '🏨 ' + hotelN;
    const display = `${fmtDate(key)} · ${label}`;
    opts += `<option value="${key}" ${key===selectedKey?'selected':''}>${escHtml(display)}</option>`;
  });
  return opts;
}

// Renderização unificada de banners
function renderEntityBanners(containerId, config) {
  const container = document.getElementById(containerId);
  if (!container || !selectedDate) { 
    if (container) container.innerHTML = ''; 
    return; 
  }
  
  const entities = config.getEntities();
  if (!entities.length) { 
    container.innerHTML = ''; 
    return; 
  }
  
  container.innerHTML = entities.map((entity, i) => {
    const realIdx = config.getRealIndex(entity);
    return config.renderBanner(entity, realIdx);
  }).join('');
  
  container.querySelectorAll(config.bannerClass).forEach(el => {
    el.onclick = () => config.onClick(parseInt(el.dataset.idx, 10));
  });
}

// Configurações de banners
const BANNER_CONFIGS = {
  tour: {
    getEntities: () => tours.filter(t => t.linkedDay === selectedDate),
    getRealIndex: (entity) => tours.indexOf(entity),
    bannerClass: '.tour-banner',
    renderBanner: (t, idx) => `
      <div class="tour-banner" data-idx="${idx}">
        <i class="ti ti-map tb-icon"></i>
        <span>Passeio: <b>${escHtml(t.name||'Sem nome')}</b>${t.time ? ` às ${escHtml(t.time)}` : ''}</span>
        <span class="tb-arrow">Ver detalhes →</span>
      </div>`,
    onClick: (idx) => goToEntity('tour', idx)
  },
  hotel: {
    getEntities: () => {
      const events = [];
      hotels.forEach((h, hi) => {
        if (h.checkinDay === selectedDate) events.push({ hotelIdx: hi, hotel: h, kind: 'checkin', time: h.checkinTime });
        if (h.checkoutDay === selectedDate) events.push({ hotelIdx: hi, hotel: h, kind: 'checkout', time: h.checkoutTime });
      });
      return events;
    },
    getRealIndex: (entity) => entity.hotelIdx,
    bannerClass: '.hotel-banner',
    renderBanner: (ev, idx) => {
      const isCheckin = ev.kind === 'checkin';
      const label = isCheckin ? 'Check-in' : 'Check-out';
      const icon = isCheckin ? 'ti-login-2' : 'ti-logout-2';
      const timeStr = ev.time ? ` às ${escHtml(ev.time)}` : '';
      const name = ev.hotel.name || 'Hotel sem nome';
      return `
        <div class="hotel-banner" data-idx="${idx}">
          <i class="ti ${icon} hb-icon"></i>
          <span>${label}: <b>${escHtml(name)}</b>${timeStr}</span>
          <span class="hb-arrow">Ver hotel →</span>
        </div>`;
    },
    onClick: (idx) => goToEntity('hotel', idx)
  }
};

// Modal de confirmação estilizado (substitui o confirm() nativo)
function showConfirmModal(message, title = 'Confirmar ação', confirmText = 'Confirmar', cancelText = 'Cancelar', isDanger = false) {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.zIndex = '10001';
    
    backdrop.innerHTML = `
      <div class="modal-box" style="max-width:420px;padding:24px">
        <div class="modal-title" style="font-size:16px;margin-bottom:12px;display:flex;align-items:center;gap:10px">
          <span style="font-size:22px">${isDanger ? '⚠️' : '💡'}</span>
          <span>${escHtml(title)}</span>
        </div>
        <div style="font-size:14px;color:var(--muted);margin-bottom:20px;line-height:1.6">
          ${escHtml(message)}
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-sm" id="confirmCancelBtn" style="
            background:var(--bg);
            border:1px solid var(--border);
            color:var(--text);
            padding:8px 16px;
          ">${escHtml(cancelText)}</button>
          <button class="btn btn-sm ${isDanger ? '' : 'btn-accent'}" id="confirmOkBtn" style="
            ${isDanger ? 'background:var(--danger);color:#fff;border-color:var(--danger);' : ''}
            padding:8px 16px;
          ">${escHtml(confirmText)}</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(backdrop);
    
    const closeModal = (result) => {
      backdrop.remove();
      resolve(result);
    };
    
    backdrop.querySelector('#confirmCancelBtn').onclick = () => closeModal(false);
    backdrop.querySelector('#confirmOkBtn').onclick = () => closeModal(true);
    
    // Fechar com ESC cancela
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
        document.removeEventListener('keydown', onEsc);
      }
    };
    document.addEventListener('keydown', onEsc);
    
    // Focar no botão de confirmar
    setTimeout(() => {
      const okBtn = backdrop.querySelector('#confirmOkBtn');
      if (okBtn) okBtn.focus();
    }, 50);
  });
}

// Wrapper para substituir confirm() em operações de exclusão
async function confirmDelete(message) {
  return await showConfirmModal(
    message,
    'Confirmar exclusão',
    'Sim, excluir',
    'Cancelar',
    true
  );
}

// Wrapper para confirmações gerais
async function confirmAction(message, title = 'Confirmar') {
  return await showConfirmModal(
    message,
    title,
    'Confirmar',
    'Cancelar',
    false
  );
}