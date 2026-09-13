'use strict';
// A normal link opens X directly; no custom dialog or external widget script.
window.UmasanCameraShare = {
 bind(link,{url}) {
  const intent=new URL('https://x.com/intent/tweet');
  intent.searchParams.set('text','#旅するうまさん #うまさんカメラ');
  intent.searchParams.set('url',url);
  link.href=intent.href;
 }
};