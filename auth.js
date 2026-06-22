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
<div class="auth-forgot">
  <a href="#" onclick="event.preventDefault(); showForgotPasswordForm();">
    Esqueceu a senha?
  </a>
</div>
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
  const forgotForm = document.getElementById('forgotPasswordForm');
  
  // Mostrar login
  if (loginForm) loginForm.style.display = 'block';
  
  // Esconder registro
  if (registerForm) registerForm.style.display = 'none';
  
  // Esconder recuperação de senha (REMOVER completamente)
  if (forgotForm) {
    forgotForm.remove(); // Remove o elemento do DOM
  }
  
  // Limpar erros
  const loginError = document.getElementById('loginError');
  if (loginError) loginError.style.display = 'none';
}

function showRegisterForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const forgotForm = document.getElementById('forgotPasswordForm');
  
  // Esconder login
  if (loginForm) loginForm.style.display = 'none';
  
  // Mostrar registro
  if (registerForm) registerForm.style.display = 'block';
  
  // Esconder recuperação de senha (REMOVER completamente)
  if (forgotForm) {
    forgotForm.remove(); // Remove o elemento do DOM
  }
  
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

// =============================================
// RECUPERAÇÃO DE SENHA
// =============================================

// Mostrar formulário de "Esqueceu a senha"
function showForgotPasswordForm() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  // Esconder login
  if (loginForm) loginForm.style.display = 'none';
  
  // Esconder registro
  if (registerForm) registerForm.style.display = 'none';
  
  // Remover formulário de recuperação existente (se houver)
  const existingForgot = document.getElementById('forgotPasswordForm');
  if (existingForgot) existingForgot.remove();
  
  // Criar novo formulário
  const forgotHTML = `
    <div id="forgotPasswordForm" class="auth-form" style="display:block">
      <h2>Recuperar Senha</h2>
      <p style="font-size:13px;color:var(--muted);margin-bottom:16px">
        Digite seu email para receber um link de redefinição de senha.
      </p>
      <div class="auth-field">
        <label>Email</label>
        <input type="email" id="forgotEmail" placeholder="seu@email.com" autocomplete="email" />
      </div>
      <button class="auth-btn auth-btn-primary" onclick="handleForgotPassword()">
        <i class="ti ti-mail-forward"></i> Enviar link de recuperação
      </button>
      <div class="auth-forgot" style="margin-top:12px">
        <a href="#" onclick="event.preventDefault(); showLoginForm();">
          ← Voltar para o login
        </a>
      </div>
      <div id="forgotMessage" class="auth-message" style="display:none"></div>
      <div id="forgotError" class="auth-error" style="display:none"></div>
    </div>
  `;
  
  // Inserir após o registerForm
  const registerFormEl = document.getElementById('registerForm');
  if (registerFormEl) {
    registerFormEl.insertAdjacentHTML('afterend', forgotHTML);
  }
  
  // Focar no campo de email
  setTimeout(() => {
    const emailInput = document.getElementById('forgotEmail');
    if (emailInput) emailInput.focus();
  }, 100);
}
async function handleForgotPassword() {
  const email = document.getElementById('forgotEmail').value;
  const errorDiv = document.getElementById('forgotError');
  const messageDiv = document.getElementById('forgotMessage');
  const btn = document.querySelector('#forgotPasswordForm .auth-btn');
  
  if (!email) {
    showError(errorDiv, 'Digite seu email');
    return;
  }
  
  try {
    if (errorDiv) errorDiv.style.display = 'none';
    if (messageDiv) messageDiv.style.display = 'none';
    
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-loader"></i> Enviando...';
    }
    
    await auth.sendPasswordResetEmail(email, {
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: false
    });
    
    // Mostrar mensagem de sucesso COM instruções sobre spam
    if (messageDiv) {
      messageDiv.innerHTML = `
        <i class="ti ti-mail-check" style="font-size:24px;display:block;margin-bottom:8px"></i>
        <strong>Email enviado!</strong>
        <p style="margin-top:8px">
          Enviamos um link para <strong>${email}</strong>
        </p>
        <div style="
          background: var(--yellow-light, #fef3c7);
          border: 1px solid var(--yellow, #f59e0b);
          color: var(--yellow-dark, #92400e);
          padding: 10px;
          border-radius: 6px;
          margin-top: 12px;
          font-size: 12px;
          text-align: left;
        ">
          <strong>⚠️ Não encontrou o email?</strong><br>
          • Verifique a pasta de <strong>SPAM</strong> ou <strong>Lixo eletrônico</strong><br>
          • Verifique a aba <strong>Promoções</strong> (Gmail)<br>
          • Adicione <strong>noreply@trip-planner-bc3f9.firebaseapp.com</strong> aos seus contatos<br>
          • Aguarde até 5 minutos para o email chegar
        </div>
      `;
      messageDiv.style.display = 'block';
      messageDiv.className = 'auth-message';
    }
    
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-check"></i> Email enviado';
    }
    
    console.log('✅ Email de recuperação enviado para:', email);
    
  } catch (error) {
    console.error('Erro ao enviar email de recuperação:', error);
    
    let message = 'Erro ao enviar email';
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = 'Email inválido';
        break;
      case 'auth/user-not-found':
        message = 'Nenhuma conta encontrada com este email';
        break;
      case 'auth/too-many-requests':
        message = 'Muitas tentativas. Aguarde um momento.';
        break;
      default:
        message = error.message;
    }
    
    showError(errorDiv, message);
    
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="ti ti-mail-forward"></i> Enviar link de recuperação';
    }
  }
}

