import { frequencies, level } from '@/player/engine'
import { useEffect, useRef } from 'react'

// The hero's groove field: a record seen from very close, its grooves bending with the music and rippling
// where the pointer moves, with one waveform flowing through. One fragment shader on a full-screen
// triangle; no three.js. Loaded after first paint and only with a real GPU (see Landing.tsx).

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`

const FRAG = `precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uMouseAmp;
uniform float uLevel; uniform vec4 uBands; uniform vec2 uCenter; uniform float uScroll;
uniform vec3 uBg; uniform vec3 uInk; uniform vec3 uAccent; uniform vec3 uLive;

float wave(float x, float t, float lv) {
  return 0.07 * sin(x * 2.1 + t * 0.7) + 0.045 * sin(x * 4.7 - t * 1.13)
    + (0.018 + lv * 0.11) * sin(x * 12.0 + t * 3.1) + lv * 0.05 * sin(x * 23.0 - t * 5.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float asp = uRes.x / uRes.y;
  vec2 p = (uv - uCenter) * vec2(asp, 1.0);
  float r = length(p);
  float a = atan(p.y, p.x);

  // The grooves breathe on their own and bend with the bass and mids of the playing preview.
  float wob = 0.004 * sin(a * 3.0 + uTime * 0.6) + 0.002 * sin(a * 7.0 - uTime * 0.9);
  wob += (uBands.x * sin(a * 4.0 + uTime * 2.0) + uBands.y * sin(a * 9.0 - uTime * 3.0)) * 0.014;
  vec2 m = (uMouse - uCenter) * vec2(asp, 1.0);
  float dm = length(p - m);
  float ripple = sin(dm * 95.0 - uTime * 7.0) * exp(-dm * 8.0) * 0.006 * uMouseAmp;
  float rr = r + wob + ripple;

  // Soft lines, so there is no shimmer at any pixel density. The record turns as you scroll.
  float g = 0.5 + 0.5 * sin(rr * 330.0 - uTime * 0.35 - uScroll * 6.0);
  float lines = pow(g, 6.0);
  float disc = smoothstep(1.35, 1.2, r) * smoothstep(0.115, 0.135, r);
  vec3 col = mix(uBg, uInk, lines * disc * (0.17 + uLevel * 0.12));

  // The label, with a spindle hole.
  float label = smoothstep(0.112, 0.108, r) * smoothstep(0.012, 0.016, r);
  col = mix(col, uAccent, label * 0.92);

  // The flowing waveform: a sharp core and a soft glow, violet drifting into mint.
  float x = uv.x * asp;
  float y = 0.52 + wave(x, uTime, uLevel);
  float d = abs(uv.y - y);
  float core = smoothstep(0.0024 + uLevel * 0.004, 0.0, d);
  float glow = smoothstep(0.045 + uLevel * 0.06, 0.0, d) * 0.28;
  vec3 rc = mix(uAccent, uLive, 0.5 + 0.5 * sin(x * 1.3 + uTime * 0.8));
  col = mix(col, rc, clamp(core + glow, 0.0, 1.0));

  // A fainter echo of the waveform, a beat behind.
  float y2 = 0.52 + wave(x - 0.35, uTime - 0.6, uLevel * 0.6) * 1.25;
  float echo = smoothstep(0.0016, 0.0, abs(uv.y - y2)) * 0.45;
  col = mix(col, uInk, echo * 0.5);

  gl_FragColor = vec4(col, 1.0);
}`

function rgb(cssVar: string): [number, number, number] {
  const v = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  const hex = /^#([0-9a-f]{6})$/i.exec(v)?.[1] ?? '000000'
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
}

export default function GrooveField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const gl = canvas?.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    })
    if (!canvas || !gl || gl.isContextLost()) return

    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)
      if (!s) return null
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
    }
    const vs = shader(gl.VERTEX_SHADER, VERT)
    const fs = shader(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()
    // If the GPU can't compile it, the static CSS grooves underneath simply stay.
    if (!vs || !fs) return
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    // One triangle that covers the screen.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = (n: string) => gl.getUniformLocation(prog, n)
    const U = {
      res: u('uRes'),
      time: u('uTime'),
      mouse: u('uMouse'),
      mouseAmp: u('uMouseAmp'),
      level: u('uLevel'),
      bands: u('uBands'),
      center: u('uCenter'),
      scroll: u('uScroll'),
    }
    const colours = () => {
      gl.uniform3fv(u('uBg'), rgb('--bg'))
      gl.uniform3fv(u('uInk'), rgb('--text'))
      gl.uniform3fv(u('uAccent'), rgb('--accent'))
      gl.uniform3fv(u('uLive'), rgb('--live'))
    }
    colours()
    const themeWatch = new MutationObserver(colours)
    themeWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    let w = 0
    let h = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      // Wide screens: the record sits right of the sentence. Phones: low and centred, under the text.
      if (w >= 768) gl.uniform2f(U.center, 0.74, 0.46)
      else gl.uniform2f(U.center, 0.5, 0.12)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const mouse = { x: 0.6, y: 0.5, amp: 0 }
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      mouse.x = (e.clientX - r.left) / r.width
      mouse.y = 1 - (e.clientY - r.top) / r.height
      mouse.amp = 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    // Only draw while the hero is on screen and the tab is visible.
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = Boolean(e?.isIntersecting)))
    io.observe(canvas)

    const buf = new Uint8Array(128)
    const bands = [0, 0, 0, 0]
    let lv = 0
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible || document.hidden) return
      const f = frequencies(buf)
      for (let i = 0; i < 4; i++) {
        let sum = 0
        for (let k = 0; k < 8; k++) sum += f?.[i * 8 + k] ?? 0
        bands[i] = (bands[i] ?? 0) * 0.8 + (sum / (8 * 255)) * 0.2
      }
      lv = lv * 0.85 + level() * 0.15
      mouse.amp *= 0.985
      gl.uniform1f(U.time, (now - start) / 1000)
      gl.uniform2f(U.mouse, mouse.x, mouse.y)
      gl.uniform1f(U.mouseAmp, mouse.amp)
      gl.uniform1f(U.level, lv)
      gl.uniform4f(U.bands, bands[0] ?? 0, bands[1] ?? 0, bands[2] ?? 0, bands[3] ?? 0)
      gl.uniform1f(U.scroll, window.scrollY / Math.max(h, 1))
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      themeWatch.disconnect()
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden />
}
