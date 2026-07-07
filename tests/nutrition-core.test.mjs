import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateEntryMacros,
  sumEntries,
  getMacroStatus,
  summarizeDay,
} from "../src/nutrition-core.js";

test("calculateEntryMacros scales per-100g nutrition by weight", () => {
  const result = calculateEntryMacros({
    food: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    grams: 120,
  });
  assert.deepEqual(result, {
    calories: 198,
    protein: 37.2,
    carbs: 0,
    fat: 4.3,
  });
});

test("sumEntries totals rounded macros", () => {
  const result = sumEntries([
    { calories: 198, protein: 37.2, carbs: 0, fat: 4.3 },
    { calories: 168, protein: 3.5, carbs: 35.3, fat: 1.2 },
  ]);
  assert.deepEqual(result, {
    calories: 366,
    protein: 40.7,
    carbs: 35.3,
    fat: 5.5,
  });
});

test("getMacroStatus reports low, ok, and high", () => {
  assert.deepEqual(getMacroStatus(80, { min: 95, max: 115 }, "g"), {
    state: "low",
    label: "偏低",
    message: "还差 15g",
  });
  assert.deepEqual(getMacroStatus(105, { min: 95, max: 115 }, "g"), {
    state: "ok",
    label: "合适",
    message: "在目标范围内",
  });
  assert.deepEqual(getMacroStatus(130, { min: 95, max: 115 }, "g"), {
    state: "high",
    label: "偏高",
    message: "超出 15g",
  });
});

test("summarizeDay combines breakfast lunch and dinner", () => {
  const day = {
    breakfast: [{ macros: { calories: 500, protein: 25, carbs: 70, fat: 12 } }],
    lunch: [{ macros: { calories: 760, protein: 50, carbs: 98, fat: 18 } }],
    dinner: [{ macros: { calories: 690, protein: 35, carbs: 84, fat: 20 } }],
  };
  const summary = summarizeDay(day, {
    calories: { min: 2000, max: 2200 },
    protein: { min: 95, max: 115 },
    carbs: { min: 260, max: 330 },
    fat: { min: 55, max: 75 },
  });
  assert.equal(summary.totals.calories, 1950);
  assert.equal(summary.status.calories.state, "low");
  assert.equal(summary.status.protein.state, "ok");
  assert.equal(summary.status.carbs.state, "low");
  assert.equal(summary.status.fat.state, "low");
});
