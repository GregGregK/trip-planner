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

  // Reorganizar o sidebar-header para ter o texto agrupado
  const header = document.querySelector('.sidebar-header');
  if (header) {
    const title = header.querySelector('.app-title');
    const subtitle = header.querySelector('.app-subtitle');
    const toggle = header.querySelector('.sidebar-toggle');
    if (title && subtitle && !header.querySelector('.sidebar-header-text')) {
      const textWrapper = document.createElement('div');
      textWrapper.className = 'sidebar-header-text';
      textWrapper.appendChild(title);
      textWrapper.appendChild(subtitle);
      header.insertBefore(textWrapper, toggle || null);
    }
  }

  // Inserir menu entre o header e o collapsible (fora do overflow:hidden)
  const sidebar = document.querySelector('.sidebar');
  const collapsible = document.getElementById('sidebarCollapsible');
  if (!sidebar || !collapsible) return;

  const menuContainer = document.createElement('div');
  menuContainer.id = 'userMenuContainer';

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

  sidebar.insertBefore(menuContainer, collapsible);
  setupUserMenuEvents();
}

function setupUserMenuEvents() {
  const avatarBtn = document.getElementById('userAvatarBtn');
  const dropdown = document.getElementById('userDropdown');

  if (!avatarBtn || !dropdown) return;

  avatarBtn.onclick = (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display === 'block';

    if (isVisible) {
      dropdown.style.display = 'none';
      avatarBtn.querySelector('i').style.transform = 'rotate(0deg)';
    } else {
      // No mobile o dropdown é fixed: calcular top pelo botão
      if (window.innerWidth <= 768) {
        const rect = avatarBtn.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 6) + 'px';
      } else {
        dropdown.style.top = '';
      }
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