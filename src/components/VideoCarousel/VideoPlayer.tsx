import {useEffect, useRef, useState} from "react"
import {useVideoSound} from "./contexts/VideoSoundContext.tsx"

/**
 * The Video Slide renders the video, a play/pause button and a sound off/on button. It accepts an active flag and a preload flag, as well as the video and poster source.
 * On mount, the component should only render the video poster, videos should be loaded when preload is true.
 * The active flag will auto-play the video. The preload flag tells adjacent slides to load their videos so if the active flag is tripped it can play their video right away.
 * The video slide pauses the video when active flips back to false. This means videos that have been loaded/played should not unmount their media tag
 * The sound off/on button should be connected to a global sound on/off context so that this state is global.
 */

type VideoSlideProps = {
	videoSrc: string
	posterSrc: string
	active?: boolean
	preload?: boolean
}

export default function VideoPlayer({videoSrc, posterSrc, active = false, preload = false}: VideoSlideProps) {
	const videoRef = useRef<HTMLVideoElement>(null)

	// Once the video has been loaded (preload or active fired at least once),
	// keep the <video> tag mounted forever — per spec, loaded videos must not
	// unmount their media tag.
	const [hasLoaded, setHasLoaded] = useState(false)
	const [isPlaying, setIsPlaying] = useState(false)

	const {isMuted, setIsMuted} = useVideoSound()
	const toggleSound = () => setIsMuted(!isMuted)

	const togglePlay = () => {
		const v = videoRef.current
		if (!v) return
		if (v.paused) {
			v.play().then(() => setIsPlaying(true)).catch(() => {})
		} else {
			v.pause()
			setIsPlaying(false)
		}
	}

	const pause = () => {
		const v = videoRef.current
		if (!v) return
		v.pause()
	}

	useEffect(() => {
		if (preload || active) setHasLoaded(true)
	}, [preload, active, setHasLoaded])
	// Auto-play when active, pause when active flips back to false.

	useEffect(() => {
		if (!active || !hasLoaded) return
		togglePlay()
	}, [active, hasLoaded])

	useEffect(() => {
		if (!active && isPlaying) {
			pause()
		}
	},[active, isPlaying])


	return (
			<div className="video-player">
				{hasLoaded ? (
					<video
						ref={videoRef}
						className="video-player__media"
						poster={posterSrc}
						src={videoSrc}
						playsInline
						loop
						muted={isMuted}
						preload="auto"
					/>
				) : (
					<img className="video-player__poster" src={posterSrc} alt="" />
				)}
				{active && (
					<div className="video-player__controls">
						<button className="video-player__btn" onClick={toggleSound} aria-label={isMuted ? "Unmute" : "Mute"}>
							<img src={isMuted ? "/assets/icons/sound-off.svg" : "/assets/icons/sound-on.svg"} alt="" />
						</button>
						<button className="video-player__btn" onClick={togglePlay} aria-label={isPlaying ? "Pause" : "Play"}>
							<img src={isPlaying ? "/assets/icons/pause.svg" : "/assets/icons/play.svg"} alt="" />
						</button>
					</div>
				)}
			</div>
	)
}