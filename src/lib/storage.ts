import { validDate } from "./dates.ts";
import { categories, type Store } from "./types.ts";
export function parseStore(raw: string): Store {
  const value = JSON.parse(raw) as Store;
  if (
    value?.version !== 2 ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.records) ||
    !Array.isArray(value.acknowledgements)
  )
    throw new Error("保存データの形式が正しくありません");
  const string = (v: unknown) => typeof v === "string";
  if (
    value.items.some(
      (x) =>
        !x ||
        ![x.id, x.name, x.target, x.owner, x.memo].every(string) ||
        !x.id ||
        !x.name.trim() ||
        !categories.includes(x.category) ||
        !validDate(x.due) ||
        (x.cycle !== null && (!Number.isInteger(x.cycle) || x.cycle < 1 || x.cycle > 120)) ||
        !["due", "completed"].includes(x.basis) ||
        typeof x.done !== "boolean" ||
        (x.done && x.cycle !== null),
    )
  )
    throw new Error("管理項目の形式が正しくありません");
  if (new Set(value.items.map((x) => x.id)).size !== value.items.length)
    throw new Error("管理項目のIDが重複しています");
  if (
    value.records.some(
      (x) =>
        !x ||
        ![x.id, x.itemId, x.name, x.person, x.memo].every(string) ||
        ![x.completed, x.previousDue].every(validDate) ||
        (x.nextDue !== null && !validDate(x.nextDue)) ||
        typeof x.previousDone !== "boolean" ||
        (x.cost !== null && (!Number.isSafeInteger(x.cost) || x.cost < 0)),
    )
  )
    throw new Error("更新履歴の形式が正しくありません");
  if (
    new Set(value.records.map((row) => row.id)).size !== value.records.length ||
    value.acknowledgements.some(
      (row) =>
        !row ||
        !string(row.itemId) ||
        !validDate(row.due) ||
        !["overdue", "today", "soon", "upcoming"].includes(row.stage),
    )
  )
    throw new Error("履歴・確認済みデータの形式が正しくありません");
  return value;
}
