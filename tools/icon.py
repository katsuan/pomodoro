#!/usr/bin/env python3
"""ぽもくる（PomoQ）のアイコン・ロゴ・OGP を作る。

名前は「ぽもくる」（ポモドーロ＋くり返しの「くるくる」）。おくるん＝OQRN・キロっく＝kiloQ と同じ作り方で「く」を Q にして PomoQ。
アイコンはおくるんと同じ角の丸い四角に、ポモドーロの黄色（style.css の --color-primary #F9BE00）のグラデーション。輪はおくるんの Q と同じく、くるくる回る時計回りの矢印
（集中と休憩のくり返し）。30分を1周として、25分の作業を矢印、5分の休憩をすき間にし、すき間（右下）からしっぽを出して Q に見せる。
上には、トマトのヘタを兼ねたストップウォッチの竜頭。輪の中にタイマーの針。

  icon.svg・icon-32.png・apple-touch-icon.png・icon-512.png・icon-maskable-512.png … アイコン
  logo.svg … 横長のロゴ「PomoQ」（P・o・m・o は Jua、Q はアイコンと同じ形）
  ogp.png  … 共有したときの画像（1200×630）

使い方: python3 tools/icon.py（tools/brandkit.py を使う）
"""
from pathlib import Path

from brandkit import Brand, arc, arrow_head, polar

ROOT = Path(__file__).resolve().parent.parent
BRAND = Brand(light=(255, 210, 64), dark=(240, 160, 0))  # style.css の --color-primary #F9BE00 を中心に

C = (46, 50)  # 輪の中心
R, RING_W = 21, 10  # 輪の半径（線の真ん中）・太さ
# 輪は時計回りの矢印（おくるんの Q と同じ考え方）。ポモドーロの「25分作業＋5分休憩」に合わせて、
# 30分を1周として 25分ぶん（300°）を矢印、5分ぶん（60°）をすき間にする。すき間を右下（45°）に置き、そこから Q のしっぽを出す
GAP_CENTER = 50
ARC_START = GAP_CENTER + 30  # 度（右が 0、時計回り）。すき間の終わり＝矢印の始まり（左下寄り）
ARC_END = ARC_START + 300 - 12  # 矢印の先の分だけ手前で止める
ARROW_DIR = ARC_END + 90  # 時計回りに進む向き
ARROW_TIP = polar(polar(C, ARC_END, R), ARROW_DIR, 8)
# 上のつまみ（竜頭）＝トマトのヘタ：軸と横棒（T の字）
TOP = (C[0], C[1] - R - RING_W / 2 + 1)
STEM_TOP = (TOP[0], TOP[1] - 8)
CALYX = [(STEM_TOP[0] - 6, STEM_TOP[1]), (STEM_TOP[0] + 6, STEM_TOP[1])]
SHAPES = [
    {"t": "circle", "c": C, "r": R, "alpha": 0.18},  # トマトの面（うっすら）
    {"t": "line", "p": arc(C, R, ARC_START, ARC_END), "w": RING_W},
    {"t": "poly", "p": arrow_head(ARROW_TIP, ARROW_DIR, 11, 18)},
    {"t": "line", "p": [C, (C[0], C[1] - 11)], "w": 4.5},  # タイマーの針（12 時の向き）
    {"t": "circle", "c": C, "r": 4},
    # Q のしっぽ：5分ぶんのすき間（右下）から外へ
    {"t": "line", "p": [polar(C, GAP_CENTER, R + 1), polar(C, GAP_CENTER, 39)], "w": 8.5},
    # 竜頭（ヘタ）。根元を背景の色で削って、輪と見分ける
    {"t": "line", "p": [TOP, STEM_TOP], "w": 7, "fill": "bg"},
    {"t": "line", "p": [polar(TOP, -90, 3), STEM_TOP], "w": 5},
    {"t": "line", "p": CALYX, "w": 5},
]
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
