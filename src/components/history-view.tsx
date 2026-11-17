import { yearlySummary } from "@/lib/schedule";
import { type Store } from "@/lib/types";
import { useState } from "react";
import { Icon } from "./icon";
import { Empty } from "./view-helpers";
import { pretty } from "./view-helpers";

export function History({ data, itemId }: { data: Store; itemId?: string }) {
  const [query, setQuery] = useState("");
  const records = data.records
    .filter(
      (row) =>
        (!itemId || row.itemId === itemId) &&
        `${row.name} ${row.person} ${row.memo}`.includes(query),
    )
    .sort((a, b) => b.completed.localeCompare(a.completed));
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>
          実施記録 <span className="count-pill">{records.length}</span>
        </h2>
        {!itemId && (
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              aria-label="履歴を検索"
              placeholder="項目名・実施者で検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        )}
      </div>
      <div className="year-summary">
        {Object.entries(yearlySummary(records))
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([year, total]) => (
            <p key={year}>
              <strong>{year}年</strong>：{total.count}件 ／ 費用合計{" "}
              {total.cost.toLocaleString("ja-JP")}円
            </p>
          ))}
      </div>
      {!records.length ? (
        <Empty text="実施履歴はありません" />
      ) : (
        <div className="history-list">
          {records.map((row) => (
            <article key={row.id} className="history-entry">
              <span className="history-icon">
                <Icon name="check" />
              </span>
              <div>
                <div className="history-entry-title">
                  <h3>{row.name}</h3>
                  <span className="badge safe">実施済み</span>
                </div>
                <p>
                  {pretty(row.completed)} 実施 · {row.person} · 費用：
                  {row.cost === null ? "未入力" : `${row.cost.toLocaleString("ja-JP")}円`}
                </p>
                <div className="date-transition">
                  <span>
                    更新前 <strong>{pretty(row.previousDue)}</strong>
                  </span>
                  <Icon name="arrow" size={18} />
                  <span>
                    次回期限 <strong>{row.nextDue ? pretty(row.nextDue) : "完了済み"}</strong>
                  </span>
                </div>
                {row.memo && <p>{row.memo}</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
