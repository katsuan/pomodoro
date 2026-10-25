// ぽもくる：区切りの音（チャイム・合成音）と音量
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
