function zeroPadding(number, length) {
    // 指定桁まで 0 を追加
    return number.toString().padStart(length, "0");
}

function calculateClassName(parameters) {
    // 現在時間の算出
    const date = new Date();
    console.log(date);
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return minutesInInterval < parameters.work ? "work" : "break";
}

function calculateTimerText(parameters) {
    // タイマー表示の作成
    const date = new Date();
    console.log(date);
    const currentTime = date.getTime();
    const startDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        parameters.startHour
    );
    const elapsedTime = currentTime - startDateTime.getTime();
    const interval = (parameters.work + parameters.break) * 60 * 1000;

    let remainingTime;
    const minutesInInterval = Math.floor((elapsedTime % interval) / 1000 / 60);
    if (minutesInInterval < parameters.work) {
        remainingTime = parameters.work * 60 * 1000 - (elapsedTime % interval);
    } else {
        remainingTime = interval - (elapsedTime % interval);
    }

    const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
    const remainingSeconds = Math.floor((remainingTime / 1000) % 60);

    return `${zeroPadding(remainingMinutes, 2)}:${zeroPadding(
        remainingSeconds,
        2
    )}`;
}

function switchScene(parameters) {
    // Work と Break の切替
    const date = new Date();
    console.log(date);
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    if (seconds === 0) {
        const volumeSlider = document.getElementById("volume-slider").value;
        if (minutesInInterval === 0) {
            playSound("sound/学校のチャイム.mp3", volumeSlider);
            console.log("開始時間");
        } else if (minutesInInterval === parameters.work) {
            playSound("sound/「そこまで」.mp3", volumeSlider);
            console.log("終了時間");
        }
    }
}

function displayState(parameters) {
    if (parameters.displayState) {
        const timerLabel = document.getElementById("timer-label");
        document.getElementById("state").textContent = timerLabel.className;
        document.body.style.fontSize = "16vw";
        document.body.style.flexDirection = "column";
    }
}

function displayCounter(parameters) {
    if (parameters.displayCounter) {
        const timerLabel = document.getElementById("timer-label");
        document.getElementById("counter").textContent = timerLabel.className;
        document.body.style.fontSize = "16vw";
        document.body.style.flexDirection = "column";
    }
}

function displayVolume(parameters) {
    if (parameters.displayVolume) {
        const volumeSlider = document.getElementById("volume-slider");
        document.getElementById("state").textContent = volumeSlider.className;
        document.body.style.fontSize = "16vw";
        document.body.style.flexDirection = "column";
    }
}

function getParameters() {
    // パラメーターを定義
    const params = new URL(window.location.href).searchParams;
    const breakString = params.get("break") || "5";
    const workString = params.get("work") || "25";
    const displayStateString = params.get("displayState") || "1";
    const startHourString = params.get("start") || "9";
    const volumeString = params.get("slider") || "1";
    return {
        break: parseInt(breakString, 10),
        work: parseInt(workString, 10),
        displayState: parseInt(displayStateString, 10),
        startHour: parseInt(startHourString, 10),
        volumeSlider: parseInt(volumeString, 10),
    };
}
// HTMLで非表示にする範囲を取得
const volumeSliderRange = document.getElementById("volume");
// パラメーターを取得
const parameters = getParameters();
// sliderの値が0の場合に範囲を非表示にする
if (parameters.volumeSlider === 0) {
    volumeSliderRange.style.display = "none";
}

function updateTimer() {
    const parameters = getParameters();
    const timerLabel = document.getElementById("timer-label");
    const timeLabel = document.getElementById("time-label");
    const counter = document.getElementById("counter");
    const timerCircleInner = document.getElementById("timer-circle-inner");
    const status = document.getElementById("status");

    timerLabel.textContent = calculateTimerText(parameters);
    timerLabel.className = calculateClassName(parameters);
    timeLabel.textContent = calculateTimeText();
    counter.textContent = calculateSessionText(parameters);
    timerCircleInner.setAttribute(
        "stroke-dasharray",
        calculateRemainingPathDashArray(parameters, timerCircleInner.getAttribute("r"))
    );
    status.textContent = displayParameters(parameters);

    setTimeout(updateTimer, 1000);
    switchScene(parameters);
    displayState(parameters);
    displayVolume(parameters);
}

// setInterval(updateTimer, 1000);
updateTimer();

function displayParameters(parameters) {
    return `work ${parameters.work} | break ${parameters.break}`;
}

function calculateTimeText() {
    const date = new Date();
    console.log(date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day} ${zeroPadding(hours, 2)}:${zeroPadding(minutes, 2)}`;
}

function calculateSessionText(parameters) {
    const date = new Date();
    console.log(date);
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    const sessionCounter =
        Math.floor(((date.getHours() - parameters.startHour) * 60 + minutes) / interval) + 1;
    if (minutesInInterval < parameters.work) {
        return `pomodoro #${zeroPadding(sessionCounter, 2)}`;
    } else {
        return `break #${zeroPadding(sessionCounter, 2)}`;
    }
}

function calculateRemainingPathDashArray(parameters, r) {
    const frame = Math.round(2 * r * Math.PI);
    const date = new Date();
    console.log(date);
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return `${(frame * minutesInInterval) / interval} ${frame}`;
}

function calculateRemainingPathDashArray2(parameters, r) {
    const frame = Math.round(2 * r * Math.PI);
    const interval = parameters.work + parameters.break;
    const work = parameters.work;
    return `${(frame * work) / interval} ${frame}`;
}

function playSound(source, volume) {
    if (volume !== "0") {
        const audio = new Audio(source);
        audio.volume = volume;
        audio.play();
    }
}

const timerCircleBase = document.getElementById("timer-circle-base");
timerCircleBase.setAttribute(
    "stroke-dasharray",
    calculateRemainingPathDashArray2(getParameters(), timerCircleBase.getAttribute("r"))
);
