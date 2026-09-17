// ===== 收支明细 =====
App.registerPage('finance', function () {
  const container = document.getElementById('pageContainer');

  let currentMonth = container.dataset.month || App.utils.getMonthKey();
  container.dataset.month = currentMonth;

  const allFinance = Storage.getAll(Storage.KEYS.finance);
  const finances = allFinance.filter(f => f.month === currentMonth);
  const members = Storage.getMembers();

  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const balance = totalIncome - totalExpense;

  let html = `
    <h1 class="page-title">💰 收支明细</h1>
    <p class="page-description">每个成员记录月度收入与支出，向家庭公开透明</p>

    <div class="month-selector">
      <button class="btn btn-outline btn-icon" onclick="Finance.changeMonth(-1)">◀</button>
      <div class="month-display">${App.utils.getMonthLabel(currentMonth)}</div>
      <button class="btn btn-outline btn-icon" onclick="Finance.changeMonth(1)">▶</button>
      ${currentMonth !== App.utils.getMonthKey() ? `<button class="btn btn-outline btn-sm" onclick="Finance.goCurrentMonth()">回到本月</button>` : ''}
    </div>

    <div class="finance-summary">
      <div class="finance-summary-card">
        <div class="finance-summary-label">总收入</div>
        <div class="finance-summary-value income">${App.utils.formatMoney(totalIncome)}</div>
      </div>
      <div class="finance-summary-card">
        <div class="finance-summary-label">总支出</div>
        <div class="finance-summary-value expense">${App.utils.formatMoney(totalExpense)}</div>
      </div>
      <div class="finance-summary-card">
        <div class="finance-summary-label">结余</div>
        <div class="finance-summary-value balance">${App.utils.formatMoney(balance)}</div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">各成员明细</span>
      <button class="btn btn-primary btn-sm" onclick="Finance.showAdd()">+ 添加记录</button>
    </div>
  `;

  if (finances.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">💰</div>
        <div class="empty-state-text">本月还没有收支记录</div>
        <div class="empty-state-hint">点击"添加记录"开始填写</div>
      </div>
    `;
  } else {
    members.forEach(m => {
      const memberFinances = finances.filter(f => f.memberId === m.id);
      if (memberFinances.length === 0) return;

      const income = memberFinances.filter(f => f.type === 'income').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
      const expense = memberFinances.filter(f => f.type === 'expense').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);

      html += `
        <div class="member-finance-card">
          <div class="member-finance-header">
            <div class="member-finance-name">
              <div class="member-chore-avatar" style="background: ${Storage.getMemberColor(m.id)}; color: #fff;">
                ${m.avatar || m.name.charAt(0)}
              </div>
              ${m.name}
            </div>
            <div style="display: flex; gap: 12px; font-size: 13px;">
              <span class="text-success font-bold">收 ${App.utils.formatMoney(income)}</span>
              <span class="text-danger font-bold">支 ${App.utils.formatMoney(expense)}</span>
            </div>
          </div>
          <div class="member-finance-items">
      `;

      memberFinances.forEach(f => {
        html += `
          <div class="finance-entry">
            <div>
              <span class="tag ${f.type === 'income' ? 'tag-success' : 'tag-danger'}">${f.type === 'income' ? '收入' : '支出'}</span>
              <span style="margin-left: 8px;">${App.utils.escapeHtml(f.description || f.category || '')}</span>
              <span style="font-size: 11px; color: var(--text-light); margin-left: 8px;">${App.utils.formatDate(f.createdAt)}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="${f.type === 'income' ? 'finance-entry-income' : 'finance-entry-expense'} font-bold">
                ${f.type === 'income' ? '+' : '-'}${App.utils.formatMoney(f.amount)}
              </span>
              <button class="btn btn-outline btn-sm" onclick="Finance.deleteEntry('${f.id}')">删除</button>
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    });
  }

  container.innerHTML = html;
});

