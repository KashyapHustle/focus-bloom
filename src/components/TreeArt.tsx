import { useId } from "react";
import type { TreeDef } from "@/lib/trees";

interface Props {
  tree: TreeDef;
  /** 0 = seed, 1 = fully grown */
  growth?: number;
  className?: string;
  showGround?: boolean;
}

const ease = (g: number) => 1 - Math.pow(1 - g, 2);

/**
 * Fully local, vector-only tree illustration.
 * Shapes are parametric so every tree in the collection is distinct
 * without shipping any external artwork.
 */
export function TreeArt({ tree, growth = 1, className, showGround = true }: Props) {
  const gid = useId().replace(/:/g, "");
  const g = Math.min(1, Math.max(0, growth));
  const e = ease(g);
  const scale = 0.12 + 0.88 * e;
  const canopyOpacity = g < 0.08 ? 0 : Math.min(1, (g - 0.06) / 0.25);
  const trunkH = 60;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${tree.name} illustration`}>
      <defs>
        <radialGradient id={`glow-${gid}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor={tree.leafAlt} stopOpacity="0.55" />
          <stop offset="100%" stopColor={tree.leafAlt} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`leaf-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tree.leafAlt} />
          <stop offset="100%" stopColor={tree.leaf} />
        </linearGradient>
      </defs>

      {tree.glow && g > 0.2 && <circle cx="100" cy="95" r="78" fill={`url(#glow-${gid})`} />}

      {showGround && (
        <>
          <ellipse cx="100" cy="176" rx={38 + 22 * e} ry="8" fill="currentColor" opacity="0.12" />
          <path
            d={`M ${100 - 26 - 10 * e} 176 Q 100 ${168 - 4 * e} ${100 + 26 + 10 * e} 176 Z`}
            fill="currentColor"
            opacity="0.18"
          />
        </>
      )}

      <g transform={`translate(100 176) scale(${scale}) translate(-100 -176)`}>
        <Shape tree={tree} gid={gid} trunkH={trunkH} canopyOpacity={canopyOpacity} />
      </g>
    </svg>
  );
}

function Trunk({ tree, w = 10, h = 60, lean = 0 }: { tree: TreeDef; w?: number; h?: number; lean?: number }) {
  return (
    <path
      d={`M ${100 - w / 2} 176 
          C ${100 - w / 2 - 2} ${176 - h * 0.5}, ${100 - w / 2 + lean} ${176 - h * 0.8}, ${100 - w / 3 + lean} ${176 - h}
          L ${100 + w / 3 + lean} ${176 - h}
          C ${100 + w / 2 + lean} ${176 - h * 0.8}, ${100 + w / 2 + 2} ${176 - h * 0.5}, ${100 + w / 2} 176 Z`}
      fill={tree.trunk}
    />
  );
}

