"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

import { track } from "@/lib/analytics/track";

type Props = ComponentProps<typeof Link> & {
  cta: string;
  placement: string;
};

/** Link с funnel-событием cta_click (без ПДн). */
export function TrackCtaLink({ cta, placement, onClick, ...rest }: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    track({ name: "cta_click", params: { cta, placement } });
    onClick?.(e);
  }

  return <Link {...rest} onClick={handleClick} />;
}
