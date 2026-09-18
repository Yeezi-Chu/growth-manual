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

    <div class="hero-banner">
      <div class="hero-greeting">${greeting}，${memberName}！</div>
      <div class="hero-date">${App.utils.getMonthLabel(monthKey)} · ${now.getFullYear()}年 · 今日家庭概况</div>
      <div class="hero-weather">
        <span class="hero-weather-icon">${getWeatherIcon()}</span>
        <span>${getSeasonalBadge()}</span>
      </div>
      <div class="hero-decoration">🏡</div>
    </div>

    ${getWarmTip(urgentMemos, pendingMemos, todayChores)}

    <div class="family-members-strip">
      ${members.map(m => `
        <div class="family-member-chip" onclick="App.navigate('settings')">
          <div class="family-member-avatar" style="background: ${Storage.getMemberColor(m.id)};">
            ${m.avatar || m.name.charAt(0)}
          </div>
          <div class="family-member-name">${m.name}</div>
          <div class="family-member-role">${m.role || '家庭成员'}</div>
        </div>
      `).join('')}
    </div>

    <div class="quick-actions">
      <button class="quick-action-btn" onclick="App.navigate('bills'); setTimeout(()=>Bills.showAdd(),100)">
        <span class="quick-action-icon">🧾</span><span>记账单</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigate('finance'); setTimeout(()=>Finance.showAdd(),100)">
        <span class="quick-action-icon">💰</span><span>记收支</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigate('chores'); setTimeout(()=>Chores.showAdd(),100)">
        <span class="quick-action-icon">🧹</span><span>记家务</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigate('memo'); setTimeout(()=>Memo.showAdd(),100)">
        <span class="quick-action-icon">📝</span><span>写备忘</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigate('community'); setTimeout(()=>Community.showAdd(),100)">
        <span class="quick-action-icon">💬</span><span>发动态</span>
      </button>
      <button class="quick-action-btn" onclick="App.navigate('album'); setTimeout(()=>Album.triggerUpload(),100)">
        <span class="quick-action-icon">📸</span><span>传照片</span>
      </button>
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
        <span class="section-title">📊 本月数据概览</span>
      </div>
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div style="flex: 1; min-width: 100px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--primary);">${bills.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">账单记录</div>
        </div>
        <div style="flex: 1; min-width: 100px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--success);">${finances.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">收支记录</div>
        </div>
        <div style="flex: 1; min-width: 100px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--secondary);">${chores.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">家务记录</div>
        </div>
        <div style="flex: 1; min-width: 100px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--purple);">${albumItems.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">家庭相册</div>
        </div>
        <div style="flex: 1; min-width: 100px; text-align: center;">
          <div style="font-size: 28px; font-weight: 700; color: var(--warm);">${communityPosts.length}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">社区动态</div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
});

// 获取天气图标（基于月份和温度的简单模拟）
function getWeatherIcon() {
  const month = new Date().getMonth();
  if (month >= 5 && month <= 8) return '☀️';
  if (month >= 9 && month <= 10) return '🍂';
  if (month >= 11 || month <= 1) return '❄️';
  return '🌸';
}

// 获取季节标签
function getSeasonalBadge() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return '<span class="seasonal-badge seasonal-spring">🌸 春</span>';
  if (month >= 5 && month <= 7) return '<span class="seasonal-badge seasonal-summer">☀️ 夏</span>';
  if (month >= 8 && month <= 10) return '<span class="seasonal-badge seasonal-autumn">🍂 秋</span>';
  return '<span class="seasonal-badge seasonal-winter">❄️ 冬</span>';
}

// 获取温馨提示
function getWarmTip(urgentMemos, pendingMemos, todayChores) {
  const tips = [];
  if (urgentMemos.length > 0) {
    tips.push(`<strong>⚠️ ${urgentMemos.length} 条紧急待办</strong>需要处理`);
  }
  if (todayChores.length === 0) {
    tips.push('今天还没有家务记录，<strong>主动做一点家务</strong>会让家人很开心');
  } else {
    tips.push(`今天已有 <strong>${todayChores.length} 条</strong>家务记录，真棒`);
  }
  if (pendingMemos.length > 5) {
    tips.push(`还有 <strong>${pendingMemos.length} 条待办</strong>，记得及时完成`);
  }
  if (tips.length === 0) {
    tips.push('一切井井有条，<strong>享受美好的一天</strong>吧');
  }
  return `<div class="warm-tip"><div class="warm-tip-icon">💡</div><div class="warm-tip-text">${tips.join(' · ')}</div></div>`;
}
