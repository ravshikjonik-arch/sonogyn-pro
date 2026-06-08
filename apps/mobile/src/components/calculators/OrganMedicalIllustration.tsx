import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";

export type OrganIllustrationVariant =
  | "ovary"
  | "uterus"
  | "breast"
  | "lymph"
  | "thyroid"
  | "prenatal"
  | "prolapse";

type Props = {
  variant: OrganIllustrationVariant;
  width: number;
  height: number;
};

/** Stylized clinical line-art (not emoji); fits premium device UI. */
export function OrganMedicalIllustration({ variant, width, height }: Props) {
  const vb = "0 0 120 100";
  switch (variant) {
    case "ovary":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="go" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E8EEF9" />
              <Stop offset="0.55" stopColor="#DCE8F8" />
              <Stop offset="1" stopColor="#C9DBF3" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="120" height="100" fill="url(#go)" />
          <G opacity={0.92}>
            <Ellipse cx="38" cy="52" rx="22" ry="28" fill="none" stroke="#5B7AA6" strokeWidth="1.6" />
            <Ellipse cx="82" cy="52" rx="22" ry="28" fill="none" stroke="#5B7AA6" strokeWidth="1.6" />
            <Circle cx="32" cy="48" r="4" fill="#8FA8C8" opacity={0.55} />
            <Circle cx="44" cy="58" r="3" fill="#8FA8C8" opacity={0.45} />
            <Circle cx="76" cy="50" r="3.5" fill="#8FA8C8" opacity={0.5} />
            <Circle cx="88" cy="60" r="3" fill="#8FA8C8" opacity={0.4} />
            <Path
              d="M60 24 C52 28 48 38 50 48 C52 42 58 38 64 40 C70 42 72 36 68 30 C64 24 60 22 60 24Z"
              fill="none"
              stroke="#6B86AE"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </G>
        </Svg>
      );
    case "uterus":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="gu" x1="0" y1="0" x2="0.9" y2="1">
              <Stop offset="0" stopColor="#F3E8FF" />
              <Stop offset="0.5" stopColor="#EDE4F7" />
              <Stop offset="1" stopColor="#E8DCF5" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="100" fill="url(#gu)" />
          <G opacity={0.9}>
            <Path
              d="M60 18 C48 18 42 28 42 42 L42 72 C42 82 48 88 60 88 C72 88 78 82 78 72 L78 42 C78 28 72 18 60 18Z"
              fill="none"
              stroke="#7C6BA8"
              strokeWidth="1.8"
            />
            <Path d="M60 28 L60 78" stroke="#9B8AB8" strokeWidth="0.9" opacity={0.5} />
            <Circle cx="52" cy="48" r="5" fill="#B8A0C8" opacity={0.35} />
            <Circle cx="68" cy="56" r="4" fill="#B8A0C8" opacity={0.3} />
            <Circle cx="56" cy="66" r="3.5" fill="#B8A0C8" opacity={0.28} />
            <Ellipse cx="38" cy="58" rx="8" ry="5" fill="none" stroke="#9B8AB8" strokeWidth="1" opacity={0.6} />
            <Ellipse cx="82" cy="58" rx="8" ry="5" fill="none" stroke="#9B8AB8" strokeWidth="1" opacity={0.6} />
          </G>
        </Svg>
      );
    case "breast":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="gb" x1="0" y1="0" x2="1" y2="0.8">
              <Stop offset="0" stopColor="#FDEDF2" />
              <Stop offset="0.55" stopColor="#F8E4EC" />
              <Stop offset="1" stopColor="#F0D4E2" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="100" fill="url(#gb)" />
          <G opacity={0.88}>
            <Path
              d="M24 78 Q24 32 60 22 Q96 32 96 78 Q60 68 24 78Z"
              fill="none"
              stroke="#B87A92"
              strokeWidth="1.6"
            />
            <Path d="M36 42 Q60 36 84 42" fill="none" stroke="#C99AAC" strokeWidth="1" opacity={0.65} />
            <Path d="M40 56 Q60 50 80 56" fill="none" stroke="#C99AAC" strokeWidth="1" opacity={0.55} />
            <Path d="M44 70 Q60 64 76 70" fill="none" stroke="#C99AAC" strokeWidth="1" opacity={0.45} />
            <Circle cx="60" cy="48" r="3" fill="#D4A4B8" opacity={0.4} />
          </G>
        </Svg>
      );
    case "lymph":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="gl" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E6FAF4" />
              <Stop offset="1" stopColor="#D2F0E6" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="100" fill="url(#gl)" />
          <G opacity={0.9}>
            <Path
              d="M58 22 C42 24 32 38 34 54 C36 72 48 82 60 80 C72 82 84 72 86 54 C88 38 74 22 58 22Z"
              fill="none"
              stroke="#4A9B7E"
              strokeWidth="1.7"
            />
            <Path d="M48 40 Q40 50 44 62" fill="none" stroke="#6BB89A" strokeWidth="1.1" opacity={0.65} />
            <Path d="M72 40 Q80 50 76 62" fill="none" stroke="#6BB89A" strokeWidth="1.1" opacity={0.65} />
            <Path d="M52 32 Q60 28 68 32" fill="none" stroke="#6BB89A" strokeWidth="1" opacity={0.5} />
          </G>
        </Svg>
      );
    case "thyroid":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="gt" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E4F1FC" />
              <Stop offset="1" stopColor="#CDE4F8" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="100" fill="url(#gt)" />
          <G opacity={0.92}>
            <Rect x="56" y="38" width="8" height="36" rx="2" fill="#94A3B8" opacity={0.35} />
            <Path
              d="M60 40 C40 42 28 52 28 62 C28 72 40 78 52 76 C56 75 58 72 60 68 C62 72 64 75 68 76 C80 78 92 72 92 62 C92 52 80 42 60 40Z"
              fill="none"
              stroke="#4A7EB5"
              strokeWidth="1.7"
            />
            <Path d="M60 48 L60 70" stroke="#6B9BC9" strokeWidth="0.8" opacity={0.45} />
          </G>
        </Svg>
      );
    case "prenatal":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="gp" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FBF5E8" />
              <Stop offset="1" stopColor="#F3E8D4" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="100" fill="url(#gp)" />
          <G opacity={0.9}>
            <Ellipse cx="60" cy="58" rx="34" ry="28" fill="none" stroke="#B8956A" strokeWidth="1.5" opacity={0.55} />
            <Path
              d="M48 52 Q44 58 48 66 Q52 72 58 70 Q64 68 68 62 Q72 54 68 48 Q62 44 56 46 Q50 48 48 52Z"
              fill="none"
              stroke="#9A7A58"
              strokeWidth="1.5"
            />
            <Path d="M52 58 Q56 54 60 56" fill="none" stroke="#B8956A" strokeWidth="0.9" opacity={0.6} />
            <Circle cx="54" cy="54" r="2" fill="#C4A882" opacity={0.5} />
          </G>
        </Svg>
      );
    case "prolapse":
      return (
        <Svg width={width} height={height} viewBox={vb}>
          <Defs>
            <LinearGradient id="gpr" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#E8F4F4" />
              <Stop offset="1" stopColor="#D5ECE8" />
            </LinearGradient>
          </Defs>
          <Rect width="120" height="100" fill="url(#gpr)" />
          <G opacity={0.88}>
            <Path d="M40 78 L80 78" stroke="#5A8A84" strokeWidth="1.2" />
            <Path
              d="M52 78 L52 48 Q60 40 68 48 L68 78"
              fill="none"
              stroke="#4A8A82"
              strokeWidth="1.5"
            />
            <Ellipse cx="60" cy="44" rx="18" ry="8" fill="none" stroke="#5A9A90" strokeWidth="1.2" />
            <Path d="M48 62 Q60 58 72 62" fill="none" stroke="#6AA89E" strokeWidth="1" opacity={0.7} />
          </G>
        </Svg>
      );
    default:
      return null;
  }
}

export function MiniUltrasoundPreview({ size = 40 }: { size?: number }) {
  const rid = useId().replace(/:/g, "");
  const gid = `usg_${rid}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Defs>
        <LinearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2a2a2e" />
          <Stop offset="1" stopColor="#1a1a1e" />
        </LinearGradient>
      </Defs>
      <Circle cx="20" cy="20" r="19" fill={`url(#${gid})`} />
      <Ellipse cx="20" cy="20" rx="14" ry="10" fill="none" stroke="#5a5a62" strokeWidth="0.8" />
      <Path d="M12 22 Q20 18 28 22" fill="none" stroke="#7a7a86" strokeWidth="0.7" opacity={0.85} />
      <Path d="M14 26 Q20 24 26 26" fill="none" stroke="#6a6a76" strokeWidth="0.6" opacity={0.6} />
      <Circle cx="20" cy="20" r="2" fill="#9a9aa8" opacity={0.35} />
    </Svg>
  );
}
