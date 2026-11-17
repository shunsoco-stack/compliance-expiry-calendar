import { type Item } from "@/lib/types";
import { statusOf } from "@/lib/schedule";
import { statusLabels } from "@/lib/types";
import { Icon } from "./icon";

export function pretty(date: string) {
  return date.replaceAll("-", "/");
}

export function download(contents: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Badge({ item, today }: { item: Item; today: string }) {
  const status = statusOf(item.due, today, item.done);
  return (
    <span className={`badge ${status}`}>
      <span />
      {statusLabels[status]}
    </span>
  );
}

export function Empty({ text = "該当する項目はありません" }: { text?: string }) {
  return (
    <div className="empty">
      <Icon name="check" size={28} />
      <strong>{text}</strong>
      <p>条件を変えるか、新しい管理項目を追加してください。</p>
    </div>
  );
}
