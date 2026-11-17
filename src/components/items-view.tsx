import { type Store } from "@/lib/types";
import { type Item } from "@/lib/types";
import { useState } from "react";
import { filterItems } from "@/lib/schedule";
import { Icon } from "./icon";
import { categories } from "@/lib/types";
import { statusLabels } from "@/lib/types";
import { ItemTable } from "./item-table";

export function Items({
  data,
  today,
  record,
  exportICS,
}: {
  data: Store;
  today: string;
  record: (item: Item) => void;
  exportICS: (items: Item[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("due");
  const [owner, setOwner] = useState("");
  const items = filterItems(data.items, today, { query, category, status, sort, owner });
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          管理項目一覧 <span className="count-pill">{data.items.length}</span>
        </h2>
        <button className="button" disabled={!items.length} onClick={() => exportICS(items)}>
          <Icon name="download" size={17} />
          .ics 書き出し
        </button>
      </div>
      <div className="filters">
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="項目名・対象・担当者で検索"
            aria-label="管理項目を検索"
          />
        </label>
        <select
          aria-label="カテゴリ"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select
          aria-label="担当者"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
        >
          <option value="">すべての担当者</option>
          {[...new Set(data.items.map((item) => item.owner))].map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select aria-label="ステータス" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">すべての状態</option>
          {Object.entries(statusLabels).map(([key, value]) => (
            <option value={key} key={key}>
              {value}
            </option>
          ))}
        </select>
        <select aria-label="並び順" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="due">期限が近い順</option>
          <option value="name">名前順</option>
        </select>
      </div>
      <div className="results-meta">
        {items.length}件を表示 <span>書き出し対象は現在表示している項目です</span>
      </div>
      <ItemTable items={items} today={today} record={record} />
    </section>
  );
}
