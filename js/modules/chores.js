// ===== 家务分工 =====
App.registerPage('chores', function () {
  const container = document.getElementById('pageContainer');
  const members = Storage.getMembers();
  const searchText = container.dataset.choreSearch || '';
  const memberFilter = container.dataset.choreMemberFilter || '';

  const allChores = Storage.getAll(Storage.KEYS.chores);

  // 按搜索和成员筛选
  let filteredChores = allChores;
  if (searchText) {
    const q = searchText.toLowerCase();
    filteredChores = filteredChores.filter(c =>
      (c.choreType || '').toLowerCase().includes(q) ||
      (c.note || '').toLowerCase().includes(q)
    );
  }
  if (memberFilter) {
    filteredChores = filteredChores.filter(c => c.memberId === memberFilter);
  }

  // 今日家务
  const today = new Date().toDateString();
  const todayChores = filteredChores.filter(c => new Date(c.date).toDateString() === today);

  // 本月家务统计
  const monthKey = App.utils.getMonthKey();
  const monthChores = allChores.filter(c => {
    const d = new Date(c.date);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}` === monthKey;
  });

  // 各成员贡献统计
  const memberStats = {};
  members.forEach(m => { memberStats[m.id] = { name: m.name, count: 0, avatar: m.avatar, color: Storage.getMemberColor(m.id) }; });
  monthChores.forEach(c => {
    if (memberStats[c.memberId]) memberStats[c.memberId].count++;
  });

  const maxCount = Math.max(...Object.values(memberStats).map(s => s.count), 1);
  const totalCount = monthChores.length;

  // 家务类型统计
  const choreTypes = {};
  monthChores.forEach(c => {
    if (!choreTypes[c.choreType]) choreTypes[c.choreType] = 0;
    choreTypes[c.choreType]++;
  });

  let html = `
    <h1 class="page-title">🧹 家务分工</h1>
    <p class="page-description">记录每日家务，根据历史贡献智能分配任务，让家务更公平</p>

    <div class="chore-assignment">
      <div class="chore-assignment-title">🎲 今日家务建议</div>
      <div id="suggestionBox">
        ${Chores.generateSuggestionHTML()}
      </div>
      <button class="btn btn-secondary btn-sm mt-12" onclick="Chores.refreshSuggestion()">🔄 重新分配</button>
    </div>

    <div class="chore-progress">
      <div class="chore-progress-header">
        <span class="section-title">📊 ${App.utils.getMonthLabel(monthKey)}家务贡献</span>
        <span class="text-secondary font-sm">共 ${totalCount} 次</span>
      </div>
  `;

  Object.values(memberStats).forEach(stat => {
    const percent = maxCount > 0 ? Math.round(stat.count / maxCount * 100) : 0;
    html += `
      <div class="member-chore-bar">
        <div class="member-chore-avatar" style="background: ${stat.color}; color: #fff;">
          ${stat.avatar || stat.name.charAt(0)}
        </div>
        <div class="chore-bar-track">
          <div class="chore-bar-fill" style="width: ${percent}%; background: ${stat.color};">
            ${stat.count > 0 ? stat.count + '次' : ''}
          </div>
        </div>
        <div class="chore-count">${stat.count}</div>
      </div>
    `;
  });

  html += '</div>';

  // 家务类型分布
  if (Object.keys(choreTypes).length > 0) {
    html += '<div class="card"><div class="section-title mb-12">家务类型分布</div>';
    const sorted = Object.entries(choreTypes).sort((a, b) => b[1] - a[1]);
    sorted.forEach(([type, count]) => {
      const percent = Math.round(count / totalCount * 100);
      html += `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <span style="min-width: 80px; font-size: 14px;">${type}</span>
          <div class="chore-bar-track" style="height: 20px;">
            <div class="chore-bar-fill" style="width: ${percent}%; background: var(--primary);">${count}次</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // 今日家务记录
  html += `
    <div class="section-header mt-16">
      <span class="section-title">今日家务 (${todayChores.length})</span>
      <button class="btn btn-primary btn-sm" onclick="Chores.showAdd()">+ 记录家务</button>
    </div>

    ${allChores.length > 0 ? `
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="text" placeholder="搜索家务类型或备注..." value="${searchText}" oninput="Chores.onSearch(this.value)">
    </div>
    ${members.length > 1 ? `
    <div class="member-filter">
      <span class="member-filter-chip ${!memberFilter ? 'active' : ''}" onclick="Chores.onMemberFilter('')">全部</span>
      ${members.map(m => `<span class="member-filter-chip ${memberFilter === m.id ? 'active' : ''}" onclick="Chores.onMemberFilter('${m.id}')">${m.name}</span>`).join('')}
    </div>
    ` : ''}
    ` : ''}
  `;

  if (todayChores.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">${allChores.length > 0 ? '🔍' : '🧹'}</div>
        <div class="empty-state-text">${allChores.length > 0 ? '没有符合条件的家务记录' : '今天还没有家务记录'}</div>
        <div class="empty-state-hint">${allChores.length > 0 ? '试试调整搜索或筛选条件' : '点击"记录家务"开始记录'}</div>
      </div>
    `;
  } else {
    html += '<div class="chore-today-list">';
    todayChores.forEach(c => {
      html += `
        <div class="chore-card" style="border-left-color: ${Storage.getMemberColor(c.memberId)};">
          <div class="chore-card-name">${c.choreType}</div>
          <div class="chore-card-member">${Storage.getMemberName(c.memberId)}</div>
          <div class="chore-card-time">${App.utils.formatTime(c.date)}</div>
          ${c.note ? `<div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${App.utils.escapeHtml(c.note)}</div>` : ''}
          <div class="item-actions">
            <button class="btn-icon-sm" onclick="Chores.showEdit('${c.id}')">编辑</button>
            <button class="btn-icon-sm danger" onclick="Chores.deleteChore('${c.id}')">删除</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // 近期记录
  const recentChores = filteredChores.slice(0, 10).filter(c => !todayChores.includes(c));
  if (recentChores.length > 0) {
    html += `
      <div class="section-header mt-16">
        <span class="section-title">近期记录</span>
      </div>
      <div class="card">
    `;
    recentChores.forEach(c => {
      html += `
        <div class="bill-item">
          <div class="bill-icon" style="background: ${Storage.getMemberColor(c.memberId)}20; color: ${Storage.getMemberColor(c.memberId)};">
            ${Storage.getMemberAvatar(c.memberId)}
          </div>
          <div class="bill-info">
            <div class="bill-category">${c.choreType}</div>
            <div class="bill-desc">${Storage.getMemberName(c.memberId)} · ${App.utils.formatDate(c.date)}</div>
          </div>
          <div class="item-actions">
            <button class="btn-icon-sm" onclick="Chores.showEdit('${c.id}')">编辑</button>
            <button class="btn-icon-sm danger" onclick="Chores.deleteChore('${c.id}')">删除</button>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  container.innerHTML = html;
});

const Chores = (function () {
  const choreTypes = [
    '买菜', '洗碗', '做饭', '洗衣服', '晾衣服', '叠衣服',
    '洗车', '扫地', '拖地', '擦桌子', '倒垃圾', '整理房间',
    '照顾宠物', '浇花', '修理', '带孩子', '其他'
  ];

  function showAdd() {
    const member = App.utils.requireMember();
    if (!member) return;

    const body = `
      <div class="form-group">
        <label class="form-label">家务类型 <span class="required">*</span></label>
        <select class="form-select" id="choreType">
          ${choreTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">记录人</label>
        <div style="font-size: 14px; color: var(--text-secondary);">${member.name} (当前身份)</div>
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input type="text" class="form-input" id="choreNote" placeholder="例如：做了三菜一汤">
      </div>
    `;

    App.showModal('记录家务', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Chores.save()">保存</button>`);

    document.getElementById('choreType').focus();
  }

  function save() {
    const member = App.utils.getCurrentMember();
    if (!member) { App.toast('请先选择当前成员', 'error'); return; }

    const choreType = document.getElementById('choreType').value;
    const note = document.getElementById('choreNote').value.trim();

    Storage.addItem(Storage.KEYS.chores, {
      choreType, note,
      memberId: member.id,
      date: new Date().toISOString()
    });

    App.closeModal();
    App.toast('家务已记录', 'success');
    App.navigate('chores');
  }

  function deleteChore(id) {
    App.confirmDialog('确定删除这条家务记录吗？', () => {
      Storage.deleteItem(Storage.KEYS.chores, id);
      App.toast('已删除', 'success');
      App.navigate('chores');
    });
  }

  let searchTimer = null;
  function onSearch(value) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      document.getElementById('pageContainer').dataset.choreSearch = value;
      App.navigate('chores');
    }, 250);
  }

  function onMemberFilter(memberId) {
    document.getElementById('pageContainer').dataset.choreMemberFilter = memberId;
    App.navigate('chores');
  }

  function showEdit(id) {
    const chores = Storage.getAll(Storage.KEYS.chores);
    const c = chores.find(i => i.id === id);
    if (!c) return;

    const body = `
      <div class="form-group">
        <label class="form-label">家务类型 <span class="required">*</span></label>
        <select class="form-select" id="choreType">
          ${choreTypes.map(t => `<option value="${t}" ${c.choreType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <input type="text" class="form-input" id="choreNote" value="${App.utils.escapeHtml(c.note || '')}">
      </div>
    `;

    App.showModal('编辑家务', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Chores.saveEdit('${id}')">保存</button>`);
  }

  function saveEdit(id) {
    const choreType = document.getElementById('choreType').value;
    const note = document.getElementById('choreNote').value.trim();

    Storage.updateItem(Storage.KEYS.chores, id, { choreType, note });
    App.closeModal();
    App.toast('家务已更新', 'success');
    App.navigate('chores');
  }

  // 根据历史贡献智能分配家务
  // 逻辑：做家务多的人，被分配的概率更低（鼓励少做家务的人多做）
  function generateSuggestion() {
    const members = Storage.getMembers();
    if (members.length === 0) return [];

    const allChores = Storage.getAll(Storage.KEYS.chores);

    // 统计过去30天各成员做家务次数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentChores = allChores.filter(c => new Date(c.date) >= thirtyDaysAgo);

    const memberCounts = {};
    members.forEach(m => { memberCounts[m.id] = 0; });
    recentChores.forEach(c => {
      if (memberCounts[c.memberId] !== undefined) memberCounts[c.memberId]++;
    });

    // 为每个成员计算权重：做家务越少，权重越高（更容易被抽中）
    // 权重 = 1 / (count + 1) * 10
    const weights = {};
    members.forEach(m => {
      weights[m.id] = 10 / (memberCounts[m.id] + 1);
    });

    // 加权随机分配
    const assignments = [];
    const todayChores = ['扫地', '拖地', '洗碗', '做饭', '倒垃圾', '洗衣服'];
    const shuffledChores = [...todayChores].sort(() => Math.random() - 0.5).slice(0, Math.min(4, todayChores.length));

    shuffledChores.forEach(chore => {
      // 加权随机选择成员
      const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
      let rand = Math.random() * totalWeight;
      let selectedMember = members[0];

      for (const m of members) {
        rand -= weights[m.id];
        if (rand <= 0) {
          selectedMember = m;
          break;
        }
      }

      assignments.push({ chore, member: selectedMember, memberCount: memberCounts[selectedMember.id] });
    });

    return assignments;
  }

  function generateSuggestionHTML() {
    const assignments = generateSuggestion();
    if (assignments.length === 0) {
      return '<div class="text-secondary font-sm">添加家庭成员后可生成分配建议</div>';
    }

    return assignments.map(a => `
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; padding: 8px 12px; background: var(--bg-card); border-radius: 8px;">
        <span class="tag tag-secondary">${a.chore}</span>
        <span style="color: var(--text-light);">→</span>
        <div class="member-chore-avatar" style="background: ${Storage.getMemberColor(a.member.id)}; color: #fff; width: 24px; height: 24px; font-size: 12px;">
          ${a.member.avatar || a.member.name.charAt(0)}
        </div>
        <span style="font-weight: 600;">${a.member.name}</span>
        <span class="text-secondary font-sm" style="margin-left: auto;">近30天 ${a.memberCount} 次</span>
      </div>
    `).join('');
  }

  function refreshSuggestion() {
    const box = document.getElementById('suggestionBox');
    if (box) {
      box.innerHTML = generateSuggestionHTML();
      App.toast('已重新分配', 'success');
    }
  }

  return { showAdd, save, showEdit, saveEdit, deleteChore, onSearch, onMemberFilter, generateSuggestion, generateSuggestionHTML, refreshSuggestion };
})();
