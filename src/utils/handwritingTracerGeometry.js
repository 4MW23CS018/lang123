export const CANVAS_SIZE = 400;
export const GLYPH_FONT_SIZE = CANVAS_SIZE * 1.2;
export const GLYPH_INSET = 20;
export const PEN_SIZE = 32;

export function fitGlyph(ctx, char, canvasSize, fontSize, inset, fontFamily, fontWeight) {
  const available = canvasSize - inset * 2;
  const resolvedFontFamily = fontFamily ||
    "'Noto Sans Kannada', 'Noto Sans Tamil', 'Noto Sans Telugu', 'Noto Sans Malayalam', sans-serif";
  const measure = (size) => {
    ctx.font = `${fontWeight || "bold"} ${size}px ${resolvedFontFamily}`;
    const metrics = ctx.measureText(char);
    return {
      metrics,
      width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
      height:
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
  };

  let fittedSize = fontSize;
  let bounds = measure(fittedSize);
  if (bounds.width > available || bounds.height > available) {
    let low = 1;
    let high = fontSize;
    for (let i = 0; i < 12; i++) {
      const candidate = (low + high) / 2;
      const candidateBounds = measure(candidate);
      if (
        candidateBounds.width <= available &&
        candidateBounds.height <= available
      ) {
        low = candidate;
      } else {
        high = candidate;
      }
    }
    fittedSize = low;
    bounds = measure(fittedSize);
  }

  const x =
    (canvasSize +
      bounds.metrics.actualBoundingBoxLeft -
      bounds.metrics.actualBoundingBoxRight) /
    2;
  const baseline =
    (canvasSize +
      bounds.metrics.actualBoundingBoxAscent -
      bounds.metrics.actualBoundingBoxDescent) /
    2;
  return { x, baseline };
}

/** Convert supported SVG path commands to a scaled polyline in canvas space. */
export function getPathMetrics(pathData, viewBox, size) {
  const box = viewBox.split(/[ ,]+/).map(Number);
  const [, , viewWidth, viewHeight] = box;
  if (
    box.length !== 4 ||
    !box.every(Number.isFinite) ||
    viewWidth <= 0 ||
    viewHeight <= 0 ||
    typeof pathData !== "string"
  ) {
    throw new Error("Handwriting paths need a valid viewBox and path string.");
  }
  const tokens =
    pathData.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/g) || [];
  const points = [];
  let index = 0;
  let command = null;
  let current = { x: 0, y: 0 };
  let hasMove = false;
  const readPoint = () => {
    const xToken = tokens[index++];
    const yToken = tokens[index++];
    const point = { x: Number(xToken), y: Number(yToken) };
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error("Handwriting paths need finite coordinate pairs.");
    }
    return point;
  };
  const appendCurve = (evaluate, estimate) => {
    const steps = Math.max(1, Math.ceil(estimate / 2));
    for (let step = 1; step <= steps; step++)
      points.push(evaluate(step / steps));
  };

  while (index < tokens.length) {
    if (/^[a-z]$/i.test(tokens[index])) command = tokens[index++];
    if (!command || command !== command.toUpperCase())
      throw new Error(
        "Handwriting SVG paths must use supported absolute commands.",
      );
    if (command === "M") {
      if (hasMove) {
        throw new Error("Each pen motion must be stored as a separate stroke.");
      }
      hasMove = true;
      current = readPoint();
      points.push(current);
      command = "L";
    } else if (command === "L") {
      const start = current;
      const end = readPoint();
      const distance = Math.hypot(end.x - start.x, end.y - start.y);
      appendCurve(
        (t) => ({
          x: start.x + (end.x - start.x) * t,
          y: start.y + (end.y - start.y) * t,
        }),
        distance,
      );
      current = end;
    } else if (command === "Q") {
      const start = current;
      const control = readPoint();
      const end = readPoint();
      const estimate =
        Math.hypot(control.x - start.x, control.y - start.y) +
        Math.hypot(end.x - control.x, end.y - control.y);
      appendCurve(
        (t) => ({
          x:
            (1 - t) ** 2 * start.x +
            2 * (1 - t) * t * control.x +
            t ** 2 * end.x,
          y:
            (1 - t) ** 2 * start.y +
            2 * (1 - t) * t * control.y +
            t ** 2 * end.y,
        }),
        estimate,
      );
      current = end;
    } else if (command === "C") {
      const start = current;
      const firstControl = readPoint();
      const secondControl = readPoint();
      const end = readPoint();
      const estimate =
        Math.hypot(firstControl.x - start.x, firstControl.y - start.y) +
        Math.hypot(
          secondControl.x - firstControl.x,
          secondControl.y - firstControl.y,
        ) +
        Math.hypot(end.x - secondControl.x, end.y - secondControl.y);
      appendCurve(
        (t) => ({
          x:
            (1 - t) ** 3 * start.x +
            3 * (1 - t) ** 2 * t * firstControl.x +
            3 * (1 - t) * t ** 2 * secondControl.x +
            t ** 3 * end.x,
          y:
            (1 - t) ** 3 * start.y +
            3 * (1 - t) ** 2 * t * firstControl.y +
            3 * (1 - t) * t ** 2 * secondControl.y +
            t ** 3 * end.y,
        }),
        estimate,
      );
      current = end;
    } else {
      throw new Error(`Unsupported handwriting SVG command: ${command}`);
    }
  }

  if (points.length < 2) {
    throw new Error("A handwriting stroke needs at least two points.");
  }
  const scaleX = size / viewWidth;
  const scaleY = size / viewHeight;
  const scaledPoints = points.map((point) => ({
    x: point.x * scaleX,
    y: point.y * scaleY,
  }));
  if (
    scaledPoints.some(
      (point) => point.x < 0 || point.x > size || point.y < 0 || point.y > size,
    )
  ) {
    throw new Error("Handwriting paths must stay inside the practice board.");
  }
  const cumulative = [0];
  for (let i = 1; i < scaledPoints.length; i++) {
    cumulative.push(
      cumulative[i - 1] +
        Math.hypot(
          scaledPoints[i].x - scaledPoints[i - 1].x,
          scaledPoints[i].y - scaledPoints[i - 1].y,
        ),
    );
  }
  const length = cumulative.at(-1) || 0;
  if (!Number.isFinite(length) || length <= 0) {
    throw new Error("A handwriting stroke needs non-zero length.");
  }
  return { points: scaledPoints, cumulative, length };
}

export function isPathInsideGlyph(metricsList, glyphPixels, size, radius = 4) {
  for (const metrics of metricsList) {
    for (const point of metrics.points) {
      const centerX = Math.round(point.x);
      const centerY = Math.round(point.y);
      let foundInk = false;
      for (let y = centerY - radius; y <= centerY + radius && !foundInk; y++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
          if (x < 0 || y < 0 || x >= size || y >= size) continue;
          if (Math.hypot(x - centerX, y - centerY) > radius) continue;
          if (glyphPixels[(y * size + x) * 4 + 3] > 16) {
            foundInk = true;
            break;
          }
        }
      }
      if (!foundInk) return false;
    }
  }
  return metricsList.length > 0;
}
