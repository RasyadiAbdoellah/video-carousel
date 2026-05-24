import {useEffect, useRef, type RefObject} from "react"

const SWIPE_THRESHOLD_PX = 50
// `|dx|` must dominate `|dy|` by this factor to count as a horizontal swipe;
// keeps vertical scrolls (which the page may legitimately want) from being
// misinterpreted as carousel navigation.
const HORIZONTAL_DOMINANCE = 1.2

type Direction = 'left' | 'right'

/**
 * Attaches touch listeners to `ref` and calls `onSwipe` with the navigation
 * direction the gesture implies:
 *   finger moves left  → 'right' (advance to next slide, Instagram-style)
 *   finger moves right → 'left'  (back to previous slide)
 *
 * Single-finger gestures only; pinch / multi-touch is ignored. Tiny moves
 * (< threshold) are treated as taps and don't trigger a swipe, so child
 * buttons keep working.
 */
export function useTouchSwipe(
	ref: RefObject<HTMLElement | null>,
	onSwipe: (direction: Direction) => void,
) {
	// Keep `onSwipe` in a ref so the effect doesn't re-bind listeners every
	// time the parent re-renders.
	const onSwipeRef = useRef(onSwipe)
	useEffect(() => {
		onSwipeRef.current = onSwipe
	}, [onSwipe])

	useEffect(() => {
		const el = ref.current
		if (!el) return

		let startX = 0
		let startY = 0
		let active = false

		function onTouchStart(e: TouchEvent) {
			if (e.touches.length !== 1) {
				active = false
				return
			}
			startX = e.touches[0].clientX
			startY = e.touches[0].clientY
			active = true
		}

		function onTouchEnd(e: TouchEvent) {
			if (!active) return
			active = false
			const t = e.changedTouches[0]
			const dx = t.clientX - startX
			const dy = t.clientY - startY
			if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return
			if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE) return
			onSwipeRef.current(dx < 0 ? 'right' : 'left')
		}

		function onTouchCancel() {
			active = false
		}

		el.addEventListener('touchstart', onTouchStart, {passive: true})
		el.addEventListener('touchend', onTouchEnd, {passive: true})
		el.addEventListener('touchcancel', onTouchCancel, {passive: true})
		return () => {
			el.removeEventListener('touchstart', onTouchStart)
			el.removeEventListener('touchend', onTouchEnd)
			el.removeEventListener('touchcancel', onTouchCancel)
		}
	}, [ref])
}