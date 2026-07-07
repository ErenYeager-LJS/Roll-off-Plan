const COLORS = {
  weight: "#60a5fa",
  calories: "#fbbf24",
  exercise: "#a78bfa",
  protein: "#34d399",
  carbs: "#fde68a",
  fat: "#fb7185",
};

export function drawTrend(canvas, history, key, label) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "#b7a99a";
  ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(label, 12, 18);

  const values = history.map((item) => Number(item[key] || 0)).filter((value) => value > 0);
  if (values.length < 2) {
    ctx.fillStyle = "#84786d";
    ctx.fillText("数据不足，记录几天后会显示趋势", 12, height / 2);
    return;
  }

  const points = history
    .map((item, index) => ({ index, value: Number(item[key] || 0) }))
    .filter((point) => point.value > 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 14;
  const padTop = 28;
  const padBottom = 24;
  const usableW = width - padX * 2;
  const usableH = height - padTop - padBottom;

  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i += 1) {
    const y = padTop + (usableH / 2) * i;
    ctx.beginPath();
    ctx.moveTo(padX, y);
    ctx.lineTo(width - padX, y);
    ctx.stroke();
  }

  ctx.strokeStyle = COLORS[key] || "#fbbf24";
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((point, i) => {
    const x = padX + (point.index / Math.max(1, history.length - 1)) * usableW;
    const y = padTop + (1 - (point.value - min) / range) * usableH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = COLORS[key] || "#fbbf24";
  for (const point of points) {
    const x = padX + (point.index / Math.max(1, history.length - 1)) * usableW;
    const y = padTop + (1 - (point.value - min) / range) * usableH;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
