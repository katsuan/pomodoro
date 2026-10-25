// 前の名前のファイル（2026-11-25 ごろ消す）。新しいファイル（js/store.js・js/phase.js・js/sound.js・app.js）を読むだけ
// 前の index.html を覚えているブラウザ（LINE の中など）でも開けるように
["js/store.js", "js/phase.js", "js/sound.js", "app.js"].forEach(function (src) {
    document.write('<script src="' + src + '"><\/script>');
});
