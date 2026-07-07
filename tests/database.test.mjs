import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDatabase } from "../server/database.js";

test("database stores entries, custom foods, weights, and history", async () => {
  const dir = await mkdtemp(join(tmpdir(), "nutrition-db-"));
  const dbPath = join(dir, "test.db");
  try {
    const db = createDatabase(dbPath);
    const food = db.addCustomFood({
      name: "测试牛肉饭",
      category: "自定义",
      serving: "200g",
      defaultGrams: 200,
      calories: 160,
      protein: 12,
      carbs: 20,
      fat: 4,
    });
    const entry = db.addEntry({
      date: "2026-07-07",
      meal: "lunch",
      foodId: food.id,
      foodName: food.name,
      grams: 200,
      calories: 320,
      protein: 24,
      carbs: 40,
      fat: 8,
    });
    db.saveWeight({ date: "2026-07-07", weight: 91.2 });

    const state = db.getState("2026-07-07");
    assert.equal(state.customFoods[0].name, "测试牛肉饭");
    assert.equal(state.day.lunch[0].id, entry.id);
    assert.equal(state.weight.weight, 91.2);

    const history = db.getHistory(7);
    assert.equal(history.length, 1);
    assert.equal(history[0].date, "2026-07-07");
    assert.equal(history[0].calories, 320);
    assert.equal(history[0].weight, 91.2);

    db.close();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
