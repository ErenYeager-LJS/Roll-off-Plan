import { BUILT_IN_FOODS, DEFAULT_TARGETS, MEAL_LABELS } from "./food-data.js";
import { loadState, saveState, resetToday } from "./storage.js";
import {
  calculateEntryMacros,
  emptyDay,
  summarizeDay,
  todayKey,
} from "./nutrition-core.js";

let state = loadState();
let currentDate = todayKey();
let activeMeal = "breakfast";
let selectedFood = BUILT_IN_FOODS[0];

const $ = (selector) => document.querySelector(selector);

const elements = {
  dashboard: $("#dashboard"),
  macroGrid: $("#macroGrid"),
  insight: $("#insight"),
  mealActions: $("#mealActions"),
  mealList: $("#mealList"),
  entrySheet: $("#entrySheet"),
  customFoodSheet: $("#customFoodSheet"),
  todayButton: $("#todayButton"),
};

function dayRecord() {
  if (!state.days[currentDate]) state.days[currentDate] = emptyDay();
  return state.days[currentDate];
}

function allFoods() {
  return [...BUILT_IN_FOODS, ...state.customFoods];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(1);
}

function progressPercent(value, max) {
  return Math.min(100, Math.max(0, Math.round((Number(value || 0) / max) * 100)));
}

function statusClass(stateName) {
  if (stateName === "high") return "status-high";
  if (stateName === "ok") return "status-ok";
  return "status-low";
}

function render() {
  const summary = summarizeDay(dayRecord(), state.targets || DEFAULT_TARGETS);
  renderDashboard(summary);
  renderMacros(summary);
  renderInsight(summary);
  renderMealActions();
  renderMealList();
  saveState(state);
}

function renderDashboard(summary) {
  const target = state.targets.calories;
  const remaining = Math.max(0, Math.round(target.max - summary.totals.calories));
  const percent = progressPercent(summary.totals.calories, target.max);
  elements.dashboard.innerHTML = `
    <div class="hero-row">
      <div>
        <p class="date-label">${currentDate}</p>
        <p class="micro-label">还可摄入</p>
        <div class="remaining-number">${remaining} kcal</div>
      </div>
      <div class="progress-ring">${percent}%</div>
    </div>
    <div class="progress-track" aria-label="热量进度">
      <div class="progress-fill" style="width:${percent}%"></div>
    </div>
    <p class="status-copy" style="margin-top:10px">
      已摄入 ${summary.totals.calories} kcal / 目标 ${target.min}-${target.max} kcal
    </p>
  `;
}

function renderMacros(summary) {
  const items = [
    ["protein", "蛋白质", "protein"],
    ["carbs", "碳水", "carbs"],
    ["fat", "脂肪", "fat"],
  ];
  elements.macroGrid.innerHTML = items
    .map(([key, label, cls]) => {
      const target = state.targets[key];
      const status = summary.status[key];
      return `
        <article class="macro-card ${cls}">
          <p class="micro-label">${label}</p>
          <div class="macro-value">${formatNumber(summary.totals[key])}g</div>
          <p class="macro-target">/ ${target.max}g</p>
          <p class="${statusClass(status.state)}" style="margin-top:8px;font-size:12px;font-weight:800">
            ${status.label}
          </p>
        </article>
      `;
    })
    .join("");
}

function renderInsight(summary) {
  const problems = [
    ["蛋白质", summary.status.protein],
    ["碳水", summary.status.carbs],
    ["脂肪", summary.status.fat],
    ["热量", summary.status.calories],
  ].filter(([, status]) => status.state !== "ok");

  const main = problems[0];
  const badge = main ? main[1].label : "状态合适";
  const text = main
    ? `${main[0]}${main[1].label}，${main[1].message}。${suggestionFor(main[0], main[1].state)}`
    : "今天的热量和三大营养素都在目标范围内。保持当前节奏。";

  elements.insight.innerHTML = `
    <div class="insight-title">
      <h2 style="font-size:17px">今日提示</h2>
      <span class="status-pill">${badge}</span>
    </div>
    <p class="insight-text">${text}</p>
  `;
}

function suggestionFor(name, stateName) {
  if (stateName === "high") {
    if (name === "脂肪") return "后续优先选虾仁、少刺鱼或少油鸡胸肉。";
    if (name === "碳水") return "后续主食减量，蔬菜不需要减少。";
    if (name === "热量") return "今天后面尽量不再加高油食物。";
    return "后续不用再额外堆肉蛋奶。";
  }
  if (name === "蛋白质") return "下一餐可选虾仁、鱼、鸡胸肉或低脂牛奶。";
  if (name === "碳水") return "训练日可补糙米饭、土豆、玉米或荞麦面。";
  if (name === "脂肪") return "脂肪偏低不一定要硬补，正常烹调油即可。";
  return "下一餐正常吃主食和蛋白质，不需要极端节食。";
}

