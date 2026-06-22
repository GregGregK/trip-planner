// links.js - Links tab
let linkTagFilter = 'all';

function renderLinkFilterBar() {
  const bar = document.getElementById('linkFilterBar');
  if (!links.length) { bar.innerHTML=''; return; }
  const counts = {};
  LINK_TAG_LIST.forEach(t => counts[t]=0);
  links.forEach(l => { const t=l.tag||'other'; counts[t]=(counts[t]||0)+1; });
  let html = `<div class="filter-bar"><span class="filter-bar-label">Filtrar:</span>`;
  html += `<button class="filter-chip ${linkTagFilter==='all'?'active':''}" id="ltf-all">Todos <span class="fc-count">${links.length}</span></button>`;
  LINK_TAG_LIST.forEach(t => {
    if (!counts[t]) return;
    html += `<button class="filter-chip ${linkTagFilter===t?'active':''}" id="ltf-${t}"><i class="ti ${LINK_TAG_ICONS[t]}" style="font-size:12px"></i> ${LINK_TAG_LABELS[t]} <span class="fc-count">${counts[t]}</span></button>`;
  });
  html += `</div>`;
  bar.innerHTML = html;
  document.getElementById('ltf-all').onclick = () => { linkTagFilter='all'; renderLinks(); };
  LINK_TAG_LIST.forEach(t => {
    const el = document.getElementById(`ltf-${t}`);
    if (el) el.onclick = () => { linkTagFilter=t; renderLinks(); };
  });
}

function renderLinks() {
  renderLinkFilterBar();
  const container = document.getElementById('linksContent');
  if (!links.length) {
    container.innerHTML=`<div class="empty-state"><i class="ti ti-link empty-icon"></i><div class="empty-title">Nenhum link salvo</div><div class="empty-sub">Salve passagens, reservas e qualquer link útil. Você pode vinculá-los a um dia da viagem.</div></div><button class="add-link-btn" onclick="addLink()"><i class="ti ti-plus"></i> Adicionar link</button>`;
    return;
  }
  const visibleIdx = links
    .map((l,li) => ({l,li}))
    .filter(({l}) => linkTagFilter==='all' || (l.tag||'other')===linkTagFilter);

  if (!visibleIdx.length) {
    container.innerHTML=`<div class="empty-state"><i class="ti ti-filter-off empty-icon"></i><div class="empty-title">Nenhum link em "${LINK_TAG_LABELS[linkTagFilter]}"</div><div class="empty-sub">Tente outro filtro ou adicione um novo link.</div></div><button class="add-link-btn" onclick="addLink()"><i class="ti ti-plus"></i> Adicionar link</button>`;
    return;
  }

  container.innerHTML=`<div class="links-grid">${visibleIdx.map(({l,li})=>renderLinkCard(l,li)).join('')}</div><button class="add-link-btn" onclick="addLink()"><i class="ti ti-plus"></i> Adicionar link</button>`;
  visibleIdx.forEach(({li}) => {
    const tEl=document.getElementById(`ltitle-${li}`); if(tEl) tEl.oninput=e=>{links[li].title=e.target.value;save();};
    const uEl=document.getElementById(`lurl-${li}`); if(uEl) uEl.oninput=e=>{links[li].url=e.target.value;save();updateLinkHref(li);};
    const nEl=document.getElementById(`lnote-${li}`); if(nEl) nEl.oninput=e=>{links[li].note=e.target.value;save();};
    const dEl=document.getElementById(`ldel-${li}`); 
if(dEl) dEl.onclick=async ()=>{
  const confirmed = await confirmDelete('Tem certeza que deseja remover este link?');
  if (confirmed) {
    links.splice(li,1);save();renderLinks();
  }
};
    const dayEl=document.getElementById(`lday-${li}`);
    if(dayEl){
      dayEl.onchange=e=>{links[li].linkedDay=e.target.value;save();dayEl.className='link-day-select'+(e.target.value?' has-day':'');};
    }
    LINK_TAG_LIST.forEach(tag=>{
      const tBtn=document.getElementById(`ltag-${li}-${tag}`);
      if(tBtn) tBtn.onclick=()=>{links[li].tag=tag;save();renderLinks();};
    });
  });
}

function renderLinkCard(l,li) {
  const tag=l.tag||'other';
  const icon=LINK_TAG_ICONS[tag]||'ti-link';
  const tagBtns=LINK_TAG_LIST.map(t=>`<button class="link-tag ltag-${tag===t?t:'other'}" id="ltag-${li}-${t}">${LINK_TAG_LABELS[t]}</button>`).join('');
  const href=l.url&&(l.url.startsWith('http')?l.url:'https://'+l.url);
  const daySelector=Object.keys(data).length>0 || tours.length>0 || hotels.length>0 ? 
    `<select class="link-day-select${l.linkedDay?' has-day':''}" id="lday-${li}">${getAllDayOptions(l.linkedDay||'')}</select>`:
    `<span style="font-size:11px;color:var(--muted)">Adicione dias para vincular</span>`;

  return `<div class="link-card">
    <div class="link-icon"><i class="ti ${icon}"></i></div>
    <div class="link-body">
      <input class="link-title-input" id="ltitle-${li}" value="${escHtml(l.title)}" placeholder="Nome (ex: Passagem Lisboa)" />
      <input class="link-url-input" id="lurl-${li}" value="${escHtml(l.url||'')}" placeholder="https://…" />
      <textarea class="link-note-input" id="lnote-${li}" placeholder="Anotação…" rows="1">${escHtml(l.note||'')}</textarea>
      <div class="link-tags-row">${tagBtns}</div>
      <div style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap">
        <i class="ti ti-calendar-event" style="font-size:13px;color:var(--muted)"></i>
        <span style="font-size:11px;color:var(--muted)">Dia:</span>
        ${daySelector}
        ${l.linkedDay?`<button onclick="goToLinkedDay('${l.linkedDay}')" style="font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer;font-family:inherit;padding:0;">Ver dia →</button>`:''}
      </div>
    </div>
    <div class="link-actions">
      <a class="link-open-btn" id="lhref-${li}" href="${escHtml(href||'#')}" target="_blank" rel="noopener" ${!l.url?'style="opacity:.3;pointer-events:none"':''}><i class="ti ti-external-link"></i></a>
      <button class="btn-icon" id="ldel-${li}" style="font-size:13px"><i class="ti ti-trash"></i></button>
    </div>
  </div>`;
}

function goToLinkedDay(key) {
  const [y,m,d]=key.split('-').map(Number);
  selectDate(y,m-1,d);
}

function updateLinkHref(li) {
  const el=document.getElementById(`lhref-${li}`); if(!el) return;
  const url=links[li].url;
  if(url){const href=url.startsWith('http')?url:'https://'+url;el.href=href;el.style.opacity='';el.style.pointerEvents='';}
  else{el.href='#';el.style.opacity='.3';el.style.pointerEvents='none';}
}

function addLink() {
  links.push({title:'',url:'',note:'',tag:'other',linkedDay:''});
  save(); renderLinks();
  setTimeout(()=>{ const i=document.querySelectorAll('.link-title-input'); if(i.length) i[i.length-1].focus(); },50);
}