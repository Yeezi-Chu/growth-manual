// ===== 成长手册 - 数据存储层 =====
const Storage = (function () {
  const PREFIX = 'growth_manual_';
  const KEYS = {
    members: PREFIX + 'members',
    currentMember: PREFIX + 'current_member',
    album: PREFIX + 'album',
    bills: PREFIX + 'bills',
    finance: PREFIX + 'finance',
    chores: PREFIX + 'chores',
    diplomacy: PREFIX + 'diplomacy',
    community: PREFIX + 'community',
    memos: PREFIX + 'memos',
    settings: PREFIX + 'settings'
  };

  function get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // 成员管理
  function getMembers() {
    return get(KEYS.members) || [];
  }

  function saveMembers(members) {
    return set(KEYS.members, members);
  }

  function getCurrentMember() {
    return get(KEYS.currentMember) || null;
  }

  function setCurrentMember(memberId) {
    return set(KEYS.currentMember, memberId);
  }

  function addMember(member) {
    const members = getMembers();
    member.id = 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    member.createdAt = new Date().toISOString();
    members.push(member);
    saveMembers(members);
    return member;
  }

  function updateMember(id, updates) {
    const members = getMembers();
    const idx = members.findIndex(m => m.id === id);
    if (idx >= 0) {
      members[idx] = { ...members[idx], ...updates };
      saveMembers(members);
      return members[idx];
    }
    return null;
  }

  function deleteMember(id) {
    let members = getMembers();
    members = members.filter(m => m.id !== id);
    saveMembers(members);
    if (getCurrentMember() === id) {
      setCurrentMember(members.length > 0 ? members[0].id : null);
    }
    return true;
  }

  function getMemberById(id) {
    return getMembers().find(m => m.id === id) || null;
  }

  function getMemberName(id) {
    const m = getMemberById(id);
    return m ? m.name : '未知';
  }

  function getMemberAvatar(id) {
    const m = getMemberById(id);
    if (!m) return '?';
    return m.avatar || m.name.charAt(0);
  }

  function getMemberColor(id) {
    const colors = ['#2D9B8B', '#F5A623', '#3498DB', '#9B59B6', '#E74C3C', '#1ABC9C', '#F39C12'];
    const members = getMembers();
    const idx = members.findIndex(m => m.id === id);
    return colors[idx % colors.length] || '#2D9B8B';
  }

  // 通用 CRUD
  function getAll(key) {
    return get(key) || [];
  }

  function saveAll(key, data) {
    return set(key, data);
  }

  function addItem(key, item) {
    const items = getAll(key);
    item.id = 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    item.createdAt = new Date().toISOString();
    items.unshift(item);
    saveAll(key, items);
    return item;
  }

  function updateItem(key, id, updates) {
    const items = getAll(key);
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...updates };
      saveAll(key, items);
      return items[idx];
    }
    return null;
  }

  function deleteItem(key, id) {
    let items = getAll(key);
    items = items.filter(i => i.id !== id);
    saveAll(key, items);
    return true;
  }

  // 设置
  function getSettings() {
    return get(KEYS.settings) || { appName: '成长手册', familyName: '我的家' };
  }

  function saveSettings(settings) {
    return set(KEYS.settings, settings);
  }

  // 初始化默认数据
  function initDefaultData() {
    if (getMembers().length === 0) {
      const defaultMembers = [
        { id: 'm_default_1', name: '爸爸', role: '家长', avatar: '👨', color: '#2D9B8B', createdAt: new Date().toISOString() },
        { id: 'm_default_2', name: '妈妈', role: '家长', avatar: '👩', color: '#F5A623', createdAt: new Date().toISOString() },
        { id: 'm_default_3', name: '孩子', role: '子女', avatar: '🧒', color: '#3498DB', createdAt: new Date().toISOString() }
      ];
      saveMembers(defaultMembers);
      setCurrentMember('m_default_1');
    }

    if (!getSettings()) {
      saveSettings({ appName: '成长手册', familyName: '我的家' });
    }
  }

  // 数据导出/导入
  function exportData() {
    const data = {};
    Object.keys(KEYS).forEach(k => {
      data[k] = get(KEYS[k]);
    });
    return JSON.stringify(data, null, 2);
  }

  function importData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      Object.keys(KEYS).forEach(k => {
        if (data[k] !== undefined) {
          set(KEYS[k], data[k]);
        }
      });
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  function clearAll() {
    Object.keys(KEYS).forEach(k => remove(KEYS[k]));
  }

  return {
    KEYS,
    get, set, remove,
    getMembers, saveMembers, addMember, updateMember, deleteMember,
    getMemberById, getMemberName, getMemberAvatar, getMemberColor,
    getCurrentMember, setCurrentMember,
    getAll, saveAll, addItem, updateItem, deleteItem,
    getSettings, saveSettings,
    initDefaultData,
    exportData, importData, clearAll
  };
})();
