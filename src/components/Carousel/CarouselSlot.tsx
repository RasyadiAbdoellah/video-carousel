import type {ComponentType} from "react"
import styles from "./Carousel.module.scss"

export type CarouselSlotProps<T> = {
	item: T
	isActive: boolean
	position: number
	preload: boolean
}

type Props<T> = {
	position: number
	left: number
	preload: boolean
	item: T
	SlotComponent: ComponentType<CarouselSlotProps<T>>
}

export default function CarouselSlot<T>({position, left, preload, item, SlotComponent}: Props<T>) {
	const isActive = position === 0
	const isLeftBuffer = position === -1
	const className = [
		styles.slot,
		isActive && styles.active,
		isLeftBuffer && styles.leftBuffer,
	].filter(Boolean).join(' ')
	return (
		<div className={className} style={{left: `${left}px`}}>
			<SlotComponent item={item} isActive={isActive} position={position} preload={preload} />
		</div>
	)
}
