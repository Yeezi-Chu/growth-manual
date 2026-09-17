// ===== 家庭外交事项 =====
App.registerPage('diplomacy', function () {
  const container = document.getElementById('pageContainer');
  const items = Storage.getAll(Storage.KEYS.diplomacy);

  // 统计
  const totalGift = items.filter(i => i.type === 'gift' || i.direction === 'outgoing').reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const totalReceive = items.filter(i => i.direction === 'incoming').reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);

  let html = `
    <h1 class="page-title">🤝 家庭外交</h1>
    <p class="page-description">记录人情往来、婚宴聚餐、礼金收支，维护家庭社交关系</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">📤</div>
        <div>
          <div class="stat-value text-danger">${App.utils.formatMoney(totalGift)}</div>
          <div class="stat-label">礼金支出</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📥</div>
        <div>
          <div class="stat-value text-success">${App.utils.formatMoney(totalReceive)}</div>
          <div class="stat-label">礼金收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🤝</div>
        <div>
          <div class="stat-value">${items.length}</div>
          <div class="stat-label">外交记录</div>
        </div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">往来记录</span>
      <button class="btn btn-primary btn-sm" onclick="Diplomacy.showAdd()">+ 添加记录</button>
    </div>
  `;

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">🤝</div>
        <div class="empty-state-text">还没有外交记录</div>
        <div class="empty-state-hint">记录婚宴、聚餐、人情往来等</div>
      </div>
    `;
  } else {
    const eventTypes = {
      'wedding': { label: '婚宴', icon: '💒' },
      'funeral': { label: '白事', icon: '🕯️' },
      'birthday': { label: '生日宴', icon: '🎂' },
      'baby': { label: '满月宴', icon: '🍼' },
      'dinner': { label: '私人聚餐', icon: '🍽️' },
      'festival': { label: '节日往来', icon: '🎉' },
      'visit': { label: '拜访', icon: '🏠' },
      'other': { label: '其他', icon: '📦' }
    };

    items.forEach(item => {
      const typeInfo = eventTypes[item.eventType] || eventTypes.other;
      const isIncoming = item.direction === 'incoming';
      html += `
        <div class="diplomacy-item">
          <div class="diplomacy-icon">${typeInfo.icon}</div>
          <div class="diplomacy-info">
            <div class="diplomacy-title">${App.utils.escapeHtml(item.eventTitle || typeInfo.label)}</div>
            <div class="diplomacy-meta">
              <span>📅 ${App.utils.formatDate(item.eventDate || item.createdAt)}</span>
              <span>👤 ${Storage.getMemberName(item.memberId)}</span>
              ${item.counterparty ? `<span>🤝 ${App.utils.escapeHtml(item.counterparty)}` : ''}
              <span class="tag ${isIncoming ? 'tag-success' : 'tag-danger'}">${isIncoming ? '收礼' : '送礼'}</span>
            </div>
            ${item.note ? `<div style="font-size: 13px; color: var(--text-secondary);">${App.utils.escapeHtml(item.note)}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div class="diplomacy-amount" style="color: ${isIncoming ? 'var(--success)' : 'var(--danger)'};">
              ${isIncoming ? '+' : '-'}${App.utils.formatMoney(item.amount)}
            </div>
            <button class="btn btn-outline btn-sm" onclick="Diplomacy.deleteItem('${item.id}')">删除</button>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
});

const Diplomacy = (function () {
  const eventTypes = [
    { value: 'wedding', label: '婚宴', icon: '💒' },
    { value: 'funeral', label: '白事', icon: '🕯️' },
    { value: 'birthday', label: '生日宴', icon: '🎂' },
    { value: 'baby', label: '满月宴', icon: '🍼' },
    { value: 'dinner', label: '私人聚餐', icon: '🍽️' },
    { value: 'festival', label: '节日往来', icon: '🎉' },
    { value: 'visit', label: '拜访', icon: '🏠' },
    { value: 'other', label: '其他', icon: '📦' }
  ];

  function showAdd() {
    const member = App.utils.requireMember();
    if (!member) return;

    const today = new Date().toISOString().slice(0, 10);

    const body = `
      <div class="form-group">
        <label class="form-label">活动类型 <span class="required">*</span></label>
        <select class="form-select" id="eventType">
          ${eventTypes.map(t => `<option value="${t.value}" data-icon="${t.icon}">${t.icon} ${t.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">活动名称</label>
        <input type="text" class="form-input" id="eventTitle" placeholder="例如：张三结婚、李四生日">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">日期</label>
          <input type="date" class="form-input" id="eventDate" value="${today}">
        </div>
        <div class="form-group">
          <label class="form-label">礼金方向</label>
          <select class="form-select" id="direction">
            <option value="outgoing">送出</option>
            <option value="incoming">收入</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">金额</label>
        <input type="number" class="form-input" id="amount" placeholder="0.00" step="0.01" min="0">
      </div>
      <div class="form-group">
        <label class="form-label">对方</label>
        <input type="text" class="form-input" id="counterparty" placeholder="例如：张三一家">
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input type="text" class="form-input" id="note" placeholder="例如：在XX酒店、关系备注">
      </div>
      <div class="form-group">
        <label class="form-label">记录人</label>
        <div style="font-size: 14px; color: var(--text-secondary);">${member.name} (当前身份)</div>
      </div>
    `;

    App.showModal('添加外交记录', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Diplomacy.save()">保存</button>`);
  }

  function save() {
    const member = App.utils.getCurrentMember();
    if (!member) { App.toast('请先选择当前成员', 'error'); return; }

    const eventType = document.getElementById('eventType').value;
    const eventTitle = document.getElementById('eventTitle').value.trim();
    const eventDate = document.getElementById('eventDate').value;
    const direction = document.getElementById('direction').value;
    const amount = parseFloat(document.getElementById('amount').value) || 0;
    const counterparty = document.getElementById('counterparty').value.trim();
    const note = document.getElementById('note').value.trim();

    if (!eventTitle && eventType === 'other') {
      App.toast('请填写活动名称', 'error');
      return;
    }

    Storage.addItem(Storage.KEYS.diplomacy, {
      eventType, eventTitle, eventDate, direction, amount,
      counterparty, note, memberId: member.id
    });

    App.closeModal();
    App.toast('外交记录已添加', 'success');
    App.navigate('diplomacy');
  }

  function deleteItem(id) {
    App.confirmDialog('确定删除这条记录吗？', () => {
      Storage.deleteItem(Storage.KEYS.diplomacy, id);
      App.toast('已删除', 'success');
      App.navigate('diplomacy');
    });
  }

  return { showAdd, save, deleteItem };
})();
