import {type ReactNode, useCallback, useEffect, useRef, useState} from "react"
import "./carousel.scss"

/**
 * Calculates the modulo operation, ensuring a positive result even for negative dividends.
 *
 * @param {number} n - The dividend, which is the number to be divided.
 * @param {number} m - The divisor, which is the number to divide by.
 * @return {number} The positive remainder after division.
 */
function mod(n: number, m: number) {
	return ((n % m) + m) % m
}

/**
 * I need to make an infinite scroll video carousel. The active slide should auto-play the video, with video controls
 * only shown on the active slide. No autoscroll, we move left/right with arrow keys. The active slide should be
 * aligned to the left and the entire carousel overflows to the right. The figma leaves room for interpretation, but I
 * think the previous active slide(s) should not be hidden from view when progressing through the carousel.
 *
 * What will be needed?
 * - video player
 * - video controls
 * - carousel container
 * - carousel track
 * - carousel control
 * - carousel slide that renders the video player
 *
 * We will need to measure and observe the container and track widths to determine the scroll amount and how many
 * slides to display.
 *
 * Nice to haves:
 * - a visibleSlides value to lazy load slides
 * - preload the previous and next slide videos.
 * - touch controls
 *
 */



type CarouselProps = {
	slides: ReactNode[]
}

export default function Carousel({slides: slides}: CarouselProps) {

	const N = slides.length
	// Start with no left-side buffer — only the "current" copy and a right-side
	// buffer copy are rendered, so nothing sits to the left of the first slide
	// on first paint. The left buffer is added lazily on the first leftward nav.
	const [offset, setOffset] = useState(0)
	const [hasLeftBuffer, setHasLeftBuffer] = useState(false)
	const [slideAnimDistance, setSlideAnimDistance] = useState(0)
	const [animate, setAnimate] = useState(true)
	const pendingLeftRef = useRef(false)


	const containerRef = useRef<HTMLDivElement>(null)
	const trackRef = useRef<HTMLDivElement>(null)
	const slideRef = useRef<HTMLDivElement>(null)
	const activeSlideRef = useRef<HTMLDivElement>(null)
	const visibleSlidesRef = useRef(1)


	useEffect(() => {
		if (!containerRef.current || !trackRef.current || !slideRef.current) return

		function measure() {
			if (!containerRef.current || !trackRef.current || !slideRef.current) return
			const containerWidth = containerRef.current.clientWidth
			const trackWidth = trackRef.current.clientWidth
			// slideAnimDistance is the distance of the second slide from the left edge of the track
			setSlideAnimDistance(slideRef.current.offsetLeft)

			visibleSlidesRef.current = Math.floor(containerWidth / slideAnimDistance)
			console.log(containerWidth, trackWidth, slideAnimDistance, visibleSlidesRef.current)
		}

		const ro = new ResizeObserver(measure)
		ro.observe(containerRef.current)
		ro.observe(trackRef.current)
		return () => ro.disconnect()
	}, [])

	const handleArrowClick = useCallback((direction: 'left' | 'right') => {
		if (direction === 'left' && !hasLeftBuffer) {
			// First-ever leftward nav: prepend a left-buffer copy, snap (no anim)
			// to the equivalent position in the new middle copy, and queue the
			// actual -1 step to run once the snap has painted.
			setHasLeftBuffer(true)
			setAnimate(false)
			setOffset((prev) => prev + N)
			pendingLeftRef.current = true
			return
		}
		setAnimate(true)
		setOffset((prev) => prev + (direction === 'left' ? -1 : 1))
	}, [hasLeftBuffer, N])

	// After the animated slide finishes, if we've drifted out of the "middle"
	// region, silently snap back into it. The middle region is [0, N) when
	// there's no left buffer, and [N, 2N) once the left buffer is added.
	const handleTransitionEnd = useCallback(() => {
		const base = hasLeftBuffer ? N : 0
		if (offset < base || offset >= base + N) {
			setAnimate(false)
			setOffset(base + mod(offset, N))
		}
	}, [offset, N, hasLeftBuffer])

	// Re-enable the transition the frame after a silent snap.
	useEffect(() => {
		if (animate) return
		const id = requestAnimationFrame(() => setAnimate(true))
		return () => cancelAnimationFrame(id)
	}, [animate])

	// Once animation is re-enabled, consume a queued leftward step (from the
	// lazy left-buffer init) so the click feels like a single fluid move.
	useEffect(() => {
		if (!animate || !pendingLeftRef.current) return
		pendingLeftRef.current = false
		setOffset((prev) => prev - 1)
	}, [animate])

	const paddedSlides = hasLeftBuffer
		? [...slides, ...slides, ...slides]
		: [...slides, ...slides]
	const activeIndex = mod(offset, N)

	return (
		<div className="carousel-container" ref={containerRef}>
			<button className="carousel-control" onClick={() => handleArrowClick('left')}>
				&lt;
			</button>
			<button className="carousel-control" onClick={() => handleArrowClick('right')}>
				&gt;
			</button>
			<div className="carousel-track"
					 ref={trackRef}
					 onTransitionEnd={handleTransitionEnd}
					 style={{
						 transform: `translateX(-${offset * slideAnimDistance}px)`,
						 transition: animate ? undefined : 'none',
					 }}
			>
				{paddedSlides.map((slide, index) => (
					<div className={`carousel-slide ${mod(index, N) === activeIndex ? "active": ""}`} key={index} ref={index === 1 ? slideRef : index === offset ? activeSlideRef : undefined}>
						{slide}
					</div>
				))}
			</div>
		</div>
	)
}