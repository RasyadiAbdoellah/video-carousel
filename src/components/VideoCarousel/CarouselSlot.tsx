import VideoPlayer from "src/components/VideoCarousel/VideoPlayer.tsx"
import type {VideoSrc} from "src/types.ts"


type SlotProps = {
	/** Slot position relative to the active slide (0 = active). */
	position: number
	/** Pixel offset from the track's left edge. */
	left: number
	preload: boolean
	slide: VideoSrc
}

/**
 * A single positioned slot inside the carousel track. Contains the
 * `VideoSlide` and applies the absolute `left:` that pins it to its virtual
 * column.
 */
export default function CarouselSlot({position, left, preload, slide}: SlotProps) {
	const isActive = position === 0
	const isLeftBuffer = position === -1
	return (
		<div
			className={`carousel-slot ${isActive ? 'active' : ''} ${isLeftBuffer ? 'left-buffer' : ''}`}
			style={{left: `${left}px`}}
		>
			<div className="carousel-slot__inner">
				<VideoPlayer
					videoSrc={slide.videoSrc}
					posterSrc={slide.posterSrc}
					active={isActive}
					preload={preload}
				/>
			</div>
			<p className="carousel-slot__text">{slide.text}</p>
		</div>
	)
}