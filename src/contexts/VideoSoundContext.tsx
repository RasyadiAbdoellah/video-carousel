import {createContext, useContext, useState, type ReactNode} from "react"

type VideoSoundContextValue = {
	isMuted: boolean
	setIsMuted: (muted: boolean) => void
}

const VideoSoundContext = createContext<VideoSoundContextValue | null>(null)

export function VideoSoundProvider({children}: {children: ReactNode}) {
	const [isMuted, setIsMuted] = useState(true)
	return (
		<VideoSoundContext.Provider value={{isMuted, setIsMuted}}>
			{children}
		</VideoSoundContext.Provider>
	)
}

export function useVideoSound() {
	const ctx = useContext(VideoSoundContext)
	if (!ctx) throw new Error("useVideoSound must be used inside <VideoSoundProvider>")
	return ctx
}