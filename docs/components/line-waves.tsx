"use client"

import { Mesh, Program, Renderer, Triangle } from "ogl"
import { useEffect, useRef, useState } from "react"

interface LineWavesProps {
  speed?: number
  innerLineCount?: number
  outerLineCount?: number
  warpIntensity?: number
  rotation?: number
  edgeFadeWidth?: number
  colorCycleSpeed?: number
  brightness?: number
  color1?: string
  color2?: string
  color3?: string
  enableMouseInteraction?: boolean
  mouseInfluence?: number
}

function hexToVec3(hex: string): [number, number, number] {
  const h = hex.replace("#", "")
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ]
}

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uInnerLines;
uniform float uOuterLines;
uniform float uWarpIntensity;
uniform float uRotation;
uniform float uEdgeFadeWidth;
uniform float uColorCycleSpeed;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define HALF_PI 1.5707963

float hashF(float n) {
  return fract(sin(n * 127.1) * 43758.5453123);
}

float smoothNoise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hashF(i), hashF(i + 1.0), u);
}

float displaceA(float coord, float t) {
  float result = sin(coord * 2.123) * 0.2;
  result += sin(coord * 3.234 + t * 4.345) * 0.1;
  result += sin(coord * 0.589 + t * 0.934) * 0.5;
  return result;
}

float displaceB(float coord, float t) {
  float result = sin(coord * 1.345) * 0.3;
  result += sin(coord * 2.734 + t * 3.345) * 0.2;
  result += sin(coord * 0.189 + t * 0.934) * 0.3;
  return result;
}

vec2 rotate2D(vec2 p, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(p.x * c - p.y * s, p.x * s + p.y * c);
}

