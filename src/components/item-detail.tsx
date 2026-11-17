import { CategoryBadge } from "./category-badge";
import { undoLatest } from "@/lib/schedule";
import { type Store } from "@/lib/types";
import { type Item } from "@/lib/types";
import { Icon } from "./icon";
import Link from "next/link";
import { Badge } from "./view-helpers";
import { pretty } from "./view-helpers";
import { daysUntil } from "@/lib/dates";
import { addDays } from "@/lib/dates";
import { History } from "./history-view";

export function Detail({
  data,
  id,
  today,
  edit,
  record,
  exportICS,
  commit,
}: {
  data: Store;
  id: string;
  today: string;
  edit: (item: Item) => void;
  record: (item: Item) => void;
  exportICS: (items: Item[]) => void;
  commit: (data: Store, message: string) => boolean;
}) {
  const item = data.items.find((row) => row.id === id);
  if (!item)
    return (
      <section className="panel missing">
        <Icon name="search" size={35} />
        <h2>管理項目が見つかりません</h2>
        <p>このブラウザーに保存されていない項目、または削除された項目です。</p>
        <Link className="button primary" href="/items">
          管理項目に戻る
        </Link>
      </section>
    );
  return (
    <>
      <Link href="/items" className="back-link">
        ← 管理項目に戻る
      </Link>
      <section className="panel detail-panel">
        <div className="panel-heading">
          <div>
            <CategoryBadge category={item.category} />
            <h2>{item.name}</h2>
          </div>
          <Badge item={item} today={today} />
        </div>
        <div className="detail-body">
          <div className="due-feature">
            <span>次回の期限</span>
            <strong>{item.done ? "完了済み" : pretty(item.due)}</strong>
            <p>
              {item.done
                ? "次回期限はありません"
                : daysUntil(item.due, today) < 0
                  ? `${-daysUntil(item.due, today)}日超過しています`
                  : `期限まであと${daysUntil(item.due, today)}日`}
            </p>
            <button className="button primary" disabled={item.done} onClick={() => record(item)}>
              <Icon name="check" size={18} />
              実施を記録する
            </button>
          </div>
          <dl>
            <div>
              <dt>対象・拠点</dt>
              <dd>{item.target}</dd>
            </div>
            <div>
              <dt>担当者</dt>
              <dd>{item.owner}</dd>
            </div>
            <div>
              <dt>更新周期</dt>
              <dd>{item.cycle === null ? "周期なし（1回限り）" : `${item.cycle}か月`}</dd>
            </div>
            <div>
              <dt>次回期限の起算方法</dt>
              <dd>{item.basis === "due" ? "前回期限から" : "実施日から"}</dd>
            </div>
            <div>
              <dt>メモ</dt>
              <dd>{item.memo || "メモはありません"}</dd>
            </div>
            <div>
              <dt>通知の目安</dt>
              <dd>
                90日前：{pretty(addDays(item.due, -90))}
                <br />
                30日前：{pretty(addDays(item.due, -30))}
                <br />
                当日：{pretty(item.due)}
              </dd>
            </div>
          </dl>
        </div>
        <div className="detail-actions">
          <button className="button" onClick={() => edit(item)}>
            項目を編集
          </button>
          <button className="button" onClick={() => exportICS([item])}>
            <Icon name="download" size={17} />
            .ics 書き出し
          </button>
          <button
            className="button danger"
            onClick={() => {
              if (window.confirm(`「${item.name}」を削除しますか？実施履歴は残ります。`))
                commit(
                  { ...data, items: data.items.filter((row) => row.id !== id) },
                  "管理項目を削除しました。実施履歴は保持しています。",
                );
            }}
          >
            項目を削除
          </button>
        </div>
      </section>
      <button
        className="button"
        disabled={!data.records.some((row) => row.itemId === id)}
        onClick={() => {
          if (window.confirm("直近の実施記録を取り消し、期限と状態を元に戻しますか？"))
            commit(undoLatest(data, id), "直近の実施記録を取り消しました");
        }}
      >
        直近の実施記録を取り消す
      </button>
      <History data={data} itemId={id} />
    </>
  );
}
