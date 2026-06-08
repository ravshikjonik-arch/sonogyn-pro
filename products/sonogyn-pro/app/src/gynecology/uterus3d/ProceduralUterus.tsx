import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { UterusClinicalWorkspaceBinding } from "./clinicalWorkspaceTypes";
import AdenoFociMarkers from "./AdenoFociMarkers";
import FibroidMarkers from "./FibroidMarkers";
import { analyzeUterusHit, type UterusHitResult } from "./figoHitMapping";
import MeasureDistanceOverlay from "./MeasureDistanceOverlay";
import {
  createMyometriumBumpTexture,
  createParametricInnerCavityGeometryHalf,
  createParametricOuterGeometryHalf,
  createSagittalCrossSectionCapGeometry,
} from "./parametricUterusGeometry";
import { DEFAULT_SCAR_NICHE_MEASUREMENTS_MM, type ScarNicheVisualState } from "./scarNicheTypes";
import ScarNicheOverlay from "./ScarNicheOverlay";
import { exglTransmissionProps } from "./exglCompat";

export type ProceduralUterusProps = {
  theme: "light" | "dark";
  eduMode: "anatomy" | "figo" | "adenomyosis";
  pedunculated: boolean;
  showDiffuseAdeno: boolean;
  showFocalAdeno: boolean;
  showCysticAdeno: boolean;
  interiorCamera?: boolean;
  scarNiche?: ScarNicheVisualState;
  onPick?: (hit: UterusHitResult, local: THREE.Vector3) => void;
  clinicalWorkspace?: UterusClinicalWorkspaceBinding | null;
};

const HALF_SECTORS_OUTER = 46;
const HALF_SECTORS_INNER = 54;
const OUTER_RINGS = 44;
const INNER_RINGS = 48;
const CAP_X_SEG = 11;

function FallopianTubesAndOvaries({ theme }: { theme: "light" | "dark" }) {
  const { tubeGeoL, tubeGeoR } = useMemo(() => {
    const ptsL = [
      new THREE.Vector3(-0.062, 1.37, 0.218),
      new THREE.Vector3(-0.48, 1.5, 0.58),
      new THREE.Vector3(-0.88, 1.34, 0.94),
      new THREE.Vector3(-1.05, 0.98, 1.12),
    ];
    const ptsR = ptsL.map((p) => new THREE.Vector3(-p.x, p.y, p.z));
    const curveL = new THREE.CatmullRomCurve3(ptsL);
    const curveR = new THREE.CatmullRomCurve3(ptsR);
    const tubularSegments = 52;
    const tubeRadius = 0.038;
    const radialSegments = 10;
    return {
      tubeGeoL: new THREE.TubeGeometry(curveL, tubularSegments, tubeRadius, radialSegments, false),
      tubeGeoR: new THREE.TubeGeometry(curveR, tubularSegments, tubeRadius, radialSegments, false),
    };
  }, []);

  useEffect(() => {
    return () => {
      tubeGeoL.dispose();
      tubeGeoR.dispose();
    };
  }, [tubeGeoL, tubeGeoR]);

  const tubeColor = theme === "dark" ? "#dda3b4" : "#ecc6d2";
  const ovaryColor = theme === "dark" ? "#e8d4cf" : "#f5e6e0";

  return (
    <group raycast={() => null}>
      <mesh raycast={() => null} geometry={tubeGeoL}>
        <meshPhysicalMaterial
          color={tubeColor}
          roughness={0.44}
          metalness={0.04}
          clearcoat={0.06}
          sheen={0.12}
          sheenRoughness={0.55}
          sheenColor="#fff5f5"
          envMapIntensity={theme === "dark" ? 0.45 : 0.62}
        />
      </mesh>
      <mesh raycast={() => null} geometry={tubeGeoR}>
        <meshPhysicalMaterial
          color={tubeColor}
          roughness={0.44}
          metalness={0.04}
          clearcoat={0.06}
          sheen={0.12}
          sheenRoughness={0.55}
          sheenColor="#fff5f5"
          envMapIntensity={theme === "dark" ? 0.45 : 0.62}
        />
      </mesh>

      <mesh raycast={() => null} position={[-1.06, 0.84, 1.14]} scale={[1.05, 1.22, 0.82]}>
        <icosahedronGeometry args={[0.125, 2]} />
        <meshPhysicalMaterial
          color={ovaryColor}
          roughness={0.62}
          metalness={0.02}
          envMapIntensity={theme === "dark" ? 0.38 : 0.55}
        />
      </mesh>
      <mesh raycast={() => null} position={[1.06, 0.84, 1.14]} scale={[1.05, 1.22, 0.82]}>
        <icosahedronGeometry args={[0.125, 2]} />
        <meshPhysicalMaterial
          color={ovaryColor}
          roughness={0.62}
          metalness={0.02}
          envMapIntensity={theme === "dark" ? 0.38 : 0.55}
        />
      </mesh>
    </group>
  );
}

