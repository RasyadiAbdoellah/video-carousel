import VideoCarousel from "src/components/VideoCarousel/VideoCarousel.tsx"
import type {VideoSrc} from "src/types.ts"
import "./index.scss"

const videos: VideoSrc[] = [
	{
		posterSrc: "/assets/image/1.png",
		videoSrc: "/assets/video/1.mp4",
		text: "Whispers of Ipsum"
	},
	{
		posterSrc: "/assets/image/2.png",
		videoSrc: "/assets/video/2.mp4",
		text: "Forest of Lorem Ipsum"
	},
	{
		posterSrc: "/assets/image/3.png",
		videoSrc: "/assets/video/3.mp4",
		text: "Lorem Ipsum in the Wilderness"

	},
	{
		posterSrc: "/assets/image/4.png",
		videoSrc: "/assets/video/4.mp4",
		text: "The Ipsum Tide"
	},
	{
		posterSrc: "/assets/image/5.png",
		videoSrc: "/assets/video/5.mp4",
		text: "Echoes of Ipsum"
	},
	{
		posterSrc: "/assets/image/6.png",
		videoSrc: "/assets/video/6.mp4"
	},
	{
		posterSrc: "/assets/image/7.png",
		videoSrc: "/assets/video/7.mp4"
	},
	{
		posterSrc: "/assets/image/8.png",
		videoSrc: "/assets/video/8.mp4"
	},
	{
		posterSrc: "/assets/image/9.png",
		videoSrc: "/assets/video/9.mp4"
	},
	{
		posterSrc: "/assets/image/10.png",
		videoSrc: "/assets/video/10.mp4"
	},
	{
		posterSrc: "/assets/image/11.png",
		videoSrc: "/assets/video/11.mp4"
	},
]


function App() {

	return (
			<VideoCarousel
				title="A day in the life"
				slides={videos}
			/>
	)

}

export default App
