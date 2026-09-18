// ===== 成长手册 - Firebase 实时同步模块 =====
const FirebaseSync = (function () {
  const CONFIG_KEY = 'growth_manual_firebase_config';
  const FAMILY_KEY = 'growth_manual_firebase_family';
  const ENABLED_KEY = 'growth_manual_firebase_enabled';

  let app = null;
  let db = null;
  let connected = false;
  let initialized = false;
  let familyKey = 'default';
  let isUpdatingFromRemote = false;
  let pendingPush = new Map();
  let statusCallback = null;
  let devicesCallback = null;

  function getConfig() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    } catch (e) {
      return null;
    }
  }

  function saveConfig(config) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }

  function getFamilyKey() {
    return localStorage.getItem(FAMILY_KEY) || 'default';
  }

  function saveFamilyKey(key) {
    localStorage.setItem(FAMILY_KEY, key);
    familyKey = key;
  }

  function isEnabled() {
    return localStorage.getItem(ENABLED_KEY) === 'true';
  }

  function setEnabled(enabled) {
    localStorage.setItem(ENABLED_KEY, enabled ? 'true' : 'false');
  }

  function init(config, fKey) {
    if (initialized) disconnect();
    try {
      if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return false;
      }

      app = firebase.initializeApp(config, 'growth-manual-sync');
      db = firebase.database(app);
      if (fKey) familyKey = fKey;
      initialized = true;

      // Connection status
      db.ref('.info/connected').on('value', snap => {
        const wasConnected = connected;
        connected = snap.val() === true;
        if (connected) {
          recordPresence();
          flushPending();
        }
        if (statusCallback) statusCallback(connected);
      });

      // Listen for data changes on all keys
      Object.entries(Storage.KEYS).forEach(([name, storageKey]) => {
        db.ref(`${familyKey}/${name}`).on('value', snap => {
          if (isUpdatingFromRemote) return;

          const remoteData = snap.val();

          if (remoteData === null) {
            // Firebase is empty, push local data
            const localStr = localStorage.getItem(storageKey);
            if (localStr && localStr !== 'null') {
              const localData = JSON.parse(localStr);
              db.ref(`${familyKey}/${name}`).set(localData);
            }
            return;
          }

          // Compare with local
          const localStr = localStorage.getItem(storageKey);
          const remoteStr = JSON.stringify(remoteData);

          if (localStr === remoteStr) return;

          // Update local with remote data
          isUpdatingFromRemote = true;
          localStorage.setItem(storageKey, remoteStr);
          if (typeof App !== 'undefined' && App.currentPage) {
            App.navigate(App.currentPage);
          }
          isUpdatingFromRemote = false;
        });
      });

      // Listen for presence (online devices)
      db.ref(`${familyKey}/presence`).on('value', snap => {
        const data = snap.val() || {};
        const devices = Object.entries(data).map(([id, info]) => ({ id, ...info }));
        if (devicesCallback) devicesCallback(devices);
      });

      return true;
    } catch (e) {
      console.error('Firebase init error:', e);
      initialized = false;
      return false;
    }
  }

  function onLocalChange(storageKey, data) {
    if (isUpdatingFromRemote) return;
    if (!initialized || !db) return;

    let name = null;
    for (const [n, k] of Object.entries(Storage.KEYS)) {
      if (k === storageKey) { name = n; break; }
    }
    if (!name) return;

    if (!connected) {
      pendingPush.set(storageKey, data);
      return;
    }

    db.ref(`${familyKey}/${name}`).set(data);
  }

  function flushPending() {
    pendingPush.forEach((data, key) => {
      onLocalChange(key, data);
    });
    pendingPush.clear();
  }

  function recordPresence() {
    if (!initialized || !db) return;
    const deviceId = Storage.getDeviceId();
    const deviceName = Storage.getDeviceName();
    const ref = db.ref(`${familyKey}/presence/${deviceId}`);
    ref.set({
      name: deviceName,
      lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
    ref.onDisconnect().remove();
  }

  function onStatusChange(callback) {
    statusCallback = callback;
  }

  function onDevicesChange(callback) {
    devicesCallback = callback;
  }

  function isConnected() {
    return connected;
  }

  function isInitialized() {
    return initialized;
  }

  function disconnect() {
    if (!initialized) return;
    try {
      Object.entries(Storage.KEYS).forEach(([name]) => {
        if (db) db.ref(`${familyKey}/${name}`).off();
      });
      if (db) {
        db.ref(`${familyKey}/presence`).off();
        db.ref('.info/connected').off();
      }
    } catch (e) {}
    db = null;
    app = null;
    initialized = false;
    connected = false;
  }

  function getOnlineDevices() {
    return new Promise((resolve) => {
      if (!initialized || !db) { resolve([]); return; }
      db.ref(`${familyKey}/presence`).once('value', snap => {
        const data = snap.val() || {};
        resolve(Object.entries(data).map(([id, info]) => ({ id, ...info })));
      });
    });
  }

  function autoInit() {
    if (!isEnabled()) return false;
    const config = getConfig();
    if (!config || !config.apiKey || !config.databaseURL) return false;
    return init(config, getFamilyKey());
  }

  return {
    init, autoInit, disconnect,
    onLocalChange, onStatusChange, onDevicesChange,
    isConnected, isInitialized, getOnlineDevices,
    getConfig, saveConfig, getFamilyKey, saveFamilyKey,
    isEnabled, setEnabled
  };
})();
