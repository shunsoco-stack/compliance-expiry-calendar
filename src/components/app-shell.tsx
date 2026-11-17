"use client";

import { useStore } from "./store-provider";
import { useParams } from "next/navigation";
import { useState } from "react";
import { type Item } from "@/lib/types";
import { todayTokyo } from "@/lib/dates";
import { unreadCount } from "@/lib/schedule";
import { type Store } from "@/lib/types";
import { saveStore } from "./store-provider";
import { download } from "./view-helpers";
import { createICS } from "@/lib/ics";
import Link from "next/link";
import { Icon } from "./icon";
import { seedStore } from "@/lib/seed";
import { Dashboard } from "./dashboard";
import { Items } from "./items-view";
import { Calendar } from "./calendar-view";
import { Reminders } from "./reminders-view";
import { History } from "./history-view";
import { Detail } from "./item-detail";
import { About } from "./about-view";
import { Editor } from "./item-editor";

export type View =
  "dashboard" | "calendar" | "items" | "detail" | "reminders" | "history" | "about";

export const navigation: { view: View; href: string; label: string; icon: string }[] = [
  { view: "dashboard", href: "/", label: "ダッシュボード", icon: "grid" },
  { view: "calendar", href: "/calendar", label: "カレンダー", icon: "calendar" },
  { view: "items", href: "/items", label: "管理項目", icon: "list" },
  { view: "reminders", href: "/reminders", label: "リマインダー", icon: "bell" },
  { view: "history", href: "/history", label: "実施履歴", icon: "history" },
];

export const titles: Record<View, [string, string]> = {
  dashboard: ["ダッシュボード", "大切な期限を、見逃さない。今日の状況を確認しましょう。"],
  calendar: ["カレンダー", "点検・車検・資格・保険の期限を、月ごとに見渡せます。"],
  items: ["管理項目", "点検も、車検も、資格も、保険も。すべての期限をひとつに。"],
  detail: ["管理項目の詳細", "現在の期限と、これまでの実施記録を確認できます。"],
  reminders: ["リマインダー", "90日前・30日前・当日の段階ごとに確認しましょう。"],
  history: ["実施履歴", "実施したことを記録して、次の担当者にも安心を。"],
  about: ["このアプリについて", "期限管理を、もっとシンプルに。"],
};

