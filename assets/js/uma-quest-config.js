(function(root){
  'use strict';
  // Production calendar: one quest per day, October 1 through November 30, 2026 (JST).
  const config={
    eventId:'umasan-autumn-2026',version:3,start:'2026-10-01',end:'2026-11-30',timeZone:'Asia/Tokyo',
    title:'うまさんからの挑戦状',url:'https://web-umasan.nachiko-umasan0215.workers.dev/contents/uma_quest',
    isDraft:false,productionComplete:true,productionQuestCount:61,initialLevel:1,resultMinClears:1,
    // Cumulative EXP for Lv.1–10: 0, 7, 14, 21, 28, 34, 41, 48, 55, 61 clears.
    levelThresholds:[0,700,1400,2100,2800,3400,4100,4800,5500,6100],
    artwork:{explore:'../media/quest/explore-v1.png',create:'../media/quest/create-v1.png',challenge:'../media/quest/challenge-v1.png',rest:'../media/quest/rest-v1.png'},
    categories:[{id:'explore',name:'探索',icon:'../media/icon-compass-storybook.webp',color:'#89966a'},{id:'create',name:'創作',icon:'../media/icon-art-color.png',color:'#c48473'},{id:'challenge',name:'挑戦',icon:'../media/icon-star-color.png',color:'#80a2b7'},{id:'rest',name:'休息',icon:'../media/icon-lantern.png',color:'#c3a155'}],
    quests:[
      {
        "id": "autumn-door",
        "date": "2026-10-01",
        "title": "異世界の入口を探せ",
        "condition": "普段通ってよい道や自宅で、物語が始まりそうな扉や木の隙間を探そう。安全な場所で、人や表札が写らない写真を1枚撮ったらクリア。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-tool-story",
        "date": "2026-10-02",
        "title": "身近な道具に命を吹き込め",
        "condition": "自分の道具をひとつ選び、名前と、その道具が主人公の3行の物語を書こう。紙でもスマホのメモでも大丈夫。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-paper",
        "date": "2026-10-03",
        "title": "はじめての折り紙に挑戦",
        "condition": "手元の紙を使って、まだ折ったことのない形をひとつつくろう。自分なりの形ができたらクリア。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-base",
        "date": "2026-10-04",
        "title": "回復の拠点をつくれ",
        "condition": "いつもの飲み物と好きなものを用意して、自宅の一角で5分、ゆっくり過ごそう。ひと息つけたらクリア。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-colors",
        "date": "2026-10-05",
        "title": "秋のかけらを見つけよう",
        "condition": "いつもの道を無理のない範囲で歩いて、秋らしい色を3つメモしよう。外へ出にくい日は窓辺や家の中で見つけてもクリア。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-drawing",
        "date": "2026-10-06",
        "title": "今日を一枚の絵に",
        "condition": "今日心に残ったものを、3分かけて描こう。小さならくがきに日付を添えたら、今日だけの作品が完成。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-kindness",
        "date": "2026-10-07",
        "title": "自分に小さな花まるを",
        "condition": "今日できたことを3つ書き、自分をねぎらう言葉を添えよう。小さなことほど歓迎。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-hand",
        "date": "2026-10-08",
        "title": "いつもと違う線",
        "condition": "普段と反対の手で、紙に丸を3つ描いてみよう。書きにくければいつもの手で違う形に挑戦してもOK。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-light",
        "date": "2026-10-09",
        "title": "光の地図を見つける",
        "condition": "家の中で光が当たる場所を1つ見つけ、色や形をひと言メモしよう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-leaf",
        "date": "2026-10-10",
        "title": "紙の葉っぱの便り",
        "condition": "手元の紙に好きな形の葉を1枚描き、今の気持ちをひと言添えよう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-pause",
        "date": "2026-10-11",
        "title": "予定のない3分",
        "condition": "無理のないタイミングに3分、作業を止めて楽な姿勢で過ごそう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-word",
        "date": "2026-10-12",
        "title": "新しい言葉に出会う",
        "condition": "手元の本や辞書で知らなかった言葉を1つ見つけ、意味をメモしよう。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-round",
        "date": "2026-10-13",
        "title": "まるい世界を探そう",
        "condition": "身近にある丸いものを3つ見つけ、名前を書こう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-map",
        "date": "2026-10-14",
        "title": "机の上の宝の地図",
        "condition": "自分の机や棚を、小さな島に見立てて地図を描こう。住所や実際の間取りは不要。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-comfort",
        "date": "2026-10-15",
        "title": "心地よさをひとつ",
        "condition": "明るさ、座る場所、服などをひとつ見直し、自分が楽に感じる状態を選ぼう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-arrange",
        "date": "2026-10-16",
        "title": "小さな模様替え",
        "condition": "自分の軽い持ち物を1つ、使いやすい場所に置き直そう。重い物や他の人の物は動かさなくてOK。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-sound",
        "date": "2026-10-17",
        "title": "音の小さな採集",
        "condition": "安全な場所で立ち止まり、聞こえる音を3つメモしよう。録音は不要。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-haiku",
        "date": "2026-10-18",
        "title": "今日を短い言葉に",
        "condition": "今日の出来事を、短い3行の文章にしよう。字数や上手さは気にしなくてOK。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-warmth",
        "date": "2026-10-19",
        "title": "いつもの一杯を味わう",
        "condition": "普段飲める飲み物を、香りや温度に気づきながらゆっくり味わおう。飲めないときは器を眺めるだけでもOK。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-drawing",
        "date": "2026-10-20",
        "title": "見ないで描いてみる",
        "condition": "身近な物を20秒眺め、いったん見ずに描こう。最後に見比べて発見を1つ書こう。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-texture",
        "date": "2026-10-21",
        "title": "手ざわりの探検",
        "condition": "自分の持ち物2つを触り、手ざわりの違いをひと言ずつ書こう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-bookmark",
        "date": "2026-10-22",
        "title": "旅のしおり",
        "condition": "余った紙に好きな印を描き、しおりにしよう。切らずに折るだけでもOK。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-permission",
        "date": "2026-10-23",
        "title": "今日はここまで",
        "condition": "今日の自分へ「ここまでで十分」と言えることを1つ書こう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-read",
        "date": "2026-10-24",
        "title": "はじめの1ページ",
        "condition": "まだ読んでいない本や、手元の説明書を1ページ読もう。気づきをひと言残せばクリア。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-sky",
        "date": "2026-10-25",
        "title": "窓からの空便り",
        "condition": "窓から見える空を眺め、色や雲の様子をひと言残そう。見えない日は部屋の明るさでもOK。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-cloud",
        "date": "2026-10-26",
        "title": "雲から生まれる生き物",
        "condition": "雲のような自由な形を描き、目や名前をつけてみよう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-screen",
        "date": "2026-10-27",
        "title": "画面からひと息",
        "condition": "支障のないときに画面から2分目を離し、楽に過ごそう。目を閉じなくてもOK。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-question",
        "date": "2026-10-28",
        "title": "ひとつ調べてみる",
        "condition": "普段気になっていたことを1つ、本や信頼できる解説で調べ、わかったことをひと言残そう。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-shadow",
        "date": "2026-10-29",
        "title": "影のかくれんぼ",
        "condition": "室内で面白い形の影を1つ探し、その形を簡単に描こう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-postcard",
        "date": "2026-10-30",
        "title": "未来への絵はがき",
        "condition": "未来の自分へ、ひと言と小さな絵を書こう。送らず手元に残せばクリア。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-soft",
        "date": "2026-10-31",
        "title": "やさしい手ざわり",
        "condition": "自分のタオルや服など、心地よい物に触れてひと息つこう。好きなところをひと言残そう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-fold",
        "date": "2026-11-01",
        "title": "紙に立ってもらう",
        "condition": "手元の紙を折り、机の上に立つ形をつくってみよう。道具なしで立てばクリア。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-favorite",
        "date": "2026-11-02",
        "title": "いつもの道具の新発見",
        "condition": "よく使う道具を1つ眺め、今まで気づかなかった形や模様をメモしよう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-emblem",
        "date": "2026-11-03",
        "title": "わたしの小さな紋章",
        "condition": "好きな形を2つ組み合わせ、自分の冒険のマークを描こう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-music",
        "date": "2026-11-04",
        "title": "静かな寄り道",
        "condition": "好きな音を小さな音量で少し聴くか、静かな時間を2分過ごそう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-order",
        "date": "2026-11-05",
        "title": "順番を変える実験",
        "condition": "自分だけの小さな作業2つの順番を入れ替え、感じた違いを書こう。安全に関わる手順は変えないでね。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-palette",
        "date": "2026-11-06",
        "title": "暮らしの色見本",
        "condition": "身近な物から好きな色を3色選び、それぞれの色に名前をつけよう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-story",
        "date": "2026-11-07",
        "title": "3つの言葉の物語",
        "condition": "「窓・カップ・旅」を使って、3行の物語を書こう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-enough",
        "date": "2026-11-08",
        "title": "小さなできたを拾う",
        "condition": "今日すでにできていることを1つ書き、「よくやった」を添えよう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-learn",
        "date": "2026-11-09",
        "title": "小さな技をひとつ",
        "condition": "紙やメモアプリで、今まで使っていなかった整理の仕方を1つ試そう。見出しをつけるだけでもOK。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-tiny",
        "date": "2026-11-10",
        "title": "小さな世界の観察者",
        "condition": "自分の持ち物の小さな部分を眺め、模様や形を1つ描くか言葉にしよう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-pattern",
        "date": "2026-11-11",
        "title": "模様の小道",
        "condition": "丸・線・点を繰り返し、紙に小さな模様をつくろう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-space",
        "date": "2026-11-12",
        "title": "休む場所を整える",
        "condition": "自分が休む場所の軽い物を1つ整え、座るか楽な姿勢でひと息つこう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-minute",
        "date": "2026-11-13",
        "title": "1分だけ始める",
        "condition": "気になっていた自分の小さな作業に1分取り組もう。終わらなくても、始めたらクリア。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-window",
        "date": "2026-11-14",
        "title": "額縁の中の景色",
        "condition": "家の中で好きな眺めを決め、人物や住所が写らない写真を1枚撮るか、簡単に描こう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-title",
        "date": "2026-11-15",
        "title": "今日に表紙をつける",
        "condition": "今日一日に本のタイトルをつけ、表紙のように文字を書いてみよう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-slow",
        "date": "2026-11-16",
        "title": "ゆっくりの時間",
        "condition": "普段の安全な動作を1つ、急がず自分のペースで行ってみよう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-route",
        "date": "2026-11-17",
        "title": "想像の寄り道",
        "condition": "いつもの場所を出発点に、架空の寄り道コースを3か所考えて書こう。実際に出かけなくてもOK。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-season",
        "date": "2026-11-18",
        "title": "季節のしるし",
        "condition": "光、服、飲み物などから季節を感じるものを1つ選び、理由を書こう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-thank-card",
        "date": "2026-11-19",
        "title": "自分へのありがとうカード",
        "condition": "自分に「ありがとう」と伝えたいことを1つ書き、小さな飾りを描こう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-letter",
        "date": "2026-11-20",
        "title": "過去の自分にひと言",
        "condition": "10月の自分へ、ねぎらいの言葉をひと言書こう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-again",
        "date": "2026-11-21",
        "title": "もう一度の小さな挑戦",
        "condition": "以前難しかった絵や紙の形を、今の自分なりにもう一度試そう。完成度は比べなくてOK。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-change",
        "date": "2026-11-22",
        "title": "変わったもの、変わらないもの",
        "condition": "10月のはじめと今で変わった身近なものを1つ、変わらないものを1つ書こう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-souvenir",
        "date": "2026-11-23",
        "title": "思い出の切符",
        "condition": "この2か月の印象に残った出来事を1つ選び、架空の旅の切符に描こう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-favorite-time",
        "date": "2026-11-24",
        "title": "好きな時間をもう一度",
        "condition": "この2か月で心地よかった小さな過ごし方を1つ、無理のない範囲でもう一度楽しもう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-teach",
        "date": "2026-11-25",
        "title": "自分だけの手引き",
        "condition": "この2か月で覚えた小さなことを1つ、3つの手順でメモしよう。誰かに見せる必要はないよ。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-treasure",
        "date": "2026-11-26",
        "title": "宝物の見つけ方",
        "condition": "今日見つけた小さな好きなものを1つ選び、どこが好きかひと言残そう。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-create-epilogue",
        "date": "2026-11-27",
        "title": "物語のあとがき",
        "condition": "今回の冒険で気づいたことを3行にまとめ、あとがきにしよう。",
        "category": "create",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-rest-finish",
        "date": "2026-11-28",
        "title": "旅をねぎらう休息",
        "condition": "ここまでの自分をねぎらう言葉を書き、好きな場所で3分ゆっくりしよう。",
        "category": "rest",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-challenge-next",
        "date": "2026-11-29",
        "title": "次の旅の約束",
        "condition": "12月に試したい、無理のない小さなことを1つ決め、最初の一歩を書こう。",
        "category": "challenge",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      },
      {
        "id": "autumn-explore-last-view",
        "date": "2026-11-30",
        "title": "旅の最後の一枚",
        "condition": "この2か月を思い出す身近な景色を、安全な場所で撮るか描き、ひと言添えよう。人物や住所は写さなくてOK。",
        "category": "explore",
        "reward": {
          "xp": 100,
          "stat": 1
        }
      }
    ],
    trophies:[
      {id:'first',name:'はじめの一歩',title:'一歩を踏み出す冒険者',kind:'count',target:1,icon:'../media/icon-lantern.png'},
      {id:'three',name:'物語のはじまり',title:'日常の冒険者',kind:'count',target:3,icon:'../media/icon-book-storybook.webp'},
      {id:'count-10',name:'10ページの手帳',title:'物語を重ねる人',kind:'count',target:10,icon:'../media/icon-book-storybook.webp'},
      {id:'count-20',name:'20の足あと',title:'日常を旅する人',kind:'count',target:20,icon:'../media/icon-book-storybook.webp'},
      {id:'count-40',name:'実りの旅支度',title:'季節を歩いた冒険者',kind:'count',target:40,icon:'../media/icon-book-storybook.webp'},
      {id:'explorer',name:'発見のコンパス',title:'小さな世界の発見者',kind:'category',category:'explore',target:2,icon:'../media/icon-compass-storybook.webp'},
      {id:'creator',name:'物語の羽根',title:'物語のつくり手',kind:'category',category:'create',target:2,icon:'../media/icon-art-color.png'},
      {id:'brave',name:'勇気の星',title:'はじめてを楽しむ人',kind:'category',category:'challenge',target:2,icon:'../media/icon-star-color.png'},
      {id:'restful',name:'やすらぎの灯',title:'ひと休みの達人',kind:'category',category:'rest',target:2,icon:'../media/icon-lantern.png'},
      {id:'all61',name:'61の物語',title:'日常の大冒険家',kind:'all',target:61,icon:'../media/icon-horseshoe.webp'}
    ]
  };
  if(typeof module==='object'&&module.exports)module.exports=config;else root.UmaQuestConfig=config;
})(typeof window==='object'?window:globalThis);
