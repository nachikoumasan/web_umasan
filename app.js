'use strict';
const content = window.UMASAN_CONTENT;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external = 'target="_blank" rel="noopener noreferrer"';
// noteのタイトルから【…】だけを外す。｜や本文はそのまま。
const cleanTitle = value => String(value ?? '')
  .replace(/^[\s\u3000]*(?:【[^】]*】[\s\u3000]*)+/, '')
  .replace(/(?:[\s\u3000]*【[^】]*】)+[\s\u3000]*$/, '')
  .trim();
document.querySelector('#works').innerHTML = content.works.map(work => {
  const mediaTag = work.url ? 'a' : 'span';
  const link = work.url ? ` href="${escapeHTML(work.url)}" ${work.url.startsWith('https:') ? external : ''}` : '';
  const meta = work.meta ? `<ul class="work-meta">${work.meta.map(m => `<li>${escapeHTML(m)}</li>`).join('')}</ul>` : '';
  const cta = work.url
    ? `<a class="button primary" href="${escapeHTML(work.url)}" ${work.url.startsWith('https:') ? external : ''}>${escapeHTML(work.cta)}</a>`
    : `<span class="button is-waiting" aria-disabled="true">${escapeHTML(work.cta)}</span>`;
  return `<article class="work-card"><${mediaTag}${link} class="work-media"><img class="work-image" src="${escapeHTML(work.image)}" alt="${escapeHTML(work.imageAlt)}" loading="lazy">${work.status ? `<span class="work-status">${escapeHTML(work.status)}<small>${escapeHTML(work.statusNote)}</small></span>` : ''}</${mediaTag}><div class="work-detail"><div class="work-info">${meta}<h3>${escapeHTML(work.title)}</h3><p>${escapeHTML(work.description)}</p>${work.lead ? `<p class="work-lead">${escapeHTML(work.lead)}</p>` : ''}</div><div class="work-actions">${cta}</div></div></article>`;
}).join('');
let experiences = content.experiences;
let activeFilter = null;
let filterChosen = false;
const filterList = document.querySelector('.filter-list');
let featured = experiences.slice(0, 3);

function renderFilters() {
  const order = ['没入型アート・イベント', 'ARG', '謎解き'];
  const genres = [...new Set(experiences.map(item => item.genre))]
    .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  if (!filterChosen || !genres.includes(activeFilter)) activeFilter = genres[0] || null;
  filterList.innerHTML = genres.map(filter => `<button type="button" aria-pressed="${filter === activeFilter}" data-filter="${escapeHTML(filter)}">${escapeHTML(filter)}</button>`).join('');
}

function renderArticles() {
  document.querySelector('#articles').innerHTML = featured.map(item => `<article class="article-card"><a href="${escapeHTML(item.url)}" ${external}><img class="article-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.title)}" loading="lazy"><div class="article-body"><div class="tags"><span class="tag">${escapeHTML(item.genre)}</span></div><h3>${escapeHTML(item.title)}</h3>${item.description ? `<p>${escapeHTML(item.description)}</p>` : ''}<span class="article-date"><time datetime="${item.publishedAt}">${String(item.publishedAt).replaceAll('-', '.')}</time></span></div></a></article>`).join('');
}

function renderExperiences() {
  featured = experiences.slice(0, 3);
  renderFilters();
  renderArticles();
  renderArchive();
  renderNews();
}
function renderArchive() {
  const matched = experiences.filter(item => !activeFilter || item.genre === activeFilter);
  const records = matched.filter(item => !featured.includes(item));
  const featuredCount = matched.length - records.length;
  document.querySelector('#archive-label').textContent = featuredCount ? `上の最新記事に${featuredCount}件掲載・` : 'このジャンルの体験レポート';
  document.querySelector('#result-count').textContent = `${featuredCount ? 'ほか' : ''}${records.length}件`;
  document.querySelector('#archive-list').innerHTML = records.length ? records.map(item => `<a class="archive-row" href="${escapeHTML(item.url)}" ${external}><img src="${escapeHTML(item.image)}" alt="" loading="lazy"><span class="row-title">${escapeHTML(item.title)}</span><time datetime="${item.publishedAt}" title="記事公開日">${String(item.publishedAt).replaceAll('-', '.')}</time></a>`).join('') : `<p class="empty-state">${featuredCount ? 'このジャンルの記事は、上の「最新の体験レポート」に掲載しています。' : 'このジャンルの体験記録は、ただいま準備中です。'}</p>`;
}
filterList.addEventListener('click', event => {
  const button = event.target.closest('button[data-filter]');
  if (!button) return;
  activeFilter = button.dataset.filter;
  filterChosen = true;
  filterList.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderArchive();
});
renderExperiences();

