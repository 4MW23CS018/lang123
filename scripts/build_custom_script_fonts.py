"""Build the LangBridge custom script fonts from the checked-in glyph crops.

Requires fontTools, Pillow, NumPy, OpenCV, and brotlicffi. The script traces the
existing monochrome/blue artwork into TrueType outlines and saves WOFF2 fonts.
It does not design or substitute any glyph artwork.
"""

from __future__ import annotations

import base64
import json
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import brotlicffi
import cv2
import numpy as np
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
FONTS_DIR = ROOT / "public" / "fonts"

# fontTools imports the standard "brotli" module name. brotlicffi implements
# the same API and is already installed in the local Python environment.
sys.modules.setdefault("brotli", brotlicffi)


@dataclass(frozen=True)
class Glyph:
    codepoint: int
    semantic: str
    transliteration: str
    category: str
    source: str


KODAVA_VOWELS = [
    ("ಅ", "a", "vowel-a.svg"),
    ("ಆ", "ā", "vowel-aa.svg"),
    ("ಇ", "i", "vowel-i.svg"),
    ("ಈ", "ī", "vowel-ii.svg"),
    ("ಉ", "u", "vowel-u.svg"),
    ("ಊ", "ū", "vowel-uu.svg"),
    ("ಎ", "e", "vowel-e.svg"),
    ("ಏ", "ē", "vowel-ee.svg"),
    ("ಐ", "ai", "vowel-ai.svg"),
    ("ಒ", "o", "vowel-o.svg"),
    ("ಓ", "ō", "vowel-oo.svg"),
]

KODAVA_CONSONANTS = [
    ("ಕ", "ka", "consonant-ka.svg"),
    ("ಗ", "ga", "consonant-ga.svg"),
    ("ಙ", "ṅa", "consonant-nga.svg"),
    ("ಚ", "ca", "consonant-ca.svg"),
    ("ಜ", "ja", "consonant-ja.svg"),
    ("ಞ", "ña", "consonant-nya.svg"),
    ("ಟ", "ṭa", "consonant-tta.svg"),
    ("ಡ", "ḍa", "consonant-dda.svg"),
    ("ಣ", "ṇa", "consonant-nna.svg"),
    ("ತ", "ta", "consonant-ta.svg"),
    ("ದ", "da", "consonant-da.svg"),
    ("ನ", "na", "consonant-na.svg"),
    ("ಪ", "pa", "consonant-pa.svg"),
    ("ಬ", "ba", "consonant-ba.svg"),
    ("ಮ", "ma", "consonant-ma.svg"),
    ("ಯ", "ya", "consonant-ya.svg"),
    ("ರ", "ra", "consonant-ra.svg"),
    ("ಲ", "la", "consonant-la.svg"),
    ("ವ", "va", "consonant-va.svg"),
    ("ಶ", "śa", "consonant-sha.svg"),
    ("ಷ", "ṣa", "consonant-ssa.svg"),
    ("ಸ", "sa", "consonant-sa.svg"),
    ("ಹ", "ha", "consonant-ha.svg"),
    ("ಳ", "ḷa", "consonant-lla.svg"),
]

KODAVA_SPECIALS = [
    ("ಅಂ", "anusvāra (ṃ)", "special-anusvara.svg"),
    ("ಅಃ", "visarga (ḥ)", "special-visarga.svg"),
]

TULU_NUMBERS = [
    (1, "onji"),
    (2, "raDD"),
    (3, "mUji"),
    (4, "nAl"),
    (5, "ain"),
    (6, "Aji"),
    (7, "El"),
    (8, "enma"),
    (9, "orumba"),
    (10, "patt"),
]


