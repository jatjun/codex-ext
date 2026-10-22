import test from "node:test";
import assert from "node:assert/strict";
import {
  readVisibility,
  saveVisibility,
  VISIBILITY_KEY,
} from "../learning-home/visibility-model.js";
function storage() {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
    data,
  };
}
test("默认全显示，取消勾选会持久保存，恢复后不删除题目数据", () => {
  const s = storage();
  assert.deepEqual(readVisibility(s), {});
  saveVisibility({}, ["math:pdf-12"], false, s);
  assert.equal(readVisibility(s)["math:pdf-12"], true);
  saveVisibility(readVisibility(s), ["math:pdf-12"], true, s);
  assert.deepEqual(readVisibility(s), {});
  assert.equal(s.getItem(VISIBILITY_KEY), "{}");
});
test("按学科和错题隔离，批量只影响指定范围", () => {
  const s = storage(),
    before = { "english:en-1-1": true, "mistake:abc": true };
  saveVisibility(before, ["math:pdf-1", "math:pdf-2"], false, s);
  saveVisibility(readVisibility(s), ["math:pdf-1"], true, s);
  assert.deepEqual(readVisibility(s), {
    "english:en-1-1": true,
    "mistake:abc": true,
    "math:pdf-2": true,
  });
});
test("损坏存储安全回退，写入失败不伪装保存成功", () => {
  assert.deepEqual(readVisibility({ getItem: () => "{broken" }), {});
  const before = { "math:shop": true };
  assert.equal(
    saveVisibility(before, ["math:shop"], true, {
      setItem: () => {
        throw Error("quota");
      },
    }),
    null,
  );
  assert.equal(before["math:shop"], true);
});