// noteのマガジンから自動取得した記事があれば差し替える。
// 取得できないときは data/content.js の内容をそのまま使う。
fetch('data/articles-auto.json', {cache: 'no-cache'})
  .then(response => (response.ok ? response.json() : Promise.reject(response.status)))
  .then(auto => {
    if (!auto || !Array.isArray(auto.experiences) || !auto.experiences.length) return;
    const notes = window.UMASAN_ARTICLE_NOTES || {};
    const images = new Map(content.experiences.map(item => [item.url, item.image]));
    experiences = auto.experiences.map(item => {
      // タイトルと紹介文を上書きできるのは data/article-notes.js だけ。
      // data/content.js は画像が取れなかったときの予備としてのみ使う。
      const manual = notes[item.url] || {};
      return {
        genre: item.genre,
        title: manual.title || cleanTitle(item.title),
        description: manual.description || item.summary || '',
        url: item.url,
        image: item.image || images.get(item.url) || '',
        publishedAt: item.publishedAt,
      };
    });
    renderExperiences();
  })
  .catch(() => {});
const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#main-nav');
function setMenu(open) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  navigation.classList.toggle('is-open', open);
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); } });

function renderNews() {
  const newsList = document.querySelector('#news-list');
  if (!newsList) return;
  // 手動告知の枠を確保し、残りを最新記事で補う。
  const manualNews = (content.news || []).filter(item => item.category !== '記事').slice(0, 3);
  const articleNews = [...experiences]
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    .slice(0, Math.max(0, 3 - manualNews.length))
    .map(item => ({date: item.publishedAt, category: '記事', title: '体験レポ公開｜' + item.title, url: item.url, external: true}));
  const items = [...manualNews, ...articleNews].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  newsList.innerHTML = items.map(item => {
    const date = item.date ? `<time datetime="${item.date}">${item.date.replaceAll('-', '.')}</time>` : '<span class="news-date-blank">公開中</span>';
    const link = item.url ? ` href="${escapeHTML(item.url)}"${item.external ? ' ' + external : ''}` : '';
    const tag = `<span class="news-tag">${escapeHTML(item.category)}</span>`;
    const body = `${date}${tag}<span class="news-title">${escapeHTML(item.title)}</span>`;
    return `<li>${item.url ? `<a${link}>${body}</a>` : `<span>${body}</span>`}</li>`;
  }).join('');
}

const historyList = document.querySelector('#history-list');
if (historyList) {
  const years = [...new Set((content.history || []).map(item => item.year))].sort().reverse();
  historyList.innerHTML = years.map(year => {
    const rows = content.history.filter(item => item.year === year).map(item => {
      const label = `<span class="history-tag" data-cat="${escapeHTML(item.category)}">${escapeHTML(item.category)}</span><span class="history-title">${escapeHTML(item.title)}</span>`;
      const line = item.url
        ? `<a class="history-line" href="${escapeHTML(item.url)}" ${external}>${label}<img class="history-arrow ext ui-icon" src="assets/ui-external.svg" alt=""></a>`
        : `<span class="history-line">${label}<span class="history-arrow" aria-hidden="true"></span></span>`;
      return `<li>${line}</li>`;
    }).join('');
    return `<div class="history-year"><h4>${escapeHTML(year)}</h4><ul>${rows}</ul></div>`;
  }).join('');
}

// 動画スライドを追加してから初期化する。
function initializeCarousels() {
document.querySelectorAll('[data-carousel]').forEach(root => {
  const track = root.querySelector('.stamp-track');
  const slides = [...track.children];
  const dots = root.querySelector('.stamp-dots');
  dots.setAttribute('role', 'group');
  if (slides.length < 2) return;
  let index = Math.max(0, slides.findIndex(slide => slide.matches('.video-card')));
  let timer = null;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  dots.innerHTML = slides.map((slide, i) =>
    `<button type="button" aria-label="${escapeHTML(slide.alt || slide.getAttribute('aria-label'))}" aria-pressed="${i === 0}" data-index="${i}"${slide.matches('.video-card') ? ' class="video-dot"' : ''}>${slide.matches('.video-card') ? '<img class="ui-icon" src="assets/ui-play.svg" alt="">' : ''}</button>`).join('');

  function go(next, user) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    slides.forEach((slide, i) => { slide.inert = i !== index; slide.tabIndex = i === index ? 0 : -1; });
    dots.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(i === index)));
    if (user) restart();
  }
  function start() {
    stop();
    if (slides.some(slide => slide.matches('.video-card'))) return;
    if (!reduce.matches && !root.matches(':hover') && !root.contains(document.activeElement) && !document.querySelector('dialog[open]')) {
      timer = setInterval(() => go(index + 1), 4500);
    }
  }
  function stop() { clearInterval(timer); timer = null; }
  function restart() { stop(); start(); }

  root.querySelector('.prev').addEventListener('click', () => go(index - 1, true));
  root.querySelector('.next').addEventListener('click', () => go(index + 1, true));
  dots.addEventListener('click', event => {
    const button = event.target.closest('button[data-index]');
    if (button) go(Number(button.dataset.index), true);
  });
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', start);
  reduce.addEventListener('change', start);

  let startX = null;
  root.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  root.addEventListener('touchend', e => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
    startX = null;
    start();
  }, { passive: true });

  go(index);
  start();
});
}

