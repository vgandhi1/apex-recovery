export class ConfidenceModel {
  private value = 0.82
  private failing = false

  startFailure() {
    this.failing = true
  }

  reset() {
    this.failing = false
    this.value = 0.82
  }

  next(): number {
    if (this.failing) {
      const drop = 0.015 + Math.random() * 0.02
      this.value = Math.max(0.2, this.value - drop)
    } else {
      const drift = (Math.random() - 0.5) * 0.04
      this.value = Math.min(0.98, Math.max(0.70, this.value + drift))
    }
    return this.value
  }

  getValue(): number {
    return this.value
  }
}
