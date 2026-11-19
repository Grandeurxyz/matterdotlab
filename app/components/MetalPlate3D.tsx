"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

type Props = {
  text: string;
  width?: number;
  height?: number;
  irregular?: number;
  relief?: number;
  depth?: number;
  scratches?: number;
  seed?: number;
  className?: string;
};

const TEX_W = 1600;

function clamp(x: number, a = 0, b = 1) {
  return x < a ? a : x > b ? b : x;
}

function smooth(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeNoise(seed: number) {
  const hash = (ix: number, iy: number) => {
    let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const n = (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const a = hash(ix, iy);
    const b = hash(ix + 1, iy);
    const c = hash(ix, iy + 1);
    const d = hash(ix + 1, iy + 1);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
  const fbm = (x: number, y: number, oct: number) => {
    let s = 0;
    let amp = 0.5;
    let f = 1;
    let norm = 0;
    for (let i = 0; i < oct; i++) {
      s += n(x * f, y * f) * amp;
      norm += amp;
      amp *= 0.5;
      f *= 2;
    }
    return s / norm;
  };
  return { fbm };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toCanvas(data: Uint8ClampedArray, w: number, h: number) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  img.data.set(data);
  ctx.putImageData(img, 0, 0);
  return c;
}

function buildPlate(text: string, W: number, H: number, seed: number, irr: number, scratchAmt: number, relief: number) {
  const N = W * H;
  const { fbm } = makeNoise(seed);
  const rand = mulberry32(seed * 97 + 13);
  const ph1 = rand() * 6.283;
  const ph2 = rand() * 6.283;
  const ph3 = rand() * 6.283;

  const tc = makeCanvas(W, H);
  const tctx = tc.getContext("2d")!;
  tctx.textAlign = "center";
  tctx.textBaseline = "middle";
  tctx.fillStyle = "#ffffff";
  tctx.shadowColor = "#ffffff";
  const family = '"Helvetica Neue", Helvetica, Arial, sans-serif';
  let px = H * 0.3;
  tctx.font = `800 ${px}px ${family}`;
  const mw = tctx.measureText(text).width || 1;
  px = Math.min((px * W * 0.5) / mw, H * 0.34);
  tctx.font = `800 ${px}px ${family}`;
  tctx.shadowBlur = px * 0.22;
  tctx.fillText(text, W / 2, H / 2);
  tctx.shadowBlur = px * 0.05;
  tctx.fillText(text, W / 2, H / 2);
  const td = tctx.getImageData(0, 0, W, H).data;

  const scv = makeCanvas(W, H);
  const sctx = scv.getContext("2d")!;
  sctx.lineCap = "round";
  const count = Math.round(700 * scratchAmt);
  for (let i = 0; i < count; i++) {
    const x0 = rand() * W;
    const y0 = rand() * H;
    const ang = rand() * Math.PI;
    const len = 8 + Math.pow(rand(), 3) * 380;
    const bend = (rand() - 0.5) * 24;
    const x1 = x0 + Math.cos(ang) * len;
    const y1 = y0 + Math.sin(ang) * len;
    sctx.strokeStyle = `rgba(255,255,255,${0.2 + rand() * 0.7})`;
    sctx.lineWidth = 0.5 + rand() * 1.0;
    sctx.beginPath();
    sctx.moveTo(x0, y0);
    sctx.quadraticCurveTo((x0 + x1) / 2 - Math.sin(ang) * bend, (y0 + y1) / 2 + Math.cos(ang) * bend, x1, y1);
    sctx.stroke();
  }
  const sd = sctx.getImageData(0, 0, W, H).data;

  const hb = new Float32Array(N);
  const hf = new Float32Array(N);
  const colD = new Uint8ClampedArray(N * 4);
  const rghD = new Uint8ClampedArray(N * 4);
  const alpD = new Uint8ClampedArray(N * 4);
  const nrmD = new Uint8ClampedArray(N * 4);

  for (let i = 0; i < N; i++) {
    const k = i * 4;
    colD[k + 3] = 255;
    rghD[k] = rghD[k + 1] = rghD[k + 2] = 255;
    rghD[k + 3] = 255;
    alpD[k + 3] = 255;
    nrmD[k] = 128;
    nrmD[k + 1] = 128;
    nrmD[k + 2] = 255;
    nrmD[k + 3] = 255;
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const nx0 = (x - W * 0.5) / (W * 0.4);
      const ny0 = (y - H * 0.5) / (H * 0.4);
      const wx = nx0 + (fbm(x / 700 + 3.1, y / 700 + 7.7, 3) - 0.5) * 0.55 * irr;
      const wy = ny0 + (fbm(x / 700 + 19.4, y / 700 + 1.3, 3) - 0.5) * 0.55 * irr;
      const ang = Math.atan2(wy, wx);
      const r = 1 + irr * (0.05 * Math.sin(2 * ang + ph1) + 0.045 * Math.sin(3 * ang + ph2) + 0.035 * Math.sin(5 * ang + ph3));
      const d = Math.hypot(wx, wy) / r;
      const e = 1 - d;
      if (e <= 0) continue;

      const n1 = fbm(x / 380 + 11, y / 380 + 5, 2) - 0.5;
      const n2 = fbm(x / 380 + 23, y / 380 + 17, 2) - 0.5;
      const n3 = fbm(x / 380 + 41, y / 380 + 29, 2) - 0.5;
      const b1 = 0.87 + n1 * 0.12 * irr;
      const b2 = 0.79 + n2 * 0.12 * irr;
      const b3 = 0.72 + n3 * 0.14 * irr;

      const rim = Math.sqrt(1 - Math.pow(1 - clamp(e / 0.08), 2));
      const s1 = smooth(b1 + 0.02, b1 - 0.02, d);
      const ring = Math.exp(-Math.pow((d - b2) / 0.014, 2));
      const s3 = smooth(b3 + 0.025, b3 - 0.025, d);
      const lump = (fbm(x / 240 + 2, y / 240 + 8, 3) - 0.5) * 0.14 * rim;

      const h = Math.max(0, 0.5 * rim - 0.2 * s1 + 0.12 * ring - 0.17 * s3 + lump);

      const tsx = Math.min(W - 1, Math.max(0, Math.round(x + (fbm(x / 40 + 60, y / 40 + 40, 2) - 0.5) * 9)));
      const tsy = Math.min(H - 1, Math.max(0, Math.round(y + (fbm(x / 40 + 10, y / 40 + 90, 2) - 0.5) * 9)));
      const ta = td[(tsy * W + tsx) * 4 + 3] / 255;

      const base = h + ta * 0.3;
      hb[i] = base;

      const pit = fbm(x / 26 + 5, y / 26 + 9, 3) - 0.5;
      const mott = fbm(x / 110 + 1, y / 110 + 2, 3);
      const s = sd[i * 4 + 3] / 255;
      const grain = (rand() - 0.5) * 0.008;
      hf[i] = base + pit * 0.1 * s3 + grain - s * 0.03;

      const hn = Math.min(1.15, base / 0.55);
      const vv = clamp((0.3 + 0.62 * hn) * (0.72 + 0.56 * mott) + s * 0.3);
      const k = i * 4;
      colD[k] = vv * 255 * 0.97;
      colD[k + 1] = vv * 255 * 0.985;
      colD[k + 2] = vv * 255;

      const rr = clamp(0.16 + 0.4 * (1 - Math.min(hn, 1)) + s * 0.35 + pit * 0.3, 0.1, 0.85);
      rghD[k] = rghD[k + 1] = rghD[k + 2] = rr * 255;

      const a = clamp(e / 0.006) * 255;
      alpD[k] = alpD[k + 1] = alpD[k + 2] = a;
    }
  }

  const strength = relief * 50;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (alpD[i * 4] === 0) continue;
      const dx = hf[i + 1] - hf[i - 1];
      const dy = hf[i + W] - hf[i - W];
      const nx = -dx * strength;
      const ny = dy * strength;
      const l = Math.hypot(nx, ny, 1);
      const k = i * 4;
      nrmD[k] = (nx / l * 0.5 + 0.5) * 255;
      nrmD[k + 1] = (ny / l * 0.5 + 0.5) * 255;
      nrmD[k + 2] = (1 / l * 0.5 + 0.5) * 255;
    }
  }

  return {
    hb,
    color: toCanvas(colD, W, H),
    normal: toCanvas(nrmD, W, H),
    rough: toCanvas(rghD, W, H),
    alpha: toCanvas(alpD, W, H),
  };
}

function Plate({ text, width, height, relief, depth, irregular, scratches, seed }: Required<Omit<Props, "className">>) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  const W = TEX_W;
  const H = Math.round((TEX_W * height) / width);

  const built = useMemo(
    () => buildPlate(text, W, H, seed, irregular, scratches, relief),
    [text, W, H, seed, irregular, scratches, relief]
  );

  const tex = useMemo(() => {
    const mk = (c: HTMLCanvasElement, srgb = false) => {
      const t = new THREE.CanvasTexture(c);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      return t;
    };
    return {
      color: mk(built.color, true),
      normal: mk(built.normal),
      rough: mk(built.rough),
      alpha: mk(built.alpha),
    };
  }, [built]);

  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose());
    },
    [tex]
  );

  const geometry = useMemo(() => {
    const segX = 360;
    const segY = Math.max(60, Math.round((segX * height) / width));
    const g = new THREE.PlaneGeometry(width, height, segX, segY);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const px = Math.min(W - 1, Math.round(uv.getX(i) * (W - 1)));
      const py = Math.min(H - 1, Math.round((1 - uv.getY(i)) * (H - 1)));
      pos.setZ(i, built.hb[py * W + px] * depth);
    }
    pos.needsUpdate = true;
    return g;
  }, [width, height, W, H, built, depth]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const fit = Math.min(
    (viewport.width * 0.94) / (width * 0.82),
    (viewport.height * 0.92) / (height * 0.82)
  );

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.28 + Math.sin(t * 0.5) * 0.05, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.2 + Math.cos(t * 0.4) * 0.03, 0.06);
    if (light.current) {
      light.current.position.set(state.pointer.x * viewport.width * 0.5, state.pointer.y * viewport.height * 0.5, 2.5);
    }
  });

  return (
    <>
      <pointLight ref={light} intensity={30} decay={2} color="#ffffff" />
      <group ref={group} scale={fit}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={tex.color}
            normalMap={tex.normal}
            roughnessMap={tex.rough}
            alphaMap={tex.alpha}
            alphaTest={0.5}
            alphaToCoverage
            roughness={1}
            metalness={1}
            envMapIntensity={1.4}
          />
        </mesh>
      </group>
    </>
  );
}

export default function MetalPlate3D({
  text,
  width = 7.2,
  height = 2.5,
  irregular = 1,
  relief = 1,
  depth = 0.5,
  scratches = 1,
  seed = 7,
  className = "h-[600px] w-full",
}: Props) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />
        <Environment resolution={512}>
          <Lightformer form="rect" intensity={0.25} position={[0, 0, 9]} scale={[24, 14, 1]} />
          <Lightformer form="rect" intensity={9} position={[-6, 5, 4]} scale={[2.5, 9, 1]} />
          <Lightformer form="rect" intensity={7} position={[7, -2, 4]} scale={[1.6, 8, 1]} />
          <Lightformer form="rect" intensity={4} position={[0, 9, 2]} scale={[14, 1.5, 1]} />
          <Lightformer form="circle" intensity={6} position={[3, 3, 6]} scale={2} />
        </Environment>
        <Plate
          text={text}
          width={width}
          height={height}
          relief={relief}
          depth={depth}
          irregular={irregular}
          scratches={scratches}
          seed={seed}
        />
      </Canvas>
    </div>
  );
}