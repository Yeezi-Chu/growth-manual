// ===== 家庭账单 =====
App.registerPage('bills', function () {
  const container = document.getElementById('pageContainer');

  let currentMonth = container.dataset.month || App.utils.getMonthKey();
  container.dataset.month = currentMonth;

  const allBills = Storage.getAll(Storage.KEYS.bills);
  const bills = allBills.filter(b => b.month === currentMonth);
  const total = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);

  // 按分类统计
  const categoryStats = {};
  bills.forEach(b => {
    if (!categoryStats[b.category]) categoryStats[b.category] = { total: 0, count: 0, icon: b.icon || '📦' };
    categoryStats[b.category].total += parseFloat(b.amount) || 0;
    categoryStats[b.category].count++;
  });

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
      <span class="section-title">账单记录</span>
      <button class="btn btn-primary btn-sm" onclick="Bills.showAdd()">+ 添加账单</button>
    </div>
  `;

  if (bills.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">🧾</div>
        <div class="empty-state-text">本月还没有账单记录</div>
        <div class="empty-state-hint">点击"添加账单"开始记录</div>
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
            <button class="btn btn-outline btn-sm" onclick="Bills.deleteBill('${b.id}')">删除</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  container.innerHTML = html;
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

  return { changeMonth, goCurrentMonth, showAdd, save, deleteBill };
})();