// Videos are loaded only after an explicit click, in one shared dialog.
const videoDialog = document.createElement('dialog');
videoDialog.className = 'video-dialog';
videoDialog.setAttribute('aria-labelledby', 'video-title');
videoDialog.innerHTML = '<div class="video-dialog-heading"><h2 id="video-title"></h2><button type="button" class="video-close" aria-label="動画を閉じる">閉じる ×</button></div><div class="video-player"></div><div class="video-dialog-actions"><a class="button primary video-destination" target="_blank" rel="noopener noreferrer"></a><a class="video-fallback" target="_blank" rel="noopener noreferrer">YouTubeで見る </a></div>';
document.body.append(videoDialog);
let videoOpener = null;
const videoItems = [
  {selector: '.work-card:first-child', id: 'Q2zDstEz1KU', title: 'Echo Again 導入動画', label: '導入動画を見る', duration: '0:30'},
  {selector: '#shop .mini-card:first-child', id: 'Zw6iskJvHJI', title: 'LINEスタンプ 宣伝動画', label: '紹介動画を見る', duration: '1:03'},
];
videoItems.forEach(item => {
  const parent = document.querySelector(item.selector);
  if (!parent) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'video-card';
  // サムネイルはYouTubeのものを使い、取得できない場合は無地に再生マークだけを出す。
  button.innerHTML = `<span class="video-thumb"><img src="https://i.ytimg.com/vi/${item.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="video-play" aria-hidden="true"><img class="ui-icon" src="assets/ui-play.svg" alt=""></span></span><span class="video-meta"><strong>${item.label}</strong><small>${item.duration}</small></span>`;
  button.querySelector('img').addEventListener('error', event => event.target.remove());
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-label', `${item.title}を見る（${item.duration}）`);
  const destination = parent.querySelector('.work-actions a, .mini-actions a');
  const track = parent.querySelector('.stamp-track');
  if (track) {
    track.prepend(button);
  } else {
    const original = parent.querySelector('.work-media');
    const gallery = document.createElement('div');
    gallery.className = 'work-media work-gallery';
    original.before(gallery);
    original.className = 'gallery-image';
    gallery.append(button, original);
    original.hidden = true;
    const choices = document.createElement('div');
    choices.className = 'media-choices';
    choices.setAttribute('role', 'group');
    choices.setAttribute('aria-label', 'Echo Againの画像と動画');
    [button, original].forEach((panel, index) => {
      const choice = document.createElement('button');
      choice.type = 'button';
      choice.setAttribute('aria-label', index === 0 ? `動画サムネイルを表示（${item.duration}）` : '作品画像を表示');
      choice.setAttribute('aria-pressed', String(index === 0));
      const thumb = panel.querySelector('img').cloneNode();
      thumb.alt = '';
      choice.append(thumb);
      if (index === 0) choice.insertAdjacentHTML('beforeend', '<img class="ui-icon media-play-icon" src="assets/ui-play.svg" alt="">');
      choice.addEventListener('click', () => {
        original.hidden = index !== 1;
        button.hidden = index !== 0;
        choices.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b === choice)));
      });
      choices.append(choice);
    });
    gallery.append(choices);
    ['前のサムネイル', '次のサムネイル'].forEach((label, index) => {
      const arrow = document.createElement('button');
      arrow.type = 'button';
      arrow.className = `gallery-arrow ${index ? 'next' : 'prev'}`;
      arrow.setAttribute('aria-label', label);
      arrow.innerHTML = `<img class="ui-icon" src="assets/ui-chevron-${index ? 'right' : 'left'}.svg" alt="">`;
      arrow.addEventListener('click', () => {
        const next = original.hidden ? 1 : 0;
        choices.querySelectorAll('button')[next].click();
      });
      gallery.append(arrow);
    });
  }
  button.addEventListener('click', () => {
    videoOpener = button;
    videoDialog.querySelector('h2').textContent = item.title;
    const iframe = document.createElement('iframe');
    iframe.title = item.title;
    iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = `https://www.youtube-nocookie.com/embed/${item.id}?rel=0&playsinline=1`;
    const player = videoDialog.querySelector('.video-player');
    if (location.protocol === 'file:') {
      const notice = document.createElement('p');
      notice.className = 'video-local-note';
      notice.textContent = 'ファイルを直接開いているため、動画は「YouTubeで見る」からご覧ください。';
      player.replaceChildren(notice);
    } else {
      player.replaceChildren(iframe);
    }
    videoDialog.querySelector('.video-fallback').href = `https://www.youtube.com/watch?v=${item.id}`;
    videoDialog.querySelector('.video-destination').href = destination.href;
    videoDialog.querySelector('.video-destination').textContent = destination.textContent.trim();
    videoDialog.showModal();
    document.body.classList.add('video-open');
  });
});
initializeCarousels();
videoDialog.querySelector('.video-close').addEventListener('click', () => videoDialog.close());
videoDialog.addEventListener('click', event => {
  if (event.target !== videoDialog) return;
  const rect = videoDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) videoDialog.close();
});
videoDialog.addEventListener('close', () => {
  videoDialog.querySelector('.video-player').replaceChildren();
  document.body.classList.remove('video-open');
  videoOpener?.focus({preventScroll: true});
});

