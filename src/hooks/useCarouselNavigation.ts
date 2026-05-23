import {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {mod} from "../utils"

const BUFFER = 1

export type Direction = 'left' | 'right'

export type Slot = {
	/** Position relative to the active slide. 0 is active, -1 is one step left, etc. */
	position: number
	/** Index into the underlying slide array (always in `[0, slideCount)`). */
	slideIndex: number
}

/**
 * Encapsulates the carousel's navigation state machine: bounded `offset`,
 * in-flight animation step, lazy left-buffer expansion, and snap-back.
 *
 * Returns the inputs needed to render the track and react to its
 * `transitionend` event, plus a `navigate(direction)` action.
 */
export function useCarouselNavigation(slideCount: number, visibleSlides: number) {
	const N = slideCount

	// `offset` is the active slide's index, bounded in [0, N) via mod.
	const [offset, setOffset] = useState(0)
	// `pendingMove` is the in-flight navigation step: -1, 0, or +1. The track
	// animates by `-pendingMove * stride`; on transitionend we snap the offset
	// by `pendingMove` and reset to 0 (no animation).
	const [pendingMove, setPendingMove] = useState(0)
	const [animate, setAnimate] = useState(true)
	// Lazy left buffer: until the user makes any navigation, slot -1 isn't
	// rendered (so nothing sits left of the active slide on first paint).
	const [hasNavigated, setHasNavigated] = useState(false)
	const isAnimatingRef = useRef(false)

	const navigate = useCallback((direction: Direction) => {
		if (isAnimatingRef.current) return
		isAnimatingRef.current = true
		// Left click needs the left buffer expanded *before* the animation so
		// slot -1 exists to slide into the active position. Right click defers
		// expansion to onTransitionEnd to avoid the new left-side slot popping
		// in to the left of the container during the animation.
		if (direction === 'left' && !hasNavigated) setHasNavigated(true)
		setAnimate(true)
		setPendingMove(direction === 'right' ? 1 : -1)
	}, [hasNavigated])

	const onTransitionEnd = useCallback(() => {
		if (pendingMove === 0) return
		// Snap the track back to translateX(0) without animation. Each slot's
		// content shifts by one slide, but at the moment of snap every slide is
		// at the same viewport position it occupied a frame ago — no visible jump.
		setAnimate(false)
		setOffset((prev) => mod(prev + pendingMove, N))
		setPendingMove(0)
		// Right-click's deferred buffer expansion. The new left slot lands at
		// position -stride (off-screen of the active spot), so it appears here
		// without being visible mid-animation.
		if (!hasNavigated) setHasNavigated(true)
		isAnimatingRef.current = false
	}, [pendingMove, N, hasNavigated])

	// Re-enable animate the frame after a silent snap so the next click animates.
	useEffect(() => {
		if (animate) return
		const id = requestAnimationFrame(() => setAnimate(true))
		return () => cancelAnimationFrame(id)
	}, [animate])

	const slots = useMemo<Slot[]>(() => {
		const leftBuffer = hasNavigated ? BUFFER : 0
		const out: Slot[] = []
		for (let i = -leftBuffer; i <= visibleSlides + BUFFER; i++) {
			out.push({position: i, slideIndex: mod(offset + i, N)})
		}
		return out
	}, [hasNavigated, visibleSlides, offset, N])

	return {pendingMove, animate, slots, navigate, onTransitionEnd}
}