import { type Store } from "@/lib/types";
import { type Item } from "@/lib/types";
import { type Status } from "@/lib/types";
import { statusOf } from "@/lib/schedule";
import { Icon } from "./icon";
import { pretty } from "./view-helpers";
import Link from "next/link";
import { daysUntil, addMonths } from "@/lib/dates";
import { ItemTable } from "./item-table";
import { statusLabels } from "@/lib/types";
import { Empty } from "./view-helpers";

export function Dashboard({
  data,
  today,
  record,
}: {
  data: Store;
  today: string;
  record: (item: Item) => void;
}) {
  const sorted = data.items.filter((item) => !item.done).sort((a, b) => a.due.localeCompare(b.due));
  const counts = (status: Status) =>
    data.items.filter((item) => statusOf(item.due, today, item.done) === status).length;
  return (
    <>
      <div className="section-kicker">
        <span>
          <Icon name="calendar" size={17} />
          {pretty(today)} 時点の状況
        </span>
        <span className="subtle">Asia/Tokyo</span>
      </div>
      <div className="stats-grid">
        {(
          [
            ["今日", counts("today"), "clock", "today", "本日が期限の項目"],
            ["期限切れ", counts("overdue"), "alert", "overdue", "優先して対応しましょう"],
            ["30日以内", counts("soon"), "clock", "soon", "手続き・日程の最終確認を"],
            ["31〜90日以内", counts("upcoming"), "calendar", "upcoming", "余裕をもって準備を開始"],
          ] as const
        ).map(([label, count, icon, status, caption]) => (
          <Link href={`/reminders#${status}`} className={`stat-card ${status}`} key={label}>
            <div className="stat-top">
              <span>{label}</span>
              <span className="stat-icon">
                <Icon name={icon} />
              </span>
            </div>
            <div className="stat-number">
              {count}
              <span>件</span>
            </div>
            <p>{caption}</p>
          </Link>
        ))}
      </div>
      {counts("overdue") > 0 && (
        <div className="attention">
          <span className="attention-icon">
            <Icon name="alert" />
          </span>
          <div>
            <strong>{counts("overdue")}件の項目が期限を過ぎています</strong>
            <p>対応状況を確認し、実施済みの場合は実施記録を登録してください。</p>
          </div>
          <Link href="/reminders">
            確認する <Icon name="arrow" size={17} />
          </Link>
        </div>
      )}
      <div className="dashboard-grid">
        <section className="panel priority-panel">
          <div className="panel-heading">
            <div>
              <h2>
                優先して確認する項目{" "}
                <span className="count-pill">
                  {sorted.filter((x) => daysUntil(x.due, today) <= 90).length}
                </span>
              </h2>
              <p>期限が近い順に、5件を表示しています</p>
            </div>
            <Link href="/items" className="text-link">
              すべて見る <Icon name="arrow" size={16} />
            </Link>
          </div>
          <ItemTable items={sorted.slice(0, 5)} today={today} record={record} compact />
        </section>
        <section className="panel overview-panel">
          <div className="panel-heading">
            <h2>期限の内訳</h2>
            <span className="subtle">全{data.items.length}件</span>
          </div>
          <div
            className="donut"
            style={{
              background: `conic-gradient(${(Object.keys(statusLabels) as Status[])
                .map((status, index, statuses) => {
                  const colors = ["#c76a59", "#b86a34", "#d9a14c", "#7296bb", "#7c9e8b", "#9294a4"];
                  const end =
                    (statuses.slice(0, index + 1).reduce((sum, key) => sum + counts(key), 0) /
                      (data.items.length || 1)) *
                    100;
                  return `${colors[index]} 0 ${end}%`;
                })
                .join(", ")})`,
            }}
          >
            <div>
              <strong>{data.items.length}</strong>
              <span>管理項目</span>
            </div>
          </div>
          <div className="legend">
            {(Object.keys(statusLabels) as Status[]).map((status) => (
              <div key={status}>
                <span>
                  <i className={status} />
                  {status === "upcoming" ? "31〜90日以内" : statusLabels[status]}
                </span>
                <strong>
                  {counts(status)} <small>件</small>
                </strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="month-counts">
        {[today.slice(0, 7), addMonths(`${today.slice(0, 7)}-01`, 1).slice(0, 7)].map(
          (month, index) => (
            <section className="panel prose" key={month}>
              <h2>
                {index === 0 ? "今月" : "来月"}（{month}）
              </h2>
              <strong>{sorted.filter((item) => item.due.startsWith(month)).length}件</strong>
            </section>
          ),
        )}
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <h2>最近の実施履歴</h2>
            <Link href="/history" className="text-link">
              すべて見る <Icon name="arrow" size={16} />
            </Link>
          </div>
          <div className="recent-list">
            {[...data.records]
              .sort((a, b) => b.completed.localeCompare(a.completed))
              .slice(0, 3)
              .map((row) => (
                <div className="recent-row" key={row.id}>
                  <span className="history-icon">
                    <Icon name="check" size={17} />
                  </span>
                  <div>
                    <Link href={`/items/${row.itemId}`}>{row.name}</Link>
                    <p>{row.person} が実施記録を登録</p>
                  </div>
                  <time>{pretty(row.completed)}</time>
                </div>
              ))}
            {!data.records.length && <Empty text="実施履歴はまだありません" />}
          </div>
        </section>
        <section className="tip-card">
          <div className="tip-tag">
            <Icon name="calendar" size={18} />
            期限管理のヒント
          </div>
          <h2>
            いつものカレンダーにも、
            <br />
            大切な期限を。
          </h2>
          <p>.ics ファイルを取り込むと、90日前・30日前・当日のリマインダーも一緒に登録できます。</p>
          <Link href="/items" className="text-link">
            カレンダーに書き出す <Icon name="arrow" size={17} />
          </Link>
          <div className="tip-art" aria-hidden="true">
            <Icon name="calendar" size={64} />
            <span>
              <Icon name="check" size={20} />
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
