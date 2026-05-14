import { BoundingBox, VelocitySample } from '../types/StateMachine'

export class RobotSimulator {
  private posX = 280
  private posY = 160
  private vx = 1.2
  private vy = 0.8

  nextPosition() {
    this.posX += this.vx + (Math.random() - 0.5) * 2
    this.posY += this.vy + (Math.random() - 0.5) * 2
    if (this.posX < 80 || this.posX > 560) this.vx *= -1
    if (this.posY < 60 || this.posY > 280) this.vy *= -1
    return { x: this.posX, y: this.posY }
  }

  getBoundingBox(): BoundingBox {
    const pos = this.nextPosition()
    return { x: pos.x - 30, y: pos.y - 25, width: 60, height: 50 }
  }

  getVelocitySample(): VelocitySample {
    return { vx: this.vx, vy: this.vy, timestamp: Date.now() }
  }

  getRobotMapPosition() {
    return {
      x: 0.3 + Math.sin(Date.now() / 3000) * 0.15,
      y: 0.5 + Math.cos(Date.now() / 4000) * 0.1,
    }
  }
}
