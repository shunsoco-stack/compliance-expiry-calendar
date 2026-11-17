import type { Item } from "@/lib/types";
import { nextDeadline } from "@/lib/schedule";
import { validDate } from "@/lib/dates";
import { pretty } from "./view-helpers";

export function RecordForm({
  item,
  today,
  completed,
  setCompleted,
}: {
  item: Item;
  today: string;
  completed: string;
  setCompleted: (date: string) => void;
}) {
  const nextDue = validDate(completed) ? nextDeadline(item, completed) : undefined;
  return (
    <>
      <div className="record-summary">
        <strong>{item.name}</strong>
        <span>
          現在の期限：{pretty(item.due)} ·{" "}
          {item.cycle === null ? "周期なし（1回限り）" : `${item.cycle}か月周期`}
        </span>
      </div>
      <div className="form-grid">
        <label>
          実施日 <span>必須</span>
          <input
            type="date"
            required
            value={completed}
            max={today}
            onChange={(event) => setCompleted(event.target.value)}
          />
        </label>
        <label>
          実施者／実施先 <span>必須</span>
          <input name="person" defaultValue={item.owner} required maxLength={80} />
        </label>
      </div>
      <label>
        費用（円・任意）
        <input name="cost" type="number" min="0" step="1" max="9007199254740991" />
      </label>
      <p>起算方法：{item.basis === "due" ? "前回期限から" : "実施日から"}</p>
      <div className="record-summary" role="status">
        保存後：
        {nextDue === undefined
          ? "実施日を入力してください"
          : nextDue === null
            ? "完了済み（次回期限なし）"
            : `次回期限 ${pretty(nextDue)}`}
      </div>
      <p className="field-help">
        「前回期限から」では、早めに実施しても次回期限は前回期限＋周期になります。月末を超える場合はその月の末日に調整します。
      </p>
      <label>
        実施内容・メモ
        <textarea name="memo" rows={3} maxLength={2000} />
      </label>
    </>
  );
}
