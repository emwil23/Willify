import { Doors } from '@/landing/Doors'
import { Finale } from '@/landing/Finale'
import { Hero } from '@/landing/Hero'
import { RealOnly } from '@/landing/RealOnly'
import { RecordSpin } from '@/landing/RecordSpin'
import { SideA } from '@/landing/SideA'
import { useSmoothScroll } from '@/landing/useSmoothScroll'
import { useReducedMotionSafe } from '@/lib/boot'

/**
 * "Drop the needle": the landing page as a record you play by scrolling (docs/landing-redesign.md).
 * Hero groove field and sentence, side A (how it works), real songs only, the genre record, four doors,
 * and a closing sentence. With reduced motion every section is static and fully visible.
 */
export function Landing() {
  const reduce = useReducedMotionSafe()
  useSmoothScroll(!reduce)
  return (
    <>
      <Hero reduce={reduce} />
      <SideA animate={!reduce} />
      <RealOnly animate={!reduce} />
      <RecordSpin animate={!reduce} />
      <Doors animate={!reduce} />
      <Finale reduce={reduce} />
    </>
  )
}
