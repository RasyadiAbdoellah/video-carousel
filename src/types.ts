/**
 * A single video slide's source data. `posterSrc` is the still image shown
 * before the video has loaded (and used as the `<video>` element's `poster`
 * attribute); `videoSrc` is the URL of the video file itself.
 *
 * The carousel takes an ordered list of these and renders one `VideoSlide`
 * per entry, looping around with mod-N arithmetic so the array effectively
 * forms an infinite ring.
 */
export type VideoSrc = {
	posterSrc: string
	videoSrc: string
}
