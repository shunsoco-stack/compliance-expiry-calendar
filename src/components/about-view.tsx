import { type Store } from "@/lib/types";
import { useState } from "react";
import { Icon } from "./icon";
import { download } from "./view-helpers";
import { todayTokyo } from "@/lib/dates";
import { parseStore } from "@/lib/storage";
import { seedStore } from "@/lib/seed";

export function About({
  data,
  commit,
}: {
  data: Store;
  commit: (data: Store, message: string) => boolean;
}) {
  const [error, setError] = useState("");
  return (
    <div className="about-layout">
      <section className="panel prose">
        <span className="brand-mark">
          <Icon name="calendar" size={28} />
        </span>
        <h2>大切な期限を、ひとつの場所に。</h2>
        <p>
          期限ノートは、小さな総務チームのための期限管理デモです。点検・車検・資格・保険を一覧で確認し、90日前・30日前・当日に準備を進め、実施した内容を記録できます。
        </p>
        <h3>3つの使い方</h3>
        <ol>
          <li>管理項目に、対象・担当者・期限・更新周期を登録します。</li>
          <li>リマインダーやカレンダーで、対応が必要な項目を確認します。</li>
          <li>完了したら「実施を記録する」から次回期限と履歴を保存します。</li>
        </ol>
        <h3>計算ルール</h3>
        <p>
          次回期限は項目に保存した周期と起算方法で自動計算します。「前回期限から」では早めに実施しても前回期限＋周期です。「実施日から」では実施日＋周期です。月末を超える場合はその月の末日に調整します。周期なしは完了済みになり、カレンダーとICSから除外します。直近の記録を取り消すと期限と状態が戻ります。
        </p>
        <p>
          確認済みは期限日・通知段階ごとに記録します。次の段階では未確認になります。古い形式・破損した保存データは既定データで作り直し、通知します。
        </p>
        <h3>データと通知について</h3>
        <p>
          データは localStorage
          の「cec:v1」に保存されます。サーバー、外部API、データベースへの送信はありません。端末・ブラウザー間の同期は行いません。サイトデータの削除やプライベートブラウズの終了で失われる場合があるため、JSONバックアップをご利用ください。
        </p>
        <p>
          URLだけでは項目を共有できません。別の端末ではバックアップを読み込んでください。通知一覧はアプリを開いた時点の日本時間で判定します。メール・LINE・プッシュ通知は送信しません。.ics
          の通知は取り込み先のカレンダーに依存し、変更後は再書き出しが必要です。
        </p>
        <h3>デモデータについて</h3>
        <p>
          初回起動日に合わせた16件の架空データと31件の実施履歴を用意しています。周期や項目名は説明用の例であり、法定期限や資格の有効期間を保証するものではありません。実際の期限は証明書・担当機関で確認してください。
        </p>
      </section>
      <section className="panel prose backup-panel">
        <h2>データの管理</h2>
        <p>変更前や端末の移行前に、バックアップを保存してください。</p>
        <button
          className="button"
          onClick={() =>
            download(
              JSON.stringify(data, null, 2),
              `kigen-note-${todayTokyo()}.json`,
              "application/json",
            )
          }
        >
          <Icon name="download" size={18} />
          JSONバックアップ
        </button>
        <label className="import-label">
          バックアップを読み込む
          <input
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const imported = parseStore(await file.text());
                if (
                  window.confirm(
                    `現在のデータを${imported.items.length}件の項目と${imported.records.length}件の履歴で置き換えますか？`,
                  )
                ) {
                  commit(imported, "バックアップを読み込みました");
                  setError("");
                }
              } catch {
                setError("読み込めませんでした。期限ノートのJSONバックアップを選択してください。");
              }
              e.target.value = "";
            }}
          />
        </label>
        {error && (
          <p role="alert" className="error-box">
            {error}
          </p>
        )}
        <hr />
        <h3>デモをやり直す</h3>
        <p>現在のデータを消去して、今日を基準としたデモデータを再作成します。</p>
        <button
          className="button danger"
          onClick={() => {
            if (
              window.confirm(
                "管理項目と実施履歴をすべてデモデータで置き換えますか？この操作は元に戻せません。",
              )
            )
              commit(seedStore(todayTokyo()), "デモデータを再作成しました");
          }}
        >
          デモデータをリセット
        </button>
      </section>
    </div>
  );
}
