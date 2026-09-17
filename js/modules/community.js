// ===== 情绪社区 =====
App.registerPage('community', function () {
  const container = document.getElementById('pageContainer');
  const posts = Storage.getAll(Storage.KEYS.community);

  const moods = {
    happy: { label: '开心', emoji: '😊', color: '#FFF4E0' },
    grateful: { label: '感恩', emoji: '🙏', color: '#E0F5F2' },
    sad: { label: '难过', emoji: '😢', color: '#E8EAF6' },
    angry: { label: '生气', emoji: '😤', color: '#FDEAEA' },
    sorry: { label: '道歉', emoji: '🤐', color: '#FFF3E0' },
    excited: { label: '兴奋', emoji: '🤩', color: '#F3E5F5' },
    love: { label: '爱意', emoji: '❤️', color: '#FCE4EC' },
    thoughtful: { label: '感慨', emoji: '🤔', color: '#ECEFF1' }
  };

  let html = `
    <h1 class="page-title">💬 情绪社区</h1>
    <p class="page-description">抒发情感、表达感谢、向家人道歉，让沟通更温暖</p>

    <div class="section-header">
      <span class="section-title">家庭动态 (${posts.length})</span>
      <button class="btn btn-primary btn-sm" onclick="Community.showAdd()">+ 发布动态</button>
    </div>
  `;

  if (posts.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-state-icon">💬</div>
        <div class="empty-state-text">还没有人发布动态</div>
        <div class="empty-state-hint">分享你的心情，或者对家人说点什么吧</div>
      </div>
    `;
  } else {
    posts.forEach(post => {
      const mood = moods[post.mood] || moods.thoughtful;
      const member = Storage.getMemberById(post.memberId);
      const memberColor = Storage.getMemberColor(post.memberId);
      const memberAvatar = Storage.getMemberAvatar(post.memberId);
      const likes = post.likes || [];
      const comments = post.comments || [];

      html += `
        <div class="community-post" id="post_${post.id}">
          <div class="community-post-header">
            <div class="community-post-avatar" style="background: ${memberColor}; color: #fff;">
              ${memberAvatar}
            </div>
            <div style="flex: 1;">
              <div class="community-post-author">${member ? member.name : '未知'} ${member && member.role ? `· ${member.role}` : ''}</div>
              <div class="community-post-time">${App.utils.formatDateTime(post.createdAt)}</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="Community.deletePost('${post.id}')">删除</button>
          </div>
          <div class="community-post-mood" style="background: ${mood.color};">
            ${mood.emoji} ${mood.label}
          </div>
          <div class="community-post-content">${App.utils.escapeHtml(post.content)}</div>
          ${post.toMember ? `<div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;">@${Storage.getMemberName(post.toMember)}</div>` : ''}
          <div class="community-actions">
            <button class="community-action-btn ${likes.includes(App.utils.getCurrentMemberId()) ? 'liked' : ''}" onclick="Community.toggleLike('${post.id}')">
              👍 ${likes.length > 0 ? likes.length : '点赞'}
            </button>
            <button class="community-action-btn" onclick="Community.toggleComment('${post.id}')">
              💬 ${comments.length > 0 ? comments.length : '评论'}
            </button>
          </div>
          <div class="comments-section" id="comments_${post.id}" style="display: none;">
            ${comments.map(c => `
              <div class="community-comment">
                <span class="community-comment-author">${Storage.getMemberName(c.memberId)}:</span>
                <span class="community-comment-text">${App.utils.escapeHtml(c.text)}</span>
              </div>
            `).join('')}
            <div class="community-comment-input">
              <input type="text" placeholder="写评论..." id="commentInput_${post.id}" onkeypress="Community.onCommentKeypress(event, '${post.id}')">
              <button class="btn btn-primary btn-sm" onclick="Community.addComment('${post.id}')">发送</button>
            </div>
          </div>
        </div>
      `;
    });
  }

  container.innerHTML = html;
});

const Community = (function () {
  const moods = [
    { value: 'happy', label: '开心', emoji: '😊' },
    { value: 'grateful', label: '感恩', emoji: '🙏' },
    { value: 'sad', label: '难过', emoji: '😢' },
    { value: 'angry', label: '生气', emoji: '😤' },
    { value: 'sorry', label: '道歉', emoji: '🤐' },
    { value: 'excited', label: '兴奋', emoji: '🤩' },
    { value: 'love', label: '爱意', emoji: '❤️' },
    { value: 'thoughtful', label: '感慨', emoji: '🤔' }
  ];

  function showAdd() {
    const member = App.utils.requireMember();
    if (!member) return;

    const members = Storage.getMembers().filter(m => m.id !== member.id);

    const body = `
      <div class="form-group">
        <label class="form-label">心情</label>
        <div style="display: flex; gap: 6px; flex-wrap: wrap;">
          ${moods.map((m, i) => `
            <div class="mood-option" data-mood="${m.value}" style="padding: 8px 12px; border: 2px solid ${i === 0 ? 'var(--primary)' : 'var(--border)'}; border-radius: 20px; cursor: pointer; font-size: 14px; transition: all 0.2s; background: ${i === 0 ? 'var(--primary-light)' : 'transparent'};">
              ${m.emoji} ${m.label}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">内容 <span class="required">*</span></label>
        <textarea class="form-textarea" id="postContent" placeholder="说点什么吧...表达感谢、分享心情、或者向家人道歉" maxlength="500"></textarea>
      </div>
      ${members.length > 0 ? `
        <div class="form-group">
          <label class="form-label">@特定成员（可选）</label>
          <select class="form-select" id="toMember">
            <option value="">不指定</option>
            ${members.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}
          </select>
        </div>
      ` : ''}
      <div class="form-group">
        <label class="form-label">发布者</label>
        <div style="font-size: 14px; color: var(--text-secondary);">${member.name} (当前身份)</div>
      </div>
    `;

    App.showModal('发布动态', body,
      `<button class="btn btn-outline" onclick="App.closeModal()">取消</button>
       <button class="btn btn-primary" onclick="Community.save()">发布</button>`);

    let selectedMood = moods[0].value;
    document.querySelectorAll('.mood-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.mood-option').forEach(o => {
          o.style.borderColor = 'var(--border)';
          o.style.background = 'transparent';
        });
        opt.style.borderColor = 'var(--primary)';
        opt.style.background = 'var(--primary-light)';
        selectedMood = opt.dataset.mood;
      });
    });

    document.getElementById('postContent').focus();
  }

  function save() {
    const member = App.utils.getCurrentMember();
    if (!member) { App.toast('请先选择当前成员', 'error'); return; }

    const content = document.getElementById('postContent').value.trim();
    const toMember = document.getElementById('toMember') ? document.getElementById('toMember').value : '';
    const moodEl = document.querySelector('.mood-option[style*="var(--primary)"]') || document.querySelector('.mood-option[style*="var(--primary-light)"]');
    const mood = moodEl ? moodEl.dataset.mood : 'thoughtful';

    if (!content) {
      App.toast('请输入内容', 'error');
      return;
    }

    Storage.addItem(Storage.KEYS.community, {
      content, mood, toMember: toMember || null,
      memberId: member.id,
      likes: [], comments: []
    });

    App.closeModal();
    App.toast('动态已发布', 'success');
    App.navigate('community');
  }

  function toggleLike(postId) {
    const member = App.utils.requireMember();
    if (!member) return;

    const posts = Storage.getAll(Storage.KEYS.community);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.likes) post.likes = [];
    const idx = post.likes.indexOf(member.id);
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(member.id);
    }

    Storage.updateItem(Storage.KEYS.community, postId, { likes: post.likes });
    App.navigate('community');
  }

  function toggleComment(postId) {
    const section = document.getElementById('comments_' + postId);
    if (section) {
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
      if (section.style.display === 'block') {
        const input = document.getElementById('commentInput_' + postId);
        if (input) input.focus();
      }
    }
  }

  function addComment(postId) {
    const member = App.utils.requireMember();
    if (!member) return;

    const input = document.getElementById('commentInput_' + postId);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const posts = Storage.getAll(Storage.KEYS.community);
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (!post.comments) post.comments = [];
    post.comments.push({ memberId: member.id, text, createdAt: new Date().toISOString() });

    Storage.updateItem(Storage.KEYS.community, postId, { comments: post.comments });
    App.navigate('community');

    setTimeout(() => {
      toggleComment(postId);
    }, 50);
  }

  function onCommentKeypress(e, postId) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addComment(postId);
    }
  }

  function deletePost(id) {
    App.confirmDialog('确定删除这条动态吗？', () => {
      Storage.deleteItem(Storage.KEYS.community, id);
      App.toast('已删除', 'success');
      App.navigate('community');
    });
  }

  return { showAdd, save, toggleLike, toggleComment, addComment, onCommentKeypress, deletePost };
})();
