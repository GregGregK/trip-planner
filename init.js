function initApp() {
  const now = new Date();
  viewYear = now.getFullYear();
  viewMonth = now.getMonth();
  
  // Renderizar interface
  renderCalendar();
  renderDaysList();
  renderMain();
  setupSidebarToggle();
  addUserMenu();
  
  // Status inicial
  showSaveStatus('idle');
  
  // Verificar migração depois que tudo estiver pronto
  setTimeout(() => {
    if (isInitialized) {
      migrateFromLocalStorage().then(() => {
        console.log('✅ Verificação de migração concluída');
      });
    }
  }, 1500);
}

function addUserMenu() {
  // Remover menu existente se houver
  const existingMenu = document.getElementById('userMenuContainer');
  if (existingMenu) existingMenu.remove();
  
  const header = document.querySelector('.sidebar-header');
  if (!header) return;
  
  // Criar container do menu
  const menuContainer = document.createElement('div');
  menuContainer.id = 'userMenuContainer';
  menuContainer.style.cssText = 'position:relative;margin-top:8px';
  
  // Avatar do usuário (clicável)
  const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U';
  
  menuContainer.innerHTML = `
    <button class="user-avatar-btn" id="userAvatarBtn" title="Menu do usuário">
      <span class="user-avatar">${userInitial}</span>
      <span class="user-email-small">${currentUser?.email || 'Usuário'}</span>
      <i class="ti ti-chevron-down" style="font-size:10px;transition:transform .2s"></i>
    </button>
    
    <div class="user-dropdown" id="userDropdown" style="display:none">
      <div class="user-dropdown-header">
        <div class="user-dropdown-avatar">${userInitial}</div>
        <div class="user-dropdown-info">
          <div class="user-dropdown-name">${currentUser?.displayName || 'Usuário'}</div>
          <div class="user-dropdown-email">${currentUser?.email || ''}</div>
        </div>
      </div>
      
      <div class="user-dropdown-divider"></div>
      
      <div class="user-dropdown-item" style="cursor:default">
        <i class="ti ti-cloud-check" style="color:var(--accent)"></i>
        <span>Dados na nuvem</span>
        <span class="user-dropdown-badge">Ativo</span>
      </div>
      
      <div class="user-dropdown-divider"></div>
      
      <button class="user-dropdown-item user-dropdown-logout" onclick="handleLogout()">
        <i class="ti ti-logout" style="color:var(--danger)"></i>
        <span>Sair da conta</span>
      </button>
    </div>
  `;
  
  header.appendChild(menuContainer);
  
  // Eventos do menu
  setupUserMenuEvents();
}

function setupUserMenuEvents() {
  const avatarBtn = document.getElementById('userAvatarBtn');
  const dropdown = document.getElementById('userDropdown');
  
  if (!avatarBtn || !dropdown) return;
  
  // Toggle dropdown
  avatarBtn.onclick = (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display === 'block';
    
    if (isVisible) {
      dropdown.style.display = 'none';
      avatarBtn.querySelector('i').style.transform = 'rotate(0deg)';
    } else {
      dropdown.style.display = 'block';
      avatarBtn.querySelector('i').style.transform = 'rotate(180deg)';
    }
  };
  
  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#userMenuContainer')) {
      dropdown.style.display = 'none';
      const chevron = avatarBtn.querySelector('i');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  });
}

