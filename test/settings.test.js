// ぽもくる：URL・端末に残した設定の読みこみと、残り時間の計算のテスト（画面に触らない部分）
//   node --test test/
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const XSS = "<img src=x onerror=alert(1)>";
const source = fs.readFileSync(path.join(__dirname, "../script.js"), "utf8");
// 設定と時刻の計算の部分だけ（音・画面より前）
const part = source.slice(source.indexOf('const STORAGE_KEY'), source.indexOf("// ＃＃＃＃ 音 ＃＃＃＃"));

function load(href, stored) {
  const store = new Map(stored === undefined ? [] : [["pomodoro:settings", stored]]);
  const ctx = {
    URL,
    window: { location: { href, search: new URL(href).search } },
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)) },
    history: { url: null, replaceState(_, __, url) { this.url = String(url); } }
  };
  vm.createContext(ctx);
  vm.runInContext(part + ";globalThis.__ = { parameters, getPhase, formatRemaining, normalizeSettings, DEFAULTS };", ctx);
  return { ...ctx.__, store, history: ctx.history };
}
const plain = (o) => JSON.parse(JSON.stringify(o));

test("URL の設定を読み、作業・休憩の分だけ URL に残す", () => {
  const { parameters, history, store } = load("https://katsuan.github.io/pomodoro/?work=50&break=10&start=0930&counter=1&from=line");
  assert.deepEqual(plain(parameters), { work: 50, break: 10, start: "09:30", displayState: 1, displayCounter: 1, displayVolume: 0, displayOutside: 1, sound: "chime", volume: 0 });
  assert.equal(history.url, "https://katsuan.github.io/pomodoro/?work=50&break=10");
  assert.equal(JSON.parse(store.get("pomodoro:settings")).displayCounter, 1);
});

test("URL のおかしな値は、決まった範囲・はじめの値にそろえる", () => {
  const q = new URLSearchParams({ work: XSS, break: "99999", start: XSS, state: "5", counter: "-3", vol: "abc", outside: XSS, sound: XSS });
  const { parameters, history } = load("https://katsuan.github.io/pomodoro/?" + q);
  assert.deepEqual(plain(parameters), { work: 25, break: 120, start: "09:00", displayState: 1, displayCounter: 0, displayVolume: 0, displayOutside: 1, sound: "chime", volume: 0 });
  assert.equal(new URL(history.url).origin, "https://katsuan.github.io", "同じページのまま");
});

test("端末に残した設定が壊れていても落ちない", () => {
  for (const stored of ["{bad", "null", "[1,2]", "5", JSON.stringify({ work: { a: 1 }, volume: "x", start: XSS })]) {
    const { parameters } = load("https://katsuan.github.io/pomodoro/", stored);
    assert.equal(parameters.work, 25);
    assert.equal(parameters.volume, 0);
    assert.equal(parameters.start, "09:00");
  }
});

test("残り時間：9:00 から 25分作業・5分休憩", () => {
  const { getPhase, formatRemaining, normalizeSettings, DEFAULTS } = load("https://katsuan.github.io/pomodoro/");
  const s = normalizeSettings(DEFAULTS);
  const at = (h, m) => new Date(2026, 9, 23, h, m);
  let p = getPhase(s, at(9, 10));
  assert.equal(p.isWork, true);
  assert.equal(formatRemaining(p.remainingMs), "15:00");
  p = getPhase(s, at(9, 27));
  assert.equal(p.isWork, false);
  assert.equal(formatRemaining(p.remainingMs), "03:00");
  assert.equal(getPhase(s, at(10, 1)).session, 3);
  // 開始時刻より前もくり返しが続く
  assert.equal(getPhase(s, at(8, 50)).isWork, true);
});
