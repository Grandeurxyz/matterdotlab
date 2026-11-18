"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";

type Props = {
  text: string;
  width?: number;
  height?: number;
  emboss?: "raised" | "pressed";
  bumpScale?: number;
  textSize?: number;
  condense?: number;
  scratches?: number;
  seed?: number;
  className?: string;
};

const TEX_W = 2048;

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function addNoise(ctx: CanvasRenderingContext2D, w: number, h: number, amp: number, rand: () => number) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * amp;
    d[i] += n;
    d[i + 1] += n;
    d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function blotches(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, maxAlpha: number, rand: () => number) {
  for (let i = 0; i < count; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const r = 120 + rand() * 420;
    const c = rand() > 0.5 ? "255,255,255" : "0,0,0";
    const a = maxAlpha * (0.3 + rand() * 0.7);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

type Scratch = { x: number; y: number; angle: number; len: number; w: number; alpha: number; light: boolean; bend: number };

function makeScratches(w: number, h: number, count: number, rand: () => number): Scratch[] {
  const list: Scratch[] = [];
  for (let i = 0; i < count; i++) {
    list.push({
      x: rand() * w,
      y: rand() * h,
      angle: rand() * Math.PI,
      len: 10 + Math.pow(rand(), 3) * 520,
      w: 0.4 + rand() * 1.1,
      alpha: 0.08 + rand() * 0.35,
      light: rand() > 0.45,
      bend: (rand() - 0.5) * 30,
    });
  }
  return list;
}

function drawScratches(ctx: CanvasRenderingContext2D, list: Scratch[], mode: "color" | "height" | "rough") {
  ctx.lineCap = "round";
  for (const s of list) {
    const ex = s.x + Math.cos(s.angle) * s.len;
    const ey = s.y + Math.sin(s.angle) * s.len;
    const mx = (s.x + ex) / 2 - Math.sin(s.angle) * s.bend;
    const my = (s.y + ey) / 2 + Math.cos(s.angle) * s.bend;
    const col = mode === "rough" || s.light ? "255,255,255" : "0,0,0";
    const a = mode === "color" ? (s.light ? s.alpha : s.alpha * 0.6) : s.alpha * 0.7;
    ctx.strokeStyle = `rgba(${col},${a})`;
    ctx.lineWidth = s.w;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
}

function buildBase(w: number, h: number, seed: number, amount: number) {
  const rand = mulberry32(seed);
  const color = makeCanvas(w, h);
  const height = makeCanvas(w, h);
  const rough = makeCanvas(w, h);
  const cc = color.getContext("2d")!;
  const hc = height.getContext("2d")!;
  const rc = rough.getContext("2d")!;

  cc.fillStyle = "#c3c5c8";
  cc.fillRect(0, 0, w, h);
  blotches(cc, w, h, 70, 0.1, rand);
  addNoise(cc, w, h, 10, rand);

  hc.fillStyle = "#808080";
  hc.fillRect(0, 0, w, h);
  blotches(hc, w, h, 40, 0.05, rand);
  addNoise(hc, w, h, 8, rand);

  rc.fillStyle = "#5a5a5a";
  rc.fillRect(0, 0, w, h);
  blotches(rc, w, h, 50, 0.12, rand);
  addNoise(rc, w, h, 16, rand);

  const list = makeScratches(w, h, Math.round(1400 * amount), rand);
  drawScratches(cc, list, "color");
  drawScratches(hc, list, "height");
  drawScratches(rc, list, "rough");

  for (let i = 0; i < 500; i++) {
    cc.fillStyle = `rgba(255,255,255,${0.15 + rand() * 0.3})`;
    cc.beginPath();
    cc.arc(rand() * w, rand() * h, 0.5 + rand() * 1.2, 0, Math.PI * 2);
    cc.fill();
  }

  return { color, height, rough };
}

function drawText(ctx: CanvasRenderingContext2D, text: string, w: number, h: number, size: number, condense: number, raised: boolean) {
  const lines = text.toUpperCase().split("\n");
  const px = h * size;
  const lh = px * 1.08;
  const start = -((lines.length - 1) * lh) / 2;
  const col = raised ? "#ffffff" : "#000000";
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(condense, 1);
  ctx.font = `700 ${px}px 'Arial Narrow','Helvetica Neue',Arial,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = col;
  ctx.shadowColor = col;
  ctx.shadowBlur = px * 0.06;
  lines.forEach((line, i) => ctx.fillText(line, 0, start + i * lh));
  ctx.restore();
}

function makePlateGeometry(w: number, h: number) {
  const r = 0.14;
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);

  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 5,
    curveSegments: 16,
  });

  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const bw = w + 0.07;
  const bh = h + 0.07;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + bw / 2) / bw, (pos.getY(i) + bh / 2) / bh);
  }
  g.translate(0, 0, -0.04);
  return g;
}

function Plate({
  text,
  width,
  height,
  emboss,
  bumpScale,
  textSize,
  condense,
  scratches,
  seed,
}: Required<Omit<Props, "className">>) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  const W = TEX_W;
  const H = Math.round((TEX_W * height) / width);

  const geometry = useMemo(() => makePlateGeometry(width, height), [width, height]);
  const base = useMemo(() => buildBase(W, H, seed, scratches), [W, H, seed, scratches]);

  const colorTex = useMemo(() => {
    const t = new THREE.CanvasTexture(base.color);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [base]);

  const roughTex = useMemo(() => {
    const t = new THREE.CanvasTexture(base.rough);
    t.anisotropy = 8;
    return t;
  }, [base]);

  const heightTex = useMemo(() => {
    const c = makeCanvas(W, H);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(base.height, 0, 0);
    drawText(ctx, text, W, H, textSize, condense, emboss === "raised");
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    return t;
  }, [base, text, W, H, textSize, condense, emboss]);

  useEffect(() => () => colorTex.dispose(), [colorTex]);
  useEffect(() => () => roughTex.dispose(), [roughTex]);
  useEffect(() => () => heightTex.dispose(), [heightTex]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const fit = Math.min(1, viewport.width / (width * 1.1), viewport.height / (height * 1.1));

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, state.pointer.x * 0.35, 0.06);
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -state.pointer.y * 0.25, 0.06);
    if (light.current) {
      light.current.position.set(state.pointer.x * viewport.width * 0.5, state.pointer.y * viewport.height * 0.5, 2.5);
    }
  });

  return (
    <>
      <pointLight ref={light} intensity={40} decay={2} color="#ffffff" />
      <group ref={group} scale={fit}>
        <mesh geometry={geometry}>
          <meshStandardMaterial
            map={colorTex}
            roughnessMap={roughTex}
            roughness={1}
            metalness={1}
            bumpMap={heightTex}
            bumpScale={bumpScale}
            envMapIntensity={1.2}
          />
        </mesh>
      </group>
    </>
  );
}

export default function MetalPlate3D({
  text,
  width = 6,
  height = 3.4,
  emboss = "raised",
  bumpScale = 2,
  textSize = 0.12,
  condense = 0.85,
  scratches = 1,
  seed = 7,
  className = "h-[600px] w-full",
}: Props) {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 7], fov: 35 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />
        <Environment resolution={512}>
          <Lightformer form="rect" intensity={1.4} position={[0, 0, 9]} scale={[22, 14, 1]} />
          <Lightformer form="rect" intensity={5} position={[-7, 4, 4]} scale={[3, 10, 1]} />
          <Lightformer form="rect" intensity={5} position={[7, -3, 4]} scale={[2, 9, 1]} />
          <Lightformer form="rect" intensity={3} position={[0, 8, 3]} scale={[16, 2, 1]} />
        </Environment>
        <Plate
          text={text}
          width={width}
          height={height}
          emboss={emboss}
          bumpScale={bumpScale}
          textSize={textSize}
          condense={condense}
          scratches={scratches}
          seed={seed}
        />
      </Canvas>
    </div>
  );
}