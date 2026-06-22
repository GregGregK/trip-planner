// guide.js - Guia diário (refatorado)
function renderGuide() {
  const container = document.getElementById('guideContent');
  const dayKeysWithCountries = Object.keys(data).filter(k => data[k] && data[k].length>0);
  const tourKeys = tours.filter(t => t.linkedDay).map(t => t.linkedDay);
  const hotelKeys = hotels.filter(h => h.checkinDay || h.checkoutDay).flatMap(h => [h.checkinDay, h.checkoutDay].filter(Boolean));
  const keys = [...new Set([...dayKeysWithCountries, ...tourKeys, ...hotelKeys])].sort();

  if (!keys.length) {
    container.innerHTML = `<div class="empty-state"><i class="ti ti-notes empty-icon"></i><div class="empty-title">Nada para mostrar ainda</div><div class="empty-sub">Adicione países, passeios ou hotéis para gerar o guia.</div></div>`;
    return;
  }

  const firstKey = keys[0], lastKey = keys[keys.length-1];
  const rangeLabel = firstKey===lastKey ? fmtFullDate(firstKey) : `${fmtFullDate(firstKey)} — ${fmtFullDate(lastKey)}`;

  let html = `<div class="guide-doc">
    <div class="guide-trip-title">Roteiro da viagem</div>
    <div class="guide-trip-sub">${escHtml(rangeLabel)} · ${keys.length} dia${keys.length>1?'s':''} planejado${keys.length>1?'s':''}</div>`;

  keys.forEach(key => {
    const countries = data[key] || [];
    const [y,m,d] = key.split('-').map(Number);
    const weekday = WEEKDAYS[new Date(y,m-1,d).getDay()];
    const totalItems = countries.reduce((sum,c)=>sum+(c.activities||[]).length,0);
    const hotelEvents = getHotelEventsForDay(key);
    const dayTours = tours.filter(t => t.linkedDay === key);

    html += `<div class="guide-day">
      <div class="guide-day-title">${weekday}-feira</div>
      <div class="guide-day-date">${d} de ${MONTHS[m-1]} de ${y}</div>`;

    // Passeios primeiro (destaque)
    if (dayTours.length) {
      html += `<ul class="guide-items" style="margin-bottom:10px;border-left:3px solid ${ENTITY_CONFIG.tour.color};padding-left:12px;">`;
      dayTours.forEach(t => {
        const timeStr = t.time && t.time.trim() ? t.time : '—';
        html += `<li class="guide-item">
          <span class="guide-item-time${t.time?'':' empty'}">${escHtml(timeStr)}</span>
          <span><b>${ENTITY_CONFIG.tour.emoji} ${escHtml(t.name||'Passeio')}</b>${t.location ? ` · ${escHtml(t.location)}` : ''}<span class="guide-item-type">Passeio</span></span>
        </li>`;
        if (t.note) {
          html += `<li style="font-size:12px;color:var(--muted);padding-left:52px;list-style:none;">${escHtml(t.note)}</li>`;
        }
      });
      html += `</ul>`;
    }

    // Eventos de hotel
    if (hotelEvents.length) {
      html += `<ul class="guide-items" style="margin-bottom:10px">`;
      hotelEvents.forEach(ev => {
        const isCheckin = ev.kind==='checkin';
        const label = isCheckin ? 'Check-in' : 'Check-out';
        const timeStr = ev.time && ev.time.trim() ? ev.time : '—';
        html += `<li class="guide-item">
          <span class="guide-item-time${ev.time?'':' empty'}">${escHtml(timeStr)}</span>
          <span><b>${ENTITY_CONFIG.hotel.emoji} ${label}:</b> ${escHtml(ev.hotel.name||'Hotel')}<span class="guide-item-type">Hospedagem</span></span>
        </li>`;
      });
      html += `</ul>`;
    }

    // Atividades dos países
    if (!totalItems && countries.every(c => !c.name) && !dayTours.length && !hotelEvents.length) {
      html += `<div class="guide-empty-day">Nenhuma atividade planejada para este dia.</div>`;
    } else if (totalItems > 0) {
      countries.forEach(c => {
        const acts = (c.activities||[]).slice();
        html += `<div class="guide-country">
          <div class="guide-country-name">${c.flag||'🌍'} ${escHtml(c.name||'País sem nome')}${c.location?`<span class="guide-country-loc">· ${escHtml(c.location)}</span>`:''}</div>`;
        if (!acts.length) {
          html += `<div class="guide-empty-day">Sem itens planejados.</div>`;
        } else {
          html += `<ul class="guide-items">`;
          acts.forEach(a => {
            const typeLabel = a.type==='custom' ? (a.customType||'Outro') : (DAY_TYPE_LABELS[a.type] || 'Passeio');
            const timeStr = a.time && a.time.trim() ? a.time : '—';
            html += `<li class="guide-item">
              <span class="guide-item-time${a.time?'':' empty'}">${escHtml(timeStr)}</span>
              <span>${escHtml(a.name||'(sem descrição)')}<span class="guide-item-type">${escHtml(typeLabel)}</span></span>
            </li>`;
            if (a.description) {
              html += `<li style="font-size:12px;color:var(--muted);padding-left:52px;list-style:none;">${escHtml(a.description)}</li>`;
            }
          });
          html += `</ul>`;
        }
        html += `</div>`;
      });
    }
    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}