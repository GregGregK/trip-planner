// store-firebase.js - Gerenciamento de dados com Firebase

let data = {};
let links = [];
let hotels = [];
let tours = [];

let saveTimeout = null;
const SAVE_DELAY = 1000;

let isLoading = false;
let isSaving = false;
let isInitialized = false;

function save() {
  if (!currentUser || !currentTripId || isLoading || !isInitialized) {
    console.log('⏸️ Salvamento ignorado:', {
      user: !!currentUser,
      trip: !!currentTripId,
      loading: isLoading,
      initialized: isInitialized
    });
    return;
  }
  
  const now = firebase.firestore.FieldValue.serverTimestamp();
  
  if (saveTimeout) clearTimeout(saveTimeout);
  
  showSaveStatus('saving');
  
  saveTimeout = setTimeout(async () => {
    if (isSaving || !isInitialized) return;
    isSaving = true;
    
    try {
      const tripRef = db.collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .doc(currentTripId);
      
      await tripRef.update({
        days: data,
        links: links,
        hotels: hotels,
        tours: tours,
        updatedAt: now
      });
      
      showSaveStatus('saved');
      
      try {
        const backup = {
          days: data,
          links: links,
          hotels: hotels,
          tours: tours
        };
        localStorage.setItem('trip_planner_backup', JSON.stringify(backup));
      } catch (e) {}
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      
      if (error.code === 'not-found') {
        try {
          const tripRef = db.collection('users')
            .doc(currentUser.uid)
            .collection('trips')
            .doc(currentTripId);
          
          await tripRef.set({
            name: 'Minha Viagem',
            days: data,
            links: links,
            hotels: hotels,
            tours: tours,
            createdAt: now,
            updatedAt: now
          });
          
          showSaveStatus('saved');
        } catch (retryError) {
          console.error('Erro ao criar documento:', retryError);
          showSaveStatus('error');
        }
      } else {
        showSaveStatus('error');
      }
    } finally {
      isSaving = false;
    }
  }, SAVE_DELAY);
}

function showSaveStatus(status) {
  const header = document.querySelector('.sidebar-header');
  if (!header) return;
  
  let statusEl = document.getElementById('saveStatus');
  
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'saveStatus';
    statusEl.style.cssText = 'font-size:10px;margin-top:4px;transition:all .3s;display:flex;align-items:center;gap:4px;padding:0 4px;';
    header.appendChild(statusEl);
  }
  
  switch (status) {
    case 'saving':
      statusEl.innerHTML = '<i class="ti ti-cloud-upload" style="font-size:10px"></i> Salvando...';
      statusEl.style.color = 'var(--muted)';
      break;
    case 'saved':
      statusEl.innerHTML = '<i class="ti ti-cloud-check" style="font-size:10px"></i> Salvo na nuvem';
      statusEl.style.color = 'var(--accent)';
      setTimeout(() => {
        if (statusEl) {
          statusEl.innerHTML = '<i class="ti ti-cloud" style="font-size:10px"></i> Dados na nuvem';
          statusEl.style.color = 'var(--muted)';
        }
      }, 2000);
      break;
    case 'error':
      statusEl.innerHTML = '<i class="ti ti-cloud-x" style="font-size:10px"></i> Erro ao salvar';
      statusEl.style.color = 'var(--danger)';
      setTimeout(() => {
        if (statusEl && statusEl.style.color === 'var(--danger)') {
          statusEl.innerHTML = '<i class="ti ti-cloud" style="font-size:10px"></i> Dados na nuvem';
          statusEl.style.color = 'var(--muted)';
        }
      }, 3000);
      break;
    case 'idle':
      statusEl.innerHTML = '<i class="ti ti-cloud" style="font-size:10px"></i> Dados na nuvem';
      statusEl.style.color = 'var(--muted)';
      break;
  }
}

async function migrateFromLocalStorage() {
  const oldData = localStorage.getItem('trip_planner_v3');
  if (!oldData) {
    console.log('📭 Nenhum dado local para migrar');
    return;
  }
  
  try {
    const parsed = JSON.parse(oldData);
    
    if (!parsed.days || Object.keys(parsed.days).length === 0) {
      console.log('📭 Dados locais vazios, ignorando');
      localStorage.removeItem('trip_planner_v3');
      return;
    }
    
    const migrationDone = localStorage.getItem('trip_planner_migrated');
    if (migrationDone === 'true') {
      console.log('✅ Migração já foi feita anteriormente');
      localStorage.removeItem('trip_planner_v3');
      return;
    }
    
    if (currentUser && currentTripId) {
      try {
        const tripDoc = await db.collection('users')
          .doc(currentUser.uid)
          .collection('trips')
          .doc(currentTripId)
          .get();
        
        if (tripDoc.exists) {
          const firestoreData = tripDoc.data();
          const firestoreDays = Object.keys(firestoreData.days || {}).length;
          const localDays = Object.keys(parsed.days || {}).length;
          
          if (firestoreDays >= localDays) {
            console.log('☁️ Dados da nuvem são mais recentes, ignorando migração');
            localStorage.removeItem('trip_planner_v3');
            localStorage.setItem('trip_planner_migrated', 'true');
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ Não foi possível verificar dados da nuvem:', error.message);
      }
    }
    
    const confirmed = await confirmAction(
      `Encontramos ${Object.keys(parsed.days || {}).length} dias com dados salvos localmente. Deseja migrar para a nuvem?\n\n(Seus dados na nuvem serão substituídos pelos dados locais)`,
      'Migrar dados locais'
    );
    
    if (confirmed) {
      data = parsed.days || {};
      links = parsed.links || [];
      hotels = parsed.hotels || [];
      tours = parsed.tours || [];
      
      await save();
      
      localStorage.setItem('trip_planner_migrated', 'true');
      localStorage.removeItem('trip_planner_v3');
      
      console.log('✅ Dados migrados com sucesso para a nuvem!');
      
      renderCalendar();
      renderDaysList();
      renderMain();
      
    } else {
      console.log('❌ Migração recusada pelo usuário');
      localStorage.setItem('trip_planner_migrated', 'true');
      localStorage.removeItem('trip_planner_v3');
    }
    
  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
  }
}