function Shape({
  tree,
  gid,
  trunkH,
  canopyOpacity,
}: {
  tree: TreeDef;
  gid: string;
  trunkH: number;
  canopyOpacity: number;
}) {
  const leafFill = `url(#leaf-${gid})`;
  const o = canopyOpacity;

  switch (tree.shape) {
    case "sprout":
      return (
        <g>
          <Trunk tree={tree} w={5} h={26} />
          <g opacity={o}>
            <ellipse cx="86" cy="146" rx="15" ry="9" fill={leafFill} transform="rotate(-25 86 146)" />
            <ellipse cx="114" cy="142" rx="15" ry="9" fill={leafFill} transform="rotate(20 114 142)" />
          </g>
        </g>
      );

    case "conifer":
      return (
        <g>
          <Trunk tree={tree} w={9} h={40} />
          <g opacity={o}>
            <path d="M100 26 L134 84 L66 84 Z" fill={leafFill} />
            <path d="M100 54 L142 112 L58 112 Z" fill={leafFill} />
            <path d="M100 84 L150 140 L50 140 Z" fill={tree.leaf} />
          </g>
        </g>
      );

    case "blossom":
      return (
        <g>
          <Trunk tree={tree} w={11} h={trunkH} lean={-3} />
          <g opacity={o}>
            <circle cx="76" cy="96" r="26" fill={leafFill} />
            <circle cx="124" cy="94" r="28" fill={leafFill} />
            <circle cx="100" cy="72" r="30" fill={tree.leafAlt} />
            <circle cx="100" cy="104" r="26" fill={tree.leaf} />
            {[
              [66, 130],
              [96, 138],
              [130, 132],
              [82, 122],
              [118, 124],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3" fill={tree.leafAlt} opacity="0.9" />
            ))}
          </g>
        </g>
      );

    case "willow":
      return (
        <g>
          <Trunk tree={tree} w={13} h={54} />
          <g opacity={o}>
            <ellipse cx="100" cy="84" rx="52" ry="32" fill={leafFill} />
            {[58, 72, 86, 100, 114, 128, 142].map((x, i) => (
              <path
                key={x}
                d={`M ${x} 96 Q ${x + (i % 2 ? 6 : -6)} 126 ${x} ${142 - Math.abs(100 - x) * 0.35}`}
                stroke={tree.leaf}
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </g>
        </g>
      );

    case "palm":
      return (
        <g>
          <path
            d="M96 176 C 94 140, 92 118, 104 92 L 112 96 C 102 120, 104 146, 106 176 Z"
            fill={tree.trunk}
          />
          <g opacity={o}>
            {[-70, -35, 0, 35, 70].map((a) => (
              <ellipse
                key={a}
                cx="108"
                cy="78"
                rx="38"
                ry="11"
                fill={leafFill}
                transform={`rotate(${a} 108 90) translate(28 0)`}
              />
            ))}
            <circle cx="108" cy="90" r="7" fill={tree.leaf} />
          </g>
        </g>
      );

    case "bonsai":
      return (
        <g>
          <path
            d="M94 176 C 92 152, 88 138, 104 126 C 116 118, 118 112, 116 104 L 124 104 C 126 118, 118 126, 108 132 C 100 140, 102 158, 104 176 Z"
            fill={tree.trunk}
          />
          <g opacity={o}>
            <ellipse cx="72" cy="118" rx="28" ry="13" fill={leafFill} />
            <ellipse cx="132" cy="96" rx="34" ry="15" fill={leafFill} />
            <ellipse cx="104" cy="74" rx="26" ry="12" fill={tree.leafAlt} />
          </g>
        </g>
      );

    case "cactus":
      return (
        <g opacity={Math.max(o, 0.2)}>
          <rect x="88" y="76" width="24" height="100" rx="12" fill={leafFill} />
          <path d="M70 132 v-24 a10 10 0 0 1 20 0 v24" fill="none" stroke={tree.leaf} strokeWidth="16" strokeLinecap="round" />
          <path d="M130 122 v-32 a10 10 0 0 0 -20 0 v32" fill="none" stroke={tree.leaf} strokeWidth="16" strokeLinecap="round" />
          <circle cx="100" cy="70" r="5" fill={tree.accent ?? tree.leafAlt} />
        </g>
      );

    case "bamboo":
      return (
        <g opacity={Math.max(o, 0.2)}>
          {[
            [84, 60],
            [100, 40],
            [116, 72],
          ].map(([x, top], i) => (
            <g key={i}>
              <rect x={(x as number) - 5} y={top} width="10" height={176 - (top as number)} rx="5" fill={tree.trunk} />
              {[0, 1, 2, 3].map((k) => (
                <rect
                  key={k}
                  x={(x as number) - 6}
                  y={(top as number) + 22 + k * 28}
                  width="12"
                  height="3"
                  fill={tree.leaf}
                  opacity="0.7"
                />
              ))}
              <ellipse cx={(x as number) + 16} cy={(top as number) + 12} rx="18" ry="6" fill={leafFill} transform={`rotate(-20 ${(x as number) + 16} ${(top as number) + 12})`} />
              <ellipse cx={(x as number) - 16} cy={(top as number) + 26} rx="18" ry="6" fill={leafFill} transform={`rotate(20 ${(x as number) - 16} ${(top as number) + 26})`} />
            </g>
          ))}
        </g>
      );

    case "crystal":
      return (
        <g>
          <Trunk tree={tree} w={10} h={46} />
          <g opacity={o}>
            <path d="M100 24 L132 82 L100 124 L68 82 Z" fill={leafFill} />
            <path d="M100 24 L132 82 L100 124 Z" fill={tree.leaf} opacity="0.55" />
            <path d="M66 78 L88 108 L66 132 L48 106 Z" fill={leafFill} opacity="0.85" />
            <path d="M134 78 L152 106 L134 132 L112 108 Z" fill={leafFill} opacity="0.85" />
            {tree.accent && <circle cx="100" cy="82" r="6" fill={tree.accent} />}
          </g>
        </g>
      );

    case "broadleaf":
    default:
      return (
        <g>
          <Trunk tree={tree} w={12} h={trunkH} />
          <path
            d="M100 122 L78 96 M100 130 L124 102"
            stroke={tree.trunk}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g opacity={o}>
            <circle cx="72" cy="96" r="27" fill={leafFill} />
            <circle cx="128" cy="98" r="29" fill={leafFill} />
            <circle cx="100" cy="106" r="30" fill={tree.leaf} />
            <circle cx="100" cy="70" r="32" fill={tree.leafAlt} />
            {tree.accent &&
              [
                [82, 92],
                [116, 84],
                [100, 116],
              ].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill={tree.accent} />)}
          </g>
        </g>
      );
  }
}
