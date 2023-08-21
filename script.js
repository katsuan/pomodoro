function getParameters() {
    // URLパラメーターを定義
    const defaultValues = {
        break: 5,
        work: 25,
        startHour: 9,
        displayDate: 1,
        displayState: 1,
        displayVolume: 1,
        displayOutside: 1,
        displayCounter: 1,
    };

    const params = new URL(window.location.href).searchParams;

    const parseParam = (paramName) => {
        const paramString = params.get(paramName);
        return paramString ? parseInt(paramString, 10) : defaultValues[paramName];
    };
    return {
        break: parseParam("break"),
        work: parseParam("work"),
        startHour: parseParam("start"),
        displayDate: parseParam("date"),
        displayState: parseParam("state"),
        displayVolume: parseParam("vol"),
        displayOutside: parseParam("outside"),
        displayCounter: parseParam("counter"),
    };
}
// パラメーターを取得
const parameters = getParameters();

function zeroPadding(number, length) {
    // 指定桁まで 0 を追加
    return number.toString().padStart(length, "0");
}

function calculateClassName(parameters) {
    // 現在時間のステータス算出
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

    return `${zeroPadding(remainingMinutes, 2)}:${zeroPadding(remainingSeconds, 2)}`;
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
    function playSound(source, volume) {
        // 音源・音量を指定して再生
        if (volume !== "0") {
            const audio = new Audio(source);
            audio.volume = volume;
            audio.play();
        }
    }
}

function updateDisplay(targetId, contentId) {
    // スタイルの変更を適用
    const targetLabel = document.getElementById(targetId);
    document.getElementById(contentId).textContent = targetLabel.className;
    document.body.style.fontSize = "16vw";
    document.body.style.flexDirection = "column";
}

function displayState(parameters) {
    if (parameters.displayState) {
        updateDisplay("timer-label", "state")
    }
}

function displayCounter(parameters) {
    if (parameters.displayCounter) {
        updateDisplay("timer-label", "counter")
    }
}

function displayVolume(parameters) {
    if (parameters.displayVolume) {
        updateDisplay("volume-slider", "state")
    }
}

function hideRange(rangeList) {
    // 要素の非表示設定
    rangeList.forEach(rangeId => {
        const rangeElement = document.getElementById(rangeId);
        rangeElement.style.display = "none";
    });
}

if (parameters.displayDate === 0) {
    const range = ["time-label"]
    hideRange(range);
}

if (parameters.displayVolume === 0) {
    const range = ["volume"]
    hideRange(range);
}

if (parameters.displayOutside === 0) {
    const range = ["outside", "counter", "time-label"];
    hideRange(range);
}

if (parameters.displayCounter === 0) {
    const range = ["counter"];
    hideRange(range);
}

function updateTimer() {
    const timerLabel = document.getElementById("timer-label");
    const timeLabel = document.getElementById("time-label");
    const counter = document.getElementById("counter");
    const timerCircleInner = document.getElementById("timer-circle-inner");
    const status = document.getElementById("status");
    const timerCircleBase = document.getElementById("timer-circle-base");

    timerLabel.textContent = calculateTimerText(parameters);
    timerLabel.className = calculateClassName(parameters);
    timeLabel.textContent = calculateTimeText();
    counter.textContent = calculateSessionText(parameters);
    timerCircleInner.setAttribute(
        "stroke-dasharray",
        calculateRemainingPathDashArray(parameters, timerCircleInner.getAttribute("r"))
    );
    status.textContent = displayParameters(parameters);

    switchScene(parameters);
    displayState(parameters);
    displayVolume(parameters);
}

setInterval(updateTimer, 1000);

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
    let sessionCounter =
        Math.floor(((date.getHours() - parameters.startHour) * 60 + minutes) / interval) + 1;
    if (sessionCounter < 0) {
        sessionCounter = Math.floor(((date.getHours() + parameters.startHour) * 60 + minutes) / interval) + 1;
    }
    const sessionType = minutesInInterval < parameters.work ? "pomodoro" : "break";

    return `${sessionType} #${zeroPadding(sessionCounter, 2)}`;
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



const timerCircleBase = document.getElementById("timer-circle-base");
timerCircleBase.setAttribute(
    "stroke-dasharray",
    calculateRemainingPathDashArray2(getParameters(), timerCircleBase.getAttribute("r"))
);
