// ＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃
// ポモドーロの基本JS
// 時計の時刻に合わせて「作業 → 休憩」をくり返す。区切りは毎日「開始時刻」から数える。
// 設定の優先順位: URL パラメーター ＞ 画面で設定した値(localStorage) ＞ 初期値
// ＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃＃

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

function zeroPadding(number, length) {
    // 指定桁まで 0 を追加
    return number.toString().padStart(length, "0");
}

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

function loadSaved() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
        return {};
    }
}

function save(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        // 保存できない環境でも、表示中はそのまま使える
    }
}

function getParameters() {
    // URL パラメーターを読む（指定されたものだけ上書き）
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

// ＃＃＃＃ 時刻の計算（残り時間・状態・回数・円の進み具合はすべてここから出す） ＃＃＃＃

function startOfCycle(date, settings) {
    const [hours, minutes] = settings.start.split(":").map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}

function getPhase(settings, date = new Date()) {
    const workMs = settings.work * 60 * 1000;
    const intervalMs = (settings.work + settings.break) * 60 * 1000;
    const elapsed = date.getTime() - startOfCycle(date, settings).getTime();
    // 開始時刻より前もくり返しが続いているものとして数える
    const position = ((elapsed % intervalMs) + intervalMs) % intervalMs;
    const isWork = position < workMs;
    return {
        isWork,
        className: isWork ? "work" : "break",
        remainingMs: isWork ? workMs - position : intervalMs - position,
        progress: position / intervalMs,
        session: Math.floor(elapsed / intervalMs) + 1
    };
}

function formatRemaining(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    return `${zeroPadding(Math.floor(totalSeconds / 60), 2)}:${zeroPadding(totalSeconds % 60, 2)}`;
}

function calculateTimeText(date = new Date()) {
    return `${date.getMonth() + 1}/${date.getDate()} ${zeroPadding(date.getHours(), 2)}:${zeroPadding(date.getMinutes(), 2)}`;
}

function calculateSessionText(phase) {
    const number = zeroPadding(Math.max(1, phase.session), 2);
    return phase.isWork ? `pomodoro #${number}` : `break #${number}`;
}

function displayParameters(settings) {
    return `work ${settings.work} | break ${settings.break}`;
}

function circleLength(circle) {
    return Math.round(2 * Number(circle.getAttribute("r")) * Math.PI);
}

// ＃＃＃＃ 音 ＃＃＃＃

// 音はすべて Web Audio の音量つまみ（masterGain）を通して鳴らす。
// 音量バーを動かすと、鳴っている途中の音もすぐ大きさが変わる（iPhone は <audio> の音量を変えられないので、この形にしている）
// 音の種類：chime＝チャイム・「そこまで」（mp3）／ simple＝ピッ・ピッ・ピー（作業）とポーン・ポーン（休憩）の合成音
const CHIME_FILES = { work: "sound/学校のチャイム.mp3", break: "sound/「そこまで」.mp3" };
// [高さ(Hz), 鳴りはじめ(秒), 長さ(秒)]
const SIMPLE_TONES = {
    work: [[880, 0, 0.12], [880, 0.22, 0.12], [1320, 0.44, 0.5]],
    break: [[784, 0, 0.7], [523, 0.55, 1.1]]
};

let audioContext = null;
let masterGain = null;
const chimeBuffers = {};

function getAudio() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContext = new AudioContextClass();
        masterGain = audioContext.createGain();
        masterGain.gain.value = parameters.volume;
        masterGain.connect(audioContext.destination);
    }
    return audioContext;
}

// 画面を一度も触っていないと音を出せない（ブラウザの決まり）。触ったときに音の準備をしておく
function unlockAudio() {
    const context = getAudio();
    if (context && context.state === "suspended") {
        context.resume().then(syncUnlockHint).catch(function () {});
    }
    syncUnlockHint();
}

// 音量が 0 より大きいのに音を出せない（まだ画面を触っていない）ときは「🔔 タップで音を有効に」を出す。
// 区切りの音が鳴らなかった、を防ぐ（触ったら消える）
function syncUnlockHint() {
    const hint = document.getElementById("sound-unlock");
    if (!hint) return;
    const running = audioContext && audioContext.state === "running";
    hint.hidden = !(parameters.volume > 0) || Boolean(running);
}

function setVolume(volume) {
    if (!masterGain) return;
    // ぷつっと鳴らないよう、ごく短くなめらかに変える
    masterGain.gain.setTargetAtTime(volume, audioContext.currentTime, 0.015);
}

