import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "法定点検・資格・車検の期限カレンダー",
  description:
    "点検、車検、資格、保険の期限をひとつに。90日前・30日前・当日の確認と実施履歴を、このブラウザーで管理できるデモアプリです。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