// 商品と作例は、画像そのものから大きく確認できる。
const imageDialog = document.createElement('dialog');
imageDialog.className = 'image-dialog';
imageDialog.setAttribute('aria-label', '画像を拡大');
imageDialog.innerHTML = '<button type="button" class="image-close" aria-label="画像を閉じる">×</button><img alt=""><p></p><a class="button small image-save" hidden>この壁紙を保存 </a>';
document.body.append(imageDialog);
let imageOpener;
document.querySelectorAll('.mini-card .stamp-track > img,.mini-card .phones-row img,.memories img').forEach(img => {
 img.tabIndex = 0;
 img.setAttribute('role', 'button');
 img.setAttribute('aria-haspopup', 'dialog');
 img.setAttribute('aria-label', `${img.alt}を拡大`);
 const carousel = img.closest('[data-carousel]');
 if (carousel) {
  const active = Number(carousel.querySelector('[aria-pressed="true"]')?.dataset.index || 0);
  const inactive = [...img.parentElement.children].indexOf(img) !== active;
  img.inert = inactive;
  img.tabIndex = inactive ? -1 : 0;
 }
 const open = () => {
  imageOpener = img;
  imageDialog.querySelector('img').src = img.currentSrc || img.src;
  imageDialog.querySelector('img').alt = img.alt;
  imageDialog.querySelector('p').textContent = img.alt;
  const save = imageDialog.querySelector('.image-save');
  const isWallpaper = img.closest('.wallpaper') !== null;
  save.hidden = !isWallpaper;
  if (isWallpaper) { save.href = img.src; save.download = 'umasan-' + img.getAttribute('src').split('/').pop(); }
  imageDialog.showModal();
 };
 img.addEventListener('click', open);
 img.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
 });
});
imageDialog.querySelector('button').addEventListener('click', () => imageDialog.close());
imageDialog.addEventListener('click', event => {
 if (event.target !== imageDialog) return;
 const r = imageDialog.getBoundingClientRect();
 if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) imageDialog.close();
});
imageDialog.addEventListener('close', () => imageOpener?.focus({preventScroll:true}));

// 壁紙一覧と同一サイトの画像保存リンク。
const wallpaperDialog = document.querySelector('#wallpaper-dialog');
const wallpaperOpener = document.querySelector('.wallpaper-open');
wallpaperOpener.addEventListener('click', () => wallpaperDialog.showModal());
wallpaperDialog.querySelector('.image-close').addEventListener('click', () => wallpaperDialog.close());
wallpaperDialog.addEventListener('click', event => {
  if (event.target !== wallpaperDialog) return;
  const r = wallpaperDialog.getBoundingClientRect();
  if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) wallpaperDialog.close();
});
wallpaperDialog.addEventListener('close', () => wallpaperOpener.focus({preventScroll:true}));
