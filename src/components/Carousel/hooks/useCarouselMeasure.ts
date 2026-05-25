import {useEffect, useState, type RefObject} from "react"

/**
 * Observes the carousel container and derives layout measurements from CSS
 * variables (`--slide-width`, `--slide-gap`) plus the container's width.
 *
 * @returns `stride` — px between consecutive slide left-edges. `visibleSlides`
 *   — how many whole slides fit in the container at the current width.
 */
export function useCarouselMeasure(containerRef: RefObject<HTMLElement | null>) {
	const [stride, setStride] = useState(0)
	const [visibleSlides, setVisibleSlides] = useState(1)

	useEffect(() => {
		const el = containerRef.current
		if (!el) return

		function measure() {
			if (!el) return
			const cs = getComputedStyle(el)
			const w = parseFloat(cs.getPropertyValue('--slide-width'))
			const g = parseFloat(cs.getPropertyValue('--slide-gap'))
			const s = w + g
			setStride(s)
			setVisibleSlides(Math.max(1, Math.floor(el.clientWidth / s)))
		}

		measure()
		const ro = new ResizeObserver(measure)
		ro.observe(el)
		return () => ro.disconnect()
	}, [containerRef])

	return {stride, visibleSlides}
}
