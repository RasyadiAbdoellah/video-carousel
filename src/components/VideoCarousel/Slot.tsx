import VideoSlide from "src/components/VideoCarousel/VideoSlide.tsx"
import type {VideoSrc} from "src/components/VideoCarousel/VideoCarousel.tsx"

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
export default function Slot({position, left, preload, slide}: SlotProps) {
	const isActive = position === 0
	const isLeftBuffer = position === -1
	return (
		<div
			className={`carousel-slide ${isActive ? 'active' : ''} ${isLeftBuffer ? 'left-buffer' : ''}`}
			style={{left: `${left}px`}}
		>
			<VideoSlide
				videoSrc={slide.videoSrc}
				posterSrc={slide.posterSrc}
				active={isActive}
				preload={preload}
			/>
		</div>
	)
}