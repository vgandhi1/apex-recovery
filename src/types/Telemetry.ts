export interface RobotState {
  position: { x: number; y: number; z: number }
  jointAngles: number[]
  endEffectorForce: number
  confidence: number
  velocityX: number
  velocityY: number
}
