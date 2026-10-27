import assert from "node:assert/strict";
import { BASICS_DATA } from "../src/data/basics.js";
import {
  HANDWRITING_PATHS,
  VERIFIED_HANDWRITING_PATHS,
} from "../src/data/handwritingPaths.js";

const SIZE = 400;
const commandPattern = /[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g;

function validateStroke(pathData, viewBox) {
  assert.equal(typeof pathData, "string", "stroke path must be a string");
  const box = viewBox.split(/[ ,]+/).map(Number);
  assert.equal(box.length, 4, "viewBox must contain four numbers");
  assert.ok(box.every(Number.isFinite), "viewBox values must be finite");
  assert.ok(box[2] > 0 && box[3] > 0, "viewBox dimensions must be positive");

  const tokens = pathData.match(commandPattern) || [];
  assert.ok(tokens.length, "stroke path must not be empty");
  let index = 0;
  let command = null;
  let moves = 0;
  let pointCount = 0;
  while (index < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[index])) command = tokens[index++];
    assert.ok(["M", "L", "Q", "C"].includes(command), `unsupported command ${command}`);
    if (command === "M") {
      moves += 1;
      assert.equal(moves, 1, "each pen motion must use one move command");
      command = "L";
    }
    const coordinateCount = command === "C" ? 6 : command === "Q" ? 4 : 2;
    const values = tokens.slice(index, index + coordinateCount).map(Number);
    assert.equal(values.length, coordinateCount, `incomplete ${command} command`);
    assert.ok(values.every(Number.isFinite), "coordinates must be finite");
    for (let coordinate = 0; coordinate < values.length; coordinate += 2) {
      const x = (values[coordinate] / box[2]) * SIZE;
      const y = (values[coordinate + 1] / box[3]) * SIZE;
      assert.ok(x >= 0 && x <= SIZE, `x=${x} outside the board`);
      assert.ok(y >= 0 && y <= SIZE, `y=${y} outside the board`);
    }
    pointCount += command === "C" ? 3 : command === "Q" ? 2 : 1;
    index += coordinateCount;
  }
  assert.equal(moves, 1, "each stroke needs one starting point");
  assert.ok(pointCount >= 2, "stroke needs at least two points");
}

for (const [key, path] of Object.entries(HANDWRITING_PATHS)) {
  assert.equal(key, `${path.script}:${path.char}`, `${key} key must match its record`);
  assert.ok(["verified", "provisional"].includes(path.verificationStatus));
  assert.ok(path.verificationNote, `${key} needs a verification note`);
  assert.ok(Array.isArray(path.strokes) && path.strokes.length > 0);
  for (const stroke of path.strokes) validateStroke(stroke.d, path.viewBox);
}
const kannadaA = HANDWRITING_PATHS["Kannada:\u0C85"];
assert.equal(
  kannadaA?.strokes.length,
  2,
  "Kannada ಅ must keep its two separately ordered pen motions",
);
assert.equal(
  kannadaA.verificationStatus,
  "provisional",
  "the animation transcription must not be presented as a verified teaching standard",
);
assert.equal(
  Object.keys(VERIFIED_HANDWRITING_PATHS).length,
  Object.values(HANDWRITING_PATHS).filter(
    (path) => path.verificationStatus === "verified",
  ).length,
  "the legacy verified-path export must exclude provisional paths",
);

const categories = ["vowels", "consonants", "numbers"];
for (const category of categories) {
  const items = BASICS_DATA.Kannada[category] || [];
  const counts = { verified: 0, provisional: 0, missing: 0 };
  for (const item of items) {
    const glyph = item.char?.split(" ")[0];
    const path = glyph && HANDWRITING_PATHS[`Kannada:${glyph}`];
    if (!path) counts.missing += 1;
    else counts[path.verificationStatus] += 1;
  }
  console.log(
    `Kannada ${category}: ${counts.verified} verified, ${counts.provisional} provisional, ${counts.missing} missing (dataset ${items.length})`,
  );
}

const expectedKodavaConsonants = [
  "ka", "ga", "ṅa", "ca", "ja", "ña", "ṭa", "ḍa", "ṇa", "ta", "da", "na",
  "pa", "ba", "ma", "ya", "ra", "la", "va", "śa", "ṣa", "sa", "ha", "ḷa",
];
const kodavaConsonants = BASICS_DATA.Kodava?.consonants || [];
assert.deepEqual(
  kodavaConsonants.map((item) => item.ph),
  expectedKodavaConsonants,
  "Kodava consonants must retain the supported 24-item inventory and order",
);
console.log(`Kodava consonants: ${kodavaConsonants.length} in the expected order.`);

const penMotions = Object.values(HANDWRITING_PATHS).reduce(
  (total, path) => total + path.strokes.length,
  0,
);
console.log(
  `Validated ${Object.keys(HANDWRITING_PATHS).length} path record(s) and ${penMotions} pen motion(s) for syntax, bounds, metadata and dataset mapping.`,
);
