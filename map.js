// map.js - Mapa com Leaflet (refatorado)
let mapInstance = null;
let mapMarkers = [];

function initMap() {
  const container = document.getElementById('mapContainer');
  if (!container) return;

 if (mapInstance) {
  mapInstance.remove();
  mapInstance = null;
}
mapInstance = L.map('mapContainer', { zoomControl: true }).setView([20, 10], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
  maxZoom: 18
}).addTo(mapInstance);

  mapMarkers.forEach(m => m.remove());
  mapMarkers = [];

  const pinMap = {};
  
  // Coletar pins de países
  Object.entries(data).forEach(([dateK, countries]) => {
    (countries||[]).forEach(c => {
      if (!c.lat || !c.lng) return;
      const key = `${c.lat.toFixed(4)},${c.lng.toFixed(4)}`;
      if (!pinMap[key]) pinMap[key] = { lat: c.lat, lng: c.lng, entries: [], type: 'country' };
      pinMap[key].entries.push({ date: dateK, name: c.name||'País', flag: c.flag||'🌍', type: 'country' });
    });
  });

  // Coletar pins de passeios
  tours.forEach(t => {
    if (!t.lat || !t.lng) return;
    const key = `${t.lat.toFixed(4)},${t.lng.toFixed(4)}`;
    if (!pinMap[key]) pinMap[key] = { lat: t.lat, lng: t.lng, entries: [], type: 'tour' };
    pinMap[key].type = 'tour'; // Prioridade para passeio se houver mistura
    pinMap[key].entries.push({ 
      date: t.linkedDay || '??', 
      name: t.name||'Passeio', 
      flag: '🚶‍♂️', 
      type: 'tour',
      tourIndex: tours.indexOf(t)
    });
  });

  const hotelPins = hotels.filter(h => h.lat && h.lng);
  const subtitle = document.getElementById('mapSubtitle');
  const totalPins = Object.keys(pinMap).length + hotelPins.length;
  if (subtitle) subtitle.textContent = totalPins ? `${totalPins} localização${totalPins>1?'ões':''} no mapa` : 'Adicione localizações nos cards de país ou passeios';

  const bounds = [];
  
  // Renderizar pins do mapa de países/passeios
  Object.values(pinMap).forEach(pin => {
    const multi = pin.entries.length > 1;
    const isTour = pin.type === 'tour';
    const color = isTour ? ENTITY_CONFIG.tour.color : (multi ? '#185fa5' : ENTITY_CONFIG.country.color);
    
    const svgIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:14px;line-height:1">${pin.entries[0].flag}</span>
      </div>`,
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34]
    });

    const popupRows = pin.entries.map(e => {
      const [y,m,d] = e.date.split('-').map(Number);
      const dateDisplay = isNaN(d) ? e.date : `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
      
      if (e.type === 'tour') {
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #eee;cursor:pointer" onclick="goToEntity('tour', ${e.tourIndex})">
          <span style="font-size:15px">${e.flag}</span>
          <div>
            <div style="font-weight:600;font-size:13px">${escHtml(e.name)}</div>
            <div style="font-size:11px;color:#888">${dateDisplay}</div>
          </div>
          <span style="margin-left:auto;font-size:11px;color:${ENTITY_CONFIG.tour.color}">Ver →</span>
        </div>`;
      } else {
        return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid #eee;cursor:pointer" onclick="goToLinkedDay('${e.date}')">
          <span style="font-size:15px">${e.flag}</span>
          <div>
            <div style="font-weight:600;font-size:13px">${escHtml(e.name)}</div>
            <div style="font-size:11px;color:#888">${dateDisplay}</div>
          </div>
          <span style="margin-left:auto;font-size:11px;color:${ENTITY_CONFIG.country.color}">Ver →</span>
        </div>`;
      }
    }).join('');

    const marker = L.marker([pin.lat, pin.lng], { icon: svgIcon })
      .addTo(mapInstance)
      .bindPopup(`<div style="min-width:180px;font-family:sans-serif">${popupRows}</div>`, { maxWidth: 260 });

    mapMarkers.push(marker);
    bounds.push([pin.lat, pin.lng]);
  });

  // Renderizar pins de hotéis
  hotelPins.forEach((h, hi) => {
    const realIdx = hotels.indexOf(h);
    const svgIcon = L.divIcon({
      className: '',
      html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:${ENTITY_CONFIG.hotel.color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);font-size:13px;line-height:1;color:#fff">${ENTITY_CONFIG.hotel.emoji}</span>
      </div>`,
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -34]
    });
    const popupHtml = `<div style="min-width:180px;font-family:sans-serif;cursor:pointer" onclick="goToEntity('hotel', ${realIdx})">
      <div style="font-weight:600;font-size:13px">${escHtml(h.name||'Hotel')}</div>
      <div style="font-size:11px;color:#888;margin-top:2px">${escHtml(h.address||'')}</div>
      <div style="font-size:11px;color:${ENTITY_CONFIG.hotel.color};margin-top:4px">Ver hotel →</div>
    </div>`;
    const marker = L.marker([h.lat, h.lng], { icon: svgIcon })
      .addTo(mapInstance)
      .bindPopup(popupHtml, { maxWidth: 260 });
    mapMarkers.push(marker);
    bounds.push([h.lat, h.lng]);
  });

  if (bounds.length) {
    mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }

  setTimeout(() => mapInstance.invalidateSize(), 100);
}