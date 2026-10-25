# ⏱️ ぽもくる（PomoQ）

集中と休憩をくり返すポモドーロタイマー。名前は「ぽもくる」（ポモドーロ＋くり返しの「くるくる」）。英字は PomoQ（おくるん＝OQRN・さくせん盤＝SAQSEN・キロっく＝kiloQ と同じ作り方で、「く」を Q にする）。名前とロゴは設定（右下の ⚙️）の中にだけ出し、タイマーの画面はすっきりさせておく。

公開URL: https://katsuan.github.io/pomodoro/


設定のカードの部品（名前・ひとこと・見出し・よく使う組み合わせ・ボタン）は、おくるんの Q キット（`https://katsuan.github.io/line-share/shared/ui.css`。使い方はおくるんの README）。色は `style.css` の `:root` の `--ls-accent` など。タイマーの画面は Q キットを使わず、前のまま（`html` の文字の大きさを画面に合わせている作りのため）。
## アイコン・ロゴ・OGP

`python3 tools/icon.py` で作る（図形を描く部分は、となりのおくるん（`~/GitHub/q-oqrn`。GitHub のリポジトリ名は line-share）の `tools/brandkit.py`）。

- アイコン（`icon.svg`・`icon-32.png`・`apple-touch-icon.png`・`icon-512.png`・`icon-maskable-512.png`）：おくるんと同じ角の丸い四角に、アプリの画面と同じ色（背景は濃い灰色 #4d4d4d、進む輪は黄色 #F9BE00、針はピンク #DF7861）。輪はポモドーロ画面と同じく 12 時から時計回りに進む矢印で、30分を1周として 25分の作業ぶん（300°）が矢印、10 時〜12 時のすき間が 5分の休憩。12 時の真上にトマトのヘタを兼ねた竜頭、右下に白いしっぽを輪の下に重ねて Q に見せる
- 横長のロゴ（`logo.svg`）：P・o・m・o はフォント（Jua）、Q はアイコンと同じ形
- 共有したときの画像（`ogp.png`、1200×630）
- ホーム画面に追加したとき用に `manifest.webmanifest`

おくるんのトップの「ほかのツール」（line-share の `data/hub-links.json`）には「ぽもくる 〜PomoQ〜」として、このアイコン付きで載せている。

## URL パラメーター

| キー | 内容 |
|---|---|
| `work` / `break` | 作業・休憩の分（初期値 25 / 5）。この2つだけは URL に残し、ブックマーク・共有に使える |
| `start` | 区切りの起点（`9`・`9:30`・`0930`。初期値 9:00） |
| `counter` / `vol` | 回数・音量バーを出すとき `1`（初めは出さない） |
| `state` / `outside` | 状態欄・円や日時を消すとき `0` |
| `sound` | 区切りの音を短いピッ・ポーンにするとき `simple`（初めはチャイム）。設定の「区切りの音」でも選べる |

`work`・`break` 以外は、開いたときに端末（localStorage）に保存して URL からは消す（流入口の目印などのほかのパラメーターも消す）。設定は右下の ⚙️ からも変えられる。値はすべて決まった範囲の数・決まった値にそろえてから使う。

## ファイル

| ファイル | 中身 |
|---|---|
| `index.html`・`style.css` | 画面と見た目 |
| `app.js` | 画面の入口（表示・設定パネル） |
| `js/store.js` | 設定の読み書き（URL・端末の `pomodoro:settings`） |
| `js/phase.js` | 時計の時刻から、作業か休憩か・残り時間・何回目かを出す |
| `js/sound.js` | 区切りの音と音量 |
| `manifest.webmanifest`・`sw.js` | ホーム画面に置くときの設定と、電波がないときに開く仕組み |
| `script.js`・`manifest.json` | 前の名前のファイル。前の index.html を覚えているブラウザのために残している（`script.js` は新しいファイルを読むだけ）。2026-11-25 ごろ消す |

テスト：`node --test test/`（URL・端末に残した設定の読みこみと、残り時間の計算、読みこみの印 `?v=` のそろい）

## 紹介の窓口

「📤 ぽもくるを紹介する」（設定（⚙️）のいちばん下）は、おくるんの `shared/tool-share.js`（`data-tool="pomoq"`）。押すとおくるんで濃い灰色の紹介カードを作って LINE に送れる（リンクのシェアも選べる）。中身は line-share の `data/hub-links.json` の `key: "pomoq"`。
