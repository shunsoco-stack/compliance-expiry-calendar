import { CategoryBadge } from "./category-badge";
import { type Item } from "@/lib/types";
import { Empty } from "./view-helpers";
import Link from "next/link";
import { pretty } from "./view-helpers";
import { statusOf } from "@/lib/schedule";
import { daysUntil } from "@/lib/dates";
import { Badge } from "./view-helpers";
import { Icon } from "./icon";

export function ItemTable({
  items,
  today,
  record,
  compact = false,
}: {
  items: Item[];
  today: string;
  record: (item: Item) => void;
  compact?: boolean;
}) {
  if (!items.length) return <Empty />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>管理項目 / 対象</th>
            <th>期限日</th>
            <th>ステータス</th>
            {!compact && <th>担当者</th>}
            <th>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <Link className="item-name" href={`/items/${item.id}`}>
                  {item.name}
                </Link>
                <div className="item-target">{item.target}</div>
                <CategoryBadge category={item.category} />
              </td>
              <td className="date-cell">
                {item.done ? "—" : pretty(item.due)}
                <small className={statusOf(item.due, today, item.done)}>
                  {item.done
                    ? "完了済み"
                    : daysUntil(item.due, today) < 0
                      ? `${Math.abs(daysUntil(item.due, today))}日超過`
                      : daysUntil(item.due, today) === 0
                        ? "本日期限"
                        : `あと${daysUntil(item.due, today)}日`}
                </small>
              </td>
              <td>
                <Badge item={item} today={today} />
              </td>
              {!compact && <td>{item.owner}</td>}
              <td>
                <button
                  className="row-action"
                  disabled={item.done}
                  onClick={() => record(item)}
                  aria-label={`${item.name}の実施を記録`}
                >
                  記録 <Icon name="arrow" size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
