'use strict';

// Existing content and destinations remain the source of truth for every preview.
(() => {
  const $ = selector => document.querySelector(selector);
  const socialIcons = {
    X: 'assets/social-x.svg', note: 'assets/social-note.svg', YouTube: 'assets/social-youtube.svg',
    Instagram: 'assets/social-instagram.svg', LINE: 'assets/social-line.svg', SUZURI: 'assets/social-suzuri.png'
  };
  document.querySelectorAll('.social-links a').forEach(link => {
    const src = socialIcons[link.querySelector('b')?.textContent];
    if (!src) return;
    const img = document.createElement('img'); img.src = src; img.alt = ''; img.className = 'social-icon';
    img.width = 24; img.height = 24; link.prepend(img);
  });
  const icons = {
    star: 'assets/icon-star-color.png',
    key: 'assets/icon-key-color.png',
    art: 'assets/icon-art-color.png',
    book: 'assets/icon-book-color.png',
    clock: 'assets/icon-clock-color.png',
    phone: 'assets/icon-phone-color.png',
    save: 'assets/icon-save-color.png'
  };
  const icon = name => `<img class="action-icon" src="${icons[name] || icons.star}" alt="" aria-hidden="true" width="28" height="28">`;
  function dialog(id, title, body) {
    const el = document.createElement('dialog');
    el.id = id;
    el.className = 'try-dialog';
    el.setAttribute('aria-labelledby', `${id}-title`);
    el.innerHTML = `<div class="try-heading"><h2 id="${id}-title">${title}</h2><button class="try-close" type="button" aria-label="${title}を閉じる">×</button></div>${body}`;
    document.body.append(el);
    let opener;
    el.querySelector('.try-close').addEventListener('click', () => el.close());
    el.addEventListener('click', e => {
      if (e.target !== el) return;
      const r = el.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) el.close();
    });
    el.addEventListener('close', () => opener?.focus({preventScroll: true}));
    return {el, open(button) { opener = button; el.showModal(); }};
  }
  function addTryButton(parent, text, kind, action) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'try-link';
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = `${icon(kind)}<span>${text}</span>`;
    b.addEventListener('click', () => action(b)); parent.append(b); return b;
  }


  // Genre explanations follow the existing dynamically refreshed filter buttons.
  const genreInfo = {
    '没入型アート・イベント': ['art', '光や音、空間に包まれる体験'],
    'ARG': ['key', '手がかりをたどって物語に参加'],
    '謎解き': ['book', 'ひらめきで謎を解く体験']
  };
  function decorateFilters() {
    $('.filter-list').querySelectorAll('button[data-filter]').forEach(b => {
      if (b.querySelector('.genre-label')) return;
      const name = b.dataset.filter;
      const entry = genreInfo[name];
      if (!entry) return;
      b.innerHTML = `${icon(entry[0])}<span><span class="genre-label">${escapeHTML(name)}</span><small>${entry[1]}</small></span>`;
    });
  }
  decorateFilters();
  new MutationObserver(decorateFilters).observe($('.filter-list'), {childList:true});
  document.querySelectorAll('.work-meta li').forEach(li => {
    const kind = /分|日/.test(li.textContent) ? 'clock' : /スマホ|PC/.test(li.textContent) ? 'phone' : 'star';
    li.insertAdjacentHTML('afterbegin', icon(kind));
  });


  // Wallpaper selection changes a phone mockup; original files and downloads stay intact.
  const wallpaper = $('#wallpaper-dialog');
  const preview = document.createElement('div');
  preview.className = 'wallpaper-preview';
  preview.innerHTML = '<div class="preview-phone" aria-label="壁紙を設定したスマホ画面の見本"><img src="assets/wallpaper-moon.jpg" alt="光る花と月を設定した画面"><div class="phone-clock" aria-hidden="true"><small>うまさんと、小さな旅へ。</small><strong>9:41</strong></div><span class="phone-home" aria-hidden="true"></span></div><div class="preview-copy"><span class="try-eyebrow">YOUR FAVORITE VIEW</span><h3>スマホを開くのが、楽しみに。</h3><p>下の壁紙を選ぶと、画面の見本が切り替わります。</p><p class="wallpaper-selection" aria-live="polite">光る花と月</p><small>時計や端末の枠は見本です。<br>保存される画像には含まれません。</small></div>';
  wallpaper.querySelector('.wallpaper-choices').before(preview);
  wallpaper.querySelectorAll('.wallpaper-choices article').forEach((card, index) => {
    const img = card.querySelector('img');
    const title = card.querySelector('h3').textContent;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'wallpaper-pick';
    b.setAttribute('aria-label', `${title}を画面で見る`);
    b.setAttribute('aria-pressed', String(index === 0));
    img.before(b); b.append(img);
    b.insertAdjacentHTML('beforeend', '<span>画面で見る</span>');
    b.addEventListener('click', () => {
      wallpaper.querySelectorAll('.wallpaper-pick').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      const p = preview.querySelector('img'); p.src = img.getAttribute('src'); p.alt = `${title}を設定した画面`;
      preview.querySelector('.wallpaper-selection').textContent = title;
      preview.classList.remove('preview-changed');
      requestAnimationFrame(() => preview.classList.add('preview-changed'));
    });
    card.querySelector('a[download]').insertAdjacentHTML('afterbegin', icon('save'));
  });


  // Optional discovery: choose from the current article data, without claiming events are open.
  const adventure = dialog('adventure-try', '次の冒険を、ひとつ。', '<p class="try-note">過去の体験記録から、うまさんが1件選びます。開催状況は記事や主催者の案内をご確認ください。</p><div class="adventure-result" aria-live="polite"></div><div class="adventure-actions"><a class="button primary adventure-read" target="_blank" rel="noopener noreferrer">この体験レポートを読む </a><button class="try-link adventure-again" type="button">別の体験記録を選ぶ </button></div>');
  let lastArticle = null;
  function chooseAdventure() {
    const pool = experiences.filter(x => x.url !== lastArticle);
    const item = pool[Math.floor(Math.random() * pool.length)] || experiences[0];
    if (!item) { adventure.el.querySelector('.adventure-result').textContent = '体験記録を準備しています。'; return; }
    lastArticle = item.url;
    adventure.el.querySelector('.adventure-result').innerHTML = `<img src="${escapeHTML(item.image)}" alt="" loading="lazy"><p class="try-eyebrow">${escapeHTML(item.genre)}</p><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.description || '')}</p>`;
    adventure.el.querySelector('.adventure-read').href = item.url;
  }
  adventure.el.querySelector('.adventure-again').addEventListener('click', chooseAdventure);
  const pick = document.createElement('div'); pick.className = 'note-invite';
  pick.innerHTML = '<img src="assets/playful-guide.webp" alt="" width="72" height="72" loading="lazy"><p>どれを読むか迷ったら、<br>うまさんにおまかせ。</p>';
  $('.travel-note').append(pick);
  addTryButton(pick, '次の冒険を選んでもらう', 'book', b => { chooseAdventure(); adventure.open(b); });

  // One shared sheet: fixed heading/actions, only the content scrolls.
  function sheet(el, title, close, content, actions) {
    el.classList.add('modal-sheet');
    const heading = document.createElement('header'); heading.className = 'modal-heading';
    heading.append(title, close);
    close.classList.add('modal-close'); close.textContent = '×';
    const body = document.createElement('div'); body.className = 'modal-content'; body.append(...content);
    const footer = document.createElement('footer'); footer.className = 'modal-actions'; footer.append(...actions);
    if (!actions.length) footer.hidden = true;
    el.replaceChildren(heading, body, footer);
  }
  const imageSheet = $('.image-dialog');
  const imageTitle = document.createElement('h2'); imageTitle.id = 'image-sheet-title'; imageTitle.textContent = '旅のアルバム';
  imageSheet.setAttribute('aria-labelledby', imageTitle.id);
  const enlarged = imageSheet.querySelector('img'), caption = imageSheet.querySelector('p'), imageSave = imageSheet.querySelector('a');
  imageSave.classList.add('primary');
  const stage = document.createElement('div'); stage.className = 'image-stage'; stage.append(enlarged);
  sheet(imageSheet, imageTitle, imageSheet.querySelector('button'), [stage], [caption, imageSave]);
  function fitImageSheet() {
    const ratio = enlarged.naturalWidth / enlarged.naturalHeight;
    if (ratio > 0) imageSheet.style.width = `min(94vw, ${Math.max(320, Math.min(920, innerHeight * .62 * ratio + 40))}px)`;
  }
  enlarged.addEventListener('load', fitImageSheet); window.addEventListener('resize', fitImageSheet);
  const videoSheet = $('.video-dialog');
  sheet(videoSheet, videoSheet.querySelector('h2'), videoSheet.querySelector('.video-close'), [videoSheet.querySelector('.video-player')], [videoSheet.querySelector('.video-destination'), videoSheet.querySelector('.video-fallback')]);
  sheet(adventure.el, adventure.el.querySelector('h2'), adventure.el.querySelector('.try-close'), [adventure.el.querySelector('.try-note'), adventure.el.querySelector('.adventure-result')], [adventure.el.querySelector('.adventure-actions')]);
  const selectedName = document.createElement('p'); selectedName.className = 'selected-wallpaper-name';
  const selectedSave = document.createElement('a'); selectedSave.className = 'button primary'; selectedSave.innerHTML = `${icon('save')}この壁紙を保存`;
  wallpaper.querySelectorAll('.wallpaper-choices article').forEach((card, index) => {
    const download = card.querySelector('a[download]');
    const href = download.getAttribute('href'), filename = download.download, title = card.querySelector('h3').textContent;
    function selectDownload(){selectedSave.href = href; selectedSave.download = filename; selectedName.textContent = title; selectedSave.setAttribute('aria-label', title + 'を保存');}
    card.querySelector('.wallpaper-pick').addEventListener('click', selectDownload);
    if(index === 0) selectDownload();
    download.remove();
  });
  sheet(wallpaper, wallpaper.querySelector('h2'), wallpaper.querySelector('.image-close'), [wallpaper.querySelector(':scope > p'), preview, wallpaper.querySelector('.wallpaper-choices'), wallpaper.querySelector('.wallpaper-more')], [selectedName, selectedSave]);
})();
