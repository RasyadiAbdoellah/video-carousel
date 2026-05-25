import type {ComponentType} from "react"

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
	return (
		<div
			className={`carousel-slot ${isActive ? 'active' : ''} ${isLeftBuffer ? 'left-buffer' : ''}`}
			style={{left: `${left}px`}}
		>
			<SlotComponent item={item} isActive={isActive} position={position} preload={preload} />
		</div>
	)
}
