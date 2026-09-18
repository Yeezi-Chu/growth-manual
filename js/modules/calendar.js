// ===== 家庭日历 =====
App.registerPage('calendar', function () {
  const container = document.getElementById('pageContainer');
  const date = container.dataset.calDate ? new Date(container.dataset.calDate) : new Date();
  container.dataset.calDate = date.toISOString();

  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();
  const todayStr = today.toDateString();

  // 获取当月所有事件
  const bills = Storage.getAll(Storage.KEYS.bills);
  const finances = Storage.getAll(Storage.KEYS.finance);
  const chores = Storage.getAll(Storage.KEYS.chores);
  const diplomacy = Storage.getAll(Storage.KEYS.diplomacy);
  const memos = Storage.getAll(Storage.KEYS.memos);
  const community = Storage.getAll(Storage.KEYS.community);

  // 按日期分组
  function getEventsForDay(dayDate) {
    const dayStr = dayDate.toDateString();
    const events = [];

    bills.forEach(b => {
      if (new Date(b.createdAt).toDateString() === dayStr)
        events.push({ type: 'bill', label: b.category, icon: '🧾', color: '#E74C3C', memberId: b.memberId });
    });
    finances.forEach(f => {
      if (new Date(f.createdAt).toDateString() === dayStr)
        events.push({ type: 'finance', label: f.type === 'income' ? '收入' : '支出', icon: '💰', color: f.type === 'income' ? '#27AE60' : '#E74C3C', memberId: f.memberId });
    });
    chores.forEach(c => {
      if (new Date(c.date).toDateString() === dayStr)
        events.push({ type: 'chore', label: c.choreType, icon: '🧹', color: '#2D9B8B', memberId: c.memberId });
    });
    diplomacy.forEach(d => {
      const dDate = new Date(d.eventDate || d.createdAt);
      if (dDate.toDateString() === dayStr)
        events.push({ type: 'diplomacy', label: d.eventTitle || '外交', icon: '🤝', color: '#F5A623', memberId: d.memberId });
    });
    memos.forEach(m => {
      if (m.dueDate && new Date(m.dueDate).toDateString() === dayStr)
        events.push({ type: 'memo', label: m.title, icon: m.priority === 'urgent' ? '🔴' : '📝', color: m.priority === 'urgent' ? '#E74C3C' : '#F5A623', memberId: m.memberId });
    });
    community.forEach(p => {
      if (new Date(p.createdAt).toDateString() === dayStr)
        events.push({ type: 'community', label: '动态', icon: '💬', color: '#9B59B6', memberId: p.memberId });
    });

    return events;
  }

  const legend = [
    { label: '账单', color: '#E74C3C' },
    { label: '收支', color: '#27AE60' },
    { label: '家务', color: '#2D9B8B' },
    { label: '外交', color: '#F5A623' },
    { label: '备忘', color: '#3498DB' },
    { label: '社区', color: '#9B59B6' }
  ];

  let html = `
    <h1 class="page-title">📅 家庭日历</h1>
    <p class="page-description">统一查看家庭所有事项，一目了然</p>

    <div class="month-selector">
      <button class="btn btn-outline btn-icon" onclick="CalendarPage.changeMonth(-1)">◀</button>
      <div class="month-display">${year}年${month + 1}月</div>
      <button class="btn btn-outline btn-icon" onclick="CalendarPage.changeMonth(1)">▶</button>
      ${month !== today.getMonth() || year !== today.getFullYear() ? '<button class="btn btn-outline btn-sm" onclick="CalendarPage.goToday()">今天</button>' : ''}
    </div>

    <div class="calendar-legend">
  `;

  legend.forEach(l => {
    html += `<div class="calendar-legend-item"><span class="calendar-dot" style="background:${l.color}"></span>${l.label}</div>`;
  });

  html += '</div><div class="calendar-grid">';

  // 星期标题
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  weekdays.forEach(w => {
    html += `<div class="calendar-day-header">${w}</div>`;
  });

  // 上月填充
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  for (let i = firstDay - 1; i >= 0; i--) {
    html += '<div class="calendar-day other-month"></div>';
  }

  // 当月日期
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, month, d);
    const events = getEventsForDay(dayDate);
    const isToday = dayDate.toDateString() === todayStr;

    html += `<div class="calendar-day ${isToday ? 'today' : ''}" onclick="CalendarPage.showDay(${d})">
      <div class="calendar-day-num">${d}</div>
      <div class="calendar-dots">`;

    events.slice(0, 6).forEach(e => {
      html += `<span class="calendar-dot" style="background:${e.color}"></span>`;
    });

    if (events.length > 6) {
      html += `<span style="font-size:10px;color:var(--text-light)">+${events.length - 6}</span>`;
    }

    html += `</div></div>`;
  }

  // 下月填充
  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 0; i < remaining; i++) {
    html += '<div class="calendar-day other-month"></div>';
  }

  html += '</div>';

  // 今日事件列表
  const todayEvents = getEventsForDay(today);
  html += `
    <div class="calendar-events">
      <div class="section-header">
        <span class="section-title">📋 今日事件 (${todayEvents.length})</span>
      </div>
  `;

  if (todayEvents.length === 0) {
    html += `<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">今天没有事件</div></div>`;
  } else {
    todayEvents.forEach(e => {
      html += `
        <div class="calendar-event-item">
          <span style="font-size:18px">${e.icon}</span>
          <span style="flex:1;font-size:14px;">${App.utils.escapeHtml(e.label)}</span>
          <span style="font-size:12px;color:var(--text-secondary)">${Storage.getMemberName(e.memberId)}</span>
          <span class="calendar-dot" style="background:${e.color}"></span>
        </div>
      `;
    });
  }

  html += '</div>';

  container.innerHTML = html;
});

