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