// 鳴らせる状態か（まだ触っていないページでは鳴らさない。あとから遅れて鳴らないように）
async function readyAudio() {
    const context = getAudio();
    if (!context) return null;
    if (context.state !== "running") {
        await Promise.race([context.resume().catch(function () {}), new Promise(function (resolve) { setTimeout(resolve, 300); })]);
    }
    return context.state === "running" ? context : null;
}

function loadChime(source) {
    if (!chimeBuffers[source]) {
        chimeBuffers[source] = fetch(source)
            .then(function (response) { return response.arrayBuffer(); })
            .then(function (data) {
                return new Promise(function (resolve, reject) { audioContext.decodeAudioData(data, resolve, reject); });
            })
            .catch(function (error) {
                delete chimeBuffers[source];
                throw error;
            });
    }
    return chimeBuffers[source];
}

function playTones(context, tones) {
    const now = context.currentTime + 0.02;
    tones.forEach(function ([frequency, at, length]) {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(0.0001, now + at);
        envelope.gain.exponentialRampToValueAtTime(0.7, now + at + 0.01);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + at + length);
        oscillator.connect(envelope).connect(masterGain);
        oscillator.start(now + at);
        oscillator.stop(now + at + length + 0.05);
    });
}

// kind：work（作業の始まり）／ break（休憩の始まり）。音量 0 でも鳴らしておき、途中で上げれば聞こえる
async function playCue(kind) {
    const context = await readyAudio();
    if (!context) return;
    if (parameters.sound === "simple") {
        playTones(context, SIMPLE_TONES[kind]);
        return;
    }
    try {
        const source = context.createBufferSource();
        source.buffer = await loadChime(CHIME_FILES[kind]);
        source.connect(masterGain);
        source.start();
    } catch (error) {
        console.error(error);
    }
}

let lastPhaseClass = null;

function switchScene(phase) {
    // 作業 ⇄ 休憩 が切り替わった瞬間に音を鳴らす（ページを開いた直後は鳴らさない）
    if (lastPhaseClass && lastPhaseClass !== phase.className) {
        playCue(phase.isWork ? "work" : "break");
    }
    lastPhaseClass = phase.className;
}

// ＃＃＃＃ 表示 ＃＃＃＃

function applyLayout(settings) {
    // 表示する要素の切り替え
    const show = (id, visible) => {
        document.getElementById(id).style.display = visible ? "" : "none";
    };
    const compact = settings.displayOutside === 0;
    show("state", settings.displayState === 1);
    show("counter", settings.displayCounter === 1 && !compact);
    show("volume", settings.displayVolume === 1);
    show("outside", !compact);
    show("time-label", !compact);
    show("status", !compact);
    // 時間だけの小さい表示（配信画面に重ねる用途など）
    document.body.classList.toggle("is-compact", compact);
    document.getElementById("settings-button").hidden = compact;

    const base = document.getElementById("timer-circle-base");
    const length = circleLength(base);
    base.setAttribute("stroke-dasharray", `${(length * settings.work) / (settings.work + settings.break)} ${length}`);
}

function updateTimer() {
    const phase = getPhase(parameters);
    const timerLabel = document.getElementById("timer-label");
    const inner = document.getElementById("timer-circle-inner");

    timerLabel.textContent = formatRemaining(phase.remainingMs);
    timerLabel.className = phase.className;
    document.getElementById("time-label").textContent = calculateTimeText();
    document.getElementById("counter").textContent = calculateSessionText(phase);
    document.getElementById("status").textContent = displayParameters(parameters);
    const length = circleLength(inner);
    inner.setAttribute("stroke-dasharray", `${length * phase.progress} ${length}`);

    switchScene(phase);
}

// 秒の変わり目にそろえて更新する（setTimeout の遅れが積み重ならないように）
function tick() {
    updateTimer();
    setTimeout(tick, 1000 - (Date.now() % 1000) + 10);
}

// ＃＃＃＃ 設定パネル ＃＃＃＃