def glyph_manifest() -> tuple[list[Glyph], list[Glyph]]:
    kodava: list[Glyph] = []
    next_cp = 0xE000
    for category, records in (
        ("vowels", KODAVA_VOWELS),
        ("consonants", KODAVA_CONSONANTS),
        ("specialCharacters", KODAVA_SPECIALS),
    ):
        for semantic, transliteration, source in records:
            kodava.append(
                Glyph(next_cp, semantic, transliteration, category, f"public/glyphs/kodava/{source}")
            )
            next_cp += 1
    tulu = [
        Glyph(
            0xF100 + value - 1,
            f"Tulu number {value}",
            transliteration,
            "numbers",
            f"public/glyphs/tulu-numerals/{value}.svg",
        )
        for value, transliteration in TULU_NUMBERS
    ]
    return kodava, tulu


def load_artwork(path: Path) -> np.ndarray:
    if path.suffix.lower() == ".svg":
        svg = path.read_text(encoding="utf-8")
        match = re.search(r"base64,([A-Za-z0-9+/=]+)", svg)
        if not match:
            raise ValueError(f"SVG has no embedded raster artwork: {path}")
        import io

        rgba = Image.open(io.BytesIO(base64.b64decode(match.group(1)))).convert("RGBA")
    else:
        rgba = Image.open(path).convert("RGBA")

    pixels = np.asarray(rgba)
    rgb = pixels[:, :, :3].astype(np.int16)
    alpha = pixels[:, :, 3]
    luminance = (rgb[:, :, 0] * 0.299 + rgb[:, :, 1] * 0.587 + rgb[:, :, 2] * 0.114)

    if "tulu-numerals" in path.as_posix():
        # The source chart prints these numerals in blue ink on white paper.
        blue_ink = (rgb[:, :, 2] - rgb[:, :, 0] > 4) & (
            rgb[:, :, 2] - rgb[:, :, 1] > 1
        )
        mask = (alpha > 10) & blue_ink
    else:
        # Kodava crops use dark ink, normally on transparent or white ground.
        mask = (alpha > 10) & (luminance < 245)

    ys, xs = np.where(mask)
    if len(xs) == 0:
        raise ValueError(f"No glyph ink detected in {path}")
    left, right = max(int(xs.min()) - 1, 0), min(int(xs.max()) + 2, mask.shape[1])
    top, bottom = max(int(ys.min()) - 1, 0), min(int(ys.max()) + 2, mask.shape[0])
    return (mask[top:bottom, left:right].astype(np.uint8) * 255)


def contour_depth(hierarchy: np.ndarray, index: int) -> int:
    depth = 0
    parent = int(hierarchy[index][3])
    while parent >= 0:
        depth += 1
        parent = int(hierarchy[parent][3])
    return depth


def signed_area(points: list[tuple[int, int]]) -> float:
    return sum(
        points[i][0] * points[(i + 1) % len(points)][1]
        - points[(i + 1) % len(points)][0] * points[i][1]
        for i in range(len(points))
    ) / 2


def trace_glyph(image: np.ndarray):
    contours, hierarchy = cv2.findContours(image, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        raise ValueError("Artwork contains no vectorizable contours")
    hierarchy = hierarchy[0]
    h, w = image.shape
    scale = min(820 / max(h, 1), 840 / max(w, 1))
    drawn_width = w * scale
    left = (1000 - drawn_width) / 2
    top = 900
    pen = TTGlyphPen(None)
    drawn = 0

    # Approximation only removes raster stair-stepping; it keeps the traced
    # silhouette and holes from the checked-in reference artwork.
    for index, contour in enumerate(contours):
        if abs(cv2.contourArea(contour)) < 1.25:
            continue
        epsilon = max(0.45, min(w, h) * 0.004)
        polygon = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2)
        if len(polygon) < 3:
            continue
        points = [
            (round(left + float(x) * scale), round(top - float(y) * scale))
            for x, y in polygon
        ]

        # TrueType uses clockwise outer contours and counter-clockwise holes
        # in y-up coordinates. Even-depth contours are filled shells.
        outer = contour_depth(hierarchy, index) % 2 == 0
        area = signed_area(points)
        if (outer and area > 0) or (not outer and area < 0):
            points.reverse()

        pen.moveTo(points[0])
        for point in points[1:]:
            pen.lineTo(point)
        pen.closePath()
        drawn += 1

    if not drawn:
        raise ValueError("Artwork contours were too small to preserve")
    return pen.glyph()


