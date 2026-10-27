# Script font and chart glyph attributions

## Generated LangBridge custom fonts

`../fonts/LangBridgeTulu.woff2` is generated from the local Tulu numeral crops
listed below. Because those shapes derive from the TuluBarav chart, this font
derivative is distributed under CC BY-SA 4.0 with attribution to Prithvi
Tuluve. The font has ten application-specific PUA mappings for numerals 1 to 10
and does not encode standardized Tulu numeral code points. Zero remains a
phonetic fallback because no verified zero glyph is present in the source chart.

`../fonts/LangBridgeKodava.woff2` is generated from the Kodava alphabet crops
listed below. The alphabet chart is CC0. It maps the 11 chart vowels, 24
consonants, and two special signs to application-specific PUA code points
U+E000 through U+E024; these are not standardized Kodava Unicode assignments. No
Kodava numerals are mapped. The local numeral PNGs had no source chart or
attribution record, so they were removed; number names and values remain as
phonetic fallbacks. The CIIL Kodava Primer uses ordinary 1 to 10 numerals and is
copyrighted, so its artwork was not copied into this font. See
`../fonts/LangBridgeGlyphMapping.md`.

Both fonts use vector outlines traced from the supplied artwork. Their PUA
characters require the corresponding LangBridge font to render outside the
application. Text color is supplied by CSS, not baked into the glyph outlines.

## Tulu-Tigalari font

`../fonts/Mallige-Tulu-Tigalari.ttf` is Mallige from the OpenTuluFont/mallige
project. It is distributed under the SIL Open Font License 1.1; the full
license is included as `../fonts/Mallige-OFL.txt`. The bundled font is used
without modification. For Tulu letter forms, Basics emits only Tulu-Tigalari characters assigned in
Unicode 18.0.0. Its cmap was checked against every assigned vowel, consonant,
and special-sign code point used by the Tulu data.

Source: <https://github.com/OpenTuluFont/mallige>

The suggested <https://github.com/PrahladTantry/Mallige_unicode> repository was
also inspected, but no license file is listed in its repository contents, so
its font was not bundled. The verified OpenTuluFont copy above is used instead.

## Kodava Lipi glyph crops

The individual Kodava SVGs in `../glyphs/kodava/` supply artwork for the generated font and display crops from RaithaPade,
“Kodava Alphabet.png,” Wikimedia Commons. The chart is dedicated under CC0 1.0
Universal Public Domain Dedication. Crops are used without changing the letter
forms. The chart provides 11 labeled vowel forms, anusvāra, visarga, and 24
labeled consonants. No numeral glyphs are shown. The chart glyphs render as text through `LangBridgeKodava.woff2`, with theme-aware CSS text color.

Source and license: <https://commons.wikimedia.org/wiki/File:Kodava_Alphabet.png>

A separate 2026 Kodava El'th chart describes its forms as “Mutthana font
(Regular)” and is itself CC0, but no font binary, character mapping, or font
software license could be verified from that listing. The chart's CC0 license
does not establish a license for the font software, so it is not bundled or
used as a font mapping.

## Traditional Tulu numerals

The SVGs in `../glyphs/tulu-numerals/` crop numerals 1–10 from Prithvi Tuluve,
“TuluBaravTuluScript.jpg,” Wikimedia Commons. The source is licensed under
Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0). The
cropped SVG derivatives remain available under CC BY-SA 4.0. Attribution:
Prithvi Tuluve, “TuluBaravTuluScript.jpg,” adapted as individual numeral crops.

Source: <https://commons.wikimedia.org/wiki/File:TuluBaravTuluScript.jpg>
License: <https://creativecommons.org/licenses/by-sa/4.0/>

## Provisional Kannada handwriting path

The editable Kannada `ಅ` centerline candidate in `../../src/data/handwritingPaths.js`
was transcribed after visual review of the writing animation “Kannada-alphabet-a.gif”.
The source supports the glyph form and a demonstrated writing sequence, but it
does not establish a universal teaching order. The path is therefore marked
provisional in the registry and in the tracer UI. The transcription is an
adaptation distributed under CC BY-SA 4.0.

Author: Gopala Krishna A, “Kannada-alphabet-a.gif,” Wikimedia Commons.
Source: <https://commons.wikimedia.org/wiki/File:Kannada-alphabet-a.gif>
License: <https://creativecommons.org/licenses/by-sa/4.0/>

## Encoding and coverage notes

The Tulu-Tigalari Unicode block contains the assigned script characters used
for Tulu letters and signs, but Unicode 18.0.0 assigns no Tulu numeral code
points. Proposals use unassigned ranges including U+113F0..U+113FB and
U+113F6..U+113FF; neither range is used by this app. The number assets above
are therefore chart glyphs, not Unicode characters. Zero has no verified source glyph; the dataset retains `sonye` as a phonetic fallback without asserting it as a source-verified Tulu zero name.

Kodava Lipi has no Unicode encoding or documented font mapping in the Kodava
Takk Project's current description. The app renders chart-labeled Kodava forms
as text through the application-specific font mapping. Unsupported forms and
unverified numerals use phonetic fallbacks and are not replaced by Kannada
glyphs.

References:

- Unicode Tulu-Tigalari chart: <https://www.unicode.org/charts/script/chart_Tulu_Tigalari.html>
- Unicode 18.0.0 Core Specification, §15.18: <https://www.unicode.org/versions/Unicode18.0.0/core-spec/chapter-15/>
- Tulu numeral proposals (not encoded in Unicode 18.0.0): <https://www.unicode.org/L2/L2025/25020-tulu-tigalari-numerals.pdf> and <https://www.unicode.org/L2/L2025/25063-tulu-tigalari-characters.pdf>
- Kodava Takk Project: <https://www.kodavatakk.org/about>
