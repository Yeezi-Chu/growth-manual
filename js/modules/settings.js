// ===== 设置页面 =====
App.registerPage('settings', function () {
  const container = document.getElementById('pageContainer');
  const members = Storage.getMembers();
  const settings = Storage.getSettings();
  const currentMemberId = Storage.getCurrentMember();

  let html = `
    <h1 class="page-title">⚙️ 设置</h1>
    <p class="page-description">管理家庭成员、当前身份和应用设置</p>

    <div class="settings-section">
      <div class="section-header">
        <span class="section-title">当前身份</span>
      </div>
      <div class="card">
        <p class="text-secondary font-sm mb-12">选择你当前使用的成员身份，影响上传内容、记账等操作</p>
        <div class="member-list">
          ${members.map(m => `
            <label class="member-card" style="cursor: pointer; ${currentMemberId === m.id ? 'border: 2px solid var(--primary);' : ''}">
              <input type="radio" name="currentMember" value="${m.id}" ${currentMemberId === m.id ? 'checked' : ''} style="display: none;">
              <div class="member-card-avatar" style="background: ${Storage.getMemberColor(m.id)}; color: #fff;">
                ${m.avatar || m.name.charAt(0)}
              </div>
              <div class="member-card-info">
                <div class="member-card-name">${m.name}</div>
                <div class="member-card-role">${m.role || '家庭成员'}</div>
              </div>
              ${currentMemberId === m.id ? '<span class="tag tag-primary">当前</span>' : ''}
            </label>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <span class="section-title">家庭成员管理</span>
        <button class="btn btn-primary btn-sm" onclick="Settings.showAddMember()">+ 添加成员</button>
      </div>
      <div class="card">
        <div class="member-list">
          ${members.map(m => `
            <div class="member-card">
              <div class="member-card-avatar" style="background: ${Storage.getMemberColor(m.id)}; color: #fff;">
                ${m.avatar || m.name.charAt(0)}
              </div>
              <div class="member-card-info">
                <div class="member-card-name">${m.name}</div>
                <div class="member-card-role">${m.role || '家庭成员'}</div>
              </div>
              <div class="flex gap-8">
                <button class="btn btn-outline btn-sm" onclick="Settings.showEditMember('${m.id}')">编辑</button>
                ${members.length > 1 ? `<button class="btn btn-danger btn-sm" onclick="Settings.deleteMember('${m.id}')">删除</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <span class="section-title">应用设置</span>
      </div>
      <div class="card">
        <div class="form-group">
          <label class="form-label">应用名称</label>
          <input type="text" class="form-input" id="appNameInput" value="${App.utils.escapeHtml(settings.appName)}" placeholder="成长手册">
        </div>
        <div class="form-group">
          <label class="form-label">家庭名称</label>
          <input type="text" class="form-input" id="familyNameInput" value="${App.utils.escapeHtml(settings.familyName)}" placeholder="我的家">
        </div>
        <button class="btn btn-primary" onclick="Settings.saveAppSettings()">保存设置</button>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <span class="section-title">多设备同步</span>
      </div>
      <div class="sync-panel">
        <p class="text-secondary font-sm mb-12">在手机、平板、电脑之间同步家庭数据，让全家人共享同一份记录</p>

        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
          <div class="sync-status sync-status-online">
            <span>●</span> 本设备在线
          </div>
          <span style="font-size: 13px; color: var(--text-secondary);">${Storage.getDeviceName()}</span>
        </div>

        <div class="form-group">
          <label class="form-label">设备名称</label>
          <div class="flex gap-8">
            <input type="text" class="form-input" id="deviceNameInput" value="${Storage.getDeviceName()}" placeholder="给这台设备起个名字">
            <button class="btn btn-outline btn-sm" onclick="Settings.saveDeviceName()">保存</button>
          </div>
        </div>

        <div class="sync-actions">
          <button class="btn btn-primary" onclick="Settings.showSyncOut()">📤 生成同步码</button>
          <button class="btn btn-outline" onclick="Settings.showSyncIn()">📥 输入同步码</button>
          <button class="btn btn-outline" onclick="Settings.copySyncURL()">🔗 复制同步链接</button>
        </div>

        ${(() => {
          const devices = Storage.getSyncedDevices();
          if (devices.length === 0) return '';
          return `
            <div style="margin-top: 20px;">
              <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px;">已同步设备 (${devices.length})</div>
              <div class="sync-device-list">
                ${devices.map(d => `
                  <div class="sync-device-item">
                    <span class="sync-device-icon">${getDeviceIcon(d.name)}</span>
                    <span class="sync-device-name">${d.name}</span>
                    <span class="sync-device-time">${App.utils.formatDate(d.lastSync)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        })()}
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <span class="section-title">数据管理</span>
      </div>
      <div class="card">
        <p class="text-secondary font-sm mb-12">所有数据保存在本地浏览器中，可导出备份或导入恢复</p>
        <div class="flex gap-12" style="flex-wrap: wrap;">
          <button class="btn btn-outline" onclick="Settings.exportData()">📥 导出数据</button>
          <button class="btn btn-outline" onclick="Settings.importData()">📤 导入数据</button>
        </div>
        <hr style="border: none; border-top: 1px solid var(--border); margin: 16px 0;">
        <button class="btn btn-danger" onclick="Settings.clearData()">🗑️ 清空所有数据</button>
      </div>
    </div>

    <div class="card text-center">
      <div style="font-size: 14px; color: var(--text-secondary);">成长手册 v1.2.0</div>
      <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">记录家庭每一个美好瞬间 🌱</div>
      <div style="font-size: 11px; color: var(--text-light); margin-top: 8px;">设备: ${Storage.getDeviceName()}</div>
    </div>
  `;

  container.innerHTML = html;

  // 绑定当前成员选择
  container.querySelectorAll('input[name="currentMember"]').forEach(radio => {
    radio.addEventListener('change', () => {
      Storage.setCurrentMember(radio.value);
      App.updateCurrentUserDisplay();
      App.toast('已切换为 ' + Storage.getMemberName(radio.value), 'success');
      App.navigate('settings');
    });
  });
});

const Settings = (function () {
  const avatars = ['👨', '👩', '🧒', '👶', '👴', '👵', '🧑', '👨‍🦰', '👩‍🦰', '👦', '👧', '🧓'];
  const roles = ['家长', '子女', '爷爷', '奶奶', '外公', '外婆', '其他'];

  function showAddMember() {
    const body = `
      <div class="form-group">
        <label class="form-label">姓名 <span class="required">*</span></label>
        <input type="text" class="form-input" id="memberName" placeholder="例如：爸爸、妈妈、小明">
      </div>
      <div class="form-group">
        <label class="form-label">身份角色</label>
        <select class="form-select" id="memberRole">
          ${roles.map(r => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">头像</label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${avatars.map((a, i) => `
            <div class="avatar-option" data-avatar="${a}" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; border: 2px solid transparent; background: var(--bg-page); transition: all 0.2s;">${a}</div>
          `).join('')}
        </div>
      </div>
    `;

    App.showModal('添加家庭成员', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Settings.saveMember()">保存</button>`);

    let selectedAvatar = avatars[0];
    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(o => o.style.borderColor = 'transparent');
        opt.style.borderColor = 'var(--primary)';
        selectedAvatar = opt.dataset.avatar;
      });
    });
    document.querySelector('.avatar-option').style.borderColor = 'var(--primary)';

    document.getElementById('memberName').focus();
    document.getElementById('memberName').dataset.selectedAvatar = '';
    document.querySelector('.avatar-option').click();
  }

  function showEditMember(id) {
    const m = Storage.getMemberById(id);
    if (!m) return;

    const body = `
      <div class="form-group">
        <label class="form-label">姓名 <span class="required">*</span></label>
        <input type="text" class="form-input" id="memberName" value="${App.utils.escapeHtml(m.name)}">
      </div>
      <div class="form-group">
        <label class="form-label">身份角色</label>
        <select class="form-select" id="memberRole">
          ${roles.map(r => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">头像</label>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${avatars.map(a => `
            <div class="avatar-option" data-avatar="${a}" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; cursor: pointer; border: 2px solid ${m.avatar === a ? 'var(--primary)' : 'transparent'}; background: var(--bg-page); transition: all 0.2s;">${a}</div>
          `).join('')}
        </div>
      </div>
    `;

    App.showModal('编辑成员', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Settings.saveMember('${id}')">保存</button>`);

    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(o => o.style.borderColor = 'transparent');
        opt.style.borderColor = 'var(--primary)';
      });
    });
  }

  function saveMember(id) {
    const name = document.getElementById('memberName').value.trim();
    const role = document.getElementById('memberRole').value;
    const selectedAvatar = document.querySelector('.avatar-option[style*="border-color"]') || document.querySelector('.avatar-option[style*="var(--primary)"]');
    const avatar = selectedAvatar ? selectedAvatar.dataset.avatar : avatars[0];

    if (!name) {
      App.toast('请输入成员姓名', 'error');
      return;
    }

    if (id) {
      Storage.updateMember(id, { name, role, avatar });
      App.toast('成员已更新', 'success');
    } else {
      Storage.addMember({ name, role, avatar });
      App.toast('成员已添加', 'success');
    }

    App.closeModal();
    App.updateCurrentUserDisplay();
    App.navigate('settings');
  }

  function deleteMember(id) {
    const member = Storage.getMemberById(id);
    App.confirmDialog(`确定删除成员「${member.name}」吗？该成员相关数据不会被删除，但将无法关联到成员。`, () => {
      Storage.deleteMember(id);
      App.toast('成员已删除', 'success');
      App.updateCurrentUserDisplay();
      App.navigate('settings');
    });
  }

  function saveAppSettings() {
    const appName = document.getElementById('appNameInput').value.trim() || '成长手册';
    const familyName = document.getElementById('familyNameInput').value.trim() || '我的家';
    Storage.saveSettings({ appName, familyName });
    document.title = appName;
    App.toast('设置已保存', 'success');
  }

  function exportData() {
    const data = Storage.exportData();
    App.utils.downloadFile(data, `growth_manual_backup_${new Date().toISOString().slice(0, 10)}.json`);
    App.toast('数据已导出', 'success');
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        if (Storage.importData(ev.target.result)) {
          App.toast('数据导入成功', 'success');
          App.updateCurrentUserDisplay();
          App.navigate('settings');
        } else {
          App.toast('数据导入失败', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearData() {
    App.confirmDialog('确定清空所有数据吗？此操作不可恢复！', () => {
      Storage.clearAll();
      Storage.initDefaultData();
      App.toast('所有数据已清空', 'success');
      App.updateCurrentUserDisplay();
      App.navigate('settings');
    });
  }

  function saveDeviceName() {
    const name = document.getElementById('deviceNameInput').value.trim();
    if (!name) {
      App.toast('请输入设备名称', 'error');
      return;
    }
    Storage.setDeviceName(name);
    App.toast('设备名称已保存', 'success');
    App.navigate('settings');
  }

  function showSyncOut() {
    const code = Storage.generateSyncCode();
    Storage.recordSync();

    const body = `
      <p class="text-secondary font-sm mb-12">将以下同步码分享给其他设备，在另一台设备的「设置 → 多设备同步 → 输入同步码」中粘贴即可</p>
      <div class="sync-code-display" onclick="Settings.copySyncCode('${code}')" title="点击复制">
        ${code.substring(0, 32)}...
      </div>
      <p style="font-size: 12px; color: var(--text-light); text-align: center;">点击同步码可复制完整内容</p>
      <div class="flex gap-8 mt-12" style="justify-content: center;">
        <button class="btn btn-primary btn-sm" onclick="Settings.copySyncCode('${code}')">📋 复制同步码</button>
      </div>
    `;

    App.showModal('📤 生成同步码', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">关闭</button>`);
  }

  function showSyncIn() {
    const body = `
      <p class="text-secondary font-sm mb-12">粘贴从其他设备获取的同步码，即可导入数据到本设备</p>
      <div class="form-group">
        <label class="form-label">同步码</label>
        <textarea class="form-textarea" id="syncCodeInput" placeholder="在此粘贴同步码..." rows="4" style="font-family: 'Courier New', monospace; font-size: 12px;"></textarea>
      </div>
      <div class="warm-tip" style="margin-top: 12px;">
        <div class="warm-tip-icon">⚠️</div>
        <div class="warm-tip-text">导入将<strong>覆盖</strong>本设备当前数据，请确认后再操作</div>
      </div>
    `;

    App.showModal('📥 输入同步码', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Settings.doSyncIn()">同步</button>`);
  }

  function doSyncIn() {
    const code = document.getElementById('syncCodeInput').value.trim();
    if (!code) {
      App.toast('请输入同步码', 'error');
      return;
    }

    App.confirmDialog('导入数据将覆盖本设备当前数据，确定继续吗？', () => {
      if (Storage.importFromSyncCode(code)) {
        Storage.recordSync();
        App.closeModal();
        App.toast('同步成功！数据已更新', 'success');
        App.updateCurrentUserDisplay();
        setTimeout(() => App.navigate('dashboard'), 500);
      } else {
        App.toast('同步码无效，请检查后重试', 'error');
      }
    });
  }

  function copySyncCode(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        App.toast('同步码已复制', 'success');
      }).catch(() => fallbackCopy(code));
    } else {
      fallbackCopy(code);
    }
  }

  function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      App.toast('同步码已复制', 'success');
    } catch (e) {
      App.toast('复制失败，请手动选择复制', 'error');
    }
    document.body.removeChild(ta);
  }

  function copySyncURL() {
    const url = Storage.generateSyncURL();
    Storage.recordSync();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        App.toast('同步链接已复制，分享给家人打开即可同步', 'success');
      }).catch(() => fallbackCopy(url));
    } else {
      fallbackCopy(url);
    }
  }

  return { showAddMember, showEditMember, saveMember, deleteMember, saveAppSettings, exportData, importData, clearData, saveDeviceName, showSyncOut, showSyncIn, doSyncIn, copySyncCode, copySyncURL };
})();

function getDeviceIcon(name) {
  if (/iPhone|安卓|手机/i.test(name)) return '📱';
  if (/iPad|平板/i.test(name)) return '📋';
  if (/Mac|Windows|电脑|Linux/i.test(name)) return '💻';
  return '🖥️';
}
