"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type SpatialDeckItem = {
  id: string;
  node: ReactNode;
};

type SpatialDeckProps = {
  items: SpatialDeckItem[];
  activeId?: string | null;
  onActiveChange?: (id: string, index: number) => void;
  ariaLabel: string;
  className?: string;
};

export function SpatialDeck({ items, activeId, onActiveChange, ariaLabel, className }: SpatialDeckProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const idx = items.findIndex((i) => i.id === activeId);
    if (idx >= 0) setActiveIndex(idx);
  }, [activeId, items]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateFromScroll = () => {
      const center = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      Array.from(el.children).forEach((child, index) => {
        const node = child as HTMLElement;
        const mid = node.offsetLeft + node.offsetWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      setActiveIndex((prev) => (prev === best ? prev : best));
    };

    el.addEventListener("scroll", updateFromScroll, { passive: true });
    updateFromScroll();
    return () => el.removeEventListener("scroll", updateFromScroll);
  }, [items.length]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollerRef.current;
      if (!el || items.length === 0) return;
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      const child = el.children.item(clamped) as HTMLElement | null;
      if (!child) return;
      child.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        inline: "center",
        block: "nearest",
      });
      setActiveIndex(clamped);
      onActiveChange?.(items[clamped]!.id, clamped);
    },
    [items, onActiveChange, reducedMotion],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollToIndex(activeIndex - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      scrollToIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      scrollToIndex(items.length - 1);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p id={labelId} className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          {ariaLabel}
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Предыдущая карточка"
            disabled={activeIndex <= 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            aria-label="Следующая карточка"
            disabled={activeIndex >= items.length - 1}
            onClick={() => scrollToIndex(activeIndex + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        role="listbox"
        aria-labelledby={labelId}
        aria-activedescendant={items[activeIndex] ? `deck-item-${items[activeIndex].id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="sg-spatial-deck-scroller flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            id={`deck-item-${item.id}`}
            role="option"
            aria-selected={index === activeIndex}
            data-active={index === activeIndex ? "true" : "false"}
            onClick={() => scrollToIndex(index)}
            className="sg-spatial-deck-slide w-[min(88vw,340px)] shrink-0 snap-center sm:w-[min(42vw,380px)]"
            onFocus={() => {
              setActiveIndex(index);
              onActiveChange?.(item.id, index);
            }}
          >
            {item.node}
          </div>
        ))}
      </div>
    </div>
  );
}
