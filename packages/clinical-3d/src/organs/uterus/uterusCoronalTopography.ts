/**
 * Локализация очага на коронарном макете матки.
 * FIGO — через SSOT слоёв (`uterusLayerAnatomy`).
 */

import {
  buildUterusProtocolBlock,
  centroidOfStroke,
  coronalToSagittal,
  detectOrganZone,
  formatUterusLesionMarkerRu,
  strokeToSvgPath,
  type UterusLesionKind,
  type UterusLesionMarker,
  type UterusNormPoint,
  type UterusOrganZone,
} from "./uterusLayerAnatomy";

export type { UterusNormPoint, UterusOrganZone, UterusLesionKind };

/** @deprecated Prefer UterusLesionMarker — kept for existing coronal UI. */
export type UterusCoronalMarker = {
  id: string;
  point: UterusNormPoint;
  kind: UterusLesionKind;
  diameterMm: number;
  pedunculated: boolean;
  stroke?: UterusNormPoint[];
};

export function coronalMarkerToLesion(marker: UterusCoronalMarker): UterusLesionMarker {
  return {
    id: marker.id,
    kind: marker.kind,
    diameterMm: marker.diameterMm,
    pedunculated: marker.pedunculated,
    coronal: marker.point,
    sagittal: coronalToSagittal(marker.point),
    stroke: marker.stroke,
    strokeProjection: marker.stroke ? "coronal" : undefined,
  };
}

export function formatUterusCoronalMarkerRu(marker: UterusCoronalMarker): string {
  return formatUterusLesionMarkerRu(coronalMarkerToLesion(marker), "coronal");
}

export function buildUterusCoronalProtocolBlock(markers: UterusCoronalMarker[]): string {
  return buildUterusProtocolBlock(markers.map(coronalMarkerToLesion), "coronal");
}

export { centroidOfStroke, detectOrganZone, strokeToSvgPath };

export const UTERUS_CORONAL_ANATOMY_SRC = "/clinical/uterus-coronal-anatomy.jpg";
