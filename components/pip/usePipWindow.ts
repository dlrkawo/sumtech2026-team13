"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// Document Picture-in-Picture 작은 창 (FE_CONVENTION.md 8번)
//   열기는 클릭에서만, 열 때 원래 문서의 스타일시트를 복사한다 (안 하면 Tailwind 미적용)
const PIP_SIZE = { width: 520, height: 900 };

interface PipApi {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

function pipApi(): PipApi | null {
  return (window as unknown as { documentPictureInPicture?: PipApi }).documentPictureInPicture ?? null;
}

const noopSubscribe = () => () => {};

export function usePipWindow() {
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    () => pipApi() !== null,
    () => false,
  );
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [error, setError] = useState<string | null>(null);
  const windowRef = useRef<Window | null>(null);
  const requestIdRef = useRef(0);
  const isOpeningRef = useRef(false);
  const isMountedRef = useRef(true);

  const open = useCallback(async () => {
    if (windowRef.current || isOpeningRef.current) return;
    const api = pipApi();
    if (!api) {
      setError("크롬 또는 엣지에서 열어 주세요.");
      return;
    }
    const requestId = ++requestIdRef.current;
    isOpeningRef.current = true;
    try {
      const win = await api.requestWindow(PIP_SIZE);
      // 로그아웃·닫기·언마운트 뒤 도착한 창은 다시 연결하지 않는다.
      if (!isMountedRef.current || requestId !== requestIdRef.current) {
        win.close();
        return;
      }
      copyDocumentStyle(win.document);
      windowRef.current = win;
      win.addEventListener("pagehide", () => {
        if (windowRef.current !== win) return;
        windowRef.current = null;
        setPipWindow(null);
      }, { once: true });
      setError(null);
      setPipWindow(win);
    } catch {
      if (isMountedRef.current && requestId === requestIdRef.current) setError("작은 창을 열지 못했어요.");
    } finally {
      if (requestId === requestIdRef.current) isOpeningRef.current = false;
    }
  }, []);

  const close = useCallback(() => {
    requestIdRef.current += 1;
    isOpeningRef.current = false;
    const win = windowRef.current;
    windowRef.current = null;
    win?.close();
    setPipWindow(null);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      requestIdRef.current += 1;
      isOpeningRef.current = false;
      const win = windowRef.current;
      windowRef.current = null;
      win?.close();
    };
  }, []);

  return { isSupported, pipWindow, error, open, close };
}

function copyDocumentStyle(target: Document) {
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const style = target.createElement("style");
      style.textContent = Array.from(sheet.cssRules, (rule) => rule.cssText).join("\n");
      target.head.append(style);
    } catch {
      // 다른 출처 시트는 규칙을 읽을 수 없어 주소로 다시 건다
      if (!sheet.href) continue;
      const link = target.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      target.head.append(link);
    }
  }
  target.title = "눌러보슈";
  target.documentElement.lang = document.documentElement.lang;
  target.body.className = document.body.className;
}
