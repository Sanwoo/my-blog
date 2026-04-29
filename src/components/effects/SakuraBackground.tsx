'use client'

import { type ComponentProps, useSyncExternalStore } from 'react'
import Particles from '@tsparticles/react'
import { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { loadRollUpdater } from '@tsparticles/updater-roll'
import { loadTiltUpdater } from '@tsparticles/updater-tilt'
import { useThemeSnapshot } from '@/components/theme/useThemeSnapshot'
import type { ThemeMode } from '@/lib/theme'

export type SakuraProfileKey = 'home' | 'quiet'

type SakuraProfile = {
  count: number
  speed: [number, number]
  drift: [number, number]
  rotation: [number, number]
  scale: [number, number]
  opacity: [number, number]
  wobble: [number, number]
}

type SakuraParticlesOptions = NonNullable<ComponentProps<typeof Particles>['options']>
type SakuraEngineLike = {
  addShape: (
    drawer: {
      afterDraw?: (data: { context: CanvasRenderingContext2D; opacity: number; pixelRatio: number; radius: number }) => void
      draw: (data: { context: CanvasRenderingContext2D; opacity: number; pixelRatio: number; radius: number }) => void
      validTypes: readonly string[]
    },
    refresh?: boolean,
  ) => Promise<void>
}
type SakuraShapeDrawData = {
  context: CanvasRenderingContext2D
  opacity: number
  pixelRatio: number
  radius: number
}
type SakuraShapeDrawer = {
  afterDraw?: (data: SakuraShapeDrawData) => void
  draw: (data: SakuraShapeDrawData) => void
  validTypes: readonly string[]
}
type SakuraResolvedProfile = (typeof sakuraConfig.profiles)[keyof typeof sakuraConfig.profiles]

type SakuraVisuals = {
  fillColor: string
  strokeColor: string
  strokeOpacity: number
  theme: ThemeMode
}

const PETAL_RADIUS = 6.2
const PETAL_PROJECTION_SCALE = 1.5
const MOTION_REDUCE_FACTOR = 6
const SPEED_FACTOR = 0.045
const DRIFT_FACTOR = 0.08
const ROTATION_FACTOR = 22
const TILT_FACTOR = 16
const WOBBLE_MOVE_FACTOR = 0.28
const SAKURA_SHAPE_TYPE = 'sakura'

const sakuraConfig = {
  darkSpeedMultiplier: 0.92,
  profiles: {
    home: {
      count: 24,
      speed: [9, 12],
      drift: [0, 0],
      rotation: [-0.35, 0.35],
      scale: [0.68, 1.02],
      opacity: [0.34, 0.58],
      wobble: [8, 22],
    },
    quiet: {
      count: 11,
      speed: [7, 9],
      drift: [0, 0],
      rotation: [-0.18, 0.18],
      scale: [0.58, 0.88],
      opacity: [0.22, 0.4],
      wobble: [6, 14],
    },
  } satisfies Record<SakuraProfileKey, SakuraProfile>,
} as const

const sakuraEngineListeners = new Set<() => void>()

let particlesEngineReady = false
let particlesEnginePromise: Promise<void> | null = null

class SakuraDrawer implements SakuraShapeDrawer {
  readonly validTypes = [SAKURA_SHAPE_TYPE] as const

  draw({ context, radius }: SakuraShapeDrawData) {
    const topY = -radius * 1.18
    const bottomY = radius * 1.02
    const outerX = radius * 0.94
    const innerX = radius * 1.08

    context.moveTo(0, topY)
    context.bezierCurveTo(outerX, -radius * 0.98, innerX, radius * 0.02, 0, bottomY)
    context.bezierCurveTo(-innerX, radius * 0.02, -outerX, -radius * 0.98, 0, topY)
  }

  afterDraw({ context, opacity, radius, pixelRatio }: SakuraShapeDrawData) {
    const veinWidth = Math.max(0.9, radius * 0.16) / Math.max(pixelRatio, 1)

    context.save()
    context.globalAlpha = Math.min(1, opacity * 0.72)
    context.lineCap = 'round'
    context.lineWidth = veinWidth
    context.beginPath()
    context.moveTo(0, -radius * 0.68)
    context.quadraticCurveTo(radius * 0.12, 0, 0, radius * 0.72)
    context.stroke()
    context.restore()
  }
}

async function loadSakuraShape(engine: SakuraEngineLike, refresh = true) {
  await engine.addShape(new SakuraDrawer(), refresh)
}

function emitEngineReady() {
  sakuraEngineListeners.forEach((listener) => listener())
}

function ensureSakuraEngineReady() {
  if (particlesEnginePromise || typeof window === 'undefined') {
    return
  }

  particlesEnginePromise = initParticlesEngine(async (engine) => {
    await loadSlim(engine)
    await loadRollUpdater(engine, false)
    await loadTiltUpdater(engine, false)
    await loadSakuraShape(engine, false)
  }).then(() => {
    particlesEngineReady = true
    emitEngineReady()
  })
}

function subscribeSakuraEngine(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined
  }

  ensureSakuraEngineReady()
  sakuraEngineListeners.add(listener)

  return () => {
    sakuraEngineListeners.delete(listener)
  }
}

