import { frequencies, level } from '@/player/engine'
import { Canvas, useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  Color,
  MathUtils,
  Object3D,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'

const BARS = 96
const RADIUS = 2.15
// Scratch objects reused every frame (only one visualiser is ever on screen).
const dummy = new Object3D()
const buf = new Uint8Array(128)
const heights = new Float32Array(BARS)

/** A ring of bars round the artwork, one per frequency band, mirrored so the ring is symmetric. */
function Bars({ color }: { color: string }) {
  const ref = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    const c = new Color(color)
    const live = new Color('#6cf2c2')
    for (let i = 0; i < BARS; i++)
      m.setColorAt(i, c.clone().lerp(live, Math.abs(Math.sin((i / BARS) * Math.PI))))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [color])
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const f = frequencies(buf)
    for (let i = 0; i < BARS; i++) {
      const band = i < BARS / 2 ? i : BARS - 1 - i
      const v = f
        ? (f[2 + band] ?? 0) / 255
        : 0.05 + Math.sin(state.clock.elapsedTime * 2 + i * 0.3) * 0.03
      heights[i] = MathUtils.lerp(heights[i] ?? 0, v, 0.35)
      const h = 0.08 + (heights[i] ?? 0) * 1.6
      const a = (i / BARS) * Math.PI * 2
      dummy.position.set(Math.cos(a) * (RADIUS + h / 2), Math.sin(a) * (RADIUS + h / 2), 0)
      dummy.rotation.set(0, 0, a - Math.PI / 2)
      dummy.scale.set(1, h, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    m.rotation.z += 0.0015
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BARS]}>
      <planeGeometry args={[0.07, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}

/** Grooves rippling outwards, launched by loud moments. */
function Ripples({ color }: { color: string }) {
  const rings = useRef<(Mesh | null)[]>([])
  const ages = useRef([0, 0.33, 0.66])
  useFrame((_, dt) => {
    const boost = level()
    ages.current = ages.current.map((age) => (age + dt * (0.25 + boost * 0.9)) % 1)
    ages.current.forEach((age, i) => {
      const r = rings.current[i]
      if (!r) return
      r.scale.setScalar(1 + age * 1.6)
      ;(r.material as MeshBasicMaterial).opacity = (1 - age) * 0.35
    })
  })
  return (
    <>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => void (rings.current[i] = m)}>
          <ringGeometry args={[RADIUS * 1.02, RADIUS * 1.03, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.3} />
        </mesh>
      ))}
    </>
  )
}

export default function Visualiser({ color }: { color: string }) {
  return (
    <Canvas camera={{ position: [0, 0, 7], fov: 50 }} dpr={[1, 1.75]} gl={{ alpha: true }}>
      <Ripples color={color} />
      <Bars color={color} />
    </Canvas>
  )
}