function bindSettings() {
    const panel = document.getElementById("settings");
    const form = document.getElementById("settings-form");
    const open = document.getElementById("settings-button");
    const close = document.getElementById("settings-close");
    const copy = document.getElementById("settings-copy");
    const reset = document.getElementById("settings-reset");
    const volumeSliders = [document.getElementById("volume-slider"), form.volume];
    const test = document.getElementById("settings-test");

    function fillForm() {
        form.work.value = parameters.work;
        form.break.value = parameters.break;
        form.start.value = parameters.start;
        form.displayCounter.checked = parameters.displayCounter === 1;
        form.displayVolume.checked = parameters.displayVolume === 1;
        form.sound.value = parameters.sound;
        document.getElementById("settings-cycle").textContent =
            `${parameters.work + parameters.break}分ごとに、${parameters.start} から数えてくり返します`;
    }

    // 変えたらすぐ反映し、保存して URL にも書き戻す
    function apply(next) {
        parameters = normalizeSettings(Object.assign({}, parameters, next));
        save(parameters);
        writeUrl(parameters);
        applyLayout(parameters);
        lastPhaseClass = null; // 設定を変えた直後に音が鳴らないように
        updateTimer();
        fillForm();
    }

    open.addEventListener("click", function () {
        fillForm();
        panel.hidden = false;
        // はじめて設定を開いた人にだけ、使い方を3つ（「わかった」で消え、二度と出さない）
        LineShareUI.firstTip("pomoq", [
            "作業と休憩の長さを選びます（よく使う組み合わせは押すだけ）",
            "開始時刻から数えてくり返すので、同じ設定ならみんな同じ時計になります",
            "「🔗 リンクをコピー」で、同じ設定をほかの人にも送れます"
        ], form.querySelector(".ls-chips"));
        form.work.focus();
    });
    close.addEventListener("click", function () {
        panel.hidden = true;
        open.focus();
    });
    panel.addEventListener("click", function (event) {
        if (event.target === panel) panel.hidden = true;
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !panel.hidden) panel.hidden = true;
    });

    form.addEventListener("change", function (event) {
        if (event.target.name === "volume") return; // 音量は下の input で反映ずみ
        apply({
            work: form.work.value,
            break: form.break.value,
            start: form.start.value,
            displayCounter: form.displayCounter.checked ? 1 : 0,
            displayVolume: form.displayVolume.checked ? 1 : 0,
            sound: form.sound.value
        });
    });
    form.addEventListener("submit", function (event) {
        event.preventDefault();
    });

    // −／＋ ボタン（data-step-for="work" data-step="-5" など）
    form.querySelectorAll("[data-step-for]").forEach(function (button) {
        button.addEventListener("click", function () {
            const name = button.dataset.stepFor;
            apply({ [name]: Number(form[name].value) + Number(button.dataset.step) });
        });
    });
    // よく使う組み合わせ
    form.querySelectorAll("[data-preset]").forEach(function (button) {
        button.addEventListener("click", function () {
            const [work, rest] = button.dataset.preset.split("/");
            apply({ work, break: rest });
        });
    });

    copy.addEventListener("click", async function () {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // 季節の絵文字をときどき（Q キットの season.js。読めていなければ付けない）
            const done = "🔗 この設定のリンクをコピーしました";
            LineShareUI.toast(window.QSeason ? QSeason.decorate(done) : done);
        } catch (error) {
            LineShareUI.ask({ title: "長押ししてコピーしてね", input: window.location.href, readonly: true, ok: "閉じる", cancel: null });
        }
    });
    // 聞かずに戻して、トーストの「元に戻す」で前の設定に戻せる
    reset.addEventListener("click", function () {
        const before = Object.assign({}, parameters);
        apply(Object.assign({}, DEFAULTS, { volume: parameters.volume, sound: parameters.sound }));
        LineShareUI.toast("初期値に戻しました", {
            actionLabel: "元に戻す",
            onAction: function () { apply(before); }
        });
    });

    // 試しに鳴らす（作業の始まりの音）。音量が 0 なら少し上げてから鳴らす
    test.addEventListener("click", function () {
        if (!(parameters.volume > 0)) setVolumeFrom(0.5);
        playCue("work");
    });

    // 音量バー（タイマーの画面と設定の2つ）。動かした瞬間に、鳴っている音の大きさも変わる
    function setVolumeFrom(value, origin) {
        parameters.volume = Math.min(1, Math.max(0, Number(value) || 0));
        volumeSliders.forEach(function (slider) {
            if (slider !== origin) slider.value = String(parameters.volume);
        });
        unlockAudio();
        setVolume(parameters.volume);
        save(parameters);
    }
    volumeSliders.forEach(function (slider) {
        slider.value = String(parameters.volume);
        slider.addEventListener("input", function () {
            setVolumeFrom(slider.value, slider);
        });
    });

    // 画面のどこかを触ったら、音を出せるように準備する
    ["pointerdown", "keydown"].forEach(function (type) {
        document.addEventListener(type, unlockAudio, { passive: true });
    });
}

bindSettings();
syncUnlockHint();
document.getElementById("sound-unlock").addEventListener("click", function () {
    unlockAudio();
    playCue("work"); // 有効になったことが音でわかるように、作業の始まりの音を1回だけ
});
applyLayout(parameters);
tick();
