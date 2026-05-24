import {useEffect, useRef, type RefObject} from "react"
import {createVelocityTracker} from "../utils/velocityTracker"

const DIRECTION_LOCK_PX = 8

type DragActions = {
	startDrag: () => boolean
	updateDrag: (dx: number) => void
	endDrag: (velocity: number) => void
}

/**
 * Pointer-driven live drag for the carousel. While dragging, calls
 * `updateDrag` with the live x-displacement from the touchstart point.
 * On release, calls `endDrag` with the trailing px/ms velocity so the
 * navigation hook can decide between commit and cancel.
 *
 * Direction lock: after the first ~8 px of movement, if vertical dominates
 * horizontal, the drag is abandoned and the page is free to scroll.
 */
export function useTouchDrag(
	ref: RefObject<HTMLElement | null>,
	actions: DragActions,
) {
	// Latest actions in a ref so the effect doesn't re-bind on every parent
	// re-render.
	const actionsRef = useRef(actions)
	useEffect(() => {
		actionsRef.current = actions
	}, [actions])

	useEffect(() => {
		const el = ref.current
		if (!el) return

		const velocity = createVelocityTracker()
		let pointerId: number | null = null
		let startX = 0
		let startY = 0
		let locked: 'horizontal' | 'vertical' | null = null

		function onPointerDown(e: PointerEvent) {
			if (pointerId !== null) return // ignore secondary pointers
			if (e.pointerType === 'mouse' && e.button !== 0) return
			if (!actionsRef.current.startDrag()) return
			pointerId = e.pointerId
			startX = e.clientX
			startY = e.clientY
			locked = null
			velocity.reset()
			velocity.push(performance.now(), e.clientX)
			el!.setPointerCapture(e.pointerId)
		}

		function onPointerMove(e: PointerEvent) {
			if (e.pointerId !== pointerId) return
			const dx = e.clientX - startX
			const dy = e.clientY - startY
			if (locked === null) {
				if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return
				locked = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
				if (locked === 'vertical') {
					// Surrender the gesture so the page can scroll.
					actionsRef.current.endDrag(0)
					el!.releasePointerCapture(e.pointerId)
					pointerId = null
					return
				}
			}
			if (locked === 'horizontal') {
				velocity.push(performance.now(), e.clientX)
				actionsRef.current.updateDrag(dx)
				// Prevent the page from also scrolling horizontally on trackpads.
				e.preventDefault()
			}
		}

		function onPointerUp(e: PointerEvent) {
			if (e.pointerId !== pointerId) return
			const v = velocity.velocity()
			actionsRef.current.endDrag(locked === 'horizontal' ? v : 0)
			el!.releasePointerCapture(e.pointerId)
			pointerId = null
			locked = null
		}

		function onPointerCancel(e: PointerEvent) {
			if (e.pointerId !== pointerId) return
			actionsRef.current.endDrag(0)
			pointerId = null
			locked = null
		}

		// `touchmove`-derived preventDefault needs a non-passive listener; the
		// Pointer Events spec routes it through pointermove with passive:false.
		el.addEventListener('pointerdown', onPointerDown)
		el.addEventListener('pointermove', onPointerMove, {passive: false})
		el.addEventListener('pointerup', onPointerUp)
		el.addEventListener('pointercancel', onPointerCancel)

		return () => {
			el.removeEventListener('pointerdown', onPointerDown)
			el.removeEventListener('pointermove', onPointerMove)
			el.removeEventListener('pointerup', onPointerUp)
			el.removeEventListener('pointercancel', onPointerCancel)
		}
	}, [ref])
}
