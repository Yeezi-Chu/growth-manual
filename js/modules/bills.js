// ===== 家庭账单 =====
App.registerPage('bills', function () {
  const container = document.getElementById('pageContainer');

  let currentMonth = container.dataset.month || App.utils.getMonthKey();
  container.dataset.month = currentMonth;

  const members = Storage.getMembers();
  const searchText = container.dataset.billSearch || '';
  const memberFilter = container.dataset.billMemberFilter || '';

  const categories = [
    { value: 'water', label: '水费', icon: '💧' },
    { value: 'electric', label: '电费', icon: '⚡' },
    { value: 'gas', label: '燃气费', icon: '🔥' },
    { value: 'property', label: '物业费', icon: '🏢' },
    { value: 'insurance', label: '保险费', icon: '🛡️' },
    { value: 'car', label: '汽车养护', icon: '🚗' },
    { value: 'grocery', label: '生活采购', icon: '🛒' },
    { value: 'medical', label: '医疗健康', icon: '💊' },
    { value: 'education', label: '教育培训', icon: '📚' },
    { value: 'communication', label: '通讯网络', icon: '📱' },
    { value: 'other', label: '其他', icon: '📦' }
  ];

  const allBills = Storage.getAll(Storage.KEYS.bills).filter(b => b.month === currentMonth);

  // 按搜索和成员筛选
  let bills = allBills;
  if (searchText) {
    const q = searchText.toLowerCase();
    bills = bills.filter(b => {
      const catInfo = categories.find(c => c.value === b.category);
      const catLabel = catInfo ? catInfo.label : '';
      return (b.description || '').toLowerCase().includes(q) || catLabel.toLowerCase().includes(q);
    });
  }
  if (memberFilter) {
    bills = bills.filter(b => b.memberId === memberFilter);
  }

  const total = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  // 按分类统计
  const categoryStats = {};
  bills.forEach(b => {
    if (!categoryStats[b.category]) categoryStats[b.category] = { total: 0, count: 0, icon: b.icon || '📦' };
    categoryStats[b.category].total += parseFloat(b.amount) || 0;
    categoryStats[b.category].count++;
  });

  let html = `
    <h1 class="page-title">🧾 家庭账单</h1>
    <p class="page-description">记录家庭日常开支，水费、电费、保险、汽车养护等</p>

    <div class="month-selector">
      <button class="btn btn-outline btn-icon" onclick="Bills.changeMonth(-1)">◀</button>
      <div class="month-display">${App.utils.getMonthLabel(currentMonth)}</div>
      <button class="btn btn-outline btn-icon" onclick="Bills.changeMonth(1)">▶</button>
      ${currentMonth !== App.utils.getMonthKey() ? `<button class="btn btn-outline btn-sm" onclick="Bills.goCurrentMonth()">回到本月</button>` : ''}
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div>
          <div class="stat-value text-danger">${App.utils.formatMoney(total)}</div>
          <div class="stat-label">本月家庭账单总额</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div>
          <div class="stat-value">${bills.length}</div>
          <div class="stat-label">账单笔数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div>
          <div class="stat-value">${new Set(bills.map(b => b.memberId)).size}</div>
          <div class="stat-label">参与成员</div>
        </div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">账单记录 ${searchText || memberFilter ? '(' + bills.length + '/' + allBills.length + ')' : ''}</span>
      <button class="btn btn-primary btn-sm" onclick="Bills.showAdd()">+ 添加账单</button>
    </div>

    ${allBills.length > 0 ? `
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" placeholder="搜索账单描述或分类..." value="${searchText}" oninput="Bills.onSearch(this.value)">
    </div>
    ${members.length > 1 ? `
    <div class="member-filter">
      <span class="member-filter-chip ${!memberFilter ? 'active' : ''}" onclick="Bills.onMemberFilter('')">全部</span>
      ${members.map(m => `<span class="member-filter-chip ${memberFilter === m.id ? 'active' : ''}" onclick="Bills.onMemberFilter('${m.id}')">${m.name}</span>`).join('')}
    </div>
    ` : ''}
    ` : ''}
  `;

  if (bills.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">${allBills.length > 0 ? '🔍' : '🧾'}</div>
        <div class="empty-state-text">${allBills.length > 0 ? '没有符合条件的账单' : '本月还没有账单记录'}</div>
        <div class="empty-state-hint">${allBills.length > 0 ? '试试调整搜索或筛选条件' : '点击"添加账单"开始记录'}</div>
      </div>
    `;
  } else {
    // 分类统计卡片
    html += '<div class="card"><div class="section-title mb-12">分类统计</div><div class="card-grid" style="margin: 0;">';
    Object.entries(categoryStats).forEach(([cat, stat]) => {
      const catInfo = categories.find(c => c.value === cat) || { label: cat, icon: '📦' };
      html += `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px; background: var(--bg-page); border-radius: 8px;">
          <div style="font-size: 24px;">${stat.icon}</div>
          <div>
            <div style="font-size: 13px; color: var(--text-secondary);">${catInfo.label} (${stat.count})</div>
            <div style="font-weight: 700; color: var(--danger);">${App.utils.formatMoney(stat.total)}</div>
          </div>
        </div>
      `;
    });
    html += '</div></div>';

    // 饼图
    html += '<div class="chart-container"><div class="chart-title">📊 账单分布</div><div class="chart-canvas-wrap" id="billsPieChart"></div></div>';

    // 账单列表
    html += '<div class="card mt-16">';
    bills.forEach(b => {
      const catInfo = categories.find(c => c.value === b.category) || { label: '其他', icon: '📦' };
      html += `
        <div class="bill-item">
          <div class="bill-icon" style="background: var(--primary-light);">${b.icon || catInfo.icon}</div>
          <div class="bill-info">
            <div class="bill-category">${catInfo.label}${b.description ? ' - ' + App.utils.escapeHtml(b.description) : ''}</div>
            <div class="bill-desc">${Storage.getMemberName(b.memberId)} · ${App.utils.formatDate(b.createdAt)}</div>
          </div>
          <div style="text-align: right;">
            <div class="bill-amount">${App.utils.formatMoney(b.amount)}</div>
            <div class="item-actions">
              <button class="btn-icon-sm" onclick="Bills.showEdit('${b.id}')">编辑</button>
              <button class="btn-icon-sm danger" onclick="Bills.deleteBill('${b.id}')">删除</button>
            </div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  container.innerHTML = html;

  // 渲染饼图
  if (bills.length > 0 && typeof Chart !== 'undefined') {
    setTimeout(() => {
      const pieData = Object.entries(categoryStats).map(([cat, stat]) => {
        const catInfo = categories.find(c => c.value === cat) || { label: cat };
        return { label: catInfo.label, value: stat.total };
      });
      Chart.pie('billsPieChart', pieData, { formatMoney: true, centerLabel: App.utils.formatMoney(total) });
    }, 50);
  }
});

const Bills = (function () {
  const categories = [
    { value: 'water', label: '水费', icon: '💧' },
    { value: 'electric', label: '电费', icon: '⚡' },
    { value: 'gas', label: '燃气费', icon: '🔥' },
    { value: 'property', label: '物业费', icon: '🏢' },
    { value: 'insurance', label: '保险费', icon: '🛡️' },
    { value: 'car', label: '汽车养护', icon: '🚗' },
    { value: 'grocery', label: '生活采购', icon: '🛒' },
    { value: 'medical', label: '医疗健康', icon: '💊' },
    { value: 'education', label: '教育培训', icon: '📚' },
    { value: 'communication', label: '通讯网络', icon: '📱' },
    { value: 'other', label: '其他', icon: '📦' }
  ];

  function changeMonth(delta) {
    const container = document.getElementById('pageContainer');
    let month = container.dataset.month || App.utils.getMonthKey();
    let [y, m] = month.split('-').map(Number);
    m += delta;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    container.dataset.month = `${y}-${m.toString().padStart(2, '0')}`;
    App.navigate('bills');
  }

  function goCurrentMonth() {
    document.getElementById('pageContainer').dataset.month = App.utils.getMonthKey();
    App.navigate('bills');
  }

  function showAdd() {
    const member = App.utils.requireMember();
    if (!member) return;

    const body = `
      <div class="form-group">
        <label class="form-label">分类 <span class="required">*</span></label>
        <select class="form-select" id="billCategory">
          ${categories.map(c => `<option value="${c.value}" data-icon="${c.icon}">${c.icon} ${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">金额 <span class="required">*</span></label>
        <input type="number" class="form-input" id="billAmount" placeholder="0.00" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">描述</label>
        <input type="text" class="form-input" id="billDescription" placeholder="例如：9月水费、车险续费">
      </div>
      <div class="form-group">
        <label class="form-label">付款人</label>
        <div style="font-size: 14px; color: var(--text-secondary);">${member.name} (当前身份)</div>
      </div>
    `;

    App.showModal('添加账单', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Bills.save()">保存</button>`);

    document.getElementById('billAmount').focus();
  }

  function showEdit(id) {
    const bills = Storage.getAll(Storage.KEYS.bills);
    const b = bills.find(i => i.id === id);
    if (!b) return;

    const body = `
      <div class="form-group">
        <label class="form-label">分类 <span class="required">*</span></label>
        <select class="form-select" id="billCategory">
          ${categories.map(c => `<option value="${c.value}" ${b.category === c.value ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">金额 <span class="required">*</span></label>
        <input type="number" class="form-input" id="billAmount" value="${b.amount}" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">描述</label>
        <input type="text" class="form-input" id="billDescription" value="${App.utils.escapeHtml(b.description || '')}">
      </div>
    `;

    App.showModal('编辑账单', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Bills.saveEdit('${id}')">保存</button>`);

    document.getElementById('billAmount').focus();
  }

  function saveEdit(id) {
    const category = document.getElementById('billCategory').value;
    const amount = parseFloat(document.getElementById('billAmount').value);
    const description = document.getElementById('billDescription').value.trim();
    const catInfo = categories.find(c => c.value === category);

    if (!amount || amount <= 0) {
      App.toast('请输入有效金额', 'error');
      return;
    }

    Storage.updateItem(Storage.KEYS.bills, id, {
      category, amount, description, icon: catInfo ? catInfo.icon : '📦'
    });

    App.closeModal();
    App.toast('账单已更新', 'success');
    App.navigate('bills');
  }

  function save() {
    const member = App.utils.getCurrentMember();
    if (!member) { App.toast('请先选择当前成员', 'error'); return; }

    const category = document.getElementById('billCategory').value;
    const amount = parseFloat(document.getElementById('billAmount').value);
    const description = document.getElementById('billDescription').value.trim();
    const catInfo = categories.find(c => c.value === category);

    if (!amount || amount <= 0) {
      App.toast('请输入有效金额', 'error');
      return;
    }

    Storage.addItem(Storage.KEYS.bills, {
      category,
      amount,
      description,
      memberId: member.id,
      month: document.getElementById('pageContainer').dataset.month || App.utils.getMonthKey(),
      icon: catInfo ? catInfo.icon : '📦'
    });

    App.closeModal();
    App.toast('账单已添加', 'success');
    App.navigate('bills');
  }

  function deleteBill(id) {
    App.confirmDialog('确定删除这条账单吗？', () => {
      Storage.deleteItem(Storage.KEYS.bills, id);
      App.toast('已删除', 'success');
      App.navigate('bills');
    });
  }

  let searchTimer = null;
  function onSearch(value) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      document.getElementById('pageContainer').dataset.billSearch = value;
      App.navigate('bills');
    }, 250);
  }

  function onMemberFilter(memberId) {
    document.getElementById('pageContainer').dataset.billMemberFilter = memberId;
    App.navigate('bills');
  }

  return { changeMonth, goCurrentMonth, showAdd, showEdit, saveEdit, save, deleteBill, onSearch, onMemberFilter };
})();
