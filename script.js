function zeroPadding(number, length) {
    // 指定の桁数まで数値の前に 0 をつける
    return number.toString().padStart(length, "0");
}

function calculateClassName(parameters) {
    // 現在がどの時間であるかを算出する。
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return minutesInInterval < parameters.work ? "work" : "break";
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


function switchScene(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    if (seconds === 0) {
        if (minutesInInterval === 0) {
            playSound('sound/学校のチャイム.mp3');
            console.log('開始時間');
        } else if (minutesInInterval === parameters.work) {
            playSound('sound/「そこまで」.mp3');
            console.log('終了時間');
        }
    }
}

function displayState(parameters) {
    if (parameters.displayState) {
        document.getElementById("state").textContent = document.getElementById("timer").className;
        document.body.style.fontSize = "16vw";
        document.body.style.flexDirection = 'column';
    }
}

function getParameters() {
    // パラメーターを定義する
    const params = new URL(window.location.href).searchParams;
    const breakString = params.get("break") || "5";
    const workString = params.get("work") || "25";
    const displayStateString = params.get("displayState") || "0";
    const startHourString = params.get("start") || "9";
    return {
        break: parseInt(breakString, 10),
        work: parseInt(workString, 10),
        displayState: parseInt(displayStateString, 10),
        startHour: parseInt(startHourString, 10),
    };
}

setInterval(function () {
    const parameters = getParameters();
    const element = document.getElementById("timer")
    element.textContent = calculateTimerText(parameters);
    element.className = calculateClassName(parameters);

    const timeElement = document.getElementById("time-label");
    timeElement.textContent = calculateTimeText();

    // const timerElement = document.getElementById("timer-label");
    // timerElement.textContent = calculateTimerText(parameters);

    const sessionElement = document.getElementById("counter");
    sessionElement.textContent = calculateSessionText(parameters);

    const remainingPathElement = document.getElementById("timer-circle-outer");
    remainingPathElement.setAttribute("stroke-dasharray", calculateRemainingPathDashArray(parameters));

    const statusElement = document.getElementById("status");
    statusElement.textContent = displayParameters(parameters);

    switchScene(parameters);

    displayState(parameters);
}, 1000);

function displayParameters(parameters) {
    return `work ${parameters.work} | break ${parameters.break}`;
}

function calculateTimeText() {
    // 現在時刻を作成する
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

function calculateSessionText(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = (parameters.work + parameters.break) / 2;
    const minutesInInterval = minutes % interval;
    const sessionNumber = Math.floor(
        (date.getHours() - parameters.startHour) * 2 + (minutes / parameters.work + parameters.break)) + 1;
    if (minutesInInterval < parameters.work) {
        return `POMODORO #${zeroPadding(sessionNumber, 2)}`;
    } else {
        return `BREAK #${zeroPadding(sessionNumber, 2)}`;
    }
}

function calculateRemainingPathDashArray(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return `${283 * minutesInInterval / interval} 283`;
}

let soundOn = false;

function toggleSound() {
    soundOn = !soundOn;
    let soundBtn = document.getElementById("sound-btn");
    if (soundOn) {
        alert("時報がなります。ボリュームに注意してください")
        soundBtn.textContent = "play";
    } else {
        alert("時報をオフにしました。")
        soundBtn.textContent = "Mute";
    }
}

function playSound(source) {
    // オーディオファイルのURLを指定する
    const audio = new Audio(source);
    audio.play();
}