function renderMealActions() {
  elements.mealActions.innerHTML = `
    <button class="meal-button breakfast" type="button" data-open-meal="breakfast">早餐</button>
    <button class="meal-button lunch" type="button" data-open-meal="lunch">午餐</button>
    <button class="meal-button dinner" type="button" data-open-meal="dinner">晚餐</button>
  `;
}

function renderMealList() {
  const day = dayRecord();
  elements.mealList.innerHTML = Object.entries(MEAL_LABELS)
    .map(([meal, label]) => {
      const entries = day[meal] || [];
      const mealTotals = entries.reduce(
        (totals, entry) => ({
          calories: totals.calories + entry.macros.calories,
          protein: totals.protein + entry.macros.protein,
          carbs: totals.carbs + entry.macros.carbs,
          fat: totals.fat + entry.macros.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 },
      );
      return `
        <article class="meal-card">
          <div class="meal-card-header">
            <div>
              <h3>${label}</h3>
              <p class="entry-meta">
                ${Math.round(mealTotals.calories)} kcal · 蛋白质 ${formatNumber(mealTotals.protein)}g · 碳水 ${formatNumber(mealTotals.carbs)}g · 脂肪 ${formatNumber(mealTotals.fat)}g
              </p>
            </div>
            <button class="mini-button" type="button" data-open-meal="${meal}">添加</button>
          </div>
          <div class="entry-list">
            ${
              entries.length
                ? entries
                    .map(
                      (entry) => `
                        <div class="entry-row">
                          <div>
                            <strong>${escapeHtml(entry.foodName)}</strong>
                            <p class="entry-meta">
                              ${formatNumber(entry.grams)}g · ${entry.macros.calories} kcal · 蛋白 ${formatNumber(entry.macros.protein)}g · 碳水 ${formatNumber(entry.macros.carbs)}g · 脂肪 ${formatNumber(entry.macros.fat)}g
                            </p>
                          </div>
                          <button class="danger-button" type="button" data-delete-entry="${entry.id}" data-meal="${meal}">删除</button>
                        </div>
                      `,
                    )
                    .join("")
                : `<p class="empty">还没有记录。点“添加”录入这一餐。</p>`
            }
          </div>
        </article>
      `;
    })
    .join("");
}

function openEntrySheet(meal) {
  activeMeal = meal;
  selectedFood = allFoods()[0] || BUILT_IN_FOODS[0];
  renderEntrySheet("");
  elements.entrySheet.showModal();
}

function renderEntrySheet(query = "") {
  const foods = allFoods().filter((food) => food.name.includes(query.trim()));
  elements.entrySheet.innerHTML = `
    <div class="sheet-card">
      <div class="sheet-header">
        <div>
          <p class="micro-label">记录${MEAL_LABELS[activeMeal]}</p>
          <div class="sheet-title">选择食物</div>
        </div>
        <button class="ghost-button" type="button" data-close-dialog>关闭</button>
      </div>

      <input class="search-input" id="foodSearch" placeholder="搜索：鸡蛋 / 糙米饭 / 虾仁" value="${escapeHtml(query)}" />

      <div class="food-list">
        ${foods
          .map(
            (food) => `
              <button class="food-row ${food.id === selectedFood.id ? "active" : ""}" type="button" data-select-food="${food.id}">
                <div>
                  <strong>${escapeHtml(food.name)}</strong>
                  <p class="food-meta">${food.serving} · 每100g ${food.calories} kcal · 蛋白 ${food.protein}g</p>
                </div>
                <span class="category-badge">${escapeHtml(food.category || "自定义")}</span>
              </button>
            `,
          )
          .join("")}
      </div>

      <div class="selected-panel">
        <div class="food-row" style="cursor:default">
          <div>
            <strong>${escapeHtml(selectedFood.name)}</strong>
            <p class="food-meta">输入本次吃了多少克/ml，系统按每100g数据计算。</p>
          </div>
        </div>
        <label class="form-field">
          <span>重量 g/ml</span>
          <input class="input" id="gramsInput" type="number" min="1" step="1" value="${selectedFood.defaultGrams || 100}" />
        </label>
        <button class="primary-button" type="button" data-add-entry>添加到${MEAL_LABELS[activeMeal]}</button>
      </div>

      <div class="sheet-actions">
        <button class="ghost-button" type="button" data-open-custom>新增自定义食物</button>
        <button class="ghost-button" type="button" data-clear-today>清空今天</button>
      </div>
    </div>
  `;
  $("#foodSearch")?.focus();
}

function openCustomFoodSheet() {
  elements.customFoodSheet.innerHTML = `
    <form class="sheet-card" id="customFoodForm" method="dialog">
      <div class="sheet-header">
        <div>
          <p class="micro-label">食物库</p>
          <div class="sheet-title">新增自定义食物</div>
        </div>
        <button class="ghost-button" type="button" data-close-dialog>关闭</button>
      </div>
      <label class="form-field">
        <span>名称</span>
        <input class="input" name="name" required placeholder="例如：家常番茄牛肉" />
      </label>
      <div class="form-grid">
        <label class="form-field">
          <span>默认重量</span>
          <input class="input" name="defaultGrams" type="number" min="1" value="100" required />
        </label>
        <label class="form-field">
          <span>热量 kcal/100g</span>
          <input class="input" name="calories" type="number" min="0" step="0.1" required />
        </label>
        <label class="form-field">
          <span>蛋白质 g/100g</span>
          <input class="input" name="protein" type="number" min="0" step="0.1" required />
        </label>
        <label class="form-field">
          <span>碳水 g/100g</span>
          <input class="input" name="carbs" type="number" min="0" step="0.1" required />
        </label>
        <label class="form-field">
          <span>脂肪 g/100g</span>
          <input class="input" name="fat" type="number" min="0" step="0.1" required />
        </label>
      </div>
      <button class="primary-button" type="submit">保存食物</button>
    </form>
  `;
  elements.customFoodSheet.showModal();
}

function addSelectedEntry() {
  const grams = Number($("#gramsInput")?.value);
  if (!Number.isFinite(grams) || grams <= 0) {
    alert("请输入大于 0 的重量。");
    return;
  }
  const macros = calculateEntryMacros({ food: selectedFood, grams });
  const entry = {
    id: `entry-${Date.now()}`,
    foodId: selectedFood.id,
    foodName: selectedFood.name,
    grams,
    macros,
    createdAt: new Date().toISOString(),
  };
  dayRecord()[activeMeal].push(entry);
  elements.entrySheet.close();
  render();
}

function addCustomFood(form) {
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const food = {
    id: `custom-${Date.now()}`,
    name,
    category: "自定义",
    serving: `${Number(data.get("defaultGrams")) || 100}g`,
    defaultGrams: Number(data.get("defaultGrams")),
    calories: Number(data.get("calories")),
    protein: Number(data.get("protein")),
    carbs: Number(data.get("carbs")),
    fat: Number(data.get("fat")),
  };
  const invalid = !name || [food.defaultGrams, food.calories, food.protein, food.carbs, food.fat].some((value) => !Number.isFinite(value) || value < 0);
  if (invalid || food.defaultGrams <= 0) {
    alert("请完整填写有效的营养数据。");
    return;
  }
  state.customFoods.push(food);
  saveState(state);
  selectedFood = food;
  elements.customFoodSheet.close();
  renderEntrySheet("");
}

function deleteEntry(meal, entryId) {
  if (!confirm("删除这条记录？")) return;
  const entries = dayRecord()[meal] || [];
  dayRecord()[meal] = entries.filter((entry) => entry.id !== entryId);
  render();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  const meal = target.dataset.openMeal;
  if (meal) openEntrySheet(meal);

  if (target.dataset.closeDialog !== undefined) {
    target.closest("dialog")?.close();
  }

  const foodId = target.dataset.selectFood;
  if (foodId) {
    selectedFood = allFoods().find((food) => food.id === foodId) || selectedFood;
    renderEntrySheet($("#foodSearch")?.value || "");
  }

  if (target.dataset.addEntry !== undefined) addSelectedEntry();
  if (target.dataset.openCustom !== undefined) openCustomFoodSheet();

  if (target.dataset.clearToday !== undefined) {
    if (confirm("清空今天的三餐记录？")) {
      state = resetToday(state, currentDate);
      elements.entrySheet.close();
      render();
    }
  }

  if (target.dataset.deleteEntry) {
    deleteEntry(target.dataset.meal, target.dataset.deleteEntry);
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "foodSearch") {
    renderEntrySheet(event.target.value);
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "customFoodForm") {
    event.preventDefault();
    addCustomFood(event.target);
  }
});

elements.todayButton.addEventListener("click", () => {
  currentDate = todayKey();
  render();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

render();
