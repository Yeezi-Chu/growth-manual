// ===== 家庭相册 =====
App.registerPage('album', function () {
  const container = document.getElementById('pageContainer');
  const items = Storage.getAll(Storage.KEYS.album);

  let html = `
    <h1 class="page-title">📸 家庭相册</h1>
    <p class="page-description">每个家庭成员都可以上传图片和视频，记录美好瞬间</p>

    <div class="album-upload-zone" id="uploadZone" onclick="Album.triggerUpload()">
      <div class="album-upload-icon">📁</div>
      <div class="album-upload-text">点击或拖拽文件到此处上传<br><span style="font-size: 12px;">支持图片 (JPG/PNG/GIF) 和视频 (MP4/WebM)</span></div>
      <input type="file" id="fileInput" accept="image/*,video/*" multiple style="display: none;">
    </div>

    <div class="section-header">
      <span class="section-title">全部 ${items.length} 项</span>
    </div>
  `;

  if (items.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">🖼️</div>
        <div class="empty-state-text">相册还是空的</div>
        <div class="empty-state-hint">上传第一张家庭照片吧！</div>
      </div>
    `;
  } else {
    html += '<div class="album-grid">';
    items.forEach(item => {
      if (item.type === 'video') {
        html += `
          <div class="album-item" onclick="Album.previewVideo('${item.id}')">
            <video src="${item.data}" preload="metadata"></video>
            <div class="album-item-overlay">
              <div class="album-item-uploader">📹 ${Storage.getMemberName(item.memberId)}</div>
              <div class="album-item-date">${App.utils.formatDate(item.createdAt)}</div>
            </div>
          </div>
        `;
      } else {
        html += `
          <div class="album-item" onclick="App.showImage('${item.data}')">
            <img src="${item.data}" alt="${App.utils.escapeHtml(item.title || '')}">
            <div class="album-item-overlay">
              <div class="album-item-uploader">📷 ${Storage.getMemberName(item.memberId)}</div>
              <div class="album-item-date">${App.utils.formatDate(item.createdAt)}</div>
            </div>
          </div>
        `;
      }
    });
    html += '</div>';

    html += `
      <div class="mt-16 text-center">
        <button class="btn btn-outline btn-sm" onclick="Album.clearAll()">清空相册</button>
      </div>
    `;
  }

  container.innerHTML = html;

  // 绑定上传
  const fileInput = document.getElementById('fileInput');
  fileInput.addEventListener('change', e => Album.handleFiles(e.target.files));

  const uploadZone = document.getElementById('uploadZone');
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    Album.handleFiles(e.dataTransfer.files);
  });
});

const Album = (function () {
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

  function triggerUpload() {
    document.getElementById('fileInput').click();
  }

  function handleFiles(files) {
    const member = App.utils.requireMember();
    if (!member) return;

    if (!files || files.length === 0) return;

    let processed = 0;
    let failed = 0;

    Array.from(files).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');

      if (!isImage && !isVideo) {
        App.toast('不支持的文件类型: ' + file.name, 'error');
        failed++;
        return;
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        App.toast('图片不能超过10MB: ' + file.name, 'error');
        failed++;
        return;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        App.toast('视频不能超过50MB: ' + file.name, 'error');
        failed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = function (e) {
        // 图片压缩
        if (isImage) {
          compressImage(e.target.result, 1200, 0.85, function (compressed) {
            Storage.addItem(Storage.KEYS.album, {
              type: 'image',
              data: compressed,
              title: file.name,
              memberId: member.id,
              fileName: file.name
            });
            processed++;
            checkDone();
          });
        } else {
          Storage.addItem(Storage.KEYS.album, {
            type: 'video',
            data: e.target.result,
            title: file.name,
            memberId: member.id,
            fileName: file.name
          });
          processed++;
          checkDone();
        }
      };
      reader.onerror = function () {
        failed++;
        checkDone();
      };
      reader.readAsDataURL(file);
    });

    function checkDone() {
      if (processed + failed === files.length) {
        if (processed > 0) App.toast(`成功上传 ${processed} 个文件`, 'success');
        if (failed > 0) App.toast(`${failed} 个文件上传失败`, 'error');
        App.navigate('album');
      }
    }
  }

  function compressImage(dataUrl, maxSize, quality, callback) {
    const img = new Image();
    img.onload = function () {
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = function () { callback(dataUrl); };
    img.src = dataUrl;
  }

  function previewVideo(id) {
    const items = Storage.getAll(Storage.KEYS.album);
    const item = items.find(i => i.id === id);
    if (!item) return;

    App.showModal('视频预览',
      `<video src="${item.data}" controls style="width: 100%; border-radius: 8px;"></video>
       <div class="mt-12 text-secondary font-sm">上传者: ${Storage.getMemberName(item.memberId)} · ${App.utils.formatDateTime(item.createdAt)}</div>`,
      `<button class="btn btn-danger btn-sm" onclick="Album.deleteItem('${id}')">删除</button>
       <button class="btn btn-outline" onclick="App.closeModal()">关闭</button>`);
  }

  function deleteItem(id) {
    App.confirmDialog('确定删除这个文件吗？', () => {
      Storage.deleteItem(Storage.KEYS.album, id);
      App.closeModal();
      App.toast('已删除', 'success');
      App.navigate('album');
    });
  }

  function clearAll() {
    App.confirmDialog('确定清空整个相册吗？此操作不可恢复！', () => {
      Storage.saveAll(Storage.KEYS.album, []);
      App.toast('相册已清空', 'success');
      App.navigate('album');
    });
  }

  return { triggerUpload, handleFiles, compressImage, previewVideo, deleteItem, clearAll };
})();