def build_font(family: str, glyphs: list[Glyph], output: Path) -> None:
    order = [".notdef"] + [f"uni{glyph.codepoint:04X}" for glyph in glyphs]
    builder = FontBuilder(unitsPerEm=1000, isTTF=True)
    builder.setupGlyphOrder(order)
    builder.setupCharacterMap({glyph.codepoint: name for glyph, name in zip(glyphs, order[1:])})

    outlines = {".notdef": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (1000, 0)}
    for glyph, name in zip(glyphs, order[1:]):
        source_path = ROOT / glyph.source
        if not source_path.is_file():
            raise FileNotFoundError(f"Missing source glyph asset: {glyph.source}")
        outlines[name] = trace_glyph(load_artwork(source_path))
        metrics[name] = (1000, 0)

    builder.setupGlyf(outlines)
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=900, descent=-150)
    builder.setupOS2(
        sTypoAscender=850,
        sTypoDescender=-150,
        sTypoLineGap=0,
        usWinAscent=900,
        usWinDescent=150,
    )
    builder.setupNameTable(
        {
            "familyName": family,
            "styleName": "Regular",
            "uniqueFontIdentifier": f"LangBridge {family} Regular 1.0",
            "fullName": f"LangBridge {family} Regular",
            "psName": f"LangBridge-{family}",
            "version": "Version 1.000",
        }
    )
    builder.setupPost()
    builder.setupMaxp()

    output.parent.mkdir(parents=True, exist_ok=True)
    font = builder.font
    font.flavor = "woff2"
    font.save(output)

    # Reopen each generated WOFF2 and verify the complete intended cmap.
    saved = TTFont(output)
    cmap = saved.getBestCmap() or {}
    expected = {glyph.codepoint for glyph in glyphs}
    if expected != set(cmap):
        raise ValueError(f"{family} cmap mismatch: expected {len(expected)}, got {len(cmap)}")
    for codepoint in expected:
        if not saved["glyf"][cmap[codepoint]].numberOfContours:
            raise ValueError(f"{family} has an empty glyph at U+{codepoint:04X}")


def load_basics_data() -> dict:
    """Read the actual Vite dataset through Node so reports follow its records."""
    script = "import { BASICS_DATA } from './src/data/basics.js'; console.log(JSON.stringify(BASICS_DATA));"
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        encoding="utf-8",
        text=True,
    )
    return json.loads(result.stdout)


