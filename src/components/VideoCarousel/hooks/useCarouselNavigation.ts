import {useCallback, useEffect, useMemo, useRef, useState, type TransitionEvent} from "react"
import {mod} from "src/utils.ts"

const BUFFER = 1
const SLIDE_DURATION_MS = 500 // matches the CSS transition on .carousel-track

export type Direction = 'left' | 'right'

export type Slot = {
	/** Position relative to the active slide. 0 is active, -1 is one step left, etc. */
	position: number
	/** Index into the underlying slide array (always in `[0, slideCount)`). */
	slideIndex: number
}

/**
 * Navigation lifecycle:
 *   'idle'      — at rest, ready for the next click.
 *   'sliding'   — the track is mid-transition after a click.
 *   'snapping'  — between transitionend and the rAF re-enable; CSS transition
 *                 is suppressed so the track can jump to translateX(0).
 *   'dragging'  — a touch/pointer is down and the track follows dragDelta
 *                 live; CSS transition is suppressed.
 *   'returning' — a drag released below the commit threshold; the track
 *                 eases back to translateX(0), then settles to 'idle'.
 */
type Phase = 'idle' | 'sliding' | 'snapping' | 'dragging' | 'returning'

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
export function useCarouselNavigation(
	slideCount: number,
	visibleSlides: number,
	stride: number,
) {
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
	// Live finger displacement during a drag (px). Zero when no drag is in
	// flight. The track's transform is the sum of pendingMove and dragDelta.
	const [dragDelta, setDragDelta] = useState(0)
	const phaseRef = useRef<Phase>('idle')
	const dragDeltaRef = useRef(0)
	const pendingMoveRef = useRef(0)
	// Time (performance.now()) the current 'sliding' animation began. Used to
	// estimate the track's current x-offset if the user interrupts.
	const slideStartRef = useRef<number | null>(null)

	// Keep ref and state in lockstep. The ref is what `navigate` and
	// `onTransitionEnd` read so they can gate synchronously, without waiting
	// for React's next commit.
	const setPhaseSync = useCallback((next: Phase) => {
		phaseRef.current = next
		setPhase(next)
	}, [])
	const setDragDeltaSync = useCallback((next: number) => {
		dragDeltaRef.current = next
		setDragDelta(next)
	}, [])
	const setPendingMoveSync = useCallback((next: number) => {
		pendingMoveRef.current = next
		setPendingMove(next)
	}, [])

	const navigate = useCallback((direction: Direction) => {
		console.log("navigate", direction)
		if (phaseRef.current !== 'idle') return
		slideStartRef.current = performance.now()
		setPhaseSync('sliding')

		if (direction === 'left') {
			setHasNavigated(true)
			setFade('in')
			setPendingMoveSync(-1)
			return
		}

		setFade('out')
		setPendingMoveSync(1)
	}, [setPhaseSync, setPendingMoveSync])

	/** Begin a live drag. Returns false if the carousel is mid-animation. */
	const startDrag = useCallback((): boolean => {
		if (phaseRef.current === 'idle') {
			setPhaseSync('dragging')
			setDragDeltaSync(0)
			return true
		}
		if (phaseRef.current === 'sliding') {
			// Fold the in-flight animation into dragDelta and reset pendingMove,
			// so the user can drag from wherever the track currently is.
			const startedAt = slideStartRef.current
			let here = 0
			if (startedAt !== null) {
				const elapsed = performance.now() - startedAt
				const progress = Math.min(1, elapsed / SLIDE_DURATION_MS)
				// Eased value of ease-in-out is non-trivial to invert; linear is
				// close enough — the user is about to overwrite it via drag.
				here = -pendingMoveRef.current * stride * progress
			}
			setPhaseSync('dragging')
			setPendingMoveSync(0)
			setDragDeltaSync(here)
			setFade(null)
			slideStartRef.current = null
			return true
		}
		return false
	}, [stride, setPhaseSync, setDragDeltaSync, setPendingMoveSync])

	/** Update the live drag offset (px). No-op outside the 'dragging' phase. */
	const updateDrag = useCallback((dx: number) => {
		if (phaseRef.current !== 'dragging') return
		setDragDeltaSync(dx)
	}, [setDragDeltaSync])

	/**
	 * End a drag. Decides between committing to the next/previous slide (when
	 * distance or velocity is sufficient) and snapping back to centre. The
	 * commit path mirrors `navigate()`; the cancel path uses the 'returning'
	 * phase, which `onTransitionEnd` will resolve back to 'idle'.
	 *
	 * @param velocity px/ms; negative means finger moved left (= advance).
	 */
	const endDrag = useCallback((velocity: number) => {
		if (phaseRef.current !== 'dragging') return
		const dx = dragDeltaRef.current
		const distanceTriggered = Math.abs(dx) > stride * 0.25
		const flickTriggered = Math.abs(velocity) > 0.5

		if (!distanceTriggered && !flickTriggered) {
			// Cancel. If dragDelta is already 0 (tap without movement, or a
			// vertical-lock surrender that fires before any horizontal motion),
			// there's no transition to wait for — go straight back to idle.
			// Otherwise enter 'returning' so the CSS transition animates the
			// track back to translateX(0); onTransitionEnd resolves it.
			if (dx === 0) {
				setPhaseSync('idle')
				return
			}
			setPhaseSync('returning')
			setDragDeltaSync(0)
			return
		}

		// Commit: same effect as a click in this direction. Finger moved left
		// (dx<0 or velocity<0) means user wants to advance, which is navigate('right').
		const advance = dx < 0 || (dx === 0 && velocity < 0)
		slideStartRef.current = performance.now()
		setPhaseSync('sliding')
		if (advance) {
			setFade('out')
			setPendingMoveSync(1)
		} else {
			setHasNavigated(true)
			setFade('in')
			setPendingMoveSync(-1)
		}
		setDragDeltaSync(0)
	}, [stride, setPhaseSync, setDragDeltaSync, setPendingMoveSync])

	const onTransitionEnd = useCallback((e: TransitionEvent<HTMLDivElement>) => {
		// Slides have their own transitions (border, outline) that bubble. Ignore
		// anything that isn't the track's transform finishing.
		if (e.propertyName !== 'transform') return
		if (e.target !== e.currentTarget) return

		if (phaseRef.current === 'returning') {
			// Cancelled drag finished animating back to centre.
			setPhaseSync('idle')
			return
		}
		if (phaseRef.current !== 'sliding') return
		setPhaseSync('snapping')
		setOffset((prev) => mod(prev + pendingMove, N))
		setPendingMoveSync(0)
		setFade(null)
		if (!hasNavigated) setHasNavigated(true)
	}, [pendingMove, N, hasNavigated, setPhaseSync, setPendingMoveSync])

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

	// CSS transition is off during the silent snap (no animation) and while
	// the user is actively dragging (we want the track to follow the finger
	// without easing). All other phases keep transition enabled.
	const animate = phase !== 'snapping' && phase !== 'dragging'

	return {
		pendingMove,
		dragDelta,
		animate,
		fade,
		slots,
		navigate,
		startDrag,
		updateDrag,
		endDrag,
		onTransitionEnd,
	}
}