export function Workspace({ view }: { view: View }) {
  const { data, ready, error } = useStore();
  const params = useParams<{ id?: string }>();
  const [modal, setModal] = useState<{ kind: "item" | "record"; item?: Item } | null>(null);
  const [notice, setNotice] = useState("");
  const [failure, setFailure] = useState("");
  const today = ready ? todayTokyo() : "";
  const urgent = data ? unreadCount(data, today) : 0;
  function commit(next: Store, message: string) {
    try {
      saveStore(next);
      setNotice(message);
      setFailure("");
      return true;
    } catch {
      setFailure("保存できませんでした。ブラウザーの保存設定と空き容量をご確認ください。");
      return false;
    }
  }
  function exportICS(items: Item[]) {
    download(createICS(items), "kigen-note.ics", "text/calendar;charset=utf-8");
    setNotice(
      `${items.filter((item) => !item.done).length}件の期限を .ics ファイルに書き出しました`,
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        本文へ移動
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Icon name="calendar" size={25} />
          </span>
          <span>
            期限ノート<small>KIGEN NOTE</small>
          </span>
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">本</span>
          <div>
            本社・総務チーム<small>ワークスペース</small>
          </div>
          <span className="workspace-chevron">⌄</span>
        </div>
        <p className="nav-label">ワークスペース</p>
        <nav aria-label="メインナビゲーション">
          {navigation.map((link) => (
            <Link
              key={link.view}
              href={link.href}
              className={`nav-link ${view === link.view || (view === "detail" && link.view === "items") ? "active" : ""}`}
              aria-current={view === link.view ? "page" : undefined}
            >
              <Icon name={link.icon} />
              <span>{link.label}</span>
              {link.view === "reminders" && ready && urgent > 0 && (
                <b className="nav-count">{urgent}</b>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <Icon name="shield" />
            <strong>このブラウザーに保存</strong>
            <p>
              あなたの管理データは
              <br />
              この端末内で保管されます。
            </p>
            <Link href="/about">
              保存について <span>↗</span>
            </Link>
          </div>
          <Link className={`nav-link ${view === "about" ? "active" : ""}`} href="/about">
            <Icon name="info" />
            このアプリについて
          </Link>
          <div className="sidebar-footer">
            期限ノート <span>DEMO v1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="breadcrumb">
            ワークスペース <span>/</span> <strong>{titles[view][0]}</strong>
          </div>
          <div className="topbar-right">
            <span className="demo-label">デモ用の架空データです</span>
            <Link href="/reminders" className="icon-button" aria-label="リマインダーを確認">
              <Icon name="bell" />
              {urgent > 0 && <i />}
            </Link>
            <span className="avatar">総</span>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">COMPLIANCE & EXPIRY MANAGEMENT</div>
              <h1>{titles[view][0]}</h1>
              <p>{titles[view][1]}</p>
            </div>
            {view !== "about" && (
              <button
                className="button primary"
                disabled={!data}
                onClick={() => setModal({ kind: "item" })}
              >
                <Icon name="plus" size={18} />
                管理項目を追加
              </button>
            )}
          </div>
          {notice && (
            <div className="notice" role="status">
              <Icon name="check" />
              {notice}
              <button
                className="icon-button"
                onClick={() => setNotice("")}
                aria-label="通知を閉じる"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          )}
          {(failure || error) && (
            <div className="error-box" role="alert">
              {failure || error}
              {error && (
                <button
                  className="button"
                  onClick={() => {
                    if (window.confirm("現在の保存データをデモデータで置き換えますか？"))
                      commit(seedStore(todayTokyo()), "デモデータを再作成しました");
                  }}
                >
                  デモデータを再作成
                </button>
              )}
            </div>
          )}
          {!ready && (
            <div className="loading" role="status">
              <div className="loading-bar" />
              保存データを読み込んでいます…
            </div>
          )}
          {data && (
            <>
              {view === "dashboard" && (
                <Dashboard
                  data={data}
                  today={today}
                  record={(item) => setModal({ kind: "record", item })}
                />
              )}
              {view === "items" && (
                <Items
                  data={data}
                  today={today}
                  exportICS={exportICS}
                  record={(item) => setModal({ kind: "record", item })}
                />
              )}
              {view === "calendar" && <Calendar data={data} today={today} />}
              {view === "reminders" && (
                <Reminders
                  data={data}
                  today={today}
                  record={(item) => setModal({ kind: "record", item })}
                  exportICS={exportICS}
                  commit={commit}
                />
              )}
              {view === "history" && <History data={data} />}
              {view === "detail" && (
                <Detail
                  data={data}
                  id={params.id || ""}
                  today={today}
                  edit={(item) => setModal({ kind: "item", item })}
                  record={(item) => setModal({ kind: "record", item })}
                  exportICS={exportICS}
                  commit={commit}
                />
              )}
              {view === "about" && <About data={data} commit={commit} />}
            </>
          )}
          <footer className="page-footer">
            <span>
              <span className="live-dot" />
              ブラウザー内に保存 · 外部送信なし
            </span>
            <Link className="text-link" href="/about">
              このアプリについて・データ管理 <Icon name="arrow" size={14} />
            </Link>
          </footer>
        </main>
      </div>
      {modal && data && (
        <Editor
          key={`${modal.kind}-${modal.item?.id || "new"}`}
          kind={modal.kind}
          item={modal.item}
          data={data}
          today={today}
          close={() => setModal(null)}
          commit={commit}
        />
      )}
    </div>
  );
}
