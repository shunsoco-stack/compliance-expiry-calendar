import { addDays, addMonths } from "./dates.ts";
import { acknowledge } from "./schedule.ts";
import type { Category, Store, Item } from "./types.ts";

export function seedStore(today: string): Store {
  const rows: [string, Category, string, string, number, number | null][] = [
    ["本社ビル 消防設備点検（架空）", "法定点検", "本社ビル（架空）", "青木（架空）", -12, 6],
    ["社用車 白いバン（架空） 車検", "車検", "白いバン（架空）", "田中（架空）", -3, 24],
    ["青凪店 浄化槽 法定検査（架空）", "法定点検", "青凪店（架空）", "青木（架空）", 0, 12],
    ["本社ビル 電気設備点検（架空）", "法定点検", "本社ビル（架空）", "鈴木（架空）", 7, 12],
    ["店舗 火災保険（架空の保険会社）", "保険", "青凪店（架空）", "青木（架空）", 18, 12],
    ["佐藤 花子（架空） 普通自動車免許", "資格・免許", "佐藤 花子（架空）", "佐藤（架空）", 28, 60],
    ["本社ビル 昇降機定期検査（架空）", "法定点検", "本社ビル（架空）", "鈴木（架空）", 45, 12],
    ["社用車 青いワゴン（架空） 自賠責保険", "車検", "青いワゴン（架空）", "田中（架空）", 62, 24],
    ["店舗 施設賠償責任保険（架空）", "保険", "青凪店（架空）", "青木（架空）", 85, 12],
    ["本社ビル 建築設備定期検査（架空）", "法定点検", "本社ビル（架空）", "鈴木（架空）", 120, 12],
    ["社用車 緑の軽自動車（架空） 車検", "車検", "緑の軽自動車（架空）", "田中（架空）", 150, 24],
    ["社用車 任意自動車保険（架空）", "保険", "白いバン（架空）", "田中（架空）", 180, 12],
    [
      "高橋 葵（架空） 危険物取扱者保安講習",
      "資格・免許",
      "高橋 葵（架空）",
      "佐藤（架空）",
      210,
      36,
    ],
    ["海風店 消防設備点検（架空）", "法定点検", "海風店（架空）", "鈴木（架空）", 240, 12],
    [
      "山田 太郎（架空） 普通自動車免許",
      "資格・免許",
      "山田 太郎（架空）",
      "佐藤（架空）",
      300,
      60,
    ],
    [
      "田中 一郎（架空） 第一種衛生管理者 取得手続き",
      "資格・免許",
      "田中 一郎（架空）",
      "田中（架空）",
      -20,
      null,
    ],
  ];
  const items: Item[] = rows.map(([name, category, target, owner, offset, cycle], i) => ({
    id: `item-${i + 1}`,
    name,
    category,
    target,
    owner,
    due: addDays(today, offset),
    cycle,
    basis: i % 3 === 0 ? "completed" : "due",
    done: cycle === null,
    memo:
      cycle === null
        ? "資格自体の更新期限ではなく、取得手続きの一度限りの予定です。"
        : "架空の期限・周期です。証明書等で実際の期限を確認してください。",
  }));
  let store: Store = { version: 2, items, records: [], acknowledgements: [] };
  for (const [index, item] of items.entries()) {
    let nextDue = item.due;
    const count = item.cycle === null ? 1 : 1 + (index % 3);
    for (let n = 0; n < count; n += 1) {
      // 今日より前の実施日を保証し、各履歴の次回期限を現在の項目まで連結する。
      const previousDue = item.cycle === null ? item.due : addMonths(nextDue, -item.cycle);
      const completed =
        item.cycle === null
          ? addDays(today, -21)
          : item.basis === "due"
            ? addDays(previousDue, -3)
            : previousDue;
      store.records.push({
        id: `record-${index}-${n}`,
        itemId: item.id,
        name: item.name,
        completed,
        previousDue,
        previousDone: false,
        nextDue: item.cycle === null ? null : nextDue,
        person: "青空サービス（架空）",
        cost: index % 2 === 0 ? 12000 + index * 1000 : null,
        memo: "過去の実施記録（架空）。期限は証明書に基づく設定例です。",
      });
      nextDue = previousDue;
    }
  }
  store = acknowledge(store, items[3], today);
  return acknowledge(store, items[6], today);
}
