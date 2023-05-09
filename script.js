const timerDisplay = document.getElementById('timer');

let timer;
let audio;
let isWorking = true;
let params = getParameters();

const soundSources = {
    work: 'sound/学校のチャイム.mp3',
    break: 'sound/「そこまで」.mp3'
};

function getParameters() {
    // 作業時間の設定
    return {
        break: 5,
        work: 25,
        startHour: 9,
    };
}

function playSound(soundSource) {
    // 音声を設定
    const audio = new Audio(soundSource);
    audio.play();
}

function zeroPadding(number, length) {
    // 指定した桁数になるまで数値の前に0をつける関数
    return (Array(length).join("0") + number).slice(-length);
}

function calculateTimeText() {
    // 現在時刻を表示する
    const date = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    // const seconds = date.getSeconds() + 1;
    return `${month}/${day} ` +
        [
            zeroPadding(hours, 2),
            zeroPadding(minutes, 2),
        ].join(":");
}

function switchToWork() {
    isWorking = true;
    playSound('sound/学校のチャイム.mp3');
    // clearInterval(timer);
    timer = setInterval(countDown, 1000);
    timerDisplay.classList.remove('break-time');
    timerDisplay.classList.add('work-time');
    document.getElementById('status').textContent = "作業中";
}

function switchToBreak() {
    isWorking = false;
    playSound('sound/「そこまで」.mp3');
    // clearInterval(timer);
    timer = setInterval(countDown, 1000);
    timerDisplay.classList.remove('work-time');
    timerDisplay.classList.add('break-time');
    document.getElementById('status').textContent = "休憩中";
}

function calculateTimerText(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const remainingSeconds = 59 - seconds;
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    const remainingMinutes =
        (minutes < parameters.work ? parameters.work : interval) -
        minutesInInterval -
        1;
    return [
        zeroPadding(remainingMinutes, 2),
        zeroPadding(remainingSeconds, 2),
    ].join(":");
}

function calculateSessionText(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = (parameters.work + parameters.break) / 2;
    const minutesInInterval = minutes % interval;
    const sessionNumber = Math.floor((date.getHours() - parameters.startHour) * 2 + (minutes / 30)) + 1;
    console.log("処理実行")
    if (minutesInInterval < parameters.work) {
        return `POMODORO #${sessionNumber}`;
    } else {
        return `BREAK #${sessionNumber}`;
    }
}

function calculateRemainingPathDashArray(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return `${283 * minutesInInterval / interval} 283`;
}

setInterval(function () {
    const parameters = getParameters();

    const timeElement = document.getElementById("time-label");
    timeElement.textContent = calculateTimeText();

    const timerElement = document.getElementById("timer-label");
    timerElement.textContent = calculateTimerText(parameters);

    const sessionElement = document.getElementById("counter");
    sessionElement.textContent = calculateSessionText(parameters);

    const remainingPathElement = document.getElementById("timer-circle-outer");
    remainingPathElement.setAttribute("stroke-dasharray", calculateRemainingPathDashArray(parameters));
}, 1000);

function playAudio(audio) {
    audio.addEventListener('canplaythrough', function () {
        audio.play();
    });
}
