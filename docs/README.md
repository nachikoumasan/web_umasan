# 旅するうまさん — web_umasan

添付デザインを基準とする新公式サイトのローカル実装。HTML / CSS / JavaScriptのみで動作します。

## 確認方法

```sh
node scripts/serve.cjs
```

http://127.0.0.1:4279/web_umasan/ を開きます。ARにはカメラを利用できる端末と使用許可が必要です。本番はHTTPSで配信してください。

## ファイル

- `index.html`：新トップのセクション、ナビゲーション、NEWS、無料コンテンツ、ショップ、ABOUT・活動年表。
- CSSは読み込み順に7層。後の層が最終的な見た目を決めます。
  - `assets/css/styles.css`：共通色・書体・カード・PC/タブレット/スマホの基本レイアウト。
  - `assets/css/storybook.css`：カード・ボタン・タグの装飾と寸法の調整層。
  - `assets/css/journal.css`：現在の最終調整層。紙の質感、二重枠、3D画像の適用、作品カード・無料コンテンツ・グッズ・活動写真の配置。
  - `assets/css/playful.css`：ジャンルの補足・壁紙プレビュー・体験記録のおまかせ機能とカラーアイコンの表示。
  - `assets/css/dialogs.css`：画像拡大・壁紙・動画など、開いた先の画面。
  - `assets/css/image-save.css`：壁紙とカメラの共通保存画面。
  - `assets/css/responsive.css`：タブレット・スマホの配置、壁紙プレビュー、フッターの最終調整。
- `assets/js/image-save.js`：既存の壁紙選択・撮影確認内で、右下に「©旅する馬さん」を付けたPNGを準備する。追加の画面は開かず、保存ボタンから端末の共有メニュー（対応時）またはダウンロードへ進む。表示画像の長押しにも対応。実機の写真アプリへの保存は別途確認が必要。
- `assets/js/playful.js`：上記の追加機能。`assets/js/app.js` の後に読み込みます。
- `assets/js/app.js`：作品・記事・体験一覧の描画、ジャンル絞り込み、スライド、スマホメニュー。ジャンルの選択肢はデータから生成するため、0件のジャンルは表示されません。
- `scripts/update_note.py`：noteのマガジンAPIから記事を取得し `data/articles-auto.json` を書き出します。ジャンルはマガジンで決まり、タイトルからの推測は行いません。
- `.github/workflows/update-articles.yml`：毎朝7時JSTに上記を実行し、`data/articles-auto.json` だけをコミットします。
- `data/articles-auto.json`：自動生成。手で編集しないでください。
- `assets/js/article-notes.js`：記事URLをキーにした手動の補足（短縮タイトル・紹介文）。値がある場合は自動取得したタイトル・紹介文より優先します。
- `assets/js/content.js`：作品3件と公開記事に基づく体験記録。`publishedAt`は記事公開日です。参加日・開催地は未確認のためnullです。
  末尾の `news` は作品などの手動告知、`history` は活動年表です。記事NEWSは記事データから描画します。`history` の `url` はXの告知投稿に統一（noteの2件はnoteトップ、サイト公開はURL未確定でnull）。`period` / `venue` は告知画像で確認できたものだけ入れ、不明なものはnullです。
- `contents/umasan-camera.html`：新デザインのカメラページ。トップからの相対リンクで開きます。
- `media/`：サイト用画像。SNS用・告知画像はこのリポジトリに含めず、creative-ops の `projects/tabisuru-umasan/web-source/social-delivery-20260910/` に保管しています。
- `docs/`：説明書と `licenses/` のライセンス文書。生成記録・作業記録・確認画像は `docs/private/` に保管し、Gitには含めません。
- `data/`：取得したJSONデータ。JavaScript形式の手動データは `assets/js/content.js` と `assets/js/article-notes.js` に配置します。
- `contents/`：トップ以外のHTML。カメラの新URLは `contents/umasan-camera.html`。旧直下URLを使った外部リンクやブックマークは更新が必要です。
- うまさんの正本（2Dシート・3Dシート・三面図）は creative-ops の `projects/tabisuru-umasan/character-reference/` にあります。画像を新しく生成・修正するときは、必ずここを参照元にします。このリポジトリには置きません。
- `scripts/serve.cjs`：ローカル確認サーバー。公開時には不要。
- `scripts/check.cjs`：参照先・ID重複・作品と記事の分離・JavaScript構文を確認する静的チェック。`node scripts/check.cjs` で実行。
- 更新ごとの作業記録は creative-ops の `projects/tabisuru-umasan/web-docs/` にあります。このリポジトリには含めません。作業記録は当時の状態を示します。同日にも複数の変更があるため、日付だけで現行仕様を決めないでください。現在の編集先は下記「現在の仕様・編集先」を参照してください。`web-docs/design-policy.md` は2026-09-07時点の旧方針で、現行仕様の根拠には使いません。

## Git・公開

接続先は `https://github.com/nachikoumasan/web_umasan.git` のみです。
旧 `tabisuru_umasan` は参照専用。コミット、push、Pages設定、公開は行っていません。

