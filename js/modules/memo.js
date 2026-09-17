// ===== 家庭备忘录 =====
App.registerPage('memo', function () {
  const container = document.getElementById('pageContainer');
  const memos = Storage.getAll(Storage.KEYS.memos);

  const pending = memos.filter(m => !m.done);
  const done = memos.filter(m => m.done);
  const urgent = pending.filter(m => m.priority === 'urgent');

  let html = `
    <h1 class="page-title">📝 家庭备忘</h1>
    <p class="page-description">记录重大事项、突发状况、任务提醒，给自己或家人</p>

    ${urgent.length > 0 ? `<div class="card" style="background: var(--danger-light); border: 1px solid var(--danger);">
      <div style="color: var(--danger); font-weight: 600;">⚠️ ${urgent.length} 条紧急待办</div>
    </div>` : ''}

    <div class="section-header">
      <span class="section-title">待办 (${pending.length})</span>
      <button class="btn btn-primary btn-sm" onclick="Memo.showAdd()">+ 新建备忘</button>
    </div>
  `;

  if (pending.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-text">没有待办事项</div>
        <div class="empty-state-hint">创建备忘录提醒自己或家人</div>
      </div>
    `;
  } else {
    pending.sort((a, b) => {
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (a.priority !== 'urgent' && b.priority === 'urgent') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    pending.forEach(m => {
      const isUrgent = m.priority === 'urgent';
      const toMember = m.toMember ? Storage.getMemberName(m.toMember) : null;
      const isReminder = !!m.toMember;

      html += `
        <div class="memo-item ${isUrgent ? 'urgent' : ''}">
          <div class="memo-checkbox" onclick="Memo.toggleDone('${m.id}')">○</div>
          <div class="memo-content">
            <div class="memo-title">${isUrgent ? '🔴 ' : '📌 '}${App.utils.escapeHtml(m.title)}</div>
            ${m.content ? `<div class="memo-text">${App.utils.escapeHtml(m.content)}</div>` : ''}
            <div class="memo-meta">
              <span>👤 ${Storage.getMemberName(m.memberId)}</span>
              ${toMember ? `<span>📨 提醒 @${toMember}</span>` : ''}
              ${m.dueDate ? `<span>📅 ${m.dueDate}</span>` : ''}
              <span class="memo-priority ${isUrgent ? 'text-danger' : 'text-secondary'}">
                ${isUrgent ? '紧急' : '普通'}
              </span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="Memo.deleteMemo('${m.id}')">删除</button>
        </div>
      `;
    });
  }

  if (done.length > 0) {
    html += `
      <div class="section-header mt-16">
        <span class="section-title">已完成 (${done.length})</span>
      </div>
    `;
    done.slice(0, 10).forEach(m => {
      const toMember = m.toMember ? Storage.getMemberName(m.toMember) : null;
      html += `
        <div class="memo-item done">
          <div class="memo-checkbox checked" onclick="Memo.toggleDone('${m.id}')">✓</div>
          <div class="memo-content">
            <div class="memo-title" style="text-decoration: line-through;">${App.utils.escapeHtml(m.title)}</div>
            <div class="memo-meta">
              <span>👤 ${Storage.getMemberName(m.memberId)}</span>
              ${toMember ? `<span>📨 @${toMember}</span>` : ''}
              <span>✅ ${App.utils.formatDate(m.completedAt || m.createdAt)}</span>
            </div>
          </div>
          <button class="btn btn-outline btn-sm" onclick="Memo.deleteMemo('${m.id}')">删除</button>
        </div>
      `;
    });
  }

  container.innerHTML = html;
});

const Memo = (function () {
  function showAdd() {
    const member = App.utils.requireMember();
    if (!member) return;

    const members = Storage.getMembers();
    const today = new Date().toISOString().slice(0, 10);

    const body = `
      <div class="form-group">
        <label class="form-label">标题 <span class="required">*</span></label>
        <input type="text" class="form-input" id="memoTitle" placeholder="例如：缴纳房贷、接种疫苗" maxlength="50">
      </div>
      <div class="form-group">
        <label class="form-label">详细内容</label>
        <textarea class="form-textarea" id="memoContent" placeholder="补充说明..." maxlength="500"></textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">优先级</label>
          <select class="form-select" id="memoPriority">
            <option value="normal">📌 普通</option>
            <option value="urgent">🔴 紧急</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">截止日期</label>
          <input type="date" class="form-input" id="memoDueDate">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">提醒对象</label>
        <select class="form-select" id="memoToMember">
          <option value="">仅自己可见</option>
          ${members.filter(m => m.id !== member.id).map(m => `<option value="${m.id}">提醒 ${m.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">记录人</label>
        <div style="font-size: 14px; color: var(--text-secondary);">${member.name} (当前身份)</div>
      </div>
    `;

    App.showModal('新建备忘', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Memo.save()">保存</button>`);

    document.getElementById('memoTitle').focus();
  }

  function save() {
    const member = App.utils.getCurrentMember();
    if (!member) { App.toast('请先选择当前成员', 'error'); return; }

    const title = document.getElementById('memoTitle').value.trim();
    const content = document.getElementById('memoContent').value.trim();
    const priority = document.getElementById('memoPriority').value;
    const dueDate = document.getElementById('memoDueDate').value;
    const toMember = document.getElementById('memoToMember').value;

    if (!title) {
      App.toast('请输入标题', 'error');
      return;
    }

    Storage.addItem(Storage.KEYS.memos, {
      title, content, priority, dueDate: dueDate || null,
      toMember: toMember || null,
      memberId: member.id,
      done: false
    });

    App.closeModal();
    App.toast('备忘已创建', 'success');
    App.navigate('memo');
  }

  function toggleDone(id) {
    const memos = Storage.getAll(Storage.KEYS.memos);
    const memo = memos.find(m => m.id === id);
    if (!memo) return;

    if (memo.done) {
      Storage.updateItem(Storage.KEYS.memos, id, { done: false, completedAt: null });
    } else {
      Storage.updateItem(Storage.KEYS.memos, id, { done: true, completedAt: new Date().toISOString() });
      App.toast('已完成！', 'success');
    }
    App.navigate('memo');
  }

  function deleteMemo(id) {
    App.confirmDialog('确定删除这条备忘吗？', () => {
      Storage.deleteItem(Storage.KEYS.memos, id);
      App.toast('已删除', 'success');
      App.navigate('memo');
    });
  }

  return { showAdd, save, toggleDone, deleteMemo };
})();
