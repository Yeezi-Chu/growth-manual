// ===== 成长手册 - 主应用控制器 =====
const App = (function () {
  let currentPage = 'dashboard';
  const pageContainer = document.getElementById('pageContainer');

  // 工具函数
  const utils = {
    formatDate(dateStr) {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 172800000) return '昨天';
      if (d.getFullYear() === now.getFullYear()) {
        return `${d.getMonth() + 1}月${d.getDate()}日`;
      }
      return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },

    formatTime(dateStr) {
      const d = new Date(dateStr);
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    },

    formatDateTime(dateStr) {
      return utils.formatDate(dateStr) + ' ' + utils.formatTime(dateStr);
    },

    getMonthKey(date) {
      const d = date || new Date();
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    },

    getMonthLabel(monthKey) {
      if (!monthKey) return '';
      const [y, m] = monthKey.split('-');
      return `${y}年${parseInt(m)}月`;
    },

    formatMoney(num) {
      return '¥' + (num || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    getCurrentMember() {
      const id = Storage.getCurrentMember();
      return id ? Storage.getMemberById(id) : null;
    },

    getCurrentMemberId() {
      const m = utils.getCurrentMember();
      return m ? m.id : null;
    },

    requireMember() {
      const m = utils.getCurrentMember();
      if (!m) {
        App.toast('请先在设置中选择当前成员', 'warning');
        App.navigate('settings');
        return null;
      }
      return m;
    },

    escapeHtml(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    uuid() {
      return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    downloadFile(content, filename) {
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Toast 提示
  function toast(message, type) {
    type = type || 'default';
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(100%)';
      setTimeout(() => el.remove(), 300);
    }, 2500);
  }

  // 模态框
  function showModal(title, bodyHtml, footerHtml) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHtml;
    document.getElementById('modalFooter').innerHTML = footerHtml || '';
    document.getElementById('modalOverlay').classList.add('active');
  }

  function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
  }

  function confirmDialog(message, onConfirm) {
    showModal('确认操作', `<p style="font-size:15px;">${message}</p>`,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-danger" id="confirmBtn">确认</button>`);
    document.getElementById('confirmBtn').onclick = () => {
      closeModal();
      onConfirm();
    };
  }

  // 图片预览
  function showImage(src) {
    document.getElementById('imageViewerImg').src = src;
    document.getElementById('imageViewer').classList.add('active');
  }

  function closeImage() {
    document.getElementById('imageViewer').classList.remove('active');
  }

  // 页面注册系统
  const pages = {};

  function registerPage(name, renderFn) {
    pages[name] = renderFn;
  }

  function navigate(page) {
    currentPage = page;
    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // 渲染页面
    pageContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    if (pages[page]) {
      try {
        pages[page]();
      } catch (e) {
        console.error('Page render error:', e);
        pageContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">页面加载失败</div></div>';
      }
    } else {
      pageContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-text">页面不存在</div></div>';
    }

    // 关闭移动端侧边栏
    closeSidebar();
    // 滚动到顶部
    window.scrollTo(0, 0);
  }

  // 侧边栏控制
  function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('overlay').classList.add('active');
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  }

  // 更新当前用户显示
  function updateCurrentUserDisplay() {
    const member = utils.getCurrentMember();
    const nameEl = document.getElementById('currentUserName');
    const roleEl = document.getElementById('currentUserRole');
    const avatarEl = document.getElementById('currentUserAvatar');
    const mobileAvatar = document.getElementById('mobileUserAvatar');

    if (member) {
      nameEl.textContent = member.name;
      roleEl.textContent = member.role || '家庭成员';
      avatarEl.textContent = member.avatar || member.name.charAt(0);
      avatarEl.style.background = Storage.getMemberColor(member.id);
      mobileAvatar.textContent = member.avatar || member.name.charAt(0);
    } else {
      nameEl.textContent = '未设置';
      roleEl.textContent = '点击设置选择成员';
      avatarEl.textContent = '?';
      mobileAvatar.textContent = '?';
    }
  }

  // 构建底部导航
  function buildBottomNav() {
    const navItems = [
      { page: 'dashboard', icon: '🏠', label: '首页' },
      { page: 'album', icon: '📸', label: '相册' },
      { page: 'bills', icon: '🧾', label: '账单' },
      { page: 'chores', icon: '🧹', label: '家务' },
      { page: 'community', icon: '💬', label: '社区' }
    ];

    let html = '';
    navItems.forEach(item => {
      html += `<button class="bottom-nav-item ${item.page === currentPage ? 'active' : ''}" data-page="${item.page}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
      </button>`;
    });

    let existingNav = document.querySelector('.bottom-nav');
    if (existingNav) existingNav.remove();

    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.innerHTML = html;
    nav.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });
    document.body.appendChild(nav);
  }

  // 初始化
  function init() {
    Storage.initDefaultData();
    updateCurrentUserDisplay();
    buildBottomNav();

    // 导航点击
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        navigate(item.dataset.page);
      });
    });

    // 移动端菜单按钮
    document.getElementById('menuToggle').addEventListener('click', openSidebar);
    document.getElementById('overlay').addEventListener('click', closeSidebar);

    // 当前用户点击 -> 设置页
    document.getElementById('currentUserDisplay').addEventListener('click', () => navigate('settings'));
    document.getElementById('mobileUserAvatar').addEventListener('click', () => navigate('settings'));

    // 模态框关闭
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalOverlay').addEventListener('click', e => {
      if (e.target.id === 'modalOverlay') closeModal();
    });

    // 图片预览关闭
    document.getElementById('imageViewerClose').addEventListener('click', closeImage);
    document.getElementById('imageViewer').addEventListener('click', e => {
      if (e.target.id === 'imageViewer') closeImage();
    });

    // ESC 关闭
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        closeModal();
        closeImage();
        closeSidebar();
      }
    });

    // 路由
    const hash = window.location.hash.slice(1);
    navigate(hash && pages[hash] ? hash : 'dashboard');

    // 窗口大小变化时重建底部导航
    window.addEventListener('resize', () => {
      buildBottomNav();
    });
  }

  return {
    utils,
    toast,
    showModal, closeModal, confirmDialog,
    showImage, closeImage,
    registerPage, navigate,
    openSidebar, closeSidebar,
    updateCurrentUserDisplay,
    init,
    get currentPage() { return currentPage; }
  };
})();

// 启动
document.addEventListener('DOMContentLoaded', () => App.init());
