"use client"

import { useEffect, useRef } from "react"

interface PredictionGaugeProps {
  value: number // 0 to 1
}

export function PredictionGauge({ value }: PredictionGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const size = 180
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw background arc
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.4
    const startAngle = Math.PI * 0.8
    const endAngle = Math.PI * 2.2

    // Background track
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, endAngle)
    ctx.lineWidth = 12
    ctx.strokeStyle = "hsl(var(--muted) / 0.6)"
    ctx.stroke()

    // Calculate color based on value
    let color
    if (value < 0.3) {
      color = "hsl(var(--success))"
    } else if (value < 0.7) {
      color = "hsl(var(--warning))"
    } else {
      color = "hsl(var(--destructive))"
    }

    // Value arc
    const valueAngle = startAngle + (endAngle - startAngle) * value
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, startAngle, valueAngle)
    ctx.lineWidth = 12
    ctx.lineCap = "round"
    ctx.strokeStyle = color
    ctx.stroke()

    // Draw center text
    ctx.fillStyle = "hsl(var(--foreground))"
    ctx.font = "bold 32px sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${Math.round(value * 100)}%`, centerX, centerY)

    // Draw label
    ctx.fillStyle = "hsl(var(--muted-foreground))"
    ctx.font = "14px sans-serif"
    ctx.fillText("Probability", centerX, centerY + 25)
  }, [value])

  return (
    <div className="relative">
      <canvas ref={canvasRef} width="180" height="180" />
    </div>
  )
}