// =============================================
// VERIFICAÇÃO DE EMAIL
// =============================================

// Enviar email de verificação após registro
async function sendVerificationEmail() {
  if (!auth.currentUser) return;
  
  try {
    await auth.currentUser.sendEmailVerification({
      url: window.location.origin + window.location.pathname,
      handleCodeInApp: false
    });
    
    console.log('✅ Email de verificação enviado');
    
    // Mostrar aviso na interface
    showVerificationBanner();
    
  } catch (error) {
    console.error('Erro ao enviar verificação:', error);
  }
}

// Mostrar banner de verificação de email
function showVerificationBanner() {
  // Remover banner existente
  const existingBanner = document.getElementById('verifyEmailBanner');
  if (existingBanner) existingBanner.remove();
  
  if (!auth.currentUser || auth.currentUser.emailVerified) return;
  
  const banner = document.createElement('div');
  banner.id = 'verifyEmailBanner';
  banner.style.cssText = `
    background: var(--blue-light);
    color: var(--blue);
    padding: 12px 20px;
    text-align: center;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  `;
  
  banner.innerHTML = `
    <span>
      <i class="ti ti-mail"></i>
      <strong>Verifique seu email!</strong> 
      Enviamos um link para ${auth.currentUser.email}
    </span>
    <button onclick="sendVerificationEmail()" style="
      background: var(--blue);
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
    ">
      Reenviar email
    </button>
    <button onclick="document.getElementById('verifyEmailBanner').remove()" style="
      background: none;
      border: none;
      color: var(--blue);
      cursor: pointer;
      font-size: 18px;
      padding: 0 4px;
    ">
      <i class="ti ti-x"></i>
    </button>
  `;
  
  // Inserir após a sidebar
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.parentNode.insertBefore(banner, sidebar);
  }
}

// Verificar email após login
async function checkEmailVerification() {
  if (!auth.currentUser) return;
  
  // Recarregar usuário para obter status atualizado
  await auth.currentUser.reload();
  
  if (auth.currentUser.emailVerified) {
    // Email verificado, remover banner
    const banner = document.getElementById('verifyEmailBanner');
    if (banner) banner.remove();
    console.log('✅ Email verificado');
  } else {
    // Email não verificado, mostrar banner
    showVerificationBanner();
  }
}

// =============================================
// ATUALIZAR handleRegister E onAuthStateChanged
// =============================================

// Atualize a função handleRegister (adicione no final, após criar viagem):
async function handleRegister() {
  // ... (código existente igual) ...
  
  // Após criar usuário com sucesso:
  // Enviar email de verificação
  try {
    await sendVerificationEmail();
  } catch (e) {
    console.log('⚠️ Não foi possível enviar verificação:', e.message);
  }
  
  // O restante do código continua igual...
}

// Atualize onAuthStateChanged (adicione verificação):
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    console.log('✓ Usuário logado:', user.email);
    console.log('📧 Email verificado:', user.emailVerified);
    
    await loadUserTrip();
    showApp();
    
    // Verificar email (se não estiver verificado, mostra banner)
    await checkEmailVerification();
    
  } else {
    currentUser = null;
    showLoginScreen();
  }
});