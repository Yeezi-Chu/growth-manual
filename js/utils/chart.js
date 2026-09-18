// ===== 轻量 Canvas 图表工具 =====
const Chart = (function () {
  function getCSS(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#333';
  }

  function getTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  // 饼图
  function pie(containerId, data, opts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const w = opts?.width || 300;
    const h = opts?.height || 240;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    container.innerHTML = '';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const cx = w / 2, cy = h / 2 - 10;
    const radius = Math.min(w, h) / 2 - 30;
    const total = data.reduce((s, d) => s + (d.value || 0), 0);
    if (total <= 0) {
      ctx.fillStyle = getCSS('--text-light');
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无数据', cx, cy);
      return;
    }
    const colors = ['#2D9B8B', '#F5A623', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', '#34495E', '#E91E63', '#00BCD4', '#8BC34A', '#FF5722'];
    const darkColors = ['#3DBFAE', '#F5B840', '#5BB3F3', '#B07DD6', '#FF6B6B', '#2ECC71', '#FFC107', '#90A4AE', '#F06292', '#4DD0E1', '#AED581', '#FF8A65'];
    const pal = getTheme() === 'dark' ? darkColors : colors;

    let startAngle = -Math.PI / 2;
    data.forEach((d, i) => {
      const angle = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
      ctx.closePath();
      ctx.fillStyle = pal[i % pal.length];
      ctx.fill();
      ctx.strokeStyle = getCSS('--bg-card');
      ctx.lineWidth = 2;
      ctx.stroke();
      startAngle += angle;
    });

    // 中心圆（甜甜圈效果）
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = getCSS('--bg-card');
    ctx.fill();
    ctx.fillStyle = getCSS('--text-main');
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts?.centerLabel || '', cx, cy + 5);

    // 图例
    const legend = document.createElement('div');
    legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;justify-content:center;';
    data.forEach((d, i) => {
      const item = document.createElement('div');
      item.style.cssText = 'display:flex;align-items:center;gap:4px;font-size:12px;color:' + getCSS('--text-secondary') + ';';
      const dot = document.createElement('span');
      dot.style.cssText = 'width:10px;height:10px;border-radius:50%;background:' + pal[i % pal.length] + ';flex-shrink:0;';
      item.appendChild(dot);
      item.appendChild(document.createTextNode(d.label + ' ' + (opts?.formatMoney ? '¥' + d.value.toFixed(2) : d.value)));
      legend.appendChild(item);
    });
    container.appendChild(legend);
  }

  // 柱状图
  function bar(containerId, data, opts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const w = opts?.width || 320;
    const h = opts?.height || 200;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    container.innerHTML = '';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const padding = { top: 20, right: 16, bottom: 30, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const values = data.map(d => d.value || 0);
    const maxVal = Math.max(...values, 1);
    const niceMax = Math.ceil(maxVal * 1.15);

    // Y轴刻度
    ctx.strokeStyle = getCSS('--border');
    ctx.fillStyle = getCSS('--text-secondary');
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH * i / 4);
      const val = (niceMax * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.strokeStyle = getCSS('--border');
      ctx.globalAlpha = 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(opts?.formatMoney ? '¥' + val.toFixed(0) : val.toFixed(0), padding.left - 6, y + 3);
    }

    // 柱子
    const barW = chartW / data.length * 0.6;
    const gap = chartW / data.length * 0.4;
    const colors = ['#2D9B8B', '#F5A623', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12', '#E91E63'];
    const darkColors = ['#3DBFAE', '#F5B840', '#5BB3F3', '#B07DD6', '#FF6B6B', '#2ECC71', '#FFC107', '#F06292'];
    const pal = getTheme() === 'dark' ? darkColors : colors;

    data.forEach((d, i) => {
      const x = padding.left + (chartW / data.length) * i + gap / 2;
      const barH = (d.value / niceMax) * chartH;
      const y = padding.top + chartH - barH;
      ctx.fillStyle = pal[i % pal.length];
      ctx.fillRect(x, y, barW, barH);
      // 数值
      ctx.fillStyle = getCSS('--text-main');
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(opts?.formatMoney ? '¥' + (d.value || 0).toFixed(0) : (d.value || 0), x + barW / 2, y - 4);
      // X轴标签
      ctx.fillStyle = getCSS('--text-secondary');
      ctx.font = '11px sans-serif';
      const label = d.label.length > 4 ? d.label.slice(0, 4) : d.label;
      ctx.fillText(label, x + barW / 2, h - 8);
    });
  }

  // 折线图
  function line(containerId, data, opts) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const w = opts?.width || 320;
    const h = opts?.height || 200;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    container.innerHTML = '';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const padding = { top: 20, right: 16, bottom: 30, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;
    const values = data.map(d => d.value || 0);
    const maxVal = Math.max(...values, 1);
    const niceMax = Math.ceil(maxVal * 1.15);

    // 网格线
    ctx.strokeStyle = getCSS('--border');
    ctx.fillStyle = getCSS('--text-secondary');
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + chartH - (chartH * i / 4);
      const val = (niceMax * i / 4);
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.strokeStyle = getCSS('--border');
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillText(opts?.formatMoney ? '¥' + val.toFixed(0) : val.toFixed(0), padding.left - 6, y + 3);
    }

    // 折线
    const stepX = chartW / Math.max(data.length - 1, 1);
    const lineColor = getCSS('--primary');
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = padding.left + stepX * i;
      const y = padding.top + chartH - ((d.value || 0) / niceMax) * chartH;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 填充
    ctx.lineTo(padding.left + stepX * (data.length - 1), padding.top + chartH);
    ctx.lineTo(padding.left, padding.top + chartH);
    ctx.closePath();
    ctx.fillStyle = lineColor + '22';
    ctx.fill();

    // 数据点
    data.forEach((d, i) => {
      const x = padding.left + stepX * i;
      const y = padding.top + chartH - ((d.value || 0) / niceMax) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.fillStyle = getCSS('--bg-card');
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      // X轴标签
      ctx.fillStyle = getCSS('--text-secondary');
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      const label = d.label.length > 4 ? d.label.slice(0, 4) : d.label;
      ctx.fillText(label, x, h - 8);
    });
  }

  return { pie, bar, line };
})();
