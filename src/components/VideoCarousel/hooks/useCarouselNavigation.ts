import {useCallback, useEffect, useMemo, useRef, useState} from "react"
import {mod} from "src/utils.ts"

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
 * in-flight animation step, lazy left-buffer expansion, snap-back, and the
 * fade state for the left-buffer slot.
 *
 * Left navigation: slot -1 picks up a `fade-in` class so it pops in at
 * opacity 0 and fades to 1 over 0.02s as the track slides into position.
 * Right navigation: slot -1 picks up a `fade-out` class so it fades from 1
 * to 0 over 0.02s as it slides off-screen left.
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
	// Once the user makes any navigation, slot -1 is rendered at rest. Until
	// then, the first paint has nothing left of slide 0.
	const [hasNavigated, setHasNavigated] = useState(false)
	// 'in'  — slot -1 fades in (opacity 0 → 1) as it slides into active on a left click.
	// 'out' — slot 0  fades out (opacity 1 → 0) as it slides off-screen on a right click.
	const [fade, setFade] = useState<'in' | 'out' | null>(null)
	const isAnimatingRef = useRef(false)

	const navigate = useCallback((direction: Direction) => {
		if (isAnimatingRef.current) return
		isAnimatingRef.current = true

		if (direction === 'left') {
			setHasNavigated(true)
			setFade('in')
			setAnimate(true)
			setPendingMove(-1)
			return
		}

		setFade('out')
		setAnimate(true)
		setPendingMove(1)
	}, [])

	const onTransitionEnd = useCallback(() => {
		if (pendingMove === 0) return
		setAnimate(false)
		setOffset((prev) => mod(prev + pendingMove, N))
		setPendingMove(0)
		setFade(null)
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

	return {pendingMove, animate, fade, slots, navigate, onTransitionEnd}
}