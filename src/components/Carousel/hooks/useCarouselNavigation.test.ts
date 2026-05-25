import {describe, it, expect, vi} from "vitest"
import {act, renderHook} from "@testing-library/react"
import {useCarouselNavigation} from "./useCarouselNavigation"

const STRIDE = 320

describe("useCarouselNavigation drag actions", () => {
	it("starts in 'idle' and exposes dragDelta=0", () => {
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		expect(result.current.dragDelta).toBe(0)
		expect(result.current.animate).toBe(true)
	})

	it("startDrag enters 'dragging' (animate off)", () => {
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		act(() => {
			const ok = result.current.startDrag()
			expect(ok).toBe(true)
		})
		expect(result.current.animate).toBe(false)
	})

	it("updateDrag mirrors finger displacement", () => {
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		act(() => { result.current.startDrag() })
		act(() => { result.current.updateDrag(-120) })
		expect(result.current.dragDelta).toBe(-120)
	})

	it("endDrag below threshold (no flick) enters 'returning' and resets dragDelta", () => {
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		act(() => { result.current.startDrag() })
		act(() => { result.current.updateDrag(-30) }) // < 25% of stride and no velocity
		act(() => { result.current.endDrag(0) })
		expect(result.current.dragDelta).toBe(0)
		// 'returning' has animate=true (transition runs back to centre)
		expect(result.current.animate).toBe(true)
		// pendingMove unchanged
		expect(result.current.pendingMove).toBe(0)
	})

	it("endDrag past threshold commits to 'sliding' with pendingMove=1", () => {
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		act(() => { result.current.startDrag() })
		act(() => { result.current.updateDrag(-100) }) // > 25% of 320
		act(() => { result.current.endDrag(0) })
		expect(result.current.pendingMove).toBe(1)
		expect(result.current.dragDelta).toBe(0)
		expect(result.current.animate).toBe(true)
	})

	it("endDrag with flick velocity commits even with small distance", () => {
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		act(() => { result.current.startDrag() })
		act(() => { result.current.updateDrag(-10) }) // small distance
		act(() => { result.current.endDrag(-1.5) }) // strong leftward flick
		expect(result.current.pendingMove).toBe(1)
	})

	it("endDrag with dragDelta=0 goes straight to idle (no 'returning' lock)", () => {
		// Repro for the bug where a tap-without-drag, or a direction-lock
		// surrender that fires before any horizontal motion, parks the phase
		// machine in 'returning' forever because the track transform never
		// changes and onTransitionEnd never fires.
		const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
		act(() => { result.current.startDrag() })
		expect(result.current.animate).toBe(false) // 'dragging'
		act(() => { result.current.endDrag(0) }) // no updateDrag in between
		// We should be back in 'idle' (animate=true, no pendingMove, no dragDelta).
		expect(result.current.animate).toBe(true)
		expect(result.current.pendingMove).toBe(0)
		expect(result.current.dragDelta).toBe(0)
		// A second startDrag should succeed (proving phase === 'idle').
		let ok: boolean | undefined
		act(() => { ok = result.current.startDrag() })
		expect(ok).toBe(true)
	})

	it("startDrag mid-'sliding' folds animated progress into dragDelta", () => {
		let now = 1000
		const spy = vi.spyOn(performance, 'now').mockImplementation(() => now)
		try {
			const {result} = renderHook(() => useCarouselNavigation(5, 3, STRIDE))
			act(() => { result.current.navigate('right') })
			expect(result.current.pendingMove).toBe(1)
			// Advance the clock 250 ms — halfway through the 500 ms slide.
			now = 1250
			let ok: boolean | undefined
			act(() => { ok = result.current.startDrag() })
			expect(ok).toBe(true)
			expect(result.current.pendingMove).toBe(0)
			// Linear-approx interrupt at 50% progress: dragDelta ≈ -STRIDE/2.
			const expected = -STRIDE / 2
			expect(result.current.dragDelta).toBeGreaterThan(expected - 10)
			expect(result.current.dragDelta).toBeLessThan(expected + 10)
		} finally {
			spy.mockRestore()
		}
	})
})
