import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("food amount input expands inside the selected food row", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /class="food-item/);
  assert.match(appSource, /class="inline-entry-panel/);
  assert.doesNotMatch(appSource, /class="selected-panel/);
});

test("food selection rerenders without focusing the search input", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /function renderEntrySheet\(query = "", options = \{\}\)/);
  assert.match(appSource, /options\.preserveScroll/);
  assert.match(appSource, /if \(options\.focusSearch\)/);
  assert.match(appSource, /renderEntrySheet\("", \{ focusSearch: true \}\)/);
  assert.match(appSource, /renderEntrySheet\(\$\(("#|')foodSearch("|')\)\?\.value \|\| "", \{ preserveScroll: true \}\)/);
  assert.match(appSource, /renderEntrySheet\(event\.target\.value, \{ focusSearch: true \}\)/);
});

test("trend charts are placed after food logging sections", async () => {
  const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

  const trendIndex = indexSource.indexOf('id="trendCard"');
  const mealActionsIndex = indexSource.indexOf('id="mealActions"');
  const mealListIndex = indexSource.indexOf('id="mealList"');

  assert.ok(mealActionsIndex > 0);
  assert.ok(mealListIndex > mealActionsIndex);
  assert.ok(trendIndex > mealListIndex);
});

test("entry grams are read from the currently selected food row", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.doesNotMatch(appSource, /id="gramsInput"/);
  assert.match(appSource, /data-grams-input/);
  assert.ok(appSource.includes('querySelector(".food-item.active [data-grams-input]")'));
});

test("adding one food keeps the entry sheet open for consecutive entry", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const addSelectedEntryBody = appSource.match(/async function addSelectedEntry\(\) \{([\s\S]*?)\n\}/)?.[1] || "";

  assert.doesNotMatch(addSelectedEntryBody, /entrySheet\.close\(\)/);
  assert.match(addSelectedEntryBody, /await loadFromServer\(\)/);
  assert.match(addSelectedEntryBody, /renderEntrySheet\(/);
});

test("food search supports Chinese IME composition without rerendering mid-input", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /let foodSearchComposing = false/);
  assert.match(appSource, /compositionstart/);
  assert.match(appSource, /compositionend/);
  assert.match(appSource, /event\.isComposing/);
  assert.match(appSource, /if \(foodSearchComposing \|\| event\.isComposing\) return/);
});

test("adding a food shows a non-blocking success toast", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const stylesSource = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /function showToast\(message\)/);
  assert.match(appSource, /data-toast/);
  assert.match(appSource, /showToast\(`已成功添加\$\{selectedFood\.name\}`\)/);
  assert.match(stylesSource, /\.toast/);
  assert.match(stylesSource, /\.toast\.show/);
});

test("entry sheet keeps close button and search bar sticky while scrolling foods", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const stylesSource = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  assert.match(appSource, /class="sheet-sticky"/);
  assert.match(appSource, /data-close-dialog/);
  assert.match(appSource, /id="foodSearch"/);
  assert.match(stylesSource, /\.sheet-sticky/);
  assert.match(stylesSource, /position: sticky/);
  assert.match(stylesSource, /top: 0/);
});

test("built-in foods include cooking oil and common condiments", async () => {
  const foodSource = await readFile(new URL("../src/food-data.js", import.meta.url), "utf8");

  assert.match(foodSource, /cooking-oil/);
  assert.match(foodSource, /soy-sauce/);
  assert.match(foodSource, /oyster-sauce/);
  assert.match(foodSource, /cumin-powder/);
  assert.match(foodSource, /category: "调味料"/);
});

test("UI records simple exercise calories", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  const apiSource = await readFile(new URL("../src/api.js", import.meta.url), "utf8");
  const indexSource = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(indexSource, /id="exerciseCard"/);
  assert.match(appSource, /renderExerciseCard/);
  assert.match(appSource, /id="exerciseForm"/);
  assert.match(appSource, /运动消耗/);
  assert.match(appSource, /saveExercise\(currentDate, calories\)/);
  assert.match(apiSource, /api\/exercise/);
});
