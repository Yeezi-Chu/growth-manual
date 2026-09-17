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
      <div style="font-size: 14px; color: var(--text-secondary);">成长手册 v1.0.0</div>
      <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">记录家庭每一个美好瞬间 🌱</div>
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

  return { showAddMember, showEditMember, saveMember, deleteMember, saveAppSettings, exportData, importData, clearData };
})();