const Finance = (function () {
  const incomeCategories = [
    { value: 'salary', label: '工资' },
    { value: 'bonus', label: '奖金' },
    { value: 'investment', label: '投资收益' },
    { value: 'side', label: '副业收入' },
    { value: 'gift', label: '红包礼金' },
    { value: 'refund', label: '退款' },
    { value: 'other_income', label: '其他收入' }
  ];
  const expenseCategories = [
    { value: 'food', label: '餐饮' },
    { value: 'transport', label: '交通' },
    { value: 'shopping', label: '购物' },
    { value: 'entertainment', label: '娱乐' },
    { value: 'medical', label: '医疗' },
    { value: 'education', label: '教育' },
    { value: 'housing', label: '住房' },
    { value: 'other_expense', label: '其他支出' }
  ];

  function changeMonth(delta) {
    const container = document.getElementById('pageContainer');
    let month = container.dataset.month || App.utils.getMonthKey();
    let [y, m] = month.split('-').map(Number);
    m += delta;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    container.dataset.month = `${y}-${m.toString().padStart(2, '0')}`;
    App.navigate('finance');
  }

  function goCurrentMonth() {
    document.getElementById('pageContainer').dataset.month = App.utils.getMonthKey();
    App.navigate('finance');
  }

  function showAdd() {
    const member = App.utils.requireMember();
    if (!member) return;

    const body = `
      <div class="form-group">
        <label class="form-label">类型 <span class="required">*</span></label>
        <div style="display: flex; gap: 12px;">
          <label style="flex: 1; cursor: pointer; padding: 10px; border: 2px solid var(--border); border-radius: 8px; text-align: center; transition: all 0.2s;" id="incomeLabel">
            <input type="radio" name="financeType" value="income" style="display: none;" checked onchange="Finance.updateCategoryOptions()">
            <span style="font-size: 24px;">💰</span><br>收入
          </label>
          <label style="flex: 1; cursor: pointer; padding: 10px; border: 2px solid var(--border); border-radius: 8px; text-align: center; transition: all 0.2s;" id="expenseLabel">
            <input type="radio" name="financeType" value="expense" style="display: none;" onchange="Finance.updateCategoryOptions()">
            <span style="font-size: 24px;">💸</span><br>支出
          </label>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">分类</label>
        <select class="form-select" id="financeCategory"></select>
      </div>
      <div class="form-group">
        <label class="form-label">金额 <span class="required">*</span></label>
        <input type="number" class="form-input" id="financeAmount" placeholder="0.00" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">描述</label>
        <input type="text" class="form-input" id="financeDescription" placeholder="例如：9月工资、午餐花费">
      </div>
      <div class="form-group">
        <label class="form-label">记录人</label>
        <div style="font-size: 14px; color: var(--text-secondary);">${member.name} (当前身份)</div>
      </div>
    `;

    App.showModal('添加收支记录', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Finance.save()">保存</button>`);

    updateCategoryOptions();
    document.getElementById('incomeLabel').style.borderColor = 'var(--primary)';
    document.getElementById('incomeLabel').style.background = 'var(--primary-light)';

    document.querySelectorAll('input[name="financeType"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.getElementById('incomeLabel').style.borderColor = 'var(--border)';
        document.getElementById('incomeLabel').style.background = 'transparent';
        document.getElementById('expenseLabel').style.borderColor = 'var(--border)';
        document.getElementById('expenseLabel').style.background = 'transparent';
        const selected = document.querySelector('input[name="financeType"]:checked').value;
        const label = document.getElementById(selected === 'income' ? 'incomeLabel' : 'expenseLabel');
        label.style.borderColor = 'var(--primary)';
        label.style.background = 'var(--primary-light)';
      });
    });

    document.getElementById('financeAmount').focus();
  }

  function updateCategoryOptions() {
    const type = document.querySelector('input[name="financeType"]:checked').value;
    const cats = type === 'income' ? incomeCategories : expenseCategories;
    document.getElementById('financeCategory').innerHTML = cats.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
  }

  function save() {
    const member = App.utils.getCurrentMember();
    if (!member) { App.toast('请先选择当前成员', 'error'); return; }

    const type = document.querySelector('input[name="financeType"]:checked').value;
    const category = document.getElementById('financeCategory').value;
    const amount = parseFloat(document.getElementById('financeAmount').value);
    const description = document.getElementById('financeDescription').value.trim();

    if (!amount || amount <= 0) {
      App.toast('请输入有效金额', 'error');
      return;
    }

    Storage.addItem(Storage.KEYS.finance, {
      type, category, amount, description,
      memberId: member.id,
      month: document.getElementById('pageContainer').dataset.month || App.utils.getMonthKey()
    });

    App.closeModal();
    App.toast('收支记录已添加', 'success');
    App.navigate('finance');
  }

  function deleteEntry(id) {
    App.confirmDialog('确定删除这条记录吗？', () => {
      Storage.deleteItem(Storage.KEYS.finance, id);
      App.toast('已删除', 'success');
      App.navigate('finance');
    });
  }

  return { changeMonth, goCurrentMonth, showAdd, updateCategoryOptions, save, deleteEntry };
})();
