export const categories = ["法定点検", "車検", "資格・免許", "保険"] as const;
export type Category = (typeof categories)[number];
export type Basis = "due" | "completed";
export type Item = {
  id: string;
  name: string;
  category: Category;
  target: string;
  owner: string;
  due: string;
  cycle: number | null;
  basis: Basis;
  done: boolean;
  memo: string;
};
export type RecordEntry = {
  id: string;
  itemId: string;
  name: string;
  completed: string;
  previousDue: string;
  previousDone: boolean;
  nextDue: string | null;
  person: string;
  cost: number | null;
  memo: string;
};
export type Stage = "overdue" | "today" | "soon" | "upcoming";
export type Acknowledgement = { itemId: string; due: string; stage: Stage };
export type Store = {
  version: 2;
  items: Item[];
  records: RecordEntry[];
  acknowledgements: Acknowledgement[];
};
export type Status = Stage | "safe" | "done";
export const statusLabels: Record<Status, string> = {
  overdue: "期限切れ",
  today: "今日",
  soon: "30日以内",
  upcoming: "90日以内",
  safe: "余裕あり",
  done: "完了済み",
};
