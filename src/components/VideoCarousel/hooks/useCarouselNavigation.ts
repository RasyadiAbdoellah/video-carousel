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
 * Navigation lifecycle:
 *   'idle'     — at rest, ready for the next click.
 *   'sliding'  — the track is mid-transition after a click.
 *   'snapping' — between transitionend and the rAF re-enable; CSS transition
 *                is suppressed so the track can jump to translateX(0).
 */
type Phase = 'idle' | 'sliding' | 'snapping'

/**
 * Encapsulates the carousel's navigation state machine: bounded `offset`,
 * in-flight animation step, lazy left-buffer expansion, snap-back, and the
 * fade state for the active / left-buffer slots.
 *
 * Left navigation: slot -1 picks up a `fade-in` class so it pops in at
 * opacity 0 and fades to 1 as the track slides into position.
 * Right navigation: slot 0 picks up a `fade-out` class so it fades from 1
 * to 0 as it slides off-screen left.
 */
export function useCarouselNavigation(slideCount: number, visibleSlides: number) {
	const N = slideCount

	// `offset` is the active slide's index, bounded in [0, N) via mod.
	const [offset, setOffset] = useState(0)
	// `pendingMove` is the in-flight navigation step: -1, 0, or +1. The track
	// animates by `-pendingMove * stride`; on transitionend we snap the offset
	// by `pendingMove` and reset to 0 (no animation).
	const [pendingMove, setPendingMove] = useState(0)
	// Once the user makes any navigation, slot -1 is rendered at rest. Until
	// then, the first paint has nothing left of slide 0.
	const [hasNavigated, setHasNavigated] = useState(false)
	// 'in'  — slot -1 fades in (opacity 0 → 1) as it slides into active on a left click.
	// 'out' — slot 0  fades out (opacity 1 → 0) as it slides off-screen on a right click.
	const [fade, setFade] = useState<'in' | 'out' | null>(null)

	const [phase, setPhase] = useState<Phase>('idle')
	const phaseRef = useRef<Phase>('idle')

	// Keep ref and state in lockstep. The ref is what `navigate` and
	// `onTransitionEnd` read so they can gate synchronously, without waiting
	// for React's next commit.
	const setPhaseSync = useCallback((next: Phase) => {
		phaseRef.current = next
		setPhase(next)
	}, [])

	const navigate = useCallback((direction: Direction) => {
		if (phaseRef.current !== 'idle') return
		setPhaseSync('sliding')

		if (direction === 'left') {
			setHasNavigated(true)
			setFade('in')
			setPendingMove(-1)
			return
		}

		setFade('out')
		setPendingMove(1)
	}, [setPhaseSync])

	const onTransitionEnd = useCallback(() => {
		if (phaseRef.current !== 'sliding') return
		setPhaseSync('snapping')
		setOffset((prev) => mod(prev + pendingMove, N))
		setPendingMove(0)
		setFade(null)
		if (!hasNavigated) setHasNavigated(true)
	}, [pendingMove, N, hasNavigated, setPhaseSync])

	// Hold 'snapping' for one frame so the no-animation jump commits, then
	// return to 'idle' for the next click.
	useEffect(() => {
		if (phase !== 'snapping') return
		const id = requestAnimationFrame(() => setPhaseSync('idle'))
		return () => cancelAnimationFrame(id)
	}, [phase, setPhaseSync])

	const slots = useMemo<Slot[]>(() => {
		const leftBuffer = hasNavigated ? BUFFER : 0
		const out: Slot[] = []
		for (let i = -leftBuffer; i <= visibleSlides + BUFFER; i++) {
			out.push({position: i, slideIndex: mod(offset + i, N)})
		}
		return out
	}, [hasNavigated, visibleSlides, offset, N])

	const animate = phase !== 'snapping'

	return {pendingMove, animate, fade, slots, navigate, onTransitionEnd}
}