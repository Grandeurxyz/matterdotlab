"use client";

import { useEffect, useRef, useState } from "react";

const VERT = `
attribute vec2 p;
varying vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform float uAspect;
uniform float uRx;
uniform float uRy;
uniform float uPx;
uniform vec2 uLight;
uniform vec2 uM;
uniform float uAmt;
uniform float uTime;
uniform vec4 uRip[4];

float dist(vec2 p){
  vec2 q = vec2(p.x / uRx, p.y / uRy);
  float a = atan(q.y, q.x);
  float R = 1.0 + 0.055 * sin(3.0 * a + 1.3) + 0.045 * sin(5.0 * a + 0.4) + 0.03 * sin(2.0 * a + 2.1);
  return length(q) / R;
}

float height(vec2 p){
  float d = dist(p);
  float e = 1.0 - d;
  float t = clamp(e / 0.11, 0.0, 1.0);
  float rim = sqrt(1.0 - (1.0 - t) * (1.0 - t));
  float tier = smoothstep(0.84, 0.79, d);
  float rr = (d - 0.72) / 0.016;
  float ring = exp(-rr * rr);
  float field = smoothstep(0.64, 0.58, d);
  float h = 0.5 * rim - 0.17 * tier + 0.10 * ring - 0.15 * field;

  vec2 m = p / uRy;
  float sdC = length(m - vec2(-0.17, 0.03)) - 0.27;
  vec2 v = m - vec2(0.13, -0.04);
  float cs = cos(0.5);
  float sn = sin(0.5);
  vec2 r = vec2(cs * v.x - sn * v.y, sn * v.x + cs * v.y);
  float sdS = length(max(abs(r) - vec2(0.14), 0.0)) - 0.05;
  float a1 = smoothstep(0.05, -0.05, sdC);
  float a2 = smoothstep(0.05, -0.05, sdS);
  h += field * (0.2 * max(a1, a2) - 0.13 * a1 * a2);

  float live = smoothstep(1.0, 0.85, d);
  vec2 dv = (p - uM) / uRy;
  h += uAmt * 0.22 * exp(-dot(dv, dv) * 7.0) * live;

  for (int i = 0; i < 4; i++) {
    vec4 rp = uRip[i];
    if (rp.w > 0.5) {
      float age = uTime - rp.z;
      if (age > 0.0 && age < 2.6) {
        float dd = distance(p, rp.xy) / uRy;
        float w = dd - age * 1.1;
        h += 0.07 * exp(-w * w * 40.0) * exp(-age * 1.3) * live;
      }
    }
  }
  return h;
}

void main(){
  vec2 p = vec2((vUv.x - 0.5) * uAspect * 2.0, (vUv.y - 0.5) * 2.0);
  float d = dist(p);
  float m = clamp((1.0 - d) / (1.5 * uPx), 0.0, 1.0);
  if (m < 0.003) { gl_FragColor = vec4(0.0); return; }

  float eps = 0.005 * uRy;
  float h0 = height(p);
  float hx = height(p + vec2(eps, 0.0));
  float hy = height(p + vec2(0.0, eps));
  vec3 n = normalize(vec3(-(hx - h0) / eps * 0.55, -(hy - h0) / eps * 0.55, 1.0));

  vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 L = normalize(vec3((uLight.x - 0.5) * 1.6, (0.5 - uLight.y) * 1.6, 0.9));
  float dl = max(dot(R, L), 0.0);
  float spec = pow(dl, 48.0);
  float sheen = pow(dl, 6.0);

  float g = smoothstep(-0.9, 0.9, R.y);
  float strip = smoothstep(0.10, 0.0, abs(R.x - 0.35)) * smoothstep(-0.2, 0.6, R.y);
  float strip2 = smoothstep(0.08, 0.0, abs(R.x + 0.55)) * 0.7;
  float band = smoothstep(0.06, 0.0, abs(R.y - 0.45)) * 0.6;
  float env = 0.07 + 0.32 * g * g + 0.55 * strip + 0.40 * strip2 + 0.35 * band;

  vec3 col = vec3(0.86, 0.89, 0.94) * (env + 0.5 * sheen) + vec3(1.0) * spec * 1.6;
  col = 1.0 - exp(-col * 1.6);

  gl_FragColor = vec4(col * m, m);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader error");
  return s;
}

const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);

export default function MetalObject({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false }) as WebGLRenderingContext | null;
    } catch {
      gl = null;
    }
    if (!gl) {
      setFallback(true);
      return;
    }
    const g = gl;

    let prog: WebGLProgram;
    try {
      prog = g.createProgram()!;
      g.attachShader(prog, compile(g, g.VERTEX_SHADER, VERT));
      g.attachShader(prog, compile(g, g.FRAGMENT_SHADER, FRAG));
      g.linkProgram(prog);
      if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error("link error");
    } catch {
      setFallback(true);
      return;
    }
    g.useProgram(prog);

    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, "p");
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);

    const U = (n: string) => g.getUniformLocation(prog, n);
    const uAspect = U("uAspect");
    const uRx = U("uRx");
    const uRy = U("uRy");
    const uPx = U("uPx");
    const uLight = U("uLight");
    const uM = U("uM");
    const uAmt = U("uAmt");
    const uTime = U("uTime");
    const uRip = U("uRip[0]");

    const light = { x: -0.3, y: 0.4 };
    const lightT = { x: 0.3, y: 0.35 };
    const mouse = { x: 0, y: 0 };
    const mouseT = { x: 0, y: 0 };
    let amt = 0;
    let amtT = 0;
    let ripples: { x: number; y: number; t: number }[] = [];
    let aspect = 1;
    let ready = false;
    let visible = true;
    let dead = false;
    let raf = 0;
    let timer = 0;
    let lastW = 0;
    let lastH = 0;
    const t0 = performance.now();

    const draw = (now: number) => {
      g.clearColor(0, 0, 0, 0);
      g.clear(g.COLOR_BUFFER_BIT);
      const arr = new Float32Array(16);
      for (let i = 0; i < 4; i++) {
        const r = ripples[i];
        if (r) {
          arr[i * 4] = r.x;
          arr[i * 4 + 1] = r.y;
          arr[i * 4 + 2] = r.t;
          arr[i * 4 + 3] = 1;
        }
      }
      g.uniform4fv(uRip, arr);
      g.uniform2f(uLight, light.x, light.y);
      g.uniform2f(uM, mouse.x, mouse.y);
      g.uniform1f(uAmt, amt);
      g.uniform1f(uTime, now);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    };

    const frame = () => {
      raf = 0;
      const now = (performance.now() - t0) / 1000;
      light.x += (lightT.x - light.x) * 0.06;
      light.y += (lightT.y - light.y) * 0.06;
      mouse.x += (mouseT.x - mouse.x) * 0.14;
      mouse.y += (mouseT.y - mouse.y) * 0.14;
      amt += (amtT - amt) * 0.1;
      ripples = ripples.filter((r) => now - r.t < 2.6);
      draw(now);
      const moving =
        Math.abs(lightT.x - light.x) > 0.002 ||
        Math.abs(lightT.y - light.y) > 0.002 ||
        Math.abs(mouseT.x - mouse.x) > 0.002 ||
        Math.abs(mouseT.y - mouse.y) > 0.002 ||
        Math.abs(amtT - amt) > 0.004 ||
        ripples.length > 0;
      if (moving && visible && !dead) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && ready && visible && !dead) raf = requestAnimationFrame(frame);
    };

    const build = () => {
      const cssW = wrap.clientWidth;
      const cssH = wrap.clientHeight;
      if (cssW < 10 || cssH < 10) return;
      const small = window.innerWidth < 768;
      let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.25 : 2);
      if (cssW * cssH * dpr * dpr > 1600000) dpr = Math.sqrt(1600000 / (cssW * cssH));
      const Wd = Math.round(cssW * dpr);
      const Hd = Math.round(cssH * dpr);
      cv.width = Wd;
      cv.height = Hd;
      aspect = Wd / Hd;
      const s = clamp(aspect * 0.5, 1, 1.9);
      const ry = Math.min(0.88, aspect * 0.94);
      const rx = Math.min(0.88 * s, aspect * 0.94);
      g.viewport(0, 0, Wd, Hd);
      g.uniform1f(uAspect, aspect);
      g.uniform1f(uRx, rx);
      g.uniform1f(uRy, ry);
      g.uniform1f(uPx, 2 / (Hd * ry));
      const first = !ready;
      ready = true;
      const now = (performance.now() - t0) / 1000;
      if (first) ripples.push({ x: 0, y: 0, t: now });
      draw(now);
      kick();
    };

    const toP = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const u = (e.clientX - r.left) / r.width;
      const v = (e.clientY - r.top) / r.height;
      return { u, v, x: (u - 0.5) * aspect * 2, y: (0.5 - v) * 2 };
    };

    const onMove = (e: PointerEvent) => {
      const { u, v, x, y } = toP(e);
      lightT.x = clamp(u, -0.8, 1.8);
      lightT.y = clamp(v, -1.5, 3);
      const inside = u >= 0 && u <= 1 && v >= 0 && v <= 1;
      if (inside) {
        mouseT.x = x;
        mouseT.y = y;
      }
      amtT = inside ? 1 : 0;
      kick();
    };

    const onDown = (e: PointerEvent) => {
      const { x, y } = toP(e);
      mouseT.x = x;
      mouseT.y = y;
      amtT = 1;
      const now = (performance.now() - t0) / 1000;
      ripples.push({ x, y, t: now });
      if (ripples.length > 4) ripples.shift();
      kick();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        amtT = 0;
        kick();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    cv.addEventListener("pointerdown", onDown);

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) kick();
    });
    io.observe(wrap);

    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return;
      lastW = w;
      lastH = h;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!dead) build();
      }, 100);
    });
    ro.observe(wrap);
    build();

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointerdown", onDown);
      io.disconnect();
      ro.disconnect();
      g.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  if (fallback) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="aspect-square h-4/5 rounded-full bg-gradient-to-br from-white via-neutral-500 to-neutral-800" />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={className}>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block h-full w-full cursor-pointer select-none"
        style={{ touchAction: "pan-y" }}
      />
    </div>
  );
}