import { Vector3 } from "three";

export type WorkspaceToolId =
  | "orbit_rotate"
  | "orbit_pan"
  | "add_fibroid"
  | "add_adeno_focal"
  | "measure_distance";

export type FibroidMarkerState = {
  id: string;
  /** Локальные координаты в группе матки (как при raycast) */
  position: [number, number, number];
  /** Визуальный радиус узла (условные единицы сцены) */
  radius: number;
  /** Смещение к полости: усиливает субмукозный компонент в расчёте */
  cavityBias01: number;
};

export function defaultFibroidMarker(at?: [number, number, number]): FibroidMarkerState {
  return {
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    position: at ?? [0.06, 0.22, 0.62],
    radius: 0.11,
    cavityBias01: 0,
  };
}

export type AdenoFocalState = {
  id: string;
  position: [number, number, number];
  radius: number;
  depthMm: number;
};

export function defaultAdenoFocal(at?: [number, number, number]): AdenoFocalState {
  return {
    id: `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    position: at ?? [-0.34, 0.31, 0.38],
    radius: 0.13,
    depthMm: 12,
  };
}

export function vecFromTuple(t: [number, number, number]): Vector3 {
  return new Vector3(t[0], t[1], t[2]);
}

/** Проброс колбэков и состояния клинического workspace между RN-панелью и сценой R3F */
export type UterusClinicalWorkspaceBinding = {
  fibroidMarkers: FibroidMarkerState[];
  fibroidSelectedId: string | null;
  fibroidsVisible: boolean;
  onFibroidSelect: (id: string | null) => void;
  onFibroidPositionCommit: (id: string, local: Vector3) => void;

  adenoFoci: AdenoFocalState[];
  adenoSelectedId: string | null;
  adenoFociVisible: boolean;
  onAdenoSelect: (id: string | null) => void;
  onAdenoPositionCommit: (id: string, local: Vector3) => void;

  measurePointA: Vector3 | null;
  measurePointB: Vector3 | null;
  measureOverlayVisible: boolean;

  onWorkspaceDragLock: (locked: boolean) => void;
};
