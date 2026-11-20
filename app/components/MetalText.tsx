"use client";

import { useEffect, useRef, useState } from "react";

type Props = { text: string; className?: string };

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
uniform sampler2D uMask;
uniform sampler2D uH;
uniform vec2 uTexel;
uniform vec2 uLight;
uniform float uTime;
uniform float uAspect;
uniform float uBump;
uniform float uEdge;
uniform vec4 uRip[4];

void main(){
  float m = texture2D(uMask, vUv).a;
  if (m < 0.003) { gl_FragColor = vec4(0.0); return; }

  vec2 e = uTexel * uEdge;
  float hl = texture2D(uH, vUv - vec2(e.x, 0.0)).a;
  float hr = texture2D(uH, vUv + vec2(e.x, 0.0)).a;
  float hd = texture2D(uH, vUv - vec2(0.0, e.y)).a;
  float hu = texture2D(uH, vUv + vec2(0.0, e.y)).a;
  vec3 n = vec3(-(hr - hl) * uBump, -(hu - hd) * uBump, 1.0);

  vec2 pos = vec2(vUv.x * uAspect, vUv.y);
  float flash = 0.0;
  for (int i = 0; i < 4; i++) {
    vec4 r = uRip[i];
    if (r.w > 0.5) {
      float age = uTime - r.z;
      if (age > 0.0 && age < 2.6) {
        float d = distance(pos, r.xy);
        float w = d - age * 2.2;
        float amp = exp(-w * w * 40.0) * exp(-age * 1.3);
        vec2 dir = normalize(pos - r.xy + vec2(0.0001));
        n.xy += dir * amp * 1.1;
        flash += amp;
      }
    }
  }
  n = normalize(n);

  vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
  vec3 L = normalize(vec3((uLight.x - 0.5) * 1.6, (0.5 - uLight.y) * 1.6, 0.9));
  float d = max(dot(R, L), 0.0);
  float spec = pow(d, 48.0);
  float sheen = pow(d, 6.0);

  float g = smoothstep(-0.9, 0.9, R.y);
  float strip = smoothstep(0.10, 0.0, abs(R.x - 0.35)) * smoothstep(-0.2, 0.6, R.y);
  float strip2 = smoothstep(0.08, 0.0, abs(R.x + 0.55)) * 0.7;
  float band = smoothstep(0.06, 0.0, abs(R.y - 0.45)) * 0.6;
  float env = 0.04 + 0.30 * g * g + 0.55 * strip + 0.40 * strip2 + 0.35 * band;

  vec3 col = vec3(0.86, 0.89, 0.94) * (env + 0.5 * sheen) + vec3(1.0) * spec * 1.6;
  col += flash * 0.2;
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

export default function MetalText({ text, className = "" }: Props) {
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
    const uMask = U("uMask");
    const uH = U("uH");
    const uTexel = U("uTexel");
    const uLight = U("uLight");
    const uTime = U("uTime");
    const uAspect = U("uAspect");
    const uBump = U("uBump");
    const uEdge = U("uEdge");
    const uRip = U("uRip[0]");

    const texMask = g.createTexture();
    const texH = g.createTexture();

    const light = { x: -0.3, y: 0.4 };
    const target = { x: 0.3, y: 0.35 };
    let ripples: { x: number; y: number; t: number }[] = [];
    let aspect = 5;
    let ready = false;
    let visible = true;
    let dead = false;
    let raf = 0;
    let lastW = 0;
    let timer = 0;
    const t0 = performance.now();

    const upload = (tex: WebGLTexture | null, unit: number, src: HTMLCanvasElement) => {
      g.activeTexture(g.TEXTURE0 + unit);
      g.bindTexture(g.TEXTURE_2D, tex);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, 1);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    };

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
      g.uniform1f(uTime, now);
      g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    };

    const frame = () => {
      raf = 0;
      const now = (performance.now() - t0) / 1000;
      light.x += (target.x - light.x) * 0.06;
      light.y += (target.y - light.y) * 0.06;
      ripples = ripples.filter((r) => now - r.t < 2.6);
      draw(now);
      const moving = Math.abs(target.x - light.x) > 0.002 || Math.abs(target.y - light.y) > 0.002 || ripples.length > 0;
      if (moving && visible && !dead) raf = requestAnimationFrame(frame);
    };

    const kick = () => {
      if (!raf && ready && visible && !dead) raf = requestAnimationFrame(frame);
    };

    const build = () => {
      const cssW = wrap.clientWidth;
      if (cssW < 10) return;
      const small = window.innerWidth < 768;
      let dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
      if (cssW * dpr > 2400) dpr = 2400 / cssW;

      const fam = getComputedStyle(document.body).fontFamily;
      const meas = document.createElement("canvas").getContext("2d")!;
      meas.font = `800 200px ${fam}`;
      const m = meas.measureText(text);
      const L = m.actualBoundingBoxLeft;
      const bw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight || 1;
      const asc = m.actualBoundingBoxAscent;
      const desc = m.actualBoundingBoxDescent;

      const scale = (cssW * 0.97) / bw;
      const fontDev = 200 * scale * dpr;
      const blur = fontDev * 0.06;
      const pad = Math.ceil(blur * 2);
      const Wd = Math.round(cssW * dpr);
      const Hd = Math.ceil((asc + desc) * scale * dpr + pad * 2);
      const x = (Wd - bw * scale * dpr) / 2 + L * scale * dpr;
      const y = pad + asc * scale * dpr;

      cv.width = Wd;
      cv.height = Hd;
      cv.style.height = `${Hd / dpr}px`;
      aspect = Wd / Hd;

      const mk = () => {
        const c = document.createElement("canvas");
        c.width = Wd;
        c.height = Hd;
        const ctx = c.getContext("2d")!;
        ctx.font = `800 ${fontDev}px ${fam}`;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        return { c, ctx };
      };

      const a = mk();
      a.ctx.fillStyle = "#fff";
      a.ctx.fillText(text, x, y);

      const b = mk();
      const OFF = Wd * 2 + 200;
      b.ctx.fillStyle = "#fff";
      b.ctx.shadowColor = "#fff";
      b.ctx.shadowOffsetX = OFF;
      b.ctx.shadowBlur = blur;
      b.ctx.fillText(text, x - OFF, y);
      b.ctx.shadowBlur = blur * 0.35;
      b.ctx.fillText(text, x - OFF, y);

      upload(texMask, 0, a.c);
      upload(texH, 1, b.c);
      g.uniform1i(uMask, 0);
      g.uniform1i(uH, 1);
      g.uniform2f(uTexel, 1 / Wd, 1 / Hd);
      g.uniform1f(uAspect, aspect);
      g.uniform1f(uBump, 2.4);
      g.uniform1f(uEdge, Math.max(1, blur * 0.22));
      g.viewport(0, 0, Wd, Hd);

      ready = true;
      draw((performance.now() - t0) / 1000);
      kick();
    };

    const toUV = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      return { u: (e.clientX - r.left) / r.width, v: (e.clientY - r.top) / r.height };
    };

    const onMove = (e: PointerEvent) => {
      const { u, v } = toUV(e);
      target.x = clamp(u, -0.8, 1.8);
      target.y = clamp(v, -1.5, 3);
      kick();
    };

    const onDown = (e: PointerEvent) => {
      const { u, v } = toUV(e);
      target.x = clamp(u, -0.8, 1.8);
      target.y = clamp(v, -1.5, 3);
      const now = (performance.now() - t0) / 1000;
      ripples.push({ x: u * aspect, y: 1 - v, t: now });
      if (ripples.length > 4) ripples.shift();
      kick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    cv.addEventListener("pointerdown", onDown);

    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) kick();
    });
    io.observe(wrap);

    const ro = new ResizeObserver(() => {
      const w = wrap.clientWidth;
      if (Math.abs(w - lastW) < 2) return;
      lastW = w;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (!dead) build();
      }, 120);
    });

    const fam = getComputedStyle(document.body).fontFamily;
    const start = () => {
      if (dead) return;
      lastW = wrap.clientWidth;
      build();
      ro.observe(wrap);
    };
    document.fonts.load(`800 64px ${fam}`).then(start, start);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerdown", onDown);
      io.disconnect();
      ro.disconnect();
      g.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [text]);

  if (fallback) {
    return (
      <h1
        className={`w-full whitespace-nowrap bg-gradient-to-b from-white via-neutral-400 to-neutral-600 bg-clip-text text-center text-[16vw] font-extrabold leading-none tracking-tighter text-transparent ${className}`}
      >
        {text}
      </h1>
    );
  }

  return (
    <div ref={wrapRef} className={`w-full ${className}`}>
      <h1 className="sr-only">{text}</h1>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="block w-full cursor-pointer select-none"
        style={{ touchAction: "pan-y" }}
      />
    </div>
  );
}