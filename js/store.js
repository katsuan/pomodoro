// ぽもくる：設定（作業・休憩の分・開始時刻・表示・音）の読み書き
// 設定の優先順位: URL パラメーター ＞ 画面で設定した値(localStorage の pomodoro:settings) ＞ 初期値
// ふつうの script（index.html の順に読む）。ここで決めた parameters などは、あとの js/・app.js からも使う
// 読まれるところ：index.html（いちばん先。ここの parameters を js/sound.js・app.js も使う）

const STORAGE_KEY = "pomodoro:settings";
const DEFAULTS = {
    work: 25,          // 作業(分)        ?work=
    break: 5,          // 休憩(分)        ?break=
    start: "09:00",    // 区切りの起点    ?start=9 / 9:30 / 0930
    displayState: 1,   // 状態欄 ?state=0 で非表示（今は文字を入れていないので見た目は変わらない）
    displayCounter: 0, // 回数            ?counter=1 で表示（初めは出さない）
    displayVolume: 0,  // 音量バー        ?vol=1 で表示（初めは出さない）
    displayOutside: 1, // 円・日時など    ?outside=0 で時間だけの小さい表示
    sound: "chime",    // 区切りの音      ?sound=simple でピッ・ポーンの短い音
    volume: 0
};
// URL パラメーター名との対応
const PARAM_NAMES = {
    work: "work", break: "break", start: "start",
    displayState: "state", displayCounter: "counter", displayVolume: "vol", displayOutside: "outside",
    sound: "sound"
};

// 数を、指定の桁まで前に 0 を足した文字にする
function zeroPadding(number, length) {
    return number.toString().padStart(length, "0");
}

// 整数にして min〜max に入れる（数でなければ fallback）
function clampInt(value, min, max, fallback) {
    const number = parseInt(value, 10);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

// "9" / "9:30" / "0930" / "09:30" → "09:30"
function normalizeStart(value) {
    const text = String(value ?? "").trim();
    const match = text.match(/^(\d{1,2})(?::?(\d{2}))?$/);
    if (!match) return DEFAULTS.start;
    const hours = Math.min(23, parseInt(match[1], 10));
    const minutes = Math.min(59, parseInt(match[2] || "0", 10));
    return `${zeroPadding(hours, 2)}:${zeroPadding(minutes, 2)}`;
}

// 設定を決まった範囲・決まった値にそろえる
function normalizeSettings(raw) {
    return {
        work: clampInt(raw.work, 1, 180, DEFAULTS.work),
        break: clampInt(raw.break, 1, 120, DEFAULTS.break),
        start: normalizeStart(raw.start),
        displayState: clampInt(raw.displayState, 0, 1, DEFAULTS.displayState),
        displayCounter: clampInt(raw.displayCounter, 0, 1, DEFAULTS.displayCounter),
        displayVolume: clampInt(raw.displayVolume, 0, 1, DEFAULTS.displayVolume),
        displayOutside: clampInt(raw.displayOutside, 0, 1, DEFAULTS.displayOutside),
        sound: raw.sound === "simple" ? "simple" : "chime",
        volume: Math.min(1, Math.max(0, Number(raw.volume) || 0))
    };
}

// 端末に残した設定を読む（読めないときは空）
function loadSaved() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
        return {};
    }
}

// 設定を端末に残す
function save(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        // 保存できない環境でも、表示中はそのまま使える
    }
}

// いまの設定を決める（URL ＞ 端末に残した設定 ＞ 初期値）
function getParameters() {
    const params = new URL(window.location.href).searchParams; // qcheck-ok: W5 よそへは飛ばない。値は normalizeSettings で数・決まった値にそろえる
    const fromUrl = {};
    for (const [key, name] of Object.entries(PARAM_NAMES)) {
        if (params.has(name)) fromUrl[key] = params.get(name);
    }
    return normalizeSettings(Object.assign({}, DEFAULTS, loadSaved(), fromUrl));
}

// URL に残すのは作業・休憩の分だけ（初期値と同じなら書かない）。ブックマーク・共有にそのまま使える。
// ほかのパラメーター（開始時刻・表示・流入口の目印など）は読み込んだら端末に保存して、URL からは消す
const URL_KEYS = ["work", "break"];

// 作業・休憩の分だけを URL に残す（初期値と同じなら書かない）
function writeUrl(settings) {
    const url = new URL(window.location.href);
    url.search = "";
    for (const key of URL_KEYS) {
        if (settings[key] !== DEFAULTS[key]) url.searchParams.set(PARAM_NAMES[key], String(settings[key]));
    }
    history.replaceState(null, "", url);
}

let parameters = getParameters();
if (window.location.search) {
    save(parameters);
    writeUrl(parameters);
}
