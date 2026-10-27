// Hand-authored handwriting centerlines.
//
// Each key is `${script}:${character}` and each `strokes` entry is one pen
// motion. Coordinates use the tracer's 400 × 400 logical board. Paths are
// reviewed against the actual fitted glyph and must not be generated from
// font contours.

export const HANDWRITING_PATHS = {
  "Kannada:\u0C85": {
    script: "Kannada",
    char: "\u0C85",
    source: "https://commons.wikimedia.org/wiki/File:Kannada-alphabet-a.gif",
    sourceAuthor: "Gopala Krishna A",
    sourceLicense: "CC BY-SA 4.0",
    sourceLicenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    verificationStatus: "provisional",
    verificationNote:
      "Provisional two-motion centerline. The first loop now starts at its upper-left entry point to match the onset in the cited writing animation; its curve geometry and clockwise travel are unchanged. That self-published animation is not an authoritative teaching standard, so confirm the stroke order with a Kannada handwriting instructor before marking verified.",
    viewBox: "0 0 400 400",
    strokes: [
      {
        // First visible motion: the left loop. The closed return is intentional.
        d: "M 99 108 C 122 104, 146 115, 156 132 C 166 151, 157 167, 140 176 C 119 187, 91 180, 72 164 C 62 156, 58 145, 62 134 C 67 117, 80 111, 99 108",
      },
      {
        // Second visible motion: lower bowl, right loop and inward bar.
        d: "M 48 170 C 51 220, 86 264, 142 280 C 177 290, 223 290, 258 280 C 315 265, 337 220, 340 169 C 341 145, 337 120, 325 108 C 310 96, 291 99, 276 113 C 261 126, 248 142, 252 154 C 256 165, 273 168, 300 165 L 300 185 L 196 185",
      },
    ],
  },
};

// Preserve the legacy export while keeping provisional entries out of it.
export const VERIFIED_HANDWRITING_PATHS = Object.fromEntries(
  Object.entries(HANDWRITING_PATHS).filter(
    ([, path]) => path.verificationStatus === "verified",
  ),
);
