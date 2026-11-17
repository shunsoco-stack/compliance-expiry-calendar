import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  todayTokyo,
  statusOf,
  seedStore,
  renewItem,
  undoLatest,
  nextDeadline,
  reminderStage,
  acknowledge,
  isAcknowledged,
  unreadCount,
  filterItems,
  yearlySummary,
  parseStore,
  createICS,
  categories,
} from "../src/lib/domain.ts";

const today = "2026-11-17";
const input = { completed: today, person: "担当者（架空）", cost: 1000, memo: "実施" };
for (const [date, months, expected] of [
  ["2025-01-31", 1, "2025-02-28"],
  ["2024-01-31", 1, "2024-02-29"],
  ["2024-02-29", 12, "2025-02-28"],
  ["2025-12-31", 1, "2026-01-31"],
])
  test(`月加算 ${date} + ${months}`, () => assert.equal(addMonths(date, months), expected));

test("不正な日付と月数を拒否", () => {
  assert.throws(() => addMonths("2025-02-30", 1));
  assert.throws(() => addMonths(today, 1.5));
  assert.throws(() => addDays(today, NaN));
});
test("日本時間の午前0時の境界", () => {
  assert.equal(todayTokyo(new Date("2026-11-16T15:00:00Z")), today);
  assert.equal(todayTokyo(new Date("2026-11-16T14:59:59Z")), "2026-11-16");
});
for (const [days, expected] of [
  [-1, "overdue"],
  [0, "today"],
  [1, "soon"],
  [30, "soon"],
  [31, "upcoming"],
  [90, "upcoming"],
  [91, "safe"],
]) {
  test(`状態境界 残り${days}日`, () =>
    assert.equal(statusOf(addDays(today, days), today), expected));
}
test("完了済みは日付に優先", () =>
  assert.equal(statusOf(addDays(today, -20), today, true), "done"));
