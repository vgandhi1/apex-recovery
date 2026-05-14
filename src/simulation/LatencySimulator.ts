export class LatencySimulator {
  private base = 82
  private simulating = false

  simulateHighLatency() {
    this.simulating = true
    setTimeout(() => {
      this.simulating = false
    }, 10000)
  }

  next(): number {
    if (this.simulating) {
      return 180 + Math.round(Math.random() * 40)
    }
    return this.base + Math.round((Math.random() - 0.5) * 20)
  }
}