function useSakuraEngineReady() {
  return useSyncExternalStore(
    subscribeSakuraEngine,
    () => particlesEngineReady,
    () => false,
  )
}

const sakuraThemeTokens: Record<ThemeMode, Omit<SakuraVisuals, 'theme'>> = {
  light: {
    fillColor: 'rgb(247, 200, 222)',
    strokeColor: 'rgb(208, 115, 151)',
    strokeOpacity: 0.28,
  },
  dark: {
    fillColor: 'rgba(214, 141, 171, 0.8)',
    strokeColor: 'rgba(244, 182, 210, 0.66)',
    strokeOpacity: 0.42,
  },
}

function toRange([min, max]: readonly [number, number], factor = 1) {
  return {
    min: Number((min * factor).toFixed(3)),
    max: Number((max * factor).toFixed(3)),
  }
}

function toPositiveRange([min, max]: readonly [number, number], factor = 1) {
  const values = [Math.abs(min), Math.abs(max)].sort((left, right) => left - right)
  return {
    min: Number((values[0] * factor).toFixed(3)),
    max: Number((values[1] * factor).toFixed(3)),
  }
}

function getSakuraVisuals(theme: ThemeMode): SakuraVisuals {
  return {
    theme,
    ...sakuraThemeTokens[theme],
  }
}

function buildSakuraOptions(profile: SakuraResolvedProfile, visuals: SakuraVisuals): SakuraParticlesOptions {
  const speedMultiplier = visuals.theme === 'dark' ? sakuraConfig.darkSpeedMultiplier : 1
  const rotationSpeed = toPositiveRange(profile.rotation, ROTATION_FACTOR)
  const tiltSpeed = toPositiveRange(profile.rotation, TILT_FACTOR)

  return {
    detectRetina: true,
    fpsLimit: 60,
    fullScreen: {
      enable: false,
    },
    motion: {
      disable: false,
      reduce: {
        factor: MOTION_REDUCE_FACTOR,
        value: true,
      },
    },
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    smooth: true,
    particles: {
      color: {
        value: visuals.fillColor,
      },
      move: {
        direction: 'bottom',
        drift: toRange(profile.drift, DRIFT_FACTOR),
        enable: true,
        outModes: {
          default: 'out',
        },
        random: false,
        speed: toRange(profile.speed, SPEED_FACTOR * speedMultiplier),
        straight: true,
      },
      number: {
        density: {
          enable: false,
        },
        value: profile.count,
      },
      opacity: {
        animation: {
          enable: false,
        },
        value: toRange(profile.opacity),
      },
      rotate: {
        animation: {
          decay: 0,
          enable: true,
          speed: rotationSpeed,
          sync: false,
        },
        direction: 'random',
        path: false,
        value: {
          min: 0,
          max: 360,
        },
      },
      roll: {
        darken: {
          enable: false,
          value: 0,
        },
        enable: true,
        enlighten: {
          enable: false,
          value: 0,
        },
        mode: 'both',
        speed: rotationSpeed,
      },
      shape: {
        type: SAKURA_SHAPE_TYPE,
      },
      size: {
        animation: {
          enable: false,
        },
        value: toRange(profile.scale, PETAL_RADIUS * PETAL_PROJECTION_SCALE),
      },
      tilt: {
        animation: {
          decay: 0,
          enable: true,
          speed: tiltSpeed,
          sync: false,
        },
        direction: 'random',
        enable: true,
        value: {
          max: 360,
          min: 0,
        },
      },
      wobble: {
        distance: toRange(profile.wobble),
        enable: false,
        speed: {
          angle: rotationSpeed,
          move: toRange(profile.speed, WOBBLE_MOVE_FACTOR),
        },
      },
      stroke: {
        color: {
          value: visuals.strokeColor,
        },
        opacity: visuals.strokeOpacity,
        width: 0.9,
      },
    },
  }
}

export function SakuraBackground({ profile = 'home' }: { profile?: SakuraProfileKey }) {
  const engineReady = useSakuraEngineReady()
  const theme = useThemeSnapshot().resolved

  const visuals = getSakuraVisuals(theme)
  const options = buildSakuraOptions(sakuraConfig.profiles[profile], visuals)

  return engineReady ? <Particles key={`${profile}-${theme}`} id="sakura-particles" className="sakura-particles" options={options} /> : <div className="sakura-particles" />
}