for (const date of [
  "2026-11-17",
  "2025-01-31",
  "2024-02-29",
  "2025-12-31",
  "2026-04-30",
  "2026-02-28",
]) {
  test(`シードの内訳と履歴 ${date}`, () => {
    const data = seedStore(date);
    assert.equal(data.items.length, 16);
    assert.equal(data.records.length, 31);
    assert.deepEqual(new Set(data.items.map((item) => item.category)), new Set(categories));
    for (const [status, count] of Object.entries({
      overdue: 2,
      today: 1,
      soon: 3,
      upcoming: 3,
      safe: 6,
      done: 1,
    })) {
      assert.equal(
        data.items.filter((item) => statusOf(item.due, date, item.done) === status).length,
        count,
      );
    }
    for (const item of data.items) {
      const records = data.records.filter((row) => row.itemId === item.id);
      assert.ok(records.length >= 1 && records.length <= 3);
      assert.ok(records.every((row) => row.completed < date));
      assert.ok(item.name.includes("架空"));
    }
    assert.ok(data.items.some((item) => item.name.includes("自賠責")));
    assert.ok(data.records.some((row) => row.cost > 0));
    assert.equal(unreadCount(data, date), 7);
    assert.deepEqual(parseStore(JSON.stringify(data)), data);
  });
}
test("前回期限からなら前倒し実施でも前回期限＋周期", () => {
  const item = { ...seedStore(today).items[0], due: "2024-01-31", cycle: 1, basis: "due" };
  assert.equal(nextDeadline(item, "2024-01-10"), "2024-02-29");
});
test("実施日からなら実施日＋周期", () => {
  const item = { ...seedStore(today).items[0], due: "2024-03-31", cycle: 1, basis: "completed" };
  assert.equal(nextDeadline(item, "2024-01-31"), "2024-02-29");
});
test("実施記録は自動更新し元データを変更しない", () => {
  const data = seedStore(today);
  const before = structuredClone(data);
  const next = renewItem(data, data.items[0].id, input);
  assert.equal(next.items[0].due, nextDeadline(data.items[0], today));
  assert.equal(next.records[0].previousDue, data.items[0].due);
  assert.equal(next.records[0].cost, 1000);
  assert.deepEqual(data, before);
  assert.deepEqual(undoLatest(next, data.items[0].id), data);
});
test("周期なしは完了し、取り消しで元の期限と状態に戻る", () => {
  let data = seedStore(today);
  data = undoLatest(data, "item-16");
  assert.equal(data.items[15].done, false);
  const next = renewItem(data, "item-16", input);
  assert.equal(next.items[15].done, true);
  assert.equal(next.records[0].nextDue, null);
  assert.equal(reminderStage(next.items[15], today), null);
  assert.deepEqual(undoLatest(next, "item-16"), data);
});
test("直近の登録を取り消す（実施日の新旧ではない）", () => {
  const data = seedStore(today);
  const first = renewItem(data, "item-1", input);
  const second = renewItem(first, "item-1", { ...input, completed: addDays(today, -10) });
  assert.deepEqual(undoLatest(second, "item-1"), first);
});
test("不正費用・実施者・存在しない項目・完了項目を拒否", () => {
  const data = seedStore(today);
  for (const cost of [-1, 0.5, NaN, Infinity])
    assert.throws(() => renewItem(data, "item-1", { ...input, cost }));
  assert.throws(() => renewItem(data, "item-1", { ...input, person: " " }));
  assert.throws(() => renewItem(data, "missing", input));
  assert.throws(() => renewItem(data, "item-16", input));
  assert.throws(() => undoLatest(data, "missing"));
});
test("確認済みは90日前→30日前→当日→期限切れでリセット", () => {
  let data = seedStore(today);
  const item = { ...data.items[0], due: addDays(today, 90), done: false };
  data.items[0] = item;
  for (const [offset, stage] of [
    [0, "upcoming"],
    [60, "soon"],
    [90, "today"],
    [91, "overdue"],
  ]) {
    const date = addDays(today, offset);
    assert.equal(reminderStage(item, date), stage);
    assert.equal(isAcknowledged(data, item, date), false);
    const before = unreadCount(data, date);
    data = acknowledge(data, item, date);
    assert.equal(isAcknowledged(data, item, date), true);
    assert.equal(unreadCount(data, date), before - 1);
    assert.equal(acknowledge(data, item, date), data);
  }
});
test("期限更新後は前の期限の確認済みを引き継がない", () => {
  const original = seedStore(today);
  const data = acknowledge(original, original.items[0], today);
  const item = { ...data.items[0], due: addDays(today, -1) };
  assert.equal(isAcknowledged(data, item, today), false);
});
test("余裕あり・完了済みには通知なし", () => {
  const data = seedStore(today);
  assert.equal(reminderStage(data.items[9], today), null);
  assert.equal(reminderStage(data.items[15], today), null);
  assert.equal(acknowledge(data, data.items[9], today), data);
});
test("種類・担当者・状態・検索の複合絞り込み", () => {
  const data = seedStore(today);
  const item = data.items[1];
  assert.deepEqual(
    filterItems(data.items, today, {
      category: item.category,
      owner: item.owner,
      status: "overdue",
      query: "白い",
    }),
    [item],
  );
  assert.equal(filterItems(data.items, today, { status: "done" }).length, 1);
  assert.equal(filterItems(data.items, today, { query: "存在しない" }).length, 0);
});
test("期限順・名称順で並べ替え、元配列を変更しない", () => {
  const data = seedStore(today);
  const before = structuredClone(data.items);
  const due = filterItems(data.items, today);
  const names = filterItems(data.items, today, { sort: "name" });
  assert.deepEqual(
    due.map((item) => item.due),
    before.map((item) => item.due).sort(),
  );
  assert.deepEqual(
    names.map((item) => item.name),
    before.map((item) => item.name).sort((a, b) => a.localeCompare(b, "ja")),
  );
  assert.deepEqual(data.items, before);
});
test("年別件数・費用は未入力を0として合算", () => {
  const records = seedStore(today)
    .records.slice(0, 3)
    .map((row, i) => ({
      ...row,
      completed: i < 2 ? "2025-01-01" : "2024-12-31",
      cost: i === 0 ? 100 : i === 1 ? null : 250,
    }));
  assert.deepEqual(yearlySummary(records), {
    2025: { count: 2, cost: 100 },
    2024: { count: 1, cost: 250 },
  });
});
test("旧形式・破損・不正な項目・重複IDを拒否", () => {
  const data = seedStore(today);
  assert.throws(() => parseStore("broken"));
  assert.throws(() => parseStore(JSON.stringify({ ...data, version: 1 })));
  assert.throws(() =>
    parseStore(JSON.stringify({ ...data, items: [...data.items, data.items[0]] })),
  );
  for (const patch of [
    { due: "2026-02-30" },
    { category: "不明" },
    { cycle: 0 },
    { basis: "不明" },
    { done: true },
    { cycle: undefined },
  ]) {
    const copy = structuredClone(data);
    Object.assign(copy.items[0], patch);
    assert.throws(() => parseStore(JSON.stringify(copy)));
  }
});
test("履歴と確認済みの破損を拒否", () => {
  for (const change of [
    (data) => {
      data.records[0].cost = -1;
    },
    (data) => {
      data.records[0].previousDone = undefined;
    },
    (data) => {
      data.acknowledgements[0].stage = "unknown";
    },
  ]) {
    const data = seedStore(today);
    change(data);
    assert.throws(() => parseStore(JSON.stringify(data)));
  }
});
test("ICSは完了済みを除外し各予定に3アラーム", () => {
  const data = seedStore(today);
  const ics = createICS(data.items, new Date("2026-11-17T00:00:00Z"));
  const events = ics.split("BEGIN:VEVENT").slice(1);
  assert.equal(events.length, 15);
  for (const event of events) {
    assert.equal((event.match(/BEGIN:VALARM/g) || []).length, 3);
    for (const trigger of ["TRIGGER:-P90D", "TRIGGER:-P30D", "TRIGGER:PT0S"])
      assert.equal(event.split(trigger).length - 1, 1);
  }
  assert.match(ics, /DTSTART;VALUE=DATE:20261105/);
  assert.match(ics, /DTEND;VALUE=DATE:20261106/);
  assert.doesNotMatch(ics, /UID:item-16@/);
  assert.doesNotMatch(createICS([data.items[15]]), /BEGIN:VEVENT/);
});
test("ICSの日本語75バイト折り返しと特殊文字エスケープ", () => {
  const item = {
    ...seedStore(today).items[0],
    name: "日本語の長い項目名".repeat(12) + ",;" + String.fromCharCode(92, 10) + "テスト",
  };
  const ics = createICS([item]);
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  const unfolded = ics.replace(/\r\n /g, "");
  assert.ok(unfolded.includes(String.fromCharCode(92) + ","));
  assert.ok(unfolded.includes(String.fromCharCode(92) + ";"));
  assert.ok(unfolded.includes(String.fromCharCode(92) + "nテスト"));
});
