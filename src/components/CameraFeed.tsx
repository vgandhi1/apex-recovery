import React, { useRef, useEffect } from 'react'
import { useCockpitStore } from '../store/cockpitStore'

export const CameraFeed: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentBox, velocityHistory, latencyMs, cameraMode, setCameraMode } = useCockpitStore()

  const predictPosition = () => {
    if (velocityHistory.length < 3) return currentBox
    const recent = velocityHistory.slice(-10)
    const avgVx = recent.reduce((s, v) => s + v.vx, 0) / recent.length
    const avgVy = recent.reduce((s, v) => s + v.vy, 0) / recent.length
    const delaySeconds = latencyMs / 1000
    return {
      x: currentBox.x + avgVx * delaySeconds * 12,
      y: currentBox.y + avgVy * delaySeconds * 12,
      width: currentBox.width,
      height: currentBox.height,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(1, '#1e293b')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid lines for depth
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.8)'
    ctx.lineWidth = 1
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke()
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke()
    }

    // Camera mode label
    ctx.fillStyle = 'rgba(156, 163, 175, 0.6)'
    ctx.font = '11px monospace'
    ctx.fillText(`[${cameraMode.toUpperCase()} CAM]`, 10, 18)

    // Current box
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.strokeRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.fillRect(currentBox.x, currentBox.y, currentBox.width, currentBox.height)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '9px monospace'
    ctx.fillText('OBJECT', currentBox.x + 4, currentBox.y + 12)

    // Predicted box
    const predicted = predictPosition()
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(predicted.x, predicted.y, predicted.width, predicted.height)

    ctx.fillStyle = 'rgba(251, 191, 36, 0.9)'
    ctx.font = '10px monospace'
    ctx.setLineDash([])
    ctx.fillText(`Predicted +${latencyMs}ms`, predicted.x + 4, predicted.y - 6)

    // Arrow
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(currentBox.x + currentBox.width / 2, currentBox.y + currentBox.height / 2)
    ctx.lineTo(predicted.x + predicted.width / 2, predicted.y + predicted.height / 2)
    ctx.stroke()

    // Watermark
    ctx.fillStyle = 'rgba(156, 163, 175, 0.4)'
    ctx.font = '10px monospace'
    ctx.setLineDash([])
    ctx.fillText(`stream delay: ${latencyMs}ms`, canvas.width - 140, canvas.height - 10)
  }, [currentBox, velocityHistory, latencyMs, cameraMode])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-gray-400 font-mono">PRIMARY CAMERA FEED</span>
        <div className="flex gap-1">
          {(['wrist', 'external'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              className={`px-2 py-0.5 text-xs font-mono rounded border ${
                cameraMode === mode
                  ? 'bg-blue-800 border-blue-600 text-blue-200'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <canvas ref={canvasRef} width={640} height={360} className="w-full rounded-lg bg-gray-900 border border-gray-800" />
    </div>
  )
}
