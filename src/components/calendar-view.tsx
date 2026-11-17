import { CategoryBadge } from "./category-badge";
import { type Store } from "@/lib/types";
import { useState } from "react";
import { addDays } from "@/lib/dates";
import { pretty } from "./view-helpers";
import Link from "next/link";
import { categories } from "@/lib/types";
import { Badge } from "./view-helpers";
import { Icon } from "./icon";
import { Empty } from "./view-helpers";

export function Calendar({ data, today }: { data: Store; today: string }) {
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState("");
  const first = `${month}-01`;
  const start = addDays(first, -new Date(`${first}T00:00:00Z`).getUTCDay());
  const dates = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const monthItems = data.items
    .filter((item) => !item.done && (selected ? item.due === selected : item.due.startsWith(month)))
    .sort((a, b) => a.due.localeCompare(b.due));
  function move(offset: number) {
    const date = new Date(`${first}T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + offset);
    setMonth(date.toISOString().slice(0, 7));
    setSelected("");
  }
  return (
    <>
      <section className="panel">
        <div className="panel-heading calendar-heading">
          <h2>
            {Number(month.slice(0, 4))}年 {Number(month.slice(5))}月
          </h2>
          <div className="button-group">
            <button
              className="button"
              onClick={() => {
                setMonth(today.slice(0, 7));
                setSelected("");
              }}
            >
              今日へ戻る
            </button>
            <button className="icon-button" onClick={() => move(-1)} aria-label="前の月">
              ←
            </button>
            <button className="icon-button" onClick={() => move(1)} aria-label="次の月">
              →
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {"日月火水木金土".split("").map((day) => (
            <div className="weekday" key={day}>
              {day}
            </div>
          ))}
          {dates.map((date) => (
            <div
              key={date}
              className={`calendar-cell ${date.startsWith(month) ? "" : "outside"} ${selected === date ? "selected" : ""}`}
            >
              <button
                aria-label={`${pretty(date)}の期限を表示`}
                aria-pressed={selected === date}
                className={`day-number ${date === today ? "is-today" : ""}`}
                onClick={() => setSelected(selected === date ? "" : date)}
              >
                <span className="mobile-date">{pretty(date).slice(5)} </span>
                <span className="desktop-date">{Number(date.slice(-2))}</span>
              </button>
              {data.items
                .filter((item) => !item.done && item.due === date)
                .map((item) => (
                  <Link
                    className={`calendar-event category-${categories.indexOf(item.category)}`}
                    href={`/items/${item.id}`}
                    key={item.id}
                  >
                    {item.name}
                  </Link>
                ))}
            </div>
          ))}
        </div>
      </section>
      <section className="panel calendar-agenda">
        <div className="panel-heading">
          <h2>
            {selected ? pretty(selected) : `${Number(month.slice(5))}月`}の期限{" "}
            <span className="count-pill">{monthItems.length}</span>
          </h2>
          {selected && (
            <button className="button" onClick={() => setSelected("")}>
              月全体を表示
            </button>
          )}
        </div>
        {monthItems.length ? (
          monthItems.map((item) => (
            <Link key={item.id} className="agenda-row" href={`/items/${item.id}`}>
              <time>{pretty(item.due)}</time>
              <strong>
                {item.name}
                <CategoryBadge category={item.category} />
              </strong>
              <Badge item={item} today={today} />
              <Icon name="arrow" size={16} />
            </Link>
          ))
        ) : (
          <Empty text="この期間の期限はありません" />
        )}
      </section>
    </>
  );
}
