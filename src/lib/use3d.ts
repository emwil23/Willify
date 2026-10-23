import { Component, useEffect, useState, type ReactNode } from 'react'

/**
 * WebGL only when it helps: a real GPU, no reduced motion and no save-data, and (with `wideOnly`) a wide
 * screen. It waits until the page is idle so the 3D bundle never competes with the first paint.
 */
export function useCan3D(reduce: boolean, wideOnly = true) {
  const [ok, setOk] = useState(false)
  useEffect(() => {
    if (reduce || (wideOnly && !matchMedia('(min-width: 768px)').matches)) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    if (conn?.saveData) return
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return
    // Software rendering (no GPU) would spin the CPU for a decoration.
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return
    const id = requestIdleCallback(() => setOk(true), { timeout: 2500 })
    return () => cancelIdleCallback(id)
  }, [reduce, wideOnly])
  return ok
}

/** If the 3D scene fails (a lost context, a driver bug), whatever sits under it carries on. */
export class Quiet extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  override render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
