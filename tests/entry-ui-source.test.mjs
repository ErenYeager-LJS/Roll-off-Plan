import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("food amount input expands inside the selected food row", async () => {
  const appSource = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(appSource, /class="food-item/);
  assert.match(appSource, /class="inline-entry-panel/);
  assert.doesNotMatch(appSource, /class="selected-panel/);
});
