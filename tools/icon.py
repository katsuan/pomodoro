#!/usr/bin/env python3
"""ぽもくる（PomoQ）のアイコン・ロゴ・OGP を作る。

名前は「ぽもくる」（ポモドーロ＋くり返しの「くるくる」）。おくるん＝OQRN・キロっく＝kiloQ と同じ作り方で「く」を Q にして PomoQ。
アイコンはおくるんと同じ角の丸い四角に、アプリの画面と同じ色：背景は濃い灰色（style.css の --color-base #4d4d4d）、
進む輪は黄色（--color-primary #F9BE00）、針はピンク（--color-second #DF7861）。
輪はポモドーロ画面と同じく、12 時から時計回りに進む矢印。30分を1周として 25分の作業ぶん（300°）が矢印で、
10 時の手前で矢印の先になる。10 時〜12 時のすき間が 5分の休憩。12 時の真上に、トマトのヘタを兼ねたストップウォッチの竜頭。
右下に白いしっぽを輪の下に重ねて出し、Q に見せる。

  icon.svg・icon-32.png・apple-touch-icon.png・icon-512.png・icon-maskable-512.png … アイコン
  logo.svg … 横長のロゴ「PomoQ」（P・o・m・o は Jua、Q はアイコンと同じ形）
  ogp.png  … 共有したときの画像（1200×630）

使い方: python3 tools/icon.py（となりの line-share/tools/brandkit.py を使う）
"""
from pathlib import Path

import brandkit_path  # noqa: F401（となりの line-share/tools/brandkit.py を読めるようにする）
from brandkit import Brand, arc, arrow_head, centered, polar

ROOT = Path(__file__).resolve().parent.parent
BRAND = Brand(light=(96, 96, 96), dark=(60, 60, 60))  # style.css の --color-base #4d4d4d を中心に
YELLOW = (249, 190, 0)  # --color-primary
PINK = (223, 120, 97)  # --color-second

C = (46, 50)  # 輪の中心
R, RING_W = 21, 10  # 輪の半径（線の真ん中）・太さ
ARC_START = -90  # 12 時
ARC_END = ARC_START + 300 - 12  # 25分ぶん（300°）。矢印の先の分だけ手前で止める（10 時の手前）
ARROW_DIR = ARC_END + 90  # 時計回りに進む向き
ARROW_TIP = polar(polar(C, ARC_END, R), ARROW_DIR, 8)
# 上のつまみ（竜頭）＝トマトのヘタ：軸と横棒（T の字）。12 時の矢印の始まりにつなげる
TOP = (C[0], C[1] - R - RING_W / 2 + 1)
STEM_TOP = (TOP[0], TOP[1] - 8)
CALYX = [(STEM_TOP[0] - 6, STEM_TOP[1]), (STEM_TOP[0] + 6, STEM_TOP[1])]
TAIL = 45  # Q のしっぽの向き（右下）
SHAPES = [
    # Q のしっぽ（白）。輪の下に重ねる（いちばん先に描く）
    {"t": "line", "p": [polar(C, TAIL, R), polar(C, TAIL, 35)], "w": 7.5},  # 根元は輪の線の真ん中（丸い端が輪に隠れる）
    {"t": "circle", "c": C, "r": R, "alpha": 0.18},  # 輪の内側（うっすら）
    {"t": "line", "p": arc(C, R, ARC_START, ARC_END), "w": RING_W, "fill": YELLOW},
    {"t": "poly", "p": arrow_head(ARROW_TIP, ARROW_DIR, 11, 18), "fill": YELLOW},
    {"t": "line", "p": [C, (C[0], C[1] - 11)], "w": 4.5, "fill": PINK},  # タイマーの針（12 時の向き）
    {"t": "circle", "c": C, "r": 4, "fill": PINK},
    {"t": "line", "p": [TOP, STEM_TOP], "w": 5},  # 竜頭
    {"t": "line", "p": CALYX, "w": 5},
]
# 外形（しっぽを含む）の真ん中をアイコンの真ん中にそろえ、Q の重心が片寄って見えないようにする（ロゴも同じ形を使う）
SHAPES, (_DX, _DY) = centered(SHAPES)
C = (C[0] + _DX, C[1] + _DY)
RING_OUTER = R + RING_W / 2


def decorate(d, s):
    """OGP の背景：うっすらタイマーの輪"""
    faint = (255, 255, 255, 45)
    for cx, cy, r in ((1040, 120, 150), (1110, 560, 90), (60, 600, 120)):
        d.ellipse(((cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s), outline=faint, width=6 * s)


def main():
    BRAND.write_icons(ROOT, SHAPES)
    logo, ratio = BRAND.logo_svg("PomoQ", SHAPES, C, RING_OUTER, "PomoQ（ぽもくる）")
    (ROOT / "logo.svg").write_text(logo, encoding="utf-8")
    BRAND.write_ogp(ROOT / "ogp.png", SHAPES, "ぽもくる", "PomoQ", ["集中と休憩を、くるくる", "くり返すポモドーロタイマー"], decorate)
    print(f"アイコン・logo.svg（高さ 28px なら幅 {28 * ratio:.0f}px）・ogp.png を書き出しました")


if __name__ == "__main__":
    main()