正式な公開URLは `https://web-umasan.nachiko-umasan0215.workers.dev/` です。サイト内参照は相対パスを維持しています。トップとカメラにcanonical・og:url・絶対URLのog:imageを設定し、ルートに `robots.txt` と `sitemap.xml` を配置しています。公開先を変更する際はこれらの絶対URLをまとめて更新してください。

SEO設定の公開後は、Google Search ConsoleでこのURLのURLプレフィックスプロパティを確認し、`sitemap.xml` を送信してください。ローカルでの設定・検証と、公開反映・検索エンジンへの登録確認は別です。SNS共有画像には既存の `media/hero-umasan.webp` と `media/work-camera.webp` を使用しています。共有先での画像表示は公開後に確認してください。

旧トップと停止中クエストの取得時スナップショットは creative-ops の `projects/tabisuru-umasan/web-docs/legacy-*` に保持しています。旧自動更新ワークフローは新デザインを上書きするため移植していません。記事の取得元は `scripts/update_note.py`、手動補足は `assets/js/article-notes.js` で管理します。`assets/js/content.js` の体験記事は取得失敗時の予備です。

## 記事の自動更新

`.github/workflows/update-articles.yml` が毎朝7時JSTに `scripts/update_note.py` を実行します。

対象マガジン：

| マガジンキー | サイト上のジャンル |
| --- | --- |
| mc5792ff2f39c | 没入型アート・イベント |
| m0e94126b8fea | ARG |
| mcfec0a76f4a4 | 謎解き |
| mc70338cbfbf2 | 作品（体験レポートとは分けて出力） |

各マガジンの最新10件を取得し、`data/articles-auto.json` に書き出します。

`assets/js/app.js` はこのJSONがあれば使い、無ければ `assets/js/content.js` の内容にフォールバックします。JSON取得失敗時も予備の記事と手動告知を表示します。JSON内の `works` は作品カードには使用せず、作品カードは `assets/js/content.js` の手動管理です。

旧リポジトリ `tabisuru_umasan` には一切アクセスしません。

## 現在の仕様・編集先（2026-09-09）

| 対象 | 編集先・仕様 |
| --- | --- |
| 体験レポート見出し | index.html。「最新の体験レポート」3件と「ジャンルから探す」を区別 |
| ジャンル別件数 | assets/js/app.js。最新カードに含まれる件数と、下段の「ほかN件」を表示。上段に同ジャンルがない場合は「N件」 |
| 記事NEWS | assets/js/app.js。表示中の記事データの新しい順。全3枠のうち手動告知分を確保して記事で補充し、日付順に表示 |
| 作品などの手動告知 | assets/js/content.js の news。先頭から最大3件。掲載終了時はここで更新 |
| 自動取得記事・紹介文 | articles-auto.json は生成専用。assets/js/article-notes.js の値がある場合はその値を優先 |
| スライド | index.html と assets/js/app.js。Echo AgainとLINEスタンプは動画サムネイルを初期表示し、手動で切替。Echo Againの矢印は画像の中央左右。うまさんカメラとSUZURIグッズも手動切替のみ |
| 商品・作例の表示 | assets/css/journal.css の「現行」ブロック。商品は contain、カメラ作例は cover。商品の追加拡大は行わない |
| 壁紙 | index.html のプレビュー・wallpaper-dialog、media/wallpaper-*.jpg。4枚を個別保存。X検索は追加作品の入口 |
| 作品カード | assets/js/app.js。無料・所要時間などの条件をタイトル上に配置。Echo Againは画像枠内のサムネイルで画像と動画を切り替える。動画再生は明示的なクリック時のみ |
| 壁紙〜グッズの配置 | index.html の mini-copy / mini-actions と assets/css/journal.css。PCは左右の段を共有し、タブレットは画像・説明の段を共有、スマホは1列。主ボタンは説明欄の下端にそろえる。LINEスタンプの動画は画像スライドの1枚として表示 |
| 動画からの導線 | assets/js/app.js。動画ダイアログ内に元の主ボタンと同じ遷移先を表示（Echo Againは紹介記事、LINEスタンプは販売一覧） |
| 押した先の共通画面 | assets/js/playful.js / assets/css/dialogs.css。見出しと閉じる・下部操作を固定し、本文だけスクロール。画像拡大は縦横比に応じた幅。壁紙は選択に連動する下部の保存ボタンに一本化。CSSはassets/css/playful.cssの後にassets/css/dialogs.cssを読む |
| フッターのリンク | assets/css/journal.css / assets/css/playful.css / assets/js/playful.js。SNSとページ先頭リンクは幅・高さとも44px以上。5種のSNSは茶色のSimple Icons SVG、SUZURIは生成したsocial-suzuri.png。囲み枠なし。ライセンス・免責文はdocs/licenses/simple-icons-*.txt |
| カメラ | contents/umasan-camera.html / assets/css/camera.css / assets/js/camera.js。全範囲をcontain表示。操作欄は開閉式、ドラッグ・2本指で拡縮と回転・スライダー・左右反転・位置リセット。撮影後に確認してPNG保存。カメラは取得した解像度を維持、読み込み写真は長辺4096pxを上限に合成。写真は端末内処理 |
| 背景・ボタン演出 | assets/css/playful.css。淡い茶色の濃淡を交互に配置。ボタンの光・浮き上がりを除去。通常リンクの矢印は外し、活動履歴とメディア操作に限定。左右切替は角丸プレートのSVG |
| 活動写真 | index.html の memories と assets/css/journal.css の photo-print。生成素材 media/activity-photo-mount.webp を台紙に使用。元写真全体、名称・年を重ねて表示 |
| 紹介画像 | assets/css/journal.css と assets/css/responsive.css。PC225px、タブレット180px、スマホは欄の75%・最大250px。スマホでは概要以外の紹介文を開閉できる |

