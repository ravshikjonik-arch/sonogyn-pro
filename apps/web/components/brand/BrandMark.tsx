import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

/** Square brand card used as the product avatar. */
export function BrandMark({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/sonogyn-avatar.png"
      alt="SonoGyn Pro"
      className={cn("h-10 w-10 shrink-0 rounded-xl object-cover", className)}
    />
  );
}
