(function(root){
  'use strict';
  // All values here are prototype rules. These seven fixtures are NOT the 61 production quests.
  const config={
    eventId:'umasan-autumn-2026',version:3,start:'2026-10-01',end:'2026-11-30',timeZone:'Asia/Tokyo',
    title:'うまさんからの挑戦状',url:'https://web-umasan.nachiko-umasan0215.workers.dev/uma_quest.html',
    isDraft:true,productionComplete:false,productionQuestCount:61,xpPerLevel:100,initialLevel:1,resultMinClears:1,
    artwork:{explore:'media/quest/explore-v1.png',create:'media/quest/create-v1.png',challenge:'media/quest/challenge-v1.png',rest:'media/quest/rest-v1.png'},
    categories:[{id:'explore',name:'探索',icon:'media/icon-compass-storybook.webp',color:'#89966a'},{id:'create',name:'創作',icon:'media/icon-art-color.png',color:'#c48473'},{id:'challenge',name:'挑戦',icon:'media/icon-star-color.png',color:'#80a2b7'},{id:'rest',name:'休息',icon:'media/icon-lantern.png',color:'#c3a155'}],
    quests:[
      {id:'autumn-door',date:'2026-10-01',title:'異世界の入口を探せ',condition:'普段通ってよい道や自宅で、物語が始まりそうな扉や木の隙間を探そう。安全な場所で、人や表札が写らない写真を1枚撮ったらクリア。',category:'explore',reward:{xp:100,stat:1}},
      {id:'autumn-tool-story',date:'2026-10-02',title:'身近な道具に命を吹き込め',condition:'自分の道具をひとつ選び、名前と、その道具が主人公の3行の物語を書こう。紙でもスマホのメモでも大丈夫。',category:'create',reward:{xp:100,stat:1}},
      {id:'autumn-paper',date:'2026-10-03',title:'はじめての折り紙に挑戦',condition:'手元の紙を使って、まだ折ったことのない形をひとつつくろう。自分なりの形ができたらクリア。',category:'challenge',reward:{xp:100,stat:1}},
      {id:'autumn-base',date:'2026-10-04',title:'回復の拠点をつくれ',condition:'いつもの飲み物と好きなものを用意して、自宅の一角で5分、ゆっくり過ごそう。ひと息つけたらクリア。',category:'rest',reward:{xp:100,stat:1}},
      {id:'autumn-colors',date:'2026-10-05',title:'秋のかけらを見つけよう',condition:'いつもの道を無理のない範囲で歩いて、秋らしい色を3つメモしよう。外へ出にくい日は窓辺や家の中で見つけてもクリア。',category:'explore',reward:{xp:100,stat:1}},
      {id:'autumn-drawing',date:'2026-10-06',title:'今日を一枚の絵に',condition:'今日心に残ったものを、3分かけて描こう。小さならくがきに日付を添えたら、今日だけの作品が完成。',category:'create',reward:{xp:100,stat:1}},
      {id:'autumn-kindness',date:'2026-10-07',title:'自分に小さな花まるを',condition:'今日できたことを3つ書き、自分をねぎらう言葉を添えよう。小さなことほど歓迎。',category:'rest',reward:{xp:100,stat:1}}
    ],
    trophies:[
      {id:'first',name:'はじめの一歩',title:'一歩を踏み出す冒険者',kind:'count',target:1,icon:'media/icon-lantern.png'},
      {id:'three',name:'物語のはじまり',title:'日常の冒険者',kind:'count',target:3,icon:'media/icon-book-storybook.webp'},
      {id:'explorer',name:'発見のコンパス',title:'小さな世界の発見者',kind:'category',category:'explore',target:2,icon:'media/icon-compass-storybook.webp'},
      {id:'creator',name:'物語の羽根',title:'物語のつくり手',kind:'category',category:'create',target:2,icon:'media/icon-art-color.png'},
      {id:'brave',name:'勇気の星',title:'はじめてを楽しむ人',kind:'category',category:'challenge',target:2,icon:'media/icon-star-color.png'},
      {id:'restful',name:'やすらぎの灯',title:'ひと休みの達人',kind:'category',category:'rest',target:2,icon:'media/icon-lantern.png'},
      {id:'all61',name:'61の物語',title:'日常の大冒険家',kind:'all',target:61,icon:'media/icon-horseshoe.webp'}
    ]
  };
  if(typeof module==='object'&&module.exports)module.exports=config;else root.UmaQuestConfig=config;
})(typeof window==='object'?window:globalThis);
