"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

const DEFAULT_ROW_PX = 88;
const OVERSCAN = 6;
const VIRTUALIZE_AFTER = 60;

export type EstimatedVirtualRange = {
  enabled: boolean;
  start: number;
  end: number;
  paddingTop: number;
  paddingBottom: number;
  onScroll: () => void;
  rowEstimatePx: number;
};

/** Lightweight window over a list with fixed row height estimate (no extra deps). */
export function useEstimatedVirtualRange(
  itemCount: number,
  scrollRef: RefObject<HTMLElement | null>,
  rowPx = DEFAULT_ROW_PX,
): EstimatedVirtualRange {
  const [range, setRange] = useState({ start: 0, end: itemCount });

  const recompute = useCallback(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0) {
      setRange({ start: 0, end: itemCount });
      return;
    }
    if (itemCount <= VIRTUALIZE_AFTER) {
      setRange({ start: 0, end: itemCount });
      return;
    }
    const scrollTop = el.scrollTop;
    const viewH = el.clientHeight;
    const start = Math.max(0, Math.floor(scrollTop / rowPx) - OVERSCAN);
    const end = Math.min(itemCount, Math.ceil((scrollTop + viewH) / rowPx) + OVERSCAN);
    setRange({ start, end });
  }, [itemCount, rowPx, scrollRef]);

  useEffect(() => {
    recompute();
  }, [itemCount, recompute]);

  const enabled = itemCount > VIRTUALIZE_AFTER;
  const paddingTop = enabled ? range.start * rowPx : 0;
  const paddingBottom = enabled ? Math.max(0, (itemCount - range.end) * rowPx) : 0;

  return {
    enabled,
    start: range.start,
    end: range.end,
    paddingTop,
    paddingBottom,
    onScroll: recompute,
    rowEstimatePx: rowPx,
  };
}