const CalendarPage = (function () {
  function changeMonth(delta) {
    const container = document.getElementById('pageContainer');
    const date = new Date(container.dataset.calDate);
    date.setMonth(date.getMonth() + delta);
    container.dataset.calDate = date.toISOString();
    App.navigate('calendar');
  }

  function goToday() {
    document.getElementById('pageContainer').dataset.calDate = new Date().toISOString();
    App.navigate('calendar');
  }

  function showDay(day) {
    const container = document.getElementById('pageContainer');
    const date = new Date(container.dataset.calDate);
    const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
    const dayStr = dayDate.toDateString();
    App.showModal(`${date.getMonth() + 1}月${day}日 事件`, getDayEventsHTML(dayDate), `<button class="btn btn-outline" onclick="App.closeModal()">关闭</button>`);
  }

  function getDayEventsHTML(dayDate) {
    const dayStr = dayDate.toDateString();
    const events = [];

    Storage.getAll(Storage.KEYS.bills).forEach(b => {
      if (new Date(b.createdAt).toDateString() === dayStr)
        events.push({ icon: '🧾', label: b.category + ' ¥' + b.amount, member: b.memberId, color: '#E74C3C' });
    });
    Storage.getAll(Storage.KEYS.finance).forEach(f => {
      if (new Date(f.createdAt).toDateString() === dayStr)
        events.push({ icon: '💰', label: (f.type === 'income' ? '收入' : '支出') + ' ¥' + f.amount, member: f.memberId, color: f.type === 'income' ? '#27AE60' : '#E74C3C' });
    });
    Storage.getAll(Storage.KEYS.chores).forEach(c => {
      if (new Date(c.date).toDateString() === dayStr)
        events.push({ icon: '🧹', label: c.choreType, member: c.memberId, color: '#2D9B8B' });
    });
    Storage.getAll(Storage.KEYS.diplomacy).forEach(d => {
      if (new Date(d.eventDate || d.createdAt).toDateString() === dayStr)
        events.push({ icon: '🤝', label: d.eventTitle || '外交', member: d.memberId, color: '#F5A623' });
    });
    Storage.getAll(Storage.KEYS.memos).forEach(m => {
      if (m.dueDate && new Date(m.dueDate).toDateString() === dayStr)
        events.push({ icon: m.priority === 'urgent' ? '🔴' : '📝', label: m.title, member: m.memberId, color: '#3498DB' });
    });
    Storage.getAll(Storage.KEYS.community).forEach(p => {
      if (new Date(p.createdAt).toDateString() === dayStr)
        events.push({ icon: '💬', label: p.content.slice(0, 30), member: p.memberId, color: '#9B59B6' });
    });

    if (events.length === 0) return '<p style="text-align:center;color:var(--text-secondary);padding:20px;">当天没有事件</p>';
    return events.map(e => `
      <div class="calendar-event-item">
        <span style="font-size:18px">${e.icon}</span>
        <span style="flex:1;font-size:14px;">${App.utils.escapeHtml(e.label)}</span>
        <span style="font-size:12px;color:var(--text-secondary)">${Storage.getMemberName(e.member)}</span>
      </div>
    `).join('');
  }

  return { changeMonth, goToday, showDay };
})();
