'use strict';
// Save from the existing preview; prepare files before the user's click.
window.UmasanImageSave = (() => {
  function watermark(ctx, width, height) {
    const size = Math.max(12, Math.round(Math.min(width, height) * .022));
    const inset = Math.max(10, Math.round(Math.min(width, height) * .025));
    ctx.save(); ctx.font = `500 ${size}px "Yu Gothic", sans-serif`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.lineWidth = Math.max(1, size / 12);
    ctx.strokeStyle = 'rgba(40,30,20,.38)'; ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.strokeText('©旅する馬さん', width - inset, height - inset);
    ctx.fillText('©旅する馬さん', width - inset, height - inset); ctx.restore();
  }
  async function stamped(blob) {
    const url = URL.createObjectURL(blob), image = new Image();
    try {
      image.src = url; await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0); watermark(ctx, canvas.width, canvas.height);
      return await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Export failed')), 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }
  function bind(button, {image, message, mode='auto', readyMessage='保存ボタン、または画像の長押しで保存できます。右下に©旅する馬さんが入ります。', downloadMessage='画像をダウンロードしました。写真に保存する場合は、表示中の画像を長押ししてください。'}) {
    let file, url, request = 0;
    function release() { if (url) URL.revokeObjectURL(url); url = null; file = null; }
    function download() {
      const link = document.createElement('a'); link.href = url; link.download = file.name;
      document.body.append(link); link.click(); link.remove();
    }
    button.addEventListener('click', async event => {
      event.preventDefault(); if (!file) return;
      const selected = file;
      try {
        if (mode!=='download' && navigator.share && navigator.canShare?.({files:[selected]})) await navigator.share({files:[selected]});
        else {
          download();
          message.textContent = downloadMessage;
        }
      } catch (error) {
        if (error.name !== 'AbortError') message.textContent = mode==='download'?'保存できませんでした。もう一度お試しください。':'共有できませんでした。表示中の画像を長押しして保存してください。';
      }
    });
    return {
      async prepare({src, blob, name = 'umasan.png', marked = false}) {
        const current = ++request; release(); button.setAttribute('aria-disabled', 'true');
        message.textContent = '保存用の画像を準備しています…';
        try {
          if (!blob) { const response = await fetch(src); if (!response.ok) throw new Error('Image unavailable'); blob = await response.blob(); }
          if (!marked) blob = await stamped(blob);
          if (current !== request) return;
          file = new File([blob], name.replace(/\.[^.]+$/, '') + '.png', {type:'image/png'});
          url = URL.createObjectURL(file);
          if (image) image.src = url;
          button.setAttribute('aria-disabled', 'false');
          message.textContent = readyMessage;
        } catch {
          if (current === request) message.textContent = '保存用の画像を準備できませんでした。もう一度選び直してください。';
        }
      },
      clear() { request++; release(); button.setAttribute('aria-disabled', 'true'); }
    };
  }
  return {bind, watermark};
})();