void main() {
  vec2 coords = gl_FragCoord.xy / uResolution.xy;
  coords = coords * 2.0 - 1.0;
  coords = rotate2D(coords, uRotation);

  float halfT = uTime * uSpeed * 0.5;
  float fullT = uTime * uSpeed;

  float mouseWarp = 0.0;
  if (uEnableMouse) {
    vec2 mPos = rotate2D(uMouse * 2.0 - 1.0, uRotation);
    float mDist = length(coords - mPos);
    mouseWarp = uMouseInfluence * exp(-mDist * mDist * 4.0);
  }

  float warpAx = coords.x + displaceA(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpAy = coords.y - displaceA(coords.x * cos(fullT) * 1.235, halfT) * uWarpIntensity;
  float warpBx = coords.x + displaceB(coords.y, halfT) * uWarpIntensity + mouseWarp;
  float warpBy = coords.y - displaceB(coords.x * sin(fullT) * 1.235, halfT) * uWarpIntensity;

  vec2 fieldA = vec2(warpAx, warpAy);
  vec2 fieldB = vec2(warpBx, warpBy);
  vec2 blended = mix(fieldA, fieldB, mix(fieldA, fieldB, 0.5));

  float fadeTop = smoothstep(uEdgeFadeWidth, uEdgeFadeWidth + 0.4, blended.y);
  float fadeBottom = smoothstep(-uEdgeFadeWidth, -(uEdgeFadeWidth + 0.4), blended.y);
  float vMask = 1.0 - max(fadeTop, fadeBottom);

  float tileCount = mix(uOuterLines, uInnerLines, vMask);
  float scaledY = blended.y * tileCount;
  float nY = smoothNoise(abs(scaledY));

  float ridge = pow(
    step(abs(nY - blended.x) * 2.0, HALF_PI) * cos(2.0 * (nY - blended.x)),
    5.0
  );

  float lines = 0.0;
  for (float i = 1.0; i < 3.0; i += 1.0) {
    lines += pow(max(fract(scaledY), fract(-scaledY)), i * 2.0);
  }

  float pattern = vMask * lines;

  float cycleT = fullT * uColorCycleSpeed;
  float lum = (pattern + lines * ridge) * (cos(blended.y + cycleT * 0.5) * 0.5 + 1.0);

  vec3 baseColor = (uColor1 + uColor2 + uColor3) / 3.0;
  vec3 col = lum * baseColor * uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
`

export default function LineWaves({
  speed = 0.3,
  innerLineCount = 32.0,
  outerLineCount = 36.0,
  warpIntensity = 1.0,
  rotation = -45,
  edgeFadeWidth = 0.0,
  colorCycleSpeed = 1.0,
  brightness = 0.2,
  color1 = "#ffffff",
  color2 = "#ffffff",
  color3 = "#ffffff",
  enableMouseInteraction = true,
  mouseInfluence = 2.0,
}: LineWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    if (reduceMotion) return
    const container = containerRef.current
    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false })
    const gl = renderer.gl
    gl.clearColor(0, 0, 0, 0)

    const currentMouse = [0.5, 0.5]
    let targetMouse = [0.5, 0.5]

    function handleMouseMove(e: MouseEvent) {
      const rect = gl.canvas.getBoundingClientRect()
      targetMouse = [
        (e.clientX - rect.left) / rect.width,
        1.0 - (e.clientY - rect.top) / rect.height,
      ]
    }

    function handleMouseLeave() {
      targetMouse = [0.5, 0.5]
    }

    const geometry = new Triangle(gl)
    const rotationRad = (rotation * Math.PI) / 180
    const program: Program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: {
          value: [
            gl.canvas.width,
            gl.canvas.height,
            gl.canvas.width / gl.canvas.height,
          ],
        },
        uSpeed: { value: speed },
        uInnerLines: { value: innerLineCount },
        uOuterLines: { value: outerLineCount },
        uWarpIntensity: { value: warpIntensity },
        uRotation: { value: rotationRad },
        uEdgeFadeWidth: { value: edgeFadeWidth },
        uColorCycleSpeed: { value: colorCycleSpeed },
        uBrightness: { value: brightness },
        uColor1: { value: hexToVec3(color1) },
        uColor2: { value: hexToVec3(color2) },
        uColor3: { value: hexToVec3(color3) },
        uMouse: { value: new Float32Array([0.5, 0.5]) },
        uMouseInfluence: { value: mouseInfluence },
        uEnableMouse: { value: enableMouseInteraction },
      },
    })

    function resize() {
      renderer.setSize(container.offsetWidth, container.offsetHeight)
      program.uniforms.uResolution.value = [
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      ]
    }
    window.addEventListener("resize", resize)
    resize()

    const mesh = new Mesh(gl, { geometry, program })
    container.appendChild(gl.canvas)

    if (enableMouseInteraction) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseleave", handleMouseLeave)
    }

    let animationFrameId: number | null = null
    let visible = true

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting
          if (visible && animationFrameId === null) {
            animationFrameId = requestAnimationFrame(update)
          }
        }
      },
      { threshold: 0 }
    )
    io.observe(container)

    function update(time: number) {
      if (!visible) {
        animationFrameId = null
        return
      }
      animationFrameId = requestAnimationFrame(update)
      program.uniforms.uTime.value = time * 0.001

      if (enableMouseInteraction) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0])
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1])
        program.uniforms.uMouse.value[0] = currentMouse[0]
        program.uniforms.uMouse.value[1] = currentMouse[1]
      } else {
        program.uniforms.uMouse.value[0] = 0.5
        program.uniforms.uMouse.value[1] = 0.5
      }

      renderer.render({ scene: mesh })
    }
    animationFrameId = requestAnimationFrame(update)

    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId)
      io.disconnect()
      window.removeEventListener("resize", resize)
      if (enableMouseInteraction) {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseleave", handleMouseLeave)
      }
      container.removeChild(gl.canvas)
      gl.getExtension("WEBGL_lose_context")?.loseContext()
    }
  }, [
    speed,
    innerLineCount,
    outerLineCount,
    warpIntensity,
    rotation,
    edgeFadeWidth,
    colorCycleSpeed,
    brightness,
    color1,
    color2,
    color3,
    enableMouseInteraction,
    mouseInfluence,
    reduceMotion,
  ])

  if (reduceMotion) {
    return (
      <div
        ref={containerRef}
        className="h-full w-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06),transparent_60%)]"
        aria-hidden
      />
    )
  }

  return <div ref={containerRef} className="h-full w-full" />
}
