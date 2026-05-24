import {useRef} from "react"
import Slot from "./Slot.tsx"
import {useCarouselMeasure} from "./hooks/useCarouselMeasure.ts"
import {useCarouselNavigation} from "./hooks/useCarouselNavigation.ts"
import {VideoSoundProvider} from "./contexts/VideoSoundContext.tsx"

export type VideoSrc = {
	posterSrc: string
	videoSrc: string
}

type CarouselProps = {
	slides: VideoSrc[]
}

/**
 * Infinite-scroll video carousel. Slides are navigated one at a time with the
 * left / right arrow controls — there is no autoscroll. The active slide is
 * aligned to the container's left edge and the rest of the track overflows to
 * the right. Previously-active slides remain mounted (one to the left) so the
 * user can scroll back without a jump.
 *
 * The active slide auto-plays its video and is the only slide that shows the
 * video controls; adjacent slides are pre-loaded so playback can start
 * immediately when navigation completes.
 *
 * Implementation notes:
 * - Layout measurements (`stride`, `visibleSlides`) come from
 *   `useCarouselMeasure`, which reads CSS variables and observes container
 *   resizes.
 * - Navigation state (`offset`, `pendingMove`, `animate`, lazy buffer,
 *   snap-back) lives in `useCarouselNavigation`.
 * - The render window is virtualised: only `visibleSlides + buffer` slots are
 *   in the DOM at any time, with their content rotating as `offset` changes.
 *
 * Nice-to-haves not yet implemented:
 * - touch / swipe controls
 * - keyboard arrow-key navigation
 *
 * @param slides - Ordered list of `{posterSrc, videoSrc}` entries to display.
 */
function VideoCarouselContent({slides}: CarouselProps) {
	const containerRef = useRef<HTMLDivElement>(null)
	const {stride, visibleSlides} = useCarouselMeasure(containerRef)
	const {pendingMove, animate, fade, slots, navigate, onTransitionEnd} =
		useCarouselNavigation(slides.length, visibleSlides)

	const trackClass = `carousel-track ${fade === 'in' ? 'fade-in' : ''} ${fade === 'out' ? 'fade-out' : ''}`

	return (
		<div className="carousel-container" ref={containerRef}>
			<button className="carousel-control" onClick={() => navigate('left')}>
				&lt;
			</button>
			<button className="carousel-control" onClick={() => navigate('right')}>
				&gt;
			</button>
			<div className={trackClass}
					 onTransitionEnd={onTransitionEnd}
					 style={{
						 transform: `translateX(${-pendingMove * stride}px)`,
						 transition: animate ? undefined : 'none',
					 }}
			>
				{slots.map(({position, slideIndex}) => (
					<Slot
						key={slideIndex}
						position={position}
						left={position * stride}
						preload={Math.abs(position) <= 1}
						slide={slides[slideIndex]}
					/>
				))}
			</div>
		</div>
	)
}

export default function VideoCarousel(props: CarouselProps) {
	return (
		<VideoSoundProvider>
			<VideoCarouselContent {...props} />
		</VideoSoundProvider>
	)
}