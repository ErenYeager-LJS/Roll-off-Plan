import { DatabaseSync } from "node:sqlite";

const DEFAULT_TARGETS = {
  calories: { min: 2000, max: 2200 },
  protein: { min: 95, max: 115 },
  carbs: { min: 260, max: 330 },
  fat: { min: 55, max: 75 },
};

const MEALS = ["breakfast", "lunch", "dinner"];

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function rowToEntry(row) {
  return {
    id: row.id,
    foodId: row.food_id,
    foodName: row.food_name,
    grams: row.grams,
    macros: {
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
    },
    createdAt: row.created_at,
  };
}

function rowToFood(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    serving: row.serving,
    defaultGrams: row.default_grams,
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
  };
}

export function createDatabase(path) {
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      meal TEXT NOT NULL,
      food_id TEXT NOT NULL,
      food_name TEXT NOT NULL,
      grams REAL NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);

    CREATE TABLE IF NOT EXISTS custom_foods (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      serving TEXT NOT NULL,
      default_grams REAL NOT NULL,
      calories REAL NOT NULL,
      protein REAL NOT NULL,
      carbs REAL NOT NULL,
      fat REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weights (
      date TEXT PRIMARY KEY,
      weight REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercise (
      date TEXT PRIMARY KEY,
      calories REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const targetsStmt = db.prepare("SELECT value FROM settings WHERE key = 'targets'");
  if (!targetsStmt.get()) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('targets', ?)").run(JSON.stringify(DEFAULT_TARGETS));
  }

  return {
    addEntry(entry) {
      const id = entry.id || `entry-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const createdAt = entry.createdAt || new Date().toISOString();
      db.prepare(`
        INSERT INTO entries (id, date, meal, food_id, food_name, grams, calories, protein, carbs, fat, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        entry.date,
        entry.meal,
        entry.foodId,
        entry.foodName,
        entry.grams,
        entry.calories,
        entry.protein,
        entry.carbs,
        entry.fat,
        createdAt,
      );
      return { ...entry, id, createdAt };
    },

    deleteEntry(id) {
      db.prepare("DELETE FROM entries WHERE id = ?").run(id);
    },

    clearDay(date) {
      db.prepare("DELETE FROM entries WHERE date = ?").run(date);
      db.prepare("DELETE FROM weights WHERE date = ?").run(date);
      db.prepare("DELETE FROM exercise WHERE date = ?").run(date);
    },

    addCustomFood(food) {
      const id = food.id || `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const createdAt = food.createdAt || new Date().toISOString();
      db.prepare(`
        INSERT INTO custom_foods (id, name, category, serving, default_grams, calories, protein, carbs, fat, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        food.name,
        food.category || "自定义",
        food.serving || `${food.defaultGrams || 100}g`,
        food.defaultGrams,
        food.calories,
        food.protein,
        food.carbs,
        food.fat,
        createdAt,
      );
      return { ...food, id, category: food.category || "自定义", createdAt };
    },

    saveWeight({ date, weight }) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO weights (date, weight, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET weight = excluded.weight, updated_at = excluded.updated_at
      `).run(date, weight, now, now);
      return { date, weight };
    },

    saveExercise({ date, calories }) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO exercise (date, calories, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(date) DO UPDATE SET calories = excluded.calories, updated_at = excluded.updated_at
      `).run(date, calories, now, now);
      return { date, calories };
    },

    getState(date) {
      const day = { breakfast: [], lunch: [], dinner: [] };
      const rows = db.prepare("SELECT * FROM entries WHERE date = ? ORDER BY created_at ASC").all(date);
      for (const row of rows) {
        if (MEALS.includes(row.meal)) day[row.meal].push(rowToEntry(row));
      }
      const customFoods = db.prepare("SELECT * FROM custom_foods ORDER BY created_at ASC").all().map(rowToFood);
      const weight = db.prepare("SELECT date, weight FROM weights WHERE date = ?").get(date) || null;
      const exercise = db.prepare("SELECT date, calories FROM exercise WHERE date = ?").get(date) || null;
      const targetsRow = db.prepare("SELECT value FROM settings WHERE key = 'targets'").get();
      return {
        day,
        customFoods,
        weight,
        exercise,
        targets: parseJson(targetsRow?.value, DEFAULT_TARGETS),
      };
    },

    getHistory(days = 30) {
      const limit = Math.max(1, Math.min(Number(days) || 30, 365));
      return db.prepare(`
        WITH dates AS (
          SELECT date FROM entries
          UNION
          SELECT date FROM weights
          UNION
          SELECT date FROM exercise
        )
        SELECT
          d.date,
          COALESCE(SUM(e.calories), 0) AS calories,
          COALESCE(SUM(e.protein), 0) AS protein,
          COALESCE(SUM(e.carbs), 0) AS carbs,
          COALESCE(SUM(e.fat), 0) AS fat,
          w.weight AS weight,
          x.calories AS exercise
        FROM dates d
        LEFT JOIN entries e ON e.date = d.date
        LEFT JOIN weights w ON w.date = d.date
        LEFT JOIN exercise x ON x.date = d.date
        GROUP BY d.date, w.weight, x.calories
        ORDER BY d.date DESC
        LIMIT ?
      `).all(limit).reverse();
    },

    close() {
      db.close();
    },
  };
}