def verify_data_and_tulu_font(
    kodava: list[Glyph], tulu: list[Glyph], basics_data: dict
) -> int:
    for language, glyphs in (("Kodava", kodava), ("Tulu", tulu)):
        for glyph in glyphs:
            matches = [
                record
                for record in basics_data[language].get(glyph.category, [])
                if record.get("ph") == glyph.transliteration
                and (
                    glyph.category != "numbers"
                    or record.get("val") == int(glyph.semantic.rsplit(" ", 1)[-1])
                )
            ]
            if len(matches) != 1:
                raise ValueError(
                    f"Expected one Basics record for {language}.{glyph.category} "
                    f"{glyph.transliteration!r}; found {len(matches)}"
                )
            display_char = matches[0].get("displayChar")
            if not display_char or ord(display_char) != glyph.codepoint:
                actual = f"U+{ord(display_char):04X}" if display_char else "no displayChar"
                raise ValueError(
                    f"{language} mapping for {glyph.transliteration!r} must be "
                    f"U+{glyph.codepoint:04X}, found {actual}"
                )

    actual = [
        ord(record["displayChar"])
        for language in basics_data.values()
        for records in language.values()
        if isinstance(records, list)
        for record in records
        if record.get("displayChar")
    ]
    expected = [glyph.codepoint for glyph in kodava + tulu]
    if sorted(actual) != sorted(expected):
        missing = sorted(set(expected) - set(actual))
        unexpected = sorted(set(actual) - set(expected))
        raise ValueError(
            "Basics data PUA mapping does not match the generated font manifest; "
            f"missing={[f'U+{cp:04X}' for cp in missing]}, "
            f"unexpected={[f'U+{cp:04X}' for cp in unexpected]}"
        )
    if len(actual) != len(set(actual)):
        raise ValueError("Basics data contains duplicate custom-font PUA code points")

    for language, categories in basics_data.items():
        for category, records in categories.items():
            if not isinstance(records, list):
                continue
            seen: set[str] = set()
            for record in records:
                semantic = record.get("displayChar") or record.get("char")
                if semantic:
                    if semantic in seen:
                        raise ValueError(
                            f"Duplicate visible character in {language}.{category}: {semantic!r}"
                        )
                    seen.add(semantic)
                asset = record.get("glyphAsset")
                if asset:
                    asset_path = ROOT / "public" / asset.lstrip("/")
                    if not asset_path.is_file():
                        raise FileNotFoundError(f"Missing referenced glyph artwork: {asset}")

    tulu_unicode_codepoints = {
        ord(character)
        for category in ("vowels", "consonants", "specialCharacters")
        for record in basics_data["Tulu"].get(category, [])
        if record.get("char")
        for character in record["char"]
        if 0x11380 <= ord(character) <= 0x113FF
    }
    font = TTFont(ROOT / "public" / "fonts" / "Mallige-Tulu-Tigalari.ttf")
    cmap = font.getBestCmap() or {}
    missing = sorted(tulu_unicode_codepoints - set(cmap))
    if missing:
        raise ValueError(
            "Mallige Tulu-Tigalari font lacks dataset characters: "
            f"{[f'U+{cp:04X}' for cp in missing]}"
        )
    return len(tulu_unicode_codepoints)


