const MEALS = ["breakfast", "lunch", "dinner"];

export function round1(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

export function calculateEntryMacros({ food, grams }) {
  const factor = Number(grams) / 100;
  return {
    calories: Math.round(Number(food.calories || 0) * factor),
    protein: round1(Number(food.protein || 0) * factor),
    carbs: round1(Number(food.carbs || 0) * factor),
    fat: round1(Number(food.fat || 0) * factor),
  };
}

export function sumEntries(entries) {
  return entries.reduce(
    (total, entry) => ({
      calories: Math.round(total.calories + Number(entry.calories || 0)),
      protein: round1(total.protein + Number(entry.protein || 0)),
      carbs: round1(total.carbs + Number(entry.carbs || 0)),
      fat: round1(total.fat + Number(entry.fat || 0)),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function getMacroStatus(value, range, unit) {
  const current = Number(value || 0);
  if (current < range.min) {
    const diff = round1(range.min - current);
    return { state: "low", label: "偏低", message: `还差 ${diff}${unit}` };
  }
  if (current > range.max) {
    const diff = round1(current - range.max);
    return { state: "high", label: "偏高", message: `超出 ${diff}${unit}` };
  }
  return { state: "ok", label: "合适", message: "在目标范围内" };
}

export function emptyDay() {
  return { breakfast: [], lunch: [], dinner: [] };
}

export function summarizeDay(day, targets, exerciseCalories = 0) {
  const entries = MEALS.flatMap((meal) =>
    (day?.[meal] || []).map((entry) => entry.macros || entry),
  );
  const totals = sumEntries(entries);
  const exercise = Math.max(0, Math.round(Number(exerciseCalories || 0)));
  const netCalories = Math.max(0, Math.round(totals.calories - exercise));
  return {
    totals,
    exerciseCalories: exercise,
    netCalories,
    status: {
      calories: getMacroStatus(netCalories, targets.calories, "kcal"),
      protein: getMacroStatus(totals.protein, targets.protein, "g"),
      carbs: getMacroStatus(totals.carbs, targets.carbs, "g"),
      fat: getMacroStatus(totals.fat, targets.fat, "g"),
    },
  };
}

export function todayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
