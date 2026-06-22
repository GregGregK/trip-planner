// store-firebase.js - Gerenciamento de dados com Firebase

// Variáveis globais (mantidas para compatibilidade)
let data = {};
let links = [];
let hotels = [];
let tours = [];

// Timer para debounce do salvamento
let saveTimeout = null;
const SAVE_DELAY = 1000; // 1 segundo de debounce

// Flag para evitar salvar durante carregamento
let isLoading = false;
let isSaving = false;
let isInitialized = false; // NOVA: controle de inicialização

// Salvar dados no Firestore com debounce
function save() {
  // NÃO SALVAR se:
  // - Não tem usuário logado
  // - Não tem viagem selecionada
  // - Está carregando dados
  // - Sistema não foi inicializado ainda
  if (!currentUser || !currentTripId || isLoading || !isInitialized) {
    console.log('⏸️ Salvamento ignorado:', {
      user: !!currentUser,
      trip: !!currentTripId,
      loading: isLoading,
      initialized: isInitialized
    });
    return;
  }
  
  // Atualizar timestamp de modificação
  const now = firebase.firestore.FieldValue.serverTimestamp();
  
  // Limpar timer anterior
  if (saveTimeout) clearTimeout(saveTimeout);
  
  // Status de salvamento
  showSaveStatus('saving');
  
  // Novo timer com debounce
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
      
      // Também salvar no localStorage como backup
      try {
        const backup = {
          days: data,
          links: links,
          hotels: hotels,
          tours: tours
        };
        localStorage.setItem('trip_planner_backup', JSON.stringify(backup));
      } catch (e) {
        // localStorage pode estar cheio
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error);
      
      // Se documento não existe, criar
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

// Mostrar status de salvamento
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
      // Limpar erro após 3 segundos
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