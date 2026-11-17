import { RecordForm } from "./record-form";
import { type Item } from "@/lib/types";
import { type Store } from "@/lib/types";
import { useRef } from "react";
import { useState } from "react";

import { useEffect } from "react";
import { renewItem } from "@/lib/schedule";
import { type Category } from "@/lib/types";
import { parseStore } from "@/lib/storage";
import { Icon } from "./icon";
import { categories } from "@/lib/types";

export function Editor({
  kind,
  item,
  data,
  today,
  close,
  commit,
}: {
  kind: "item" | "record";
  item?: Item;
  data: Store;
  today: string;
  close: () => void;
  commit: (data: Store, message: string) => boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(today);

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const get = (name: string) => String(fields.get(name) || "").trim();
    try {
      let next: Store;
      if (kind === "record" && item) {
        next = renewItem(data, item.id, {
          completed,
          cost: get("cost") === "" ? null : Number(get("cost")),
          person: get("person"),
          memo: get("memo"),
        });
      } else {
        if (!["name", "owner", "target"].every((key) => get(key)))
          throw new Error("必須項目に空白のみを指定できません");
        const row: Item = {
          id: item?.id || crypto.randomUUID(),
          name: get("name"),
          category: get("category") as Category,
          target: get("target"),
          owner: get("owner"),
          due: get("due"),
          cycle: get("cycle") === "" ? null : Number(get("cycle")),
          basis: get("basis") === "completed" ? "completed" : "due",
          done: item?.done === true && get("cycle") === "",
          memo: get("memo"),
        };
        next = {
          ...data,
          items: item ? data.items.map((x) => (x.id === item.id ? row : x)) : [...data.items, row],
        };
        parseStore(JSON.stringify(next));
      }
      if (
        commit(
          next,
          kind === "record" ? "実施を記録し、次回期限を設定しました" : "管理項目を保存しました",
        )
      )
        close();
      else setError("保存できませんでした。保存設定と空き容量をご確認ください。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "入力内容をご確認ください");
    }
  }
  return (
    <dialog
      ref={ref}
      className="editor-dialog"
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <form onSubmit={submit}>
        <div className="dialog-heading">
          <div>
            <div className="eyebrow">
              {kind === "record" ? "RENEWAL RECORD" : "MANAGEMENT ITEM"}
            </div>
            <h2>
              {kind === "record" ? "実施を記録する" : item ? "管理項目を編集" : "管理項目を追加"}
            </h2>
          </div>
          <button type="button" className="icon-button" aria-label="閉じる" onClick={close}>
            <Icon name="close" />
          </button>
        </div>
        <div className="dialog-body">
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          {kind === "record" && item ? (
            <RecordForm
              item={item}
              today={today}
              completed={completed}
              setCompleted={setCompleted}
            />
          ) : (
            <>
              <label>
                管理項目名 <span>必須</span>
                <input
                  name="name"
                  defaultValue={item?.name}
                  required
                  maxLength={100}
                  placeholder="例：消防設備点検"
                  autoFocus
                />
              </label>
              <div className="form-grid">
                <label>
                  カテゴリ
                  <select name="category" defaultValue={item?.category}>
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <label>
                  担当者 <span>必須</span>
                  <input
                    name="owner"
                    defaultValue={item?.owner}
                    required
                    maxLength={80}
                    placeholder="例：佐藤 美咲"
                  />
                </label>
              </div>
              <label>
                対象・拠点 <span>必須</span>
                <input
                  name="target"
                  defaultValue={item?.target}
                  required
                  maxLength={120}
                  placeholder="例：本社ビル / 全館"
                />
              </label>
              <div className="form-grid">
                <label>
                  期限日 <span>必須</span>
                  <input type="date" name="due" defaultValue={item?.due} required />
                </label>
                <label>
                  周期（月数・空欄は周期なし／1回限り）
                  <input
                    name="cycle"
                    type="number"
                    min="1"
                    max="120"
                    step="1"
                    defaultValue={item ? (item.cycle ?? "") : 12}
                    list="cycles"
                  />
                  <datalist id="cycles">
                    {[1, 6, 12, 24, 36, 60].map((n) => (
                      <option value={n} key={n} />
                    ))}
                  </datalist>
                </label>
              </div>
              <p className="field-help">周期は1〜120か月、空欄なら1回限りです。</p>
              <label>
                次回期限の起算方法
                <select name="basis" defaultValue={item?.basis ?? "due"}>
                  <option value="due">前回期限から</option>
                  <option value="completed">実施日から</option>
                </select>
              </label>
              <label>
                メモ
                <textarea
                  name="memo"
                  defaultValue={item?.memo}
                  rows={3}
                  maxLength={2000}
                  placeholder="手続きの注意点や連絡先など"
                />
              </label>
            </>
          )}
        </div>
        <div className="dialog-footer">
          <button type="button" className="button" onClick={close}>
            キャンセル
          </button>
          <button className="button primary" type="submit">
            <Icon name="check" size={17} />
            {kind === "record" ? "記録して期限を更新" : "保存する"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
