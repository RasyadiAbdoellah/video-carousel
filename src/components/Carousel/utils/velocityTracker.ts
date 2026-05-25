type Sample = {t: number; x: number}

/**
 * Rolling-window velocity tracker. Keeps `{time, x}` samples within the
 * configured window (default 100 ms before the most-recent sample) and
 * reports px/ms across the oldest-to-newest sample in that window.
 *
 * Used by drag handlers to detect "flick" gestures — a release with high
 * velocity should commit a slide change even when the drag distance is
 * shorter than the static threshold.
 */
export function createVelocityTracker(windowMs = 100) {
	const samples: Sample[] = []

	return {
		push(t: number, x: number) {
			samples.push({t, x})
			const cutoff = t - windowMs
			while (samples.length > 0 && samples[0].t < cutoff) samples.shift()
		},

		velocity(): number {
			if (samples.length < 2) return 0
			const first = samples[0]
			const last = samples[samples.length - 1]
			const dt = last.t - first.t
			if (dt === 0) return 0
			return (last.x - first.x) / dt
		},

		reset() {
			samples.length = 0
		},
	}
}
