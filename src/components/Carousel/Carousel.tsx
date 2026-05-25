import {useRef, type ComponentType} from "react"
import CarouselSlot, {type CarouselSlotProps} from "./CarouselSlot.tsx"
import {useCarouselMeasure} from "./hooks/useCarouselMeasure.ts"
import {useCarouselNavigation} from "./hooks/useCarouselNavigation.ts"
import {useTouchDrag} from "./hooks/useTouchDrag.ts"
import SquareBtn from "src/components/SquareBtn/SquareBtn.tsx"
import styles from "./Carousel.module.scss"

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

	const trackClass = [
		styles.track,
		fade === 'in' && styles.fadeIn,
		fade === 'out' && styles.fadeOut,
	].filter(Boolean).join(' ')

	return (
		<div className={styles.root}>
			<div className={styles.container}>
				<div className={styles.top}>
					<div className={styles.title}>
						{title}
					</div>
					<div className={styles.controls}>
						<SquareBtn size={48} className={styles.controlBtn} onClick={() => navigate('left')} aria-label="previous">
							<div className={styles.controlCircle}>
								<img src="/assets/icons/chevron-left.svg" alt="" />
							</div>
						</SquareBtn>
						<SquareBtn size={48} className={styles.controlBtn} onClick={() => navigate('right')} aria-label="next">
							<div className={styles.controlCircle}>
								<img src="/assets/icons/chevron-right.svg" alt="" />
							</div>
						</SquareBtn>
					</div>
				</div>
				<div className={styles.trackWrapper} ref={containerRef}>
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
