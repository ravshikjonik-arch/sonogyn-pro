import { useMemo } from "react";
import * as THREE from "three";
import { innerRadiusAtY, outerRadiusAtY } from "./profile";
import {
  SCAR_BAND_CENTER_Y,
  clampMeasurementMm,
  mmToScene,
  type ScarNicheVisualState,
} from "./scarNicheTypes";
import { exglTransmissionProps } from "./exglCompat";

type Props = {
  scar: ScarNicheVisualState;
  theme: "light" | "dark";
};

/** Ниша у передней стенки LUS, нижняя полость к шейке, маркер RMT. Overlay без raycast. */
export default function ScarNicheOverlay({ scar, theme }: Props) {
  const m = useMemo(() => clampMeasurementMm(scar.measurements), [scar.measurements]);

  const geo = useMemo(() => {
    if (!scar.enabled) return null;

    const y = SCAR_BAND_CENTER_Y;
    const innerR = innerRadiusAtY(y);
    const outerR = outerRadiusAtY(y);
    const wall = outerR - innerR;

    const depthS = mmToScene(m.nicheDepthMm);
    const lengthS = mmToScene(m.nicheLengthMm);
    const widthS = mmToScene(m.nicheWidthMm);
    const rmtS = mmToScene(m.residualMyometriumMm);

    const nicheCx = innerR + depthS * 0.42;
    const nicheCy = y;
    const nicheCz = 0;

    const rmtVisual = Math.min(Math.max(rmtS, 0.028), Math.max(0.03, wall - depthS * 0.82));

    const nicheHalfLen = lengthS * 0.48 + 0.05;
    const canalExtraMm = 22;
    const canalLen = mmToScene(canalExtraMm) + lengthS * 0.35;
    const canalEntryY = nicheCy - nicheHalfLen - canalLen * 0.48;
    const canalR = Math.max(mmToScene(5), widthS * 0.35);

    const nicheColor = theme === "dark" ? "#fb7185" : "#e11d48";
    const cavityFluid = theme === "dark" ? "#38bdf8" : "#0ea5e9";
    const rmtColor = "#16a34a";

    return {
      innerR,
      depthS,
      lengthS,
      widthS,
      nicheCx,
      nicheCy,
      nicheCz,
      rmtVisual,
      canalLen,
      canalEntryY,
      canalR,
      nicheColor,
      cavityFluid,
      rmtColor,
    };
  }, [scar.enabled, m, theme]);

  if (!scar.enabled || !geo) return null;

  const {
    innerR,
    depthS,
    lengthS,
    widthS,
    nicheCx,
    nicheCy,
    nicheCz,
    rmtVisual,
    canalLen,
    canalEntryY,
    canalR,
    nicheColor,
    cavityFluid,
    rmtColor,
  } = geo;

  const nicheEllipsoid = (
    <mesh raycast={() => null} position={[nicheCx, nicheCy, nicheCz]} scale={[depthS + 0.06, lengthS + 0.07, widthS + 0.06]}>
      <sphereGeometry args={[0.09, 22, 22]} />
      <meshPhysicalMaterial
        color={nicheColor}
        transparent
        opacity={theme === "dark" ? 0.42 : 0.38}
        roughness={0.38}
        metalness={0.06}
        {...exglTransmissionProps(0.18, 0.35)}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );

  const scarRibbon = (
    <mesh raycast={() => null} position={[innerR - 0.018, nicheCy, nicheCz]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[Math.max(widthS * 1.3, 0.12), Math.max(lengthS * 1.15, 0.14)]} />
      <meshBasicMaterial color="#991b1b" transparent opacity={0.72} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );

  const lowerCavity = (
    <mesh raycast={() => null} position={[innerR * 0.22, canalEntryY, 0]}>
      <cylinderGeometry args={[canalR * 1.05, canalR * 0.78, canalLen, 20, 1, true]} />
      <meshPhysicalMaterial
        color={cavityFluid}
        transparent
        opacity={0.26}
        roughness={0.15}
        metalness={0}
        {...exglTransmissionProps(0.55, 0.25)}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );

  const rmtAxisX = nicheCx + depthS * 0.55 + rmtVisual * 0.45;
  const rmtSegment = (
    <mesh raycast={() => null} position={[rmtAxisX, nicheCy, nicheCz]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.022, 0.022, Math.max(rmtVisual, 0.032), 10]} />
      <meshBasicMaterial color={rmtColor} transparent opacity={0.92} depthWrite={false} />
    </mesh>
  );

  const mouthRing = (
    <mesh raycast={() => null} position={[innerR + 0.012, nicheCy, nicheCz]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[Math.max(widthS * 0.55, 0.055), 0.014, 10, 28]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.65} depthWrite={false} />
    </mesh>
  );

  return (
    <group>
      {nicheEllipsoid}
      {scarRibbon}
      {mouthRing}
      {lowerCavity}
      {rmtSegment}
    </group>
  );
}
