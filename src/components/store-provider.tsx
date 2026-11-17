"use client";

import { useEffect, useSyncExternalStore } from "react";
import { parseStore } from "@/lib/storage";
import { seedStore } from "@/lib/seed";
import { todayTokyo } from "@/lib/dates";
import { type Store } from "@/lib/types";

const KEY = "cec:v1";
type Snapshot = { data: Store | null; error: string; ready: boolean };
let snapshot: Snapshot = { data: null, error: "", ready: false };
const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const serverSnapshot = snapshot;
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    let data: Store;
    let error = "";
    try {
      data = raw === null ? seedStore(todayTokyo()) : parseStore(raw);
    } catch {
      data = seedStore(todayTokyo());
      error = "古い形式または破損した保存データを、今日を基準にした既定データで作り直しました。";
    }
    localStorage.setItem(KEY, JSON.stringify(data));
    snapshot = { data, error, ready: true };
  } catch {
    snapshot = {
      data: null,
      error:
        "保存データを読み込めませんでした。ブラウザーの保存設定、またはバックアップをご確認ください。元のデータは上書きしていません。",
      ready: true,
    };
  }
  emit();
}
export function saveStore(data: Store) {
  parseStore(JSON.stringify(data));
  localStorage.setItem(KEY, JSON.stringify(data));
  snapshot = { data, error: "", ready: true };
  emit();
}
export function useStore() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
  useEffect(() => {
    if (!snapshot.ready) load();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) load();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
  return state;
}