export default function ProceduralUterus({
  theme,
  eduMode,
  pedunculated,
  showDiffuseAdeno,
  showFocalAdeno,
  showCysticAdeno,
  interiorCamera = false,
  scarNiche,
  onPick,
  clinicalWorkspace = null,
}: ProceduralUterusProps) {
  const groupRef = useRef<THREE.Group>(null);

  const geoOuterAnatomy = useMemo(
    () => createParametricOuterGeometryHalf(HALF_SECTORS_OUTER, OUTER_RINGS, false),
    [],
  );
  const geoOuterFigo = useMemo(
    () => createParametricOuterGeometryHalf(HALF_SECTORS_OUTER, OUTER_RINGS, true),
    [],
  );
  const geoInnerCavity = useMemo(
    () => createParametricInnerCavityGeometryHalf(HALF_SECTORS_INNER, INNER_RINGS),
    [],
  );
  const geoCapAnatomy = useMemo(
    () => createSagittalCrossSectionCapGeometry(OUTER_RINGS, CAP_X_SEG, "anatomy"),
    [],
  );
  const geoCapFigo = useMemo(
    () => createSagittalCrossSectionCapGeometry(OUTER_RINGS, CAP_X_SEG, "figo"),
    [],
  );

  const bumpMap = useMemo(() => createMyometriumBumpTexture(168), []);
  useEffect(() => {
    return () => bumpMap.dispose();
  }, [bumpMap]);

  const geoOuterForOverlay = geoOuterAnatomy;

  const myometriumColor = theme === "dark" ? "#a85562" : "#c47280";
  const myometriumRoughness = theme === "dark" ? 0.52 : 0.46;

  const activeGeo = eduMode === "figo" ? geoOuterFigo : geoOuterAnatomy;
  const activeCapGeo = eduMode === "figo" ? geoCapFigo : geoCapAnatomy;
  const shellSide = interiorCamera ? THREE.DoubleSide : THREE.FrontSide;

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!groupRef.current) return;
    const local = e.point.clone();
    groupRef.current.worldToLocal(local);
    const hit = analyzeUterusHit(local, pedunculated);
    onPick?.(hit, local);
  };

  const pickHoverHandlers = {
    onPointerDown,
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (typeof document !== "undefined") document.body.style.cursor = "pointer";
    },
    onPointerOut: () => {
      if (typeof document !== "undefined") document.body.style.cursor = "auto";
    },
  };

  const showInnerLining = eduMode === "anatomy" || eduMode === "figo";
  const showCrossSectionCap = eduMode === "anatomy" || eduMode === "figo" || eduMode === "adenomyosis";
  const showAccessories = eduMode === "anatomy" || eduMode === "figo";

  return (
    <group ref={groupRef} rotation={[0, -0.42, 0]}>
      <mesh
        geometry={activeGeo}
        castShadow
        receiveShadow
        {...pickHoverHandlers}
      >
        {eduMode === "figo" ? (
          <meshStandardMaterial
            vertexColors
            roughness={0.38}
            metalness={0.06}
            envMapIntensity={0.78}
            side={shellSide}
            bumpMap={bumpMap}
            bumpScale={0.072}
            emissive={interiorCamera ? "#3f2a4d" : "#000000"}
            emissiveIntensity={interiorCamera ? 0.06 : 0}
          />
        ) : (
          <meshPhysicalMaterial
            color={myometriumColor}
            roughness={myometriumRoughness}
            metalness={0.035}
            clearcoat={0.14}
            clearcoatRoughness={0.42}
            sheen={0.08}
            sheenRoughness={0.62}
            sheenColor="#fde8ec"
            bumpMap={bumpMap}
            bumpScale={0.088}
            side={shellSide}
            envMapIntensity={theme === "dark" ? 0.56 : 0.74}
            emissive={interiorCamera ? "#4c0618" : "#000000"}
            emissiveIntensity={interiorCamera ? (theme === "dark" ? 0.12 : 0.07) : 0}
          />
        )}
      </mesh>

      {showCrossSectionCap && (
        <mesh geometry={activeCapGeo} position={[0, 0, -0.00035]} {...pickHoverHandlers}>
          <meshStandardMaterial
            vertexColors
            roughness={eduMode === "figo" ? 0.44 : 0.52}
            metalness={0.05}
            envMapIntensity={theme === "dark" ? 0.42 : 0.58}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={2}
            polygonOffsetUnits={2}
          />
        </mesh>
      )}

      {showInnerLining && (
        <mesh raycast={() => null} geometry={geoInnerCavity}>
          <meshPhysicalMaterial
            color={theme === "dark" ? "#d48a96" : "#eab4bf"}
            roughness={0.42}
            metalness={0.025}
            {...exglTransmissionProps(0.11, 1.05)}
            attenuationColor="#ffccd5"
            attenuationDistance={1.15}
            transparent
            opacity={eduMode === "figo" ? 0.82 : 0.9}
            depthWrite={false}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
      )}

      {eduMode === "anatomy" && (
        <mesh raycast={() => null} geometry={geoOuterForOverlay} scale={[0.988, 1, 0.988]}>
          <meshPhysicalMaterial
            transparent
            opacity={0.14}
            color="#fde68a"
            roughness={0.62}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {eduMode === "adenomyosis" && showDiffuseAdeno && (
        <mesh raycast={() => null} geometry={geoOuterForOverlay} scale={[1.004, 1.006, 1.004]}>
          <meshPhysicalMaterial
            transparent
            opacity={0.13}
            color="#fda4af"
            emissive="#fb7185"
            emissiveIntensity={0.07}
            roughness={0.88}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {eduMode === "adenomyosis" && showFocalAdeno && (
        <mesh raycast={() => null} position={[0.38, 0.35, 0.22]} scale={[1.15, 1.05, 1]}>
          <sphereGeometry args={[0.14, 24, 24]} />
          <meshPhysicalMaterial
            transparent
            opacity={0.45}
            color="#fb7185"
            emissive="#f43f5e"
            emissiveIntensity={0.15}
            roughness={0.35}
            depthWrite={false}
          />
        </mesh>
      )}

      {eduMode === "adenomyosis" &&
        showCysticAdeno &&
        [
          [-0.36, 0.42, -0.18, 0.055],
          [-0.42, 0.28, -0.22, 0.048],
          [-0.32, 0.18, -0.28, 0.052],
          [-0.44, 0.08, -0.16, 0.04],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} raycast={() => null} position={[x, y, z]}>
            <sphereGeometry args={[r, 18, 18]} />
            <meshPhysicalMaterial
              transparent
              opacity={0.55}
              color="#bae6fd"
              emissive="#38bdf8"
              emissiveIntensity={0.12}
              roughness={0.2}
              {...exglTransmissionProps(0.35, 0.4)}
              depthWrite={false}
            />
          </mesh>
        ))}

      {showAccessories && <FallopianTubesAndOvaries theme={theme} />}

      <ScarNicheOverlay scar={scarNiche ?? { enabled: false, measurements: DEFAULT_SCAR_NICHE_MEASUREMENTS_MM }} theme={theme} />

      {clinicalWorkspace && (
        <>
          <FibroidMarkers
            markers={clinicalWorkspace.fibroidMarkers}
            selectedId={clinicalWorkspace.fibroidSelectedId}
            visible={clinicalWorkspace.fibroidsVisible}
            onSelect={clinicalWorkspace.onFibroidSelect}
            onPositionCommit={clinicalWorkspace.onFibroidPositionCommit}
            onDragLock={clinicalWorkspace.onWorkspaceDragLock}
          />
          <AdenoFociMarkers
            foci={clinicalWorkspace.adenoFoci}
            selectedId={clinicalWorkspace.adenoSelectedId}
            visible={clinicalWorkspace.adenoFociVisible}
            onSelect={clinicalWorkspace.onAdenoSelect}
            onPositionCommit={clinicalWorkspace.onAdenoPositionCommit}
            onDragLock={clinicalWorkspace.onWorkspaceDragLock}
          />
          <MeasureDistanceOverlay
            a={clinicalWorkspace.measurePointA}
            b={clinicalWorkspace.measurePointB}
            visible={clinicalWorkspace.measureOverlayVisible}
          />
        </>
      )}
    </group>
  );
}
