// ===== 首页仪表盘 =====
App.registerPage('dashboard', function () {
  const container = document.getElementById('pageContainer');
  const members = Storage.getMembers();
  const monthKey = App.utils.getMonthKey();
  const bills = Storage.getAll(Storage.KEYS.bills).filter(b => b.month === monthKey);
  const finances = Storage.getAll(Storage.KEYS.finance).filter(f => f.month === monthKey);
  const chores = Storage.getAll(Storage.KEYS.chores);
  const memos = Storage.getAll(Storage.KEYS.memos);
  const communityPosts = Storage.getAll(Storage.KEYS.community);
  const albumItems = Storage.getAll(Storage.KEYS.album);

  // 统计数据
  const totalBills = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const totalIncome = finances.filter(f => f.type === 'income').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const totalExpense = finances.filter(f => f.type === 'expense').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0);
  const todayChores = chores.filter(c => {
    const d = new Date(c.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });
  const pendingMemos = memos.filter(m => !m.done);
  const urgentMemos = pendingMemos.filter(m => m.priority === 'urgent');

  const now = new Date();
  const hour = now.getHours();
  let greeting = '你好';
  if (hour < 6) greeting = '夜深了';
  else if (hour < 9) greeting = '早上好';
  else if (hour < 12) greeting = '上午好';
  else if (hour < 14) greeting = '中午好';
  else if (hour < 18) greeting = '下午好';
  else if (hour < 22) greeting = '晚上好';
  else greeting = '夜深了';

  const member = App.utils.getCurrentMember();
  const memberName = member ? member.name : '朋友';

  // 最近相册
  const recentPhotos = albumItems.slice(0, 6);

  // 最近社区动态
  const recentPosts = communityPosts.slice(0, 3);

  let html = `
    <h1 class="page-title">🏠 首页</h1>
    <div class="card" style="background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; border: none;">
      <div style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">${greeting}，${memberName}！</div>
      <div style="font-size: 14px; opacity: 0.9;">${App.utils.getMonthLabel(monthKey)} · 今日家庭概况</div>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-icon">🧾</div>
        <div>
          <div class="stat-value">${App.utils.formatMoney(totalBills)}</div>
          <div class="stat-label">本月家庭账单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div>
          <div class="stat-value" style="color: var(--success);">${App.utils.formatMoney(totalIncome)}</div>
          <div class="stat-label">本月总收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💸</div>
        <div>
          <div class="stat-value" style="color: var(--danger);">${App.utils.formatMoney(totalExpense)}</div>
          <div class="stat-label">本月总支出</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🧹</div>
        <div>
          <div class="stat-value">${todayChores.length}</div>
          <div class="stat-label">今日家务记录</div>
        </div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="section-header">
          <span class="section-title">📸 最新相册</span>
          <button class="btn btn-outline btn-sm" onclick="App.navigate('album')">查看全部</button>
        </div>
        ${recentPhotos.length > 0 ? `
          <div class="album-grid">
            ${recentPhotos.map(p => `
              <div class="album-item" onclick="App.showImage('${p.data}')">
                <img src="${p.data}" alt="${App.utils.escapeHtml(p.title || '')}">
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📷</div>
            <div class="empty-state-text">还没有照片</div>
          </div>
        `}
      </div>

      <div class="card">
        <div class="section-header">
          <span class="section-title">💬 最新动态</span>
          <button class="btn btn-outline btn-sm" onclick="App.navigate('community')">查看全部</button>
        </div>
        ${recentPosts.length > 0 ? recentPosts.map(p => `
          <div class="community-post" style="margin-bottom: 8px; box-shadow: none; background: var(--bg-page);">
            <div class="community-post-header">
              <div class="community-post-avatar" style="background: ${Storage.getMemberColor(p.memberId)}; width: 28px; height: 28px; font-size: 13px;">
                ${Storage.getMemberAvatar(p.memberId)}
              </div>
              <div>
                <div class="community-post-author">${Storage.getMemberName(p.memberId)}</div>
                <div class="community-post-time">${App.utils.formatDate(p.createdAt)}</div>
              </div>
            </div>
            <div class="community-post-content" style="font-size: 14px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${App.utils.escapeHtml(p.content)}
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">💬</div>
            <div class="empty-state-text">还没有动态</div>
          </div>
        `}
      </div>

      <div class="card">
        <div class="section-header">
          <span class="section-title">📝 待办备忘</span>
          <button class="btn btn-outline btn-sm" onclick="App.navigate('memo')">查看全部</button>
        </div>
        ${pendingMemos.length > 0 ? pendingMemos.slice(0, 4).map(m => `
          <div class="memo-item" style="margin-bottom: 8px; box-shadow: none; padding: 12px; ${m.priority === 'urgent' ? 'border-left-color: var(--danger);' : ''}">
            <div class="memo-content">
              <div class="memo-title" style="font-size: 14px;">${m.priority === 'urgent' ? '🔴 ' : ''}${App.utils.escapeHtml(m.title)}</div>
              <div class="memo-text" style="font-size: 12px;">${App.utils.escapeHtml(m.content || '')}</div>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <div class="empty-state-text">没有待办事项</div>
          </div>
        `}
        ${urgentMemos.length > 0 ? `<div class="tag tag-danger mt-12">⚠️ ${urgentMemos.length} 条紧急待办</div>` : ''}
      </div>

      <div class="card">
        <div class="section-header">
          <span class="section-title">🧹 今日家务</span>
          <button class="btn btn-outline btn-sm" onclick="App.navigate('chores')">查看全部</button>
        </div>
        ${todayChores.length > 0 ? todayChores.map(c => `
          <div class="chore-card" style="margin-bottom: 6px;">
            <div class="chore-card-name">${c.choreType}</div>
            <div class="chore-card-member">${Storage.getMemberName(c.memberId)} · ${App.utils.formatTime(c.date)}</div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-state-icon">🧹</div>
            <div class="empty-state-text">今天还没有家务记录</div>
          </div>
        `}
      </div>
    </div>

    <div class="card">
      <div class="section-header">
        <span class="section-title">👨‍👩‍👧‍👦 家庭成员 (${members.length})</span>
        <button class="btn btn-outline btn-sm" onclick="App.navigate('settings')">管理</button>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        ${members.map(m => `
          <div style="text-align: center; cursor: pointer;" onclick="App.navigate('settings')">
            <div class="user-avatar" style="background: ${Storage.getMemberColor(m.id)}; margin: 0 auto 4px; width: 48px; height: 48px; font-size: 22px;">
              ${m.avatar || m.name.charAt(0)}
            </div>
            <div style="font-size: 13px; font-weight: 600;">${m.name}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${m.role || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.innerHTML = html;
});
