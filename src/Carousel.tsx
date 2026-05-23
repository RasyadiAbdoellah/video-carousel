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

	const [offset, setOffset] = useState(0)
	const [slideAnimDistance, setSlideAnimDistance] = useState(0)


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
		if (direction === 'left') {
			setOffset((prevIdx) => mod(prevIdx - 1, slides.length))

		} else {
			setOffset((prevIdx) => mod(prevIdx + 1, slides.length))
		}
	}, [slides])

	const paddedSlides = [...slides, ...slides]

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
					 style={{
						 transform: `translateX(-${offset * slideAnimDistance}px)`,
					 }}
			>
				{paddedSlides.map((slide, index) => (
					<div className="carousel-slide" key={index} ref={index === 1 ? slideRef : index === offset ? activeSlideRef : undefined}>
						{slide}
					</div>
				))}
			</div>
		</div>
	)
}

// const mod = (n: number, m: number) => ((n % m) + m) % m
//
// type CarouselProps = {
// 	slides: ReactNode[]
// }
//
// export default function Carousel({slides}: CarouselProps) {
// 	const containerRef = useRef<HTMLDivElement>(null)
// 	const trackRef = useRef<HTMLDivElement>(null)
//
// 	const [slideWidth, setSlideWidth] = useState(0)
// 	const [peekPx, setPeekPx] = useState(0)
//
// 	const [offset, setOffset] = useState(0)
// 	const [hasWrappedLeft, setHasWrappedLeft] = useState(false)
// 	const [animate, setAnimate] = useState(true)
// 	const transitioningRef = useRef(false)
//
// 	useEffect(() => {
// 		const container = containerRef.current
// 		if (!container) return
//
// 		const readMetrics = () => {
// 			const styles = getComputedStyle(container)
// 			const peek = parseFloat(styles.getPropertyValue('--carousel-peek')) || 0
// 			setPeekPx(peek)
// 			setSlideWidth(container.clientWidth - peek)
// 		}
//
// 		readMetrics()
// 		const ro = new ResizeObserver(readMetrics)
// 		ro.observe(container)
// 		return () => ro.disconnect()
// 	}, [])
//
// 	useEffect(() => {
// 		if (peekPx === 0 && hasWrappedLeft) setHasWrappedLeft(false)
// 	}, [peekPx, hasWrappedLeft])
//
// 	const len = slides.length
//
// 	const leadingCloneCount = hasWrappedLeft && slideWidth > 0
// 		? Math.ceil(peekPx / slideWidth) + 1
// 		: 0
//
// 	const padded = useMemo(() => [
// 		...slides.slice(len - leadingCloneCount),
// 		...slides,
// 		slides[0],
// 	], [slides, len, leadingCloneCount])
//
// 	const effectivePeek = hasWrappedLeft ? peekPx : 0
// 	const translatePx = -(offset + leadingCloneCount) * slideWidth + effectivePeek
//
// 	const activeIdx = mod(offset, len)
//
// 	const goLeft = useCallback(() => {
// 		if (transitioningRef.current) return
//
// 		if (offset === 0 && !hasWrappedLeft) {
// 			if (peekPx === 0) {
// 				setAnimate(false)
// 				setOffset(len - 1)
// 				requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
// 				return
// 			}
// 			transitioningRef.current = true
// 			setAnimate(false)
// 			setHasWrappedLeft(true)
// 			requestAnimationFrame(() => requestAnimationFrame(() => {
// 				setAnimate(true)
// 				setOffset(-1)
// 			}))
// 			return
// 		}
//
// 		transitioningRef.current = true
// 		setOffset(o => o - 1)
// 	}, [offset, hasWrappedLeft, peekPx, len])
//
// 	const goRight = useCallback(() => {
// 		if (transitioningRef.current) return
// 		transitioningRef.current = true
// 		setOffset(o => o + 1)
// 	}, [])
//
// 	const onTransitionEnd = useCallback(() => {
// 		transitioningRef.current = false
// 		if (offset < 0 || offset >= len) {
// 			setAnimate(false)
// 			setOffset(mod(offset, len))
// 			requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)))
// 		}
// 	}, [offset, len])
//
// 	useEffect(() => {
// 		const onKey = (e: KeyboardEvent) => {
// 			if (e.key === 'ArrowLeft') goLeft()
// 			else if (e.key === 'ArrowRight') goRight()
// 		}
// 		window.addEventListener('keydown', onKey)
// 		return () => window.removeEventListener('keydown', onKey)
// 	}, [goLeft, goRight])
//
// 	return (
// 		<div className="carousel-container" ref={containerRef}>
// 			<div className="carousel-control" onClick={goLeft}>&lt;</div>
// 			<div className="carousel-control" onClick={goRight}>&gt;</div>
// 			<div
// 				className="carousel-track"
// 				ref={trackRef}
// 				onTransitionEnd={onTransitionEnd}
// 				style={{
// 					transform: `translateX(${translatePx}px)`,
// 					transition: animate ? 'transform 300ms ease' : 'none',
// 				}}
// 			>
// 				{padded.map((slide, i) => {
// 					const sourceIdx = mod(i - leadingCloneCount, len)
// 					const region =
// 						i < leadingCloneCount ? 'lead'
// 							: i >= leadingCloneCount + len ? 'trail'
// 								: 'real'
// 					const isActive = region === 'real' && sourceIdx === activeIdx
// 					return (
// 						<div
// 							className="carousel-slide"
// 							key={`${region}-${sourceIdx}`}
// 							data-active={isActive}
// 						>
// 							{slide}
// 						</div>
// 					)
// 				})}
// 			</div>
// 		</div>
// 	)
// }