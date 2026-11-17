import { addMonths, daysUntil, validDate } from "./dates.ts";
import type { Item, Status, Store, Stage } from "./types.ts";

export function statusOf(due: string, today: string, done = false): Status {
  if (done) return "done";
  const days = daysUntil(due, today);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 30) return "soon";
  return days <= 90 ? "upcoming" : "safe";
}
export function nextDeadline(item: Item, completed: string): string | null {
  if (!validDate(completed)) throw new Error("実施日を確認してください");
  return item.cycle === null
    ? null
    : addMonths(item.basis === "due" ? item.due : completed, item.cycle);
}
export function reminderStage(item: Item, today: string): Stage | null {
  const status = statusOf(item.due, today, item.done);
  return status === "safe" || status === "done" ? null : status;
}
export function isAcknowledged(store: Store, item: Item, today: string): boolean {
  const stage = reminderStage(item, today);
  return store.acknowledgements.some(
    (row) => row.itemId === item.id && row.due === item.due && row.stage === stage,
  );
}
export function acknowledge(store: Store, item: Item, today: string): Store {
  const stage = reminderStage(item, today);
  if (!stage || isAcknowledged(store, item, today)) return store;
  return {
    ...store,
    acknowledgements: [...store.acknowledgements, { itemId: item.id, due: item.due, stage }],
  };
}
export function unreadCount(store: Store, today: string): number {
  return store.items.filter(
    (item) => reminderStage(item, today) && !isAcknowledged(store, item, today),
  ).length;
}
export function filterItems(
  items: Item[],
  today: string,
  filters: {
    query?: string;
    category?: string;
    owner?: string;
    status?: string;
    sort?: string;
  } = {},
): Item[] {
  return items
    .filter(
      (item) =>
        `${item.name} ${item.target} ${item.owner}`
          .toLowerCase()
          .includes((filters.query ?? "").toLowerCase()) &&
        (!filters.category || item.category === filters.category) &&
        (!filters.owner || item.owner === filters.owner) &&
        (!filters.status || statusOf(item.due, today, item.done) === filters.status),
    )
    .sort((a, b) =>
      filters.sort === "name"
        ? a.name.localeCompare(b.name, "ja")
        : a.due.localeCompare(b.due) || a.id.localeCompare(b.id),
    );
}
export function renewItem(
  store: Store,
  id: string,
  input: { completed: string; person: string; cost: number | null; memo: string },
): Store {
  const item = store.items.find((row) => row.id === id);
  if (!item || item.done) throw new Error("実施を記録できる項目がありません");
  if (!input.person.trim()) throw new Error("実施者／実施先を入力してください");
  if (input.cost !== null && (!Number.isSafeInteger(input.cost) || input.cost < 0))
    throw new Error("費用は0以上の整数で入力してください");
  const nextDue = nextDeadline(item, input.completed);
  return {
    ...store,
    items: store.items.map((row) =>
      row.id === id ? { ...row, due: nextDue ?? row.due, done: nextDue === null } : row,
    ),
    records: [
      {
        ...input,
        id: crypto.randomUUID(),
        itemId: id,
        name: item.name,
        previousDue: item.due,
        previousDone: item.done,
        nextDue,
      },
      ...store.records,
    ],
  };
}
// 記録は登録順で保持し、最後の登録を取り消す。
export function undoLatest(store: Store, id: string): Store {
  const record = store.records.find((row) => row.itemId === id);
  if (!record || !store.items.some((item) => item.id === id))
    throw new Error("取り消せる実施記録がありません");
  return {
    ...store,
    items: store.items.map((item) =>
      item.id === id ? { ...item, due: record.previousDue, done: record.previousDone } : item,
    ),
    records: store.records.filter((row) => row.id !== record.id),
  };
}
export function yearlySummary(records: Store["records"]) {
  const years: Record<string, { count: number; cost: number }> = {};
  for (const row of records) {
    const year = row.completed.slice(0, 4);
    years[year] ??= { count: 0, cost: 0 };
    years[year].count += 1;
    years[year].cost += row.cost ?? 0;
  }
  return years;
}
