import type {ButtonHTMLAttributes} from "react"
import styles from "./SquareBtn.module.scss"

type SquareBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	/** Side length of the square hitbox, in pixels. */
	size: number
}

/**
 * Bare button with a square hitbox with no background, border, and padding. The
 * width and height are fixed by the `size` prop (inline style) so consumers
 * cannot accidentally override one dimension via `className` and break the
 * square shape. Used as a click target around icons or circular visuals.
 */
export default function SquareBtn({size, className, children, type = 'button', style, ...rest}: SquareBtnProps) {
	const cls = className ? `${styles.btn} ${className}` : styles.btn
	return (
		<button
			type={type}
			className={cls}
			style={{...style, width: `${size}px`, height: `${size}px`}}
			{...rest}
		>
			{children}
		</button>
	)
}
