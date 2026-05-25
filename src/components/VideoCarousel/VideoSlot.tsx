import VideoPlayer from "src/components/VideoCarousel/VideoPlayer.tsx"
import type {CarouselSlotProps} from "src/components/Carousel/CarouselSlot.tsx"
import type {VideoSrc} from "src/types.ts"
import styles from "./VideoCarousel.module.scss"

export default function VideoSlot({item, isActive, preload}: CarouselSlotProps<VideoSrc>) {
	const frameClass = [styles.frame, isActive && styles.frameActive].filter(Boolean).join(' ')
	return (
		<>
			<div className={frameClass}>
				<VideoPlayer
					videoSrc={item.videoSrc}
					posterSrc={item.posterSrc}
					active={isActive}
					preload={preload}
				/>
			</div>
			<p className={styles.caption}>{item.text}</p>
		</>
	)
}
