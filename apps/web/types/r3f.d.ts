import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    // Merges R3F intrinsic elements into React JSX; ThreeElements is an empty-type merge target here.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- declaration merge for @react-three/fiber
    interface IntrinsicElements extends ThreeElements {}
  }
}

export {};
