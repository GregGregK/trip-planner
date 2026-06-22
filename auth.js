// auth.js - Sistema de autenticação

// Monitorar estado de autenticação
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // Usuário logado
    currentUser = user;
    console.log('✓ Usuário logado:', user.email);
    
    // Carregar a primeira viagem ou criar uma nova
    await loadUserTrip();
    
    // Mostrar o app
    showApp();
  } else {
    // Usuário deslogado
    currentUser = null;
    
    // Mostrar tela de login
    showLoginScreen();
  }
});

// Tela de login
function showLoginScreen() {
  const appDiv = document.querySelector('.app');
  if (appDiv) appDiv.style.display = 'none';
  
  // Remover tela de login existente
  const existingAuth = document.getElementById('authScreen');
  if (existingAuth) existingAuth.remove();
  
  const authHTML = `
    <div id="authScreen" class="auth-screen">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <i class="ti ti-map-2" style="font-size:40px;color:var(--accent)"></i>
            <h1>Planejador de Viagem</h1>
            <p>Organize suas viagens na nuvem</p>
          </div>
          
          <div id="loginForm" class="auth-form">
            <h2>Entrar</h2>
            <div class="auth-field">
              <label>Email</label>
              <input type="email" id="loginEmail" placeholder="seu@email.com" autocomplete="email" />
            </div>
            <div class="auth-field">
              <label>Senha</label>
              <input type="password" id="loginPassword" placeholder="Sua senha" autocomplete="current-password" />
            </div>
            <button class="auth-btn auth-btn-primary" onclick="handleLogin()">
              <i class="ti ti-login-2"></i> Entrar
            </button>
            <p class="auth-switch">
              Não tem conta? 
              <a href="#" onclick="event.preventDefault(); showRegisterForm();">Criar conta</a>
            </p>
            <div id="loginError" class="auth-error" style="display:none"></div>
          </div>
          
          <div id="registerForm" class="auth-form" style="display:none">
            <h2>Criar Conta</h2>
            <div class="auth-field">
              <label>Nome</label>
              <input type="text" id="registerName" placeholder="Seu nome" />
            </div>
            <div class="auth-field">
              <label>Email</label>
              <input type="email" id="registerEmail" placeholder="seu@email.com" autocomplete="email" />
            </div>
            <div class="auth-field">
              <label>Senha</label>
              <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
            </div>
            <button class="auth-btn auth-btn-primary" onclick="handleRegister()">
              <i class="ti ti-user-plus"></i> Registrar
            </button>
            <p class="auth-switch">
              Já tem conta? 
              <a href="#" onclick="event.preventDefault(); showLoginForm();">Fazer login</a>
            </p>
            <div id="registerError" class="auth-error" style="display:none"></div>
          </div>
          
          <div class="auth-footer">
            <span class="auth-badge">🔒 Seus dados seguros na nuvem</span>
            <span class="auth-badge">☁️ Acesse de qualquer dispositivo</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', authHTML);
  
  // Garantir que o formulário de login esteja visível
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

function showApp() {
  const authScreen = document.getElementById('authScreen');
  if (authScreen) authScreen.remove();
  
  const appDiv = document.querySelector('.app');
  if (appDiv) {
    appDiv.style.display = 'grid';
    // Ajustar display para mobile se necessário
    if (window.innerWidth <= 768) {
      appDiv.style.display = 'block';
    }
  }
  
  // Inicializar o app
  if (typeof initApp === 'function') {
    initApp();
  } else {
    // Fallback se initApp não existir
    const now = new Date();
    viewYear = now.getFullYear();
    viewMonth = now.getMonth();
    renderCalendar();
    renderDaysList();
    renderMain();
    if (typeof setupSidebarToggle === 'function') {
      setupSidebarToggle();
    }
  }
}

async function handleLogin() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  if (!email || !password) {
    showError(errorDiv, 'Preencha todos os campos');
    return;
  }
  
  try {
    errorDiv.style.display = 'none';
    const btn = document.querySelector('#loginForm .auth-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-loader"></i> Entrando...';
    }
    
    await auth.signInWithEmailAndPassword(email, password);
    // O onAuthStateChanged vai automaticamente chamar showApp()
  } catch (error) {
    console.error('Erro ao fazer login:', error.code, error.message);
    
    let message = 'Erro ao fazer login';
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/user-not-found':
        message = 'Usuário não encontrado';
        break;
      case 'auth/wrong-password':
        message = 'Senha incorreta';
        break;
      case 'auth/invalid-credential':
        message = 'Email ou senha inválidos';
        break;
      case 'auth/too-many-requests':
        message = 'Muitas tentativas. Tente novamente mais tarde.';
        break;
      default:
        message = error.message;
    }
    
    showError(errorDiv, message);
    
    const btn = document.querySelector('#loginForm .auth-btn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-login-2"></i> Entrar';
    }
  }
}

async function handleRegister() {
  const name = document.getElementById('registerName').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const errorDiv = document.getElementById('registerError');
  
  if (!name || !email || !password) {
    showError(errorDiv, 'Preencha todos os campos');
    return;
  }
  
  if (password.length < 6) {
    showError(errorDiv, 'Senha deve ter no mínimo 6 caracteres');
    return;
  }
  
  try {
    errorDiv.style.display = 'none';
    const btn = document.querySelector('#registerForm .auth-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-loader"></i> Criando conta...';
    }
    
    console.log('🔵 Tentando criar usuário:', email);
    
    // 1. Criar usuário no Authentication
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    console.log('✅ Usuário criado no Auth:', userCredential.user.uid);
    
    // 2. Salvar dados do usuário no Firestore
    try {
      await db.collection('users').doc(userCredential.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('✅ Dados salvos no Firestore');
    } catch (firestoreError) {
      console.error('❌ Erro ao salvar no Firestore:', firestoreError);
      // Não bloqueia o registro
    }
    
    // 3. Criar primeira viagem automaticamente
    try {
      const tripData = {
        name: 'Minha Viagem',
        days: {},
        links: [],
        hotels: [],
        tours: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const tripRef = await db.collection('users')
        .doc(userCredential.user.uid)
        .collection('trips')
        .add(tripData);
      
      currentTripId = tripRef.id;
      console.log('✅ Primeira viagem criada:', currentTripId);
      
      // Inicializar variáveis globais
      data = {};
      links = [];
      hotels = [];
      tours = [];
      
    } catch (tripError) {
      console.error('❌ Erro ao criar viagem:', tripError);
      // Criar ID local como fallback
      currentTripId = 'default';
      data = {};
      links = [];
      hotels = [];
      tours = [];
    }
    
    // O onAuthStateChanged vai automaticamente chamar showApp()
    
  } catch (error) {
    console.error('❌ Erro ao registrar:', error.code, error.message);
    
    let message = 'Erro ao criar conta';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Este email já está em uso';
        break;
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/weak-password':
        message = 'Senha muito fraca (mínimo 6 caracteres)';
        break;
      case 'auth/operation-not-allowed':
        message = 'Cadastro por email/senha não está habilitado. Configure no Firebase Console.';
        break;
      case 'auth/too-many-requests':
        message = 'Muitas tentativas. Tente novamente mais tarde.';
        break;
      default:
        message = error.message;
    }
    
    showError(errorDiv, message);
    
    const btn = document.querySelector('#registerForm .auth-btn');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-user-plus"></i> Registrar';
    }
  }
}

async function loadUserTrip() {
  if (!currentUser) return;
  
  // Marcar como não inicializado durante o carregamento
  isInitialized = false;
  isLoading = true;
  
  try {
    console.log('🔄 Carregando viagens do usuário...');
    
    // Buscar a viagem mais recente do usuário
    const tripsSnapshot = await db.collection('users')
      .doc(currentUser.uid)
      .collection('trips')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!tripsSnapshot.empty) {
      const tripDoc = tripsSnapshot.docs[0];
      currentTripId = tripDoc.id;
      
      // Carregar dados da viagem para as variáveis globais
      const tripData = tripDoc.data();
      data = tripData.days || {};
      links = tripData.links || [];
      hotels = tripData.hotels || [];
      tours = tripData.tours || [];
      
      console.log('✅ Viagem carregada:', tripData.name || 'Sem nome');
      console.log('📊 Dados:', Object.keys(data).length, 'dias,', tours.length, 'passeios,', hotels.length, 'hotéis,', links.length, 'links');
    } else {
      console.log('📝 Nenhuma viagem encontrada, criando padrão...');
      
      // Criar viagem padrão
      const tripData = {
        name: 'Minha Viagem',
        days: {},
        links: [],
        hotels: [],
        tours: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      const tripRef = await db.collection('users')
        .doc(currentUser.uid)
        .collection('trips')
        .add(tripData);
      
      currentTripId = tripRef.id;
      data = {};
      links = [];
      hotels = [];
      tours = [];
      
      console.log('✅ Viagem padrão criada:', currentTripId);
    }
    
    // MARCAR COMO INICIALIZADO - Só depois de carregar tudo
    isInitialized = true;
    showSaveStatus('idle');
    console.log('✅ Sistema inicializado e pronto para salvar');
    
  } catch (error) {
    console.error('❌ Erro ao carregar viagem:', error);
    // Inicializar vazio como fallback
    currentTripId = 'offline';
    data = {};
    links = [];
    hotels = [];
    tours = [];
    isInitialized = true; // Permite salvar offline
    showSaveStatus('error');
  } finally {
    isLoading = false;
  }
}
function showError(element, message) {
  if (!element) return;
  element.textContent = message;
  element.style.display = 'block';
  
  // Esconder após 4 segundos
  setTimeout(() => {
    if (element) element.style.display = 'none';
  }, 4000);
}

function showLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) loginForm.style.display = 'block';
  if (registerForm) registerForm.style.display = 'none';
  
  // Limpar erros
  const loginError = document.getElementById('loginError');
  if (loginError) loginError.style.display = 'none';
}

function showRegisterForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  if (loginForm) loginForm.style.display = 'none';
  if (registerForm) registerForm.style.display = 'block';
  
  // Limpar erros
  const registerError = document.getElementById('registerError');
  if (registerError) registerError.style.display = 'none';
}

async function handleLogout() {
  // Fechar dropdown se estiver aberto
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) dropdown.style.display = 'none';
  
  const confirmed = await confirmAction(
    'Tem certeza que deseja sair da sua conta? Seus dados continuarão salvos na nuvem.',
    'Sair da conta'
  );
  
  if (confirmed) {
    try {
      // Desmarcar inicialização
      isInitialized = false;
      
      // Salvar uma última vez antes de sair
      if (currentUser && currentTripId) {
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
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log('✅ Último salvamento antes de sair concluído');
        } catch (e) {
          console.log('⚠️ Não foi possível salvar antes de sair:', e.message);
        }
      }
      
      await auth.signOut();
      console.log('✓ Usuário deslogado com sucesso');
      
      // Limpar variáveis globais
      currentUser = null;
      currentTripId = null;
      data = {};
      links = [];
      hotels = [];
      tours = [];
      selectedDate = null;
      isInitialized = false;
      
      // Remover status de salvamento
      const statusEl = document.getElementById('saveStatus');
      if (statusEl) statusEl.remove();
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}

// Suporte a tecla Enter nos formulários
document.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm && loginForm.style.display !== 'none') {
      e.preventDefault();
      handleLogin();
    } else if (registerForm && registerForm.style.display !== 'none') {
      e.preventDefault();
      handleRegister();
    }
  }
});