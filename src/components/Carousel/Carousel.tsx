import {useRef, type ComponentType} from "react"
import CarouselSlot, {type CarouselSlotProps} from "./CarouselSlot.tsx"
import {useCarouselMeasure} from "./hooks/useCarouselMeasure.ts"
import {useCarouselNavigation} from "./hooks/useCarouselNavigation.ts"
import {useTouchDrag} from "./hooks/useTouchDrag.ts"
import "./style.scss"

type CarouselProps<T> = {
	items: T[]
	SlotComponent: ComponentType<CarouselSlotProps<T>>
	title?: string
}

/**
 * Infinite-scroll carousel. Generic over the item type; the caller supplies a
 * `SlotComponent` that renders an individual item given its active/position/
 * preload state. Navigation, measurement, virtualization, and touch drag are
 * handled here.
 */
export default function Carousel<T>({items, SlotComponent, title}: CarouselProps<T>) {
	const containerRef = useRef<HTMLDivElement>(null)
	const {stride, visibleSlides} = useCarouselMeasure(containerRef)
	const {pendingMove, dragDelta, animate, fade, slots, navigate, startDrag, updateDrag, endDrag, onTransitionEnd} =
		useCarouselNavigation(items.length, visibleSlides, stride)

	useTouchDrag(containerRef, {startDrag, updateDrag, endDrag})

	const trackClass = `carousel-track${fade === 'in' ? ' fade-in' : ''}${fade === 'out' ? ' fade-out' : ''}`

	return (
		<div className="carousel">
			<div className="carousel-container">
				<div className="carousel-top">
					<div className="carousel-top__title">
						{title}
					</div>
					<div className="carousel-controls">
						<button className="carousel-controls__btn" onClick={() => navigate('left')}>
							<img src="/assets/icons/chevron-left.svg" alt="previous" />
						</button>
						<button className="carousel-controls__btn" onClick={() => navigate('right')}>
							<img src="/assets/icons/chevron-right.svg" alt="next" />
						</button>
					</div>
				</div>
				<div className="carousel-track-wrapper" ref={containerRef}>
					<div className={trackClass}
							 onTransitionEnd={onTransitionEnd}
							 style={{
								 transform: `translateX(${-pendingMove * stride + dragDelta}px)`,
								 transition: animate ? undefined : 'none',
							 }}
					>
						{slots.map(({position, slideIndex}) => (
							<CarouselSlot
								key={slideIndex}
								position={position}
								left={position * stride}
								preload={Math.abs(position) <= 1}
								item={items[slideIndex]}
								SlotComponent={SlotComponent}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}