def write_mapping_report(
    kodava: list[Glyph], tulu: list[Glyph], basics_data: dict, tulu_unicode_count: int
) -> None:
    report = [
        "# LangBridge custom script font mapping and coverage",
        "",
        "Generated by `scripts/build_custom_script_fonts.py` from the local glyph artwork.",
        "PUA values are application-specific and are not standardized Unicode characters.",
        "They require the matching LangBridge font to render outside this app.",
        "The glyph source paths below are retained for reproducible regeneration.",
        "",
        "## Basics dataset coverage",
        "",
        "Counts are generated from the current `BASICS_DATA`, including records whose native glyph is explicitly unavailable.",
        "| Language | Vowels | Consonants | Special characters | Numbers | Unavailable native glyphs |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for language, categories in basics_data.items():
        counts = {
            category: len(categories.get(category, []))
            for category in ("vowels", "consonants", "specialCharacters", "numbers")
        }
        unavailable = sum(
            bool(record.get("nativeGlyphUnavailable"))
            for records in categories.values()
            if isinstance(records, list)
            for record in records
        )
        report.append(
            f"| {language} | {counts['vowels']} | {counts['consonants']} | "
            f"{counts['specialCharacters']} | {counts['numbers']} | {unavailable} |"
        )
    tulu_data = basics_data["Tulu"]
    tulu_unicode_vowels = sum(
        bool(record.get("char")) for record in tulu_data.get("vowels", [])
    )
    tulu_unavailable_vowels = sum(
        bool(record.get("nativeGlyphUnavailable"))
        for record in tulu_data.get("vowels", [])
    )
    report.extend(
        [
            "",
            f"Tulu's Unicode Tulu-Tigalari vowel records with glyphs: {tulu_unicode_vowels}; vowel records marked unavailable: {tulu_unavailable_vowels}. Its {tulu_unicode_count} distinct standardized Unicode code points used by vowels, consonants, and special-sign sequences are covered by Mallige's cmap. Ten chart-attested numeral forms use the separate LangBridge PUA range; zero has no verified glyph and remains a phonetic fallback.",
            "",
            "## Kodava Lipi — `LangBridgeKodava.woff2`",
            "",
            f"Chart-mapped alphabet coverage from the selected local chart: {len(basics_data['Kodava'].get('vowels', []))} vowel forms, {len(basics_data['Kodava'].get('consonants', []))} consonants, and {len(basics_data['Kodava'].get('specialCharacters', []))} special signs.",
            f"The {len(basics_data['Kodava'].get('numbers', []))} pronunciation and value records remain available as phonetic fallbacks. The local numeral PNGs were removed because this workspace had no source chart or attribution for them, so they are not mapped as native Kodava script.",
            "The chart's additional `zh` form is not included because this dataset has no verified semantic mapping for it.",
            "The prior Kannada-derived aspirate placeholders (ಖ, ಘ, ಛ, ಝ, ಠ, ಢ, ಥ, ಧ, ಫ, ಭ), plus unsupported vowels ಋ and ಔ, are excluded.",
            "The Kodava /ë/ orthographic limitation remains documented in the data comments; it is not a glyph. Any unavailable records and unverified Kodava numeral provenance are reflected above and in the dataset notes.",
            "",
            "| PUA | Semantic record | Transliteration | Category | Source artwork |",
            "| --- | --- | --- | --- | --- |",
        ]
    )
    for glyph in kodava:
        report.append(
            f"| U+{glyph.codepoint:04X} | {glyph.semantic} | {glyph.transliteration} | {glyph.category} | `{glyph.source}` |"
        )
    report.extend(
        [
            "",
            "Source shapes: the Kodava alphabet crops originate from the CC0 RaithaPade chart documented in `public/reference/ATTRIBUTION.md`. Unverified local numeral PNGs were removed because this workspace had no source chart or attribution for them. CIIL's copyrighted 2024 Kodava Primer shows ordinary 1–10 numerals; those forms were not used as Kodava Lipi artwork: https://ciil.gov.in/primers/Kodava_Primer.pdf.",
            "",
            "## Tulu numerals — `LangBridgeTulu.woff2`",
            "",
            f"Mapped coverage: {len(tulu)} traditional numeral forms. No proposed Unicode numeral code points are used.",
            "",
            "| PUA | Semantic record | Transliteration | Category | Source artwork |",
            "| --- | --- | --- | --- | --- |",
        ]
    )
    for glyph in tulu:
        report.append(
            f"| U+{glyph.codepoint:04X} | {glyph.semantic} | {glyph.transliteration} | {glyph.category} | `{glyph.source}` |"
        )
    report.extend(
        [
            "",
            "Tulu source shapes are adapted from the TuluBarav chart under CC BY-SA 4.0; the derived Tulu font must retain that license. Kodava alphabet outlines derive from the CC0 source chart. CSS text color supplies the glyph color, so the outlines work in light and dark themes.",
            "",
        ]
    )
    (FONTS_DIR / "LangBridgeGlyphMapping.md").write_text("\n".join(report), encoding="utf-8")


def main() -> None:
    kodava, tulu = glyph_manifest()
    basics_data = load_basics_data()
    tulu_unicode_count = verify_data_and_tulu_font(kodava, tulu, basics_data)
    build_font("LangBridgeKodava", kodava, FONTS_DIR / "LangBridgeKodava.woff2")
    build_font("LangBridgeTulu", tulu, FONTS_DIR / "LangBridgeTulu.woff2")
    write_mapping_report(kodava, tulu, basics_data, tulu_unicode_count)
    print(f"Generated LangBridgeKodava.woff2: {len(kodava)} verified mapped glyphs")
    print(f"Generated LangBridgeTulu.woff2: {len(tulu)} verified mapped glyphs")
    print(f"Mapping report: {FONTS_DIR / 'LangBridgeGlyphMapping.md'}")


if __name__ == "__main__":
    main()
