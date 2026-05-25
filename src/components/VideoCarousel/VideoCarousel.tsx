import Carousel from "src/components/Carousel/Carousel.tsx"
import VideoSlot from "src/components/VideoCarousel/VideoSlot.tsx"
import {VideoSoundProvider} from "./contexts/VideoSoundContext.tsx"
import type {VideoSrc} from "src/types.ts"

type VideoCarouselProps = {
	slides: VideoSrc[]
	title?: string
}

/**
 * Video-specific carousel: wires the generic `Carousel` with a `VideoSlot`
 * renderer and provides the shared video-sound context so slides can
 * coordinate muted/unmuted state.
 */
export default function VideoCarousel({slides, title}: VideoCarouselProps) {
	return (
		<VideoSoundProvider>
			<Carousel items={slides} SlotComponent={VideoSlot} title={title} />
		</VideoSoundProvider>
	)
}
