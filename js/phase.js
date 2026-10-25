// ぽもくる：時計の時刻から、いまが作業か休憩か・残り時間・何回目かを出す（画面には触らない）
// 区切りは毎日「開始時刻」から数える
// 読まれるところ：index.html（js/store.js のあと）。app.js が使う

function startOfCycle(date, settings) {
    const [hours, minutes] = settings.start.split(":").map(Number);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
}

// いまが作業か休憩か・残り（ミリ秒）・円の進み（0〜1）・何回目かを返す
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

// 残り時間を「mm:ss」の文字にする
function formatRemaining(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    return `${zeroPadding(Math.floor(totalSeconds / 60), 2)}:${zeroPadding(totalSeconds % 60, 2)}`;
}

// 日時の表示（「10/25 09:30」）
function calculateTimeText(date = new Date()) {
    return `${date.getMonth() + 1}/${date.getDate()} ${zeroPadding(date.getHours(), 2)}:${zeroPadding(date.getMinutes(), 2)}`;
}

// 何回目かの表示（「pomodoro #03」・「break #03」）
function calculateSessionText(phase) {
    const number = zeroPadding(Math.max(1, phase.session), 2);
    return phase.isWork ? `pomodoro #${number}` : `break #${number}`;
}

// 設定の表示（「work 25 | break 5」）
function displayParameters(settings) {
    return `work ${settings.work} | break ${settings.break}`;
}
