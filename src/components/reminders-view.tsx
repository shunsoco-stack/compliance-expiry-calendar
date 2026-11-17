import type { Store, Item, Stage } from "@/lib/types";
import { acknowledge, isAcknowledged, reminderStage, filterItems } from "@/lib/schedule";
import { ItemTable } from "./item-table";

const stages: [Stage, string][] = [
  ["overdue", "期限切れ"],
  ["today", "当日"],
  ["soon", "30日前"],
  ["upcoming", "90日前"],
];
export function Reminders({
  data,
  today,
  record,
  exportICS,
  commit,
}: {
  data: Store;
  today: string;
  record: (item: Item) => void;
  exportICS: (items: Item[]) => void;
  commit: (data: Store, message: string) => boolean;
}) {
  return (
    <>
      <div className="info-banner">
        <p>
          現在の段階に入った期限を表示します。確認済みでも、次の段階では再び未確認になります。通知はアプリ内のみです。
        </p>
      </div>
      {stages.map(([stage, label]) => {
        const items = filterItems(data.items, today).filter(
          (item) => reminderStage(item, today) === stage,
        );
        return (
          <section className={`panel ${stage}`} key={stage} id={stage}>
            <div className="panel-heading">
              <h2>
                {label} <span className="count-pill">{items.length}件</span>
              </h2>
              <button className="button" disabled={!items.length} onClick={() => exportICS(items)}>
                .ics 書き出し
              </button>
            </div>
            <ItemTable items={items} today={today} record={record} />
            <div className="acknowledgements">
              {items.map((item) => (
                <div className="acknowledgement" key={item.id}>
                  <span>{item.name}</span>
                  {isAcknowledged(data, item, today) ? (
                    <strong>確認済み</strong>
                  ) : (
                    <button
                      className="button"
                      onClick={() =>
                        commit(acknowledge(data, item, today), "この段階を確認済みにしました")
                      }
                    >
                      確認済みにする
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
      <p className="note-text">
        90日前は残り31〜90日、30日前は残り1〜30日、当日は残り0日です。期限を過ぎると期限切れとして表示します。
      </p>
    </>
  );
}
