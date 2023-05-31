function zeroPadding(number, length) {
    // 指定の桁数まで数値の前に 0 をつける
    return number.toString().padStart(length, "0");
}

function calculateClassName(parameters) {
    // 現在がどの時間であるかを算出する
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return minutesInInterval < parameters.work ? "work" : "break";
}

function calculateTimerText(parameters) {
    // タイマーの表示を作成する
    const date = new Date();
    const currentTime = date.getTime();
    const startDateTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        parameters.startHour,
    );
    const elapsedTime = currentTime - startDateTime.getTime();
    const interval = (parameters.work + parameters.break) * 60 * 1000;

    let remainingTime;
    const minutesInInterval = Math.floor((elapsedTime % interval) / 1000 / 60);
    if (minutesInInterval < parameters.work) {
        remainingTime = (parameters.work * 60 * 1000) - (elapsedTime % interval);
    } else {
        remainingTime = (interval) - (elapsedTime % interval);
    }

    const remainingMinutes = Math.floor(remainingTime / 1000 / 60);
    const remainingSeconds = Math.floor((remainingTime / 1000) % 60);

    return [
        zeroPadding(remainingMinutes, 2),
        zeroPadding(remainingSeconds, 2),
    ].join(":");
}

function switchScene(parameters) {
    // WorkとBreakを切り替える
    const date = new Date();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    if (seconds === 0) {
        let volumeSlider = document.getElementById('volume-slider').value;
        if (minutesInInterval === 0) {
            playSound('sound/学校のチャイム.mp3', volumeSlider);
            console.log('開始時間');
        } else if (minutesInInterval === parameters.work) {
            playSound('sound/「そこまで」.mp3', volumeSlider);
            console.log('終了時間');
        }
    }
}

function displayState(parameters) {
    if (parameters.displayState) {
        document.getElementById("state").textContent = document.getElementById("timer-label").className;
        document.body.style.fontSize = "16vw";
        document.body.style.flexDirection = 'column';
    }
}

function displayCounter(parameters) {
    if (parameters.displayCounter) {
        document.getElementById("counter").textContent = document.getElementById("timer-label").className;
        document.body.style.fontSize = "16vw";
        document.body.style.flexDirection = 'column';
    }
}

function getParameters() {
    // パラメーターを定義する
    const params = new URL(window.location.href).searchParams;
    const breakString = params.get("break") || "5";
    const workString = params.get("work") || "25";
    const displayStateString = params.get("displayState") || "1";
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
    const element = document.getElementById("timer-label")
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
    return `${month}/${day} ` +
        [
            zeroPadding(hours, 2),
            zeroPadding(minutes, 2),
        ].join(":");
}

function calculateSessionText(parameters) {
    // セッション番号を計算する
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    const sessionCounter = Math.floor(((date.getHours() - parameters.startHour) * 60 + minutes) / interval) + 1;
    if (minutesInInterval < parameters.work) {
        return `pomodoro #${zeroPadding(sessionCounter, 2)}`;
    } else {
        return `break #${zeroPadding(sessionCounter, 2)}`;
    }
}

function calculateRemainingPathDashArray(parameters) {
    const date = new Date();
    const minutes = date.getMinutes();
    const interval = parameters.work + parameters.break;
    const minutesInInterval = minutes % interval;
    return `${283 * minutesInInterval / interval} 283`;
}

function playSound(source, volume) {
    if (volume !== '0') {
        // オーディオファイルのURLを指定する
        const audio = new Audio(source);
        audio.volume = volume;
        audio.play();
    }
}
