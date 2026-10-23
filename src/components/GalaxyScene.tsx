import { stars, type Star } from '@/lib/galaxy'
import { level } from '@/player/engine'
import { Html } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, Color, MathUtils, type Group, type Mesh } from 'three'

const SCALE = 5
const DUST = 6000

/** A seeded generator, so the prerendered still and every visit draw the same galaxy. */
function rng(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647
}

/** Star dust along four spiral arms that wind into a bright core, like grooves into a label. */
function Dust() {
  const { positions, colors } = useMemo(() => {
    const rand = rng(11)
    const positions = new Float32Array(DUST * 3)
    const colors = new Float32Array(DUST * 3)
    const hues = [18, 252, 158, 320]
    const c = new Color()
    for (let i = 0; i < DUST; i++) {
      const arm = i % 4
      const t = Math.pow(rand(), 0.7)
      const angle = (arm * Math.PI) / 2 + t * Math.PI * 1.35 + (rand() - 0.5) * 0.35
      const r = (0.08 + t * 0.95) * SCALE
      const spread = (rand() - 0.5) * (0.5 - t * 0.25)
      positions[i * 3] = Math.cos(angle) * r + spread
      positions[i * 3 + 1] = (rand() - 0.5) * 0.18 * (1.2 - t)
      positions[i * 3 + 2] = Math.sin(angle) * r + spread
      // Hot violet-white near the core, each arm's hue further out.
      c.setHSL((hues[arm] ?? 252) / 360, 0.7, MathUtils.lerp(0.85, 0.55, t))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    return { positions, colors }
  }, [])
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}

function GenreStar({
  star,
  active,
  label,
  onSelect,
}: {
  star: Star
  active: boolean
  label: boolean
  onSelect: ((s: Star) => void) | undefined
}) {
  const ref = useRef<Mesh>(null)
  const color = useMemo(() => new Color().setHSL(star.hue / 360, 0.85, 0.7), [star.hue])
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    // Pulses with the playing preview; the selected star breathes even in silence.
    const pulse =
      1 + level() * 1.6 + (active ? Math.sin(state.clock.elapsedTime * 3) * 0.15 + 0.5 : 0)
    m.scale.setScalar(MathUtils.lerp(m.scale.x, pulse, 0.2))
  })
  return (
    <group position={[star.x * SCALE, 0.05, star.y * SCALE]}>
      <mesh
        ref={ref}
        onClick={
          onSelect &&
          ((e) => {
            e.stopPropagation()
            onSelect(star)
          })
        }
        onPointerOver={onSelect && (() => (document.body.style.cursor = 'pointer'))}
        onPointerOut={onSelect && (() => (document.body.style.cursor = ''))}
      >
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={active ? '#6cf2c2' : color} />
      </mesh>
      {label && (
        <Html
          center
          distanceFactor={9}
          position={[0, 0.25, 0]}
          style={{ pointerEvents: 'none' }}
          zIndexRange={[10, 0]}
        >
          <span
            className="spec whitespace-nowrap"
            style={{
              color: active ? '#6cf2c2' : 'rgba(241,238,248,0.75)',
              textShadow: '0 1px 6px #09080f',
            }}
          >
            {star.name}
          </span>
        </Html>
      )}
    </group>
  )
}

function Core() {
  const ref = useRef<Mesh>(null)
  useFrame(() => {
    const m = ref.current
    if (m) m.scale.setScalar(MathUtils.lerp(m.scale.x, 1 + level() * 0.8, 0.15))
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.32, 32, 32]} />
      <meshBasicMaterial color="#b9a8ff" transparent opacity={0.9} blending={AdditiveBlending} />
    </mesh>
  )
}

function Galaxy({
  selected,
  onSelect,
  labels,
}: {
  selected?: string | undefined
  onSelect?: ((s: Star) => void) | undefined
  labels: 'all' | 'some'
}) {
  const group = useRef<Group>(null)
  const all = useMemo(() => stars(), [])
  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    g.rotation.y += dt * (0.04 + level() * 0.12)
    // The pointer tilts the disc a little.
    g.rotation.x = MathUtils.lerp(g.rotation.x, state.pointer.y * 0.12, 0.05)
    g.rotation.z = MathUtils.lerp(g.rotation.z, -state.pointer.x * 0.08, 0.05)
  })
  return (
    <group ref={group}>
      <Dust />
      <Core />
      {all.map((s) => (
        <GenreStar
          key={s.id}
          star={s}
          active={s.id === selected}
          label={labels === 'all' || s.step % 3 === 1 || s.id === selected}
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}

/** The 3D genre galaxy. Decorative on the landing page; clickable in /app/galaxy (which also has a list). */
export default function GalaxyScene({
  selected,
  onSelect,
  labels = 'some',
}: {
  selected?: string | undefined
  onSelect?: ((s: Star) => void) | undefined
  labels?: 'all' | 'some'
}) {
  return (
    <Canvas
      camera={{ position: [0, 5.2, 6.4], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <Galaxy selected={selected} onSelect={onSelect} labels={labels} />
    </Canvas>
  )
}
