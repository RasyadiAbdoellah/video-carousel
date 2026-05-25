import VideoPlayer from "src/components/VideoCarousel/VideoPlayer.tsx"
import type {CarouselSlotProps} from "src/components/Carousel/CarouselSlot.tsx"
import type {VideoSrc} from "src/types.ts"

export default function VideoSlot({item, isActive, preload}: CarouselSlotProps<VideoSrc>) {
	return (
		<>
			<div className="video-slot__frame">
				<VideoPlayer
					videoSrc={item.videoSrc}
					posterSrc={item.posterSrc}
					active={isActive}
					preload={preload}
				/>
			</div>
			<p className="video-slot__caption">{item.text}</p>
		</>
	)
}
