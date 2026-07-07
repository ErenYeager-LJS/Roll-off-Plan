import { BUILT_IN_FOODS, DEFAULT_TARGETS, MEAL_LABELS } from "./food-data.js";
import {
  calculateEntryMacros,
  emptyDay,
  summarizeDay,
  todayKey,
} from "./nutrition-core.js";
import {
  clearDay,
  createCustomFood,
  createEntry,
  fetchHistory,
  fetchState,
  removeEntry,
  saveWeight,
} from "./api.js";
import { drawTrend } from "./trends.js";

let state = {
  days: {},
  customFoods: [],
  targets: DEFAULT_TARGETS,
  weights: {},
};
let currentWeight = null;
let historyDays = 30;
let history = [];
let currentDate = todayKey();
let activeMeal = "breakfast";
let selectedFood = BUILT_IN_FOODS[0];

const $ = (selector) => document.querySelector(selector);

const elements = {
  dashboard: $("#dashboard"),
  macroGrid: $("#macroGrid"),
  insight: $("#insight"),
  weightCard: $("#weightCard"),
  trendCard: $("#trendCard"),
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

async function loadFromServer() {
  const serverState = await fetchState(currentDate);
  state.days[currentDate] = serverState.day || emptyDay();
  state.customFoods = serverState.customFoods || [];
  state.targets = serverState.targets || DEFAULT_TARGETS;
  currentWeight = serverState.weight?.weight || null;
  history = await fetchHistory(historyDays);
  render();
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
  renderWeightCard();
  renderTrendCard();
  renderMealActions();
  renderMealList();
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

function renderWeightCard() {
  elements.weightCard.innerHTML = `
    <div class="weight-row">
      <div>
        <p class="micro-label">今日体重</p>
        <h2>${currentWeight ? `${formatNumber(currentWeight)} kg` : "未记录"}</h2>
      </div>
      <form class="weight-form" id="weightForm">
        <input class="input weight-input" name="weight" type="number" min="20" max="250" step="0.1" placeholder="91.0" value="${currentWeight || ""}" />
        <button class="mini-button" type="submit">保存</button>
      </form>
    </div>
  `;
}

function renderTrendCard() {
  elements.trendCard.innerHTML = `
    <div class="trend-head">
      <div>
        <p class="micro-label">趋势</p>
        <h2>波动图</h2>
      </div>
      <div class="trend-tabs">
        <button class="mini-button ${historyDays === 7 ? "active-tab" : ""}" type="button" data-history-days="7">7天</button>
        <button class="mini-button ${historyDays === 30 ? "active-tab" : ""}" type="button" data-history-days="30">30天</button>
      </div>
    </div>
    <div class="chart-grid">
      <canvas class="trend-canvas" data-chart="weight" aria-label="体重趋势"></canvas>
      <canvas class="trend-canvas" data-chart="calories" aria-label="热量趋势"></canvas>
      <canvas class="trend-canvas" data-chart="protein" aria-label="蛋白质趋势"></canvas>
      <canvas class="trend-canvas" data-chart="carbs" aria-label="碳水趋势"></canvas>
      <canvas class="trend-canvas" data-chart="fat" aria-label="脂肪趋势"></canvas>
    </div>
  `;
  const labels = {
    weight: "体重 kg",
    calories: "热量 kcal",
    protein: "蛋白质 g",
    carbs: "碳水 g",
    fat: "脂肪 g",
  };
  requestAnimationFrame(() => {
    for (const canvas of elements.trendCard.querySelectorAll("canvas")) {
      drawTrend(canvas, history, canvas.dataset.chart, labels[canvas.dataset.chart]);
    }
  });
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
  renderEntrySheet("", { focusSearch: true });
  elements.entrySheet.showModal();
}

function renderEntrySheet(query = "", options = {}) {
  const previousScrollTop = options.preserveScroll ? elements.entrySheet.querySelector(".sheet-card")?.scrollTop || 0 : 0;
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
              <div class="food-item ${food.id === selectedFood.id ? "active" : ""}">
                <button class="food-row" type="button" data-select-food="${food.id}">
                  <div>
                    <strong>${escapeHtml(food.name)}</strong>
                    <p class="food-meta">${food.serving} · 每100g ${food.calories} kcal · 蛋白 ${food.protein}g</p>
                  </div>
                  <span class="category-badge">${escapeHtml(food.category || "自定义")}</span>
                </button>
                <div class="inline-entry-panel ${food.id === selectedFood.id ? "" : "hide"}">
                  <label class="form-field">
                    <span>重量 g/ml</span>
                    <input class="input" data-grams-input type="number" min="1" step="1" value="${food.defaultGrams || 100}" />
                  </label>
                  <button class="primary-button" type="button" data-add-entry>添加到${MEAL_LABELS[activeMeal]}</button>
                </div>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="sheet-actions">
        <button class="ghost-button" type="button" data-open-custom>新增自定义食物</button>
        <button class="ghost-button" type="button" data-clear-today>清空今天</button>
      </div>
    </div>
  `;
  if (options.focusSearch) {
    const searchInput = $("#foodSearch");
    searchInput?.focus();
    searchInput?.setSelectionRange(query.length, query.length);
  }
  if (options.preserveScroll) {
    requestAnimationFrame(() => {
      const sheetCard = elements.entrySheet.querySelector(".sheet-card");
      if (sheetCard) sheetCard.scrollTop = previousScrollTop;
    });
  }
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

async function addSelectedEntry() {
  const query = $("#foodSearch")?.value || "";
  const grams = Number(elements.entrySheet.querySelector(".food-item.active [data-grams-input]")?.value);
  if (!Number.isFinite(grams) || grams <= 0) {
    alert("请输入大于 0 的重量。");
    return;
  }
  const macros = calculateEntryMacros({ food: selectedFood, grams });
  await createEntry({
    date: currentDate,
    meal: activeMeal,
    foodId: selectedFood.id,
    foodName: selectedFood.name,
    grams,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  });
  await loadFromServer();
  renderEntrySheet(query, { preserveScroll: true });
}

async function addCustomFood(form) {
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
  selectedFood = await createCustomFood(food);
  elements.customFoodSheet.close();
  await loadFromServer();
  renderEntrySheet("");
}

async function deleteEntry(meal, entryId) {
  if (!confirm("删除这条记录？")) return;
  await removeEntry(entryId);
  await loadFromServer();
}

document.addEventListener("click", async (event) => {
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
    renderEntrySheet($("#foodSearch")?.value || "", { preserveScroll: true });
  }

  if (target.dataset.addEntry !== undefined) await addSelectedEntry();
  if (target.dataset.openCustom !== undefined) openCustomFoodSheet();

  if (target.dataset.clearToday !== undefined) {
    if (confirm("清空今天的三餐记录？")) {
      await clearDay(currentDate);
      elements.entrySheet.close();
      await loadFromServer();
    }
  }

  if (target.dataset.deleteEntry) {
    await deleteEntry(target.dataset.meal, target.dataset.deleteEntry);
  }

  if (target.dataset.historyDays) {
    historyDays = Number(target.dataset.historyDays);
    history = await fetchHistory(historyDays);
    render();
  }
});

document.addEventListener("input", (event) => {
  if (event.target.id === "foodSearch") {
    renderEntrySheet(event.target.value, { focusSearch: true });
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "customFoodForm") {
    event.preventDefault();
    addCustomFood(event.target);
  }
  if (event.target.id === "weightForm") {
    event.preventDefault();
    const weight = Number(new FormData(event.target).get("weight"));
    if (!Number.isFinite(weight) || weight <= 0) {
      alert("请输入有效体重。");
      return;
    }
    saveWeight(currentDate, weight).then(loadFromServer).catch((error) => alert(error.message));
  }
});

elements.todayButton.addEventListener("click", async () => {
  currentDate = todayKey();
  await loadFromServer();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}

loadFromServer().catch((error) => {
  elements.insight.innerHTML = `<p class="insight-text">无法连接本地数据库服务：${escapeHtml(error.message)}</p>`;
});