基本の3層CSSに、追加機能用のassets/css/playful.cssを重ねています。作品・壁紙〜グッズのカード指定はassets/css/journal.cssで管理します。サイト全体のCSS統合は別作業です。文章・年表・作品設定を過去の作業スクリプトで一括上書きしないでください。過去のカード配置記録は creative-ops の `projects/tabisuru-umasan/web-docs/card-layout-20260909.md` にあり、現行の動画・ボタン配置は上表を参照してください。

カラーアイコン7種類は `media/icon-*-color.png`。透過PNGを128pxに縮小して配置し、原本はcreative-opsの `projects/tabisuru-umasan/web-source/` に保管しています。組み込み画像生成ツールを使用し、プロンプトと原本対応は `web-docs/color-icons-20260909.json` に記録しています。

### 壁紙の配布ファイル

カメラ用の新しい6ポーズは `media/camera-pose-*.png`。組み込み画像生成で作成し、透過と元の画像寸法を維持しています。参照シート・生成プロンプト・原本対応はローカルの生成記録に保管し、リポジトリには含めません。SNSアイコンはSimple Iconsを使用し、ライセンス・免責文は `docs/licenses/simple-icons-*.txt` に収録しています。

- wallpaper-moon.jpg：420×908px。既存ファイルを無加工で使用。
- wallpaper-tower.jpg / wallpaper-gate.jpg：420×910px。既存ファイルを無加工で使用。
- wallpaper-lily.jpg：555×1200px。今回添付された HIB9p2Fb0AAIoIh.jpg を無加工でコピー。「すずらんと光の門」は絵柄を区別する表示名で、公開時の正式タイトルや日付は未確認。
- 既存3枚の高解像度原本は未確認です。原本入手時は絵柄を照合して差し替えます。拡大加工はしていません。
- 「画像を開く」は除去し、保存操作に統一。スマホ見本の背景グラデーションも除去。実機の写真アプリへの保存は別途確認が必要です。

自動更新ワークフローは設定ファイルの存在を確認した段階です。ローカル表示の連動とGitHubでの定期実行・公開は別の検証です。

### HERO・カメラの追加調整（2026-09-10）

- HEROとNEWSは `hero-region` 内で背景を共有し、日本語見出しを先に表示。スマホは `media/hero-mobile-storybook.webp` を使用。配置は `assets/css/responsive.css`。
- カメラは中央の撮影ボタン、写真選択、編集メニューの開閉を基本操作にする。詳細調整は必要なときだけ表示。横向きの低い画面では操作欄を右へ移す。生成アイコンは `media/camera-capture.png`、他の操作アイコンは同系色のSVG。
- 透かしは出力にだけ追加し、壁紙原本は変更しない。カメラ撮影は取得解像度を維持する。
- `node scripts/image-save.test.cjs`：追加ダイアログなし、共有、キャンセル、ダウンロード、透かし、古い選択結果の破棄を確認。
- ローカルの `docs/private/camera-ui-check.html` は実カメラを使わない確認用。生成プロンプトと原本対応は `docs/private/ui-update-20260910.md`。どちらもGit管理外。

### セクション別の背景（2026-09-10）

`assets/css/responsive.css` で `media/section-play.webp`（ランタンと地図）、`section-discover.webp`（チケットと旅先）、`section-with.webp`（湖畔とカメラ）、`section-shop.webp`（贈り物）、`section-about.webp`（旅の手帳）を割り当てています。各画像は透過WebPで、カードの背後・端に配置します。従来の植物1種類の繰り返しを置き換え、既存の淡い背景色の濃淡は維持します。生成方法・プロンプト・原本の対応は `docs/private/section-backgrounds-20260910.json`。

PC・タブレットのHEROは画像全体を収め、お知らせの右側をより透明にしています。スマホ専用HEROの構図は維持します。

### 絞り込み・おまかせ欄・ナビ（2026-09-10）

ジャンル絞り込みは全端末で3等分の共通枠。おまかせ欄は記事一覧より前の独立した行に配置し、絞り込み件数で位置が変わらない構造。幅1000px以上ではヘッダーの全メニューを表示する。ショップ装飾は個別カラムではなく共通背景の右下を基準に配置する。指定は `assets/css/responsive.css`。
