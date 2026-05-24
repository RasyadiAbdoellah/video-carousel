import {describe, it, expect} from "vitest"
import {createVelocityTracker} from "./velocityTracker"

describe("velocityTracker", () => {
	it("returns 0 when there are no samples", () => {
		const v = createVelocityTracker()
		expect(v.velocity()).toBe(0)
	})

	it("returns 0 when there is only one sample", () => {
		const v = createVelocityTracker()
		v.push(0, 100)
		expect(v.velocity()).toBe(0)
	})

	it("computes px/ms over a multi-sample window", () => {
		const v = createVelocityTracker()
		v.push(0, 0)
		v.push(100, 50)
		// 50 px in 100 ms = 0.5 px/ms
		expect(v.velocity()).toBeCloseTo(0.5, 5)
	})

	it("returns a negative velocity for leftward motion", () => {
		const v = createVelocityTracker()
		v.push(0, 200)
		v.push(100, 100)
		expect(v.velocity()).toBeCloseTo(-1, 5)
	})

	it("ignores samples older than the 100ms window", () => {
		const v = createVelocityTracker(100)
		v.push(0, 0)        // outside window
		v.push(50, 0)       // outside window (older than newest - 100ms is fine; we keep newest - windowMs)
		v.push(200, 100)    // newest
		v.push(250, 150)    // 50 px over 50 ms = 1 px/ms
		expect(v.velocity()).toBeCloseTo(1, 5)
	})

	it("clears samples on reset()", () => {
		const v = createVelocityTracker()
		v.push(0, 0)
		v.push(100, 50)
		v.reset()
		expect(v.velocity()).toBe(0)
	})
})
