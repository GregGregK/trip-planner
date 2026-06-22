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

// Salvar dados no Firestore com debounce
function save() {
  if (!currentUser || !currentTripId || isLoading) return;
  
  // Atualizar timestamp de modificação
  const now = firebase.firestore.FieldValue.serverTimestamp();
  
  // Limpar timer anterior
  if (saveTimeout) clearTimeout(saveTimeout);
  
  // Status de salvamento
  showSaveStatus('saving');
  
  // Novo timer com debounce
  saveTimeout = setTimeout(async () => {
    if (isSaving) return;
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
      showSaveStatus('error');
      
      // Tentar criar o documento se não existir
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
        }
      }
    } finally {
      isSaving = false;
    }
  }, SAVE_DELAY);
}

// Mostrar status de salvamento
function showSaveStatus(status) {
  const statusEl = document.getElementById('saveStatus');
  if (!statusEl) {
    // Criar elemento de status
    const header = document.querySelector('.sidebar-header');
    if (!header) return;
    
    const div = document.createElement('div');
    div.id = 'saveStatus';
    div.style.cssText = 'font-size:10px;margin-top:4px;transition:all .3s';
    header.appendChild(div);
  }
  
  const el = document.getElementById('saveStatus');
  if (!el) return;
  
  switch (status) {
    case 'saving':
      el.innerHTML = '<i class="ti ti-cloud-upload" style="font-size:10px"></i> Salvando...';
      el.style.color = 'var(--muted)';
      break;
    case 'saved':
      el.innerHTML = '<i class="ti ti-cloud-check" style="font-size:10px"></i> Salvo na nuvem';
      el.style.color = 'var(--accent)';
      setTimeout(() => {
        if (el) el.innerHTML = '<i class="ti ti-cloud" style="font-size:10px"></i> Dados na nuvem';
        if (el) el.style.color = 'var(--muted)';
      }, 2000);
      break;
    case 'error':
      el.innerHTML = '<i class="ti ti-cloud-x" style="font-size:10px"></i> Erro ao salvar';
      el.style.color = 'var(--danger)';
      break;
  }
}

// Função para recarregar dados do Firestore
async function reloadFromFirestore() {
  if (!currentUser || !currentTripId) return;
  
  isLoading = true;
  
  try {
    console.log('🔄 Recarregando dados da nuvem...');
    
    const tripDoc = await db.collection('users')
      .doc(currentUser.uid)
      .collection('trips')
      .doc(currentTripId)
      .get();
    
    if (tripDoc.exists) {
      const tripData = tripDoc.data();
      
      // Só atualizar se os dados da nuvem forem diferentes
      const cloudDays = Object.keys(tripData.days || {}).length;
      const localDays = Object.keys(data || {}).length;
      
      data = tripData.days || {};
      links = tripData.links || [];
      hotels = tripData.hotels || [];
      tours = tripData.tours || [];
      
      console.log(`✅ Dados recarregados: ${cloudDays} dias, ${tours.length} passeios, ${hotels.length} hotéis, ${links.length} links`);
      
      // Atualizar backup local
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
    }
  } catch (error) {
    console.error('❌ Erro ao recarregar:', error);
    
    // Tentar carregar do backup local
    try {
      const backup = localStorage.getItem('trip_planner_backup');
      if (backup) {
        const parsed = JSON.parse(backup);
        data = parsed.days || {};
        links = parsed.links || [];
        hotels = parsed.hotels || [];
        tours = parsed.tours || [];
        console.log('📦 Dados restaurados do backup local');
      }
    } catch (backupError) {
      console.error('❌ Erro ao carregar backup:', backupError);
    }
  } finally {
    isLoading = false;
  }
}

// Migrar dados do localStorage para o Firestore (executar uma vez)
async function migrateFromLocalStorage() {
  const oldData = localStorage.getItem('trip_planner_v3');
  if (!oldData) {
    console.log('📭 Nenhum dado local para migrar');
    return;
  }
  
  try {
    const parsed = JSON.parse(oldData);
    
    // Só migrar se tiver dados reais
    if (!parsed.days || Object.keys(parsed.days).length === 0) {
      console.log('📭 Dados locais vazios, ignorando');
      // Limpar localStorage antigo vazio
      localStorage.removeItem('trip_planner_v3');
      return;
    }
    
    // Verificar se já migrou antes
    const migrationDone = localStorage.getItem('trip_planner_migrated');
    if (migrationDone === 'true') {
      console.log('✅ Migração já foi feita anteriormente');
      // Limpar dados antigos do localStorage
      localStorage.removeItem('trip_planner_v3');
      return;
    }
    
    // Verificar se o Firestore já tem dados (mais recentes)
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
          
          // Se Firestore tem mais ou igual número de dias, NÃO migrar
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
    
    console.log('📦 Dados locais encontrados:', {
      dias: Object.keys(parsed.days || {}).length,
      passeios: (parsed.tours || []).length,
      hoteis: (parsed.hotels || []).length,
      links: (parsed.links || []).length
    });
    
    const confirmed = await confirmAction(
      `Encontramos ${Object.keys(parsed.days || {}).length} dias com dados salvos localmente. Deseja migrar para a nuvem?\n\n` +
      '(Seus dados na nuvem serão substituídos pelos dados locais)',
      'Migrar dados locais'
    );
    
    if (confirmed) {
      // Migrar dados
      data = parsed.days || {};
      links = parsed.links || [];
      hotels = parsed.hotels || [];
      tours = parsed.tours || [];
      
      // Salvar no Firestore
      await save();
      
      // Marcar como migrado
      localStorage.setItem('trip_planner_migrated', 'true');
      
      // Remover dados antigos do localStorage
      localStorage.removeItem('trip_planner_v3');
      
      console.log('✅ Dados migrados com sucesso para a nuvem!');
      
      // Recarregar a interface
      renderCalendar();
      renderDaysList();
      renderMain();
      
    } else {
      // Usuário recusou migração
      console.log('❌ Migração recusada pelo usuário');
      localStorage.setItem('trip_planner_migrated', 'true');
      localStorage.removeItem('trip_planner_v3');
    }
    
  } catch (error) {
    console.error('❌ Erro ao migrar:', error);
    // Em caso de erro, manter dados do Firestore
  }
}