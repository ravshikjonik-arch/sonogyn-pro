import type { ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { UterusClinicalWorkspaceBinding } from "./clinicalWorkspaceTypes";
import AdenoFociMarkers from "./AdenoFociMarkers";
import FibroidMarkers from "./FibroidMarkers";
import { analyzeUterusHit, type UterusHitResult } from "./figoHitMapping";
import MeasureDistanceOverlay from "./MeasureDistanceOverlay";
import {
  createCervixCanalGeometry,
  createFullLatheOuterGeometry,
  createMyometriumBumpTexture,
  createParametricInnerCavityGeometryHalf,
  createParametricOuterGeometryHalf,
  createSagittalCrossSectionCapGeometry,
} from "./parametricUterusGeometry";
import { DEFAULT_SCAR_NICHE_MEASUREMENTS_MM, type ScarNicheVisualState } from "./scarNicheTypes";
import ScarNicheOverlay from "./ScarNicheOverlay";
import PathologyMarkers from "./PathologyMarkers";
import type { PathologyAnnotation } from "./pathologyTypes";

export type ProceduralUterusProps = {
  theme: "light" | "dark";
  eduMode: "anatomy" | "figo" | "adenomyosis";
  pedunculated: boolean;
  showDiffuseAdeno: boolean;
  showFocalAdeno: boolean;
  showCysticAdeno: boolean;
  interiorCamera?: boolean;
  scarNiche?: ScarNicheVisualState;
  /** Масштаб модели (1 = эталон; врач подгоняет под клинику) */
  modelScale?: number;
  onPick?: (hit: UterusHitResult, local: THREE.Vector3) => void;
  clinicalWorkspace?: UterusClinicalWorkspaceBinding | null;
  pathologyAnnotations?: PathologyAnnotation[];
  pathologySelectedId?: string | null;
  onPathologySelect?: (id: string | null) => void;
  onPathologyPositionCommit?: (id: string, local: THREE.Vector3) => void;
};

const HALF_SECTORS_OUTER = 52;
const HALF_SECTORS_INNER = 60;
const OUTER_RINGS = 52;
const INNER_RINGS = 56;
const CAP_X_SEG = 16;

function FallopianTubesAndOvaries({ theme }: { theme: "light" | "dark" }) {
  const { tubeGeoL, tubeGeoR, ovaryBump } = useMemo(() => {
    const ptsL = [
      new THREE.Vector3(-0.08, 1.52, 0.28),
      new THREE.Vector3(-0.52, 1.62, 0.62),
      new THREE.Vector3(-0.95, 1.48, 0.98),
      new THREE.Vector3(-1.12, 1.08, 1.18),
    ];
    const ptsR = ptsL.map((p) => new THREE.Vector3(-p.x, p.y, p.z));
    const curveL = new THREE.CatmullRomCurve3(ptsL);
    const curveR = new THREE.CatmullRomCurve3(ptsR);
    const tubularSegments = 52;
    const tubeRadius = 0.038;
    const radialSegments = 10;
    const ovaryBump = createMyometriumBumpTexture(96);
    return {
      tubeGeoL: new THREE.TubeGeometry(curveL, tubularSegments, tubeRadius, radialSegments, false),
      tubeGeoR: new THREE.TubeGeometry(curveR, tubularSegments, tubeRadius, radialSegments, false),
      ovaryBump,
    };
  }, []);

  useEffect(() => {
    return () => {
      tubeGeoL.dispose();
      tubeGeoR.dispose();
      ovaryBump.dispose();
    };
  }, [tubeGeoL, tubeGeoR, ovaryBump]);

  const tubeColor = theme === "dark" ? "#e8b4c0" : "#f0d0d8";
  const ovaryColor = theme === "dark" ? "#f0ddd8" : "#faf0ec";

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

      <mesh raycast={() => null} position={[-1.1, 1.02, 1.2]} scale={[1.15, 1.28, 0.88]}>
        <icosahedronGeometry args={[0.14, 3]} />
        <meshPhysicalMaterial
          color={ovaryColor}
          roughness={0.58}
          metalness={0.02}
          bumpMap={ovaryBump}
          bumpScale={0.14}
          envMapIntensity={theme === "dark" ? 0.42 : 0.6}
        />
      </mesh>
      <mesh raycast={() => null} position={[1.1, 1.02, 1.2]} scale={[1.15, 1.28, 0.88]}>
        <icosahedronGeometry args={[0.14, 3]} />
        <meshPhysicalMaterial
          color={ovaryColor}
          roughness={0.58}
          metalness={0.02}
          bumpMap={ovaryBump}
          bumpScale={0.14}
          envMapIntensity={theme === "dark" ? 0.42 : 0.6}
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
  modelScale = 1,
  onPick,
  clinicalWorkspace = null,
  pathologyAnnotations = [],
  pathologySelectedId = null,
  onPathologySelect,
  onPathologyPositionCommit,
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
  const geoFullBody = useMemo(() => createFullLatheOuterGeometry(84), []);
  const geoCervixCanal = useMemo(() => createCervixCanalGeometry(32), []);

  const bumpMap = useMemo(() => createMyometriumBumpTexture(256), []);
  useEffect(() => {
    return () => bumpMap.dispose();
  }, [bumpMap]);

  const geoOuterForOverlay = geoOuterAnatomy;

  const myometriumColor = theme === "dark" ? "#c46878" : "#d88090";
  const myometriumRoughness = theme === "dark" ? 0.48 : 0.42;
  const serosaColor = theme === "dark" ? "#b85868" : "#cc7888";

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

  const myoMaterial = (
    <meshPhysicalMaterial
      color={myometriumColor}
      roughness={myometriumRoughness}
      metalness={0.03}
      clearcoat={0.22}
      clearcoatRoughness={0.35}
      sheen={0.14}
      sheenRoughness={0.55}
      sheenColor="#ffe8ec"
      bumpMap={bumpMap}
      bumpScale={0.12}
      side={shellSide}
      envMapIntensity={theme === "dark" ? 0.62 : 0.82}
    />
  );

  return (
    <group
      ref={groupRef}
      rotation={[0, -0.32, -Math.PI / 2]}
      scale={[modelScale, modelScale, modelScale]}
    >
      {/* Объём тела (как на корональном референсе) */}
      <mesh raycast={() => null} geometry={geoFullBody} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={serosaColor}
          roughness={0.55}
          metalness={0.02}
          bumpMap={bumpMap}
          bumpScale={0.06}
          transparent
          opacity={eduMode === "figo" ? 0.35 : 0.22}
          depthWrite={false}
          side={THREE.DoubleSide}
          envMapIntensity={theme === "dark" ? 0.5 : 0.7}
        />
      </mesh>

      {eduMode !== "figo" ? (
        <mesh geometry={geoOuterAnatomy} scale={[1, 1, -1]} castShadow receiveShadow raycast={() => null}>
          {myoMaterial}
        </mesh>
      ) : null}

      <mesh geometry={activeGeo} castShadow receiveShadow {...pickHoverHandlers}>
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
          myoMaterial
        )}
      </mesh>

      {showCrossSectionCap && (
        <mesh geometry={activeCapGeo} position={[0, 0, 0.004]} {...pickHoverHandlers}>
          <meshStandardMaterial
            vertexColors
            roughness={eduMode === "figo" ? 0.4 : 0.46}
            metalness={0.04}
            envMapIntensity={theme === "dark" ? 0.55 : 0.72}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}

      <mesh raycast={() => null} geometry={geoCervixCanal} position={[0, 0, 0.006]}>
        <meshStandardMaterial vertexColors roughness={0.5} metalness={0.03} side={THREE.DoubleSide} />
      </mesh>

      {showInnerLining && (
        <mesh raycast={() => null} geometry={geoInnerCavity}>
          <meshPhysicalMaterial
            color={theme === "dark" ? "#f0b8c4" : "#f8d0d8"}
            roughness={0.38}
            metalness={0.02}
            transmission={0.08}
            thickness={0.8}
            attenuationColor="#ffc8d4"
            attenuationDistance={0.9}
            transparent
            opacity={0.94}
            depthWrite={false}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
            envMapIntensity={0.65}
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
              transmission={0.35}
              thickness={0.4}
              depthWrite={false}
            />
          </mesh>
        ))}

      {showAccessories && <FallopianTubesAndOvaries theme={theme} />}

      <ScarNicheOverlay scar={scarNiche ?? { enabled: false, measurements: DEFAULT_SCAR_NICHE_MEASUREMENTS_MM }} theme={theme} />

      {pathologyAnnotations.length > 0 && onPathologySelect && onPathologyPositionCommit && (
        <PathologyMarkers
          annotations={pathologyAnnotations}
          selectedId={pathologySelectedId}
          onSelect={onPathologySelect}
          onPositionCommit={onPathologyPositionCommit}
          onDragLock={(locked) => clinicalWorkspace?.onWorkspaceDragLock(locked)}
        />
      )}

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
