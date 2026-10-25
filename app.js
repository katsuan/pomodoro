// ぽもくる（PomoQ）：画面の入口（表示・設定パネル）。時計の時刻に合わせて「作業 → 休憩」をくり返す
// 部品（index.html でこの順に読む）：js/store.js 設定の読み書き → js/phase.js 時刻の計算 → js/sound.js 音 → app.js 画面

function circleLength(circle) {
    return Math.round(2 * Number(circle.getAttribute("r")) * Math.PI);
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
