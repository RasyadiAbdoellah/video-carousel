# Infinite Carousel

A working video carousel with infinite scroll, built in React + TypeScript with Vite.

The active slide is aligned to the container's left edge; the rest of the track overflows to the right. Slides are navigated one at a time via the left / right chevrons or by horizontal touch / pointer drag. The slide list wraps modulo N, so the carousel scrolls forever in both directions. There is no autoscroll.

The active slide auto-plays its video and is the only slide that shows the video controls. Immediate neighbours pre-load their media so playback starts without delay once navigation completes.

## Architecture

The carousel is split into a generic mechanism (`Carousel`) and a video-specific consumer (`VideoCarousel`). I chose to split the two to mirror the way I'd create them in a real-world project.

```
src/
├── components/
│   ├── Carousel/                         # Generic, content-agnostic carousel
│   │   ├── Carousel.tsx                  # Generic over T; takes items + SlotComponent
│   │   ├── CarouselSlot.tsx              # Positioned wrapper; delegates inner render to SlotComponent
│   │   ├── Carousel.module.scss          # Scoped styles for the carousel
│   │   ├── hooks/
│   │   │   ├── useCarouselMeasure.ts            # Reads CSS vars + observes container resizes
│   │   │   ├── useCarouselNavigation.ts         # Navigation state, lazy buffer, snap-back
│   │   │   ├── useCarouselNavigation.test.ts
│   │   │   └── useTouchDrag.ts                  # Pointer-driven drag with direction lock
│   │   └── utils/
│   │       ├── velocityTracker.ts               # Trailing px/ms velocity for drag release
│   │       └── velocityTracker.test.ts
│   ├── VideoCarousel/                    # Video-specific wrapper around Carousel
│   │   ├── VideoCarousel.tsx             # Wraps Carousel in VideoSoundProvider
│   │   ├── VideoSlot.tsx                 # Renders VideoPlayer + caption for each item
│   │   ├── VideoPlayer.tsx               # <video> with play/pause + sound controls
│   │   ├── VideoCarousel.module.scss     # Scoped styles for the video player, frame, caption
│   │   └── contexts/
│   │       └── VideoSoundContext.tsx     # Global muted/unmuted state
│   ├── SquareBtn/                        # Shared square-hitbox button with size prop
│   │   ├── SquareBtn.tsx
│   │   └── SquareBtn.module.scss
│   └── icons/                            # Inline SVG icon components (fill="currentColor")
│       ├── PlayIcon.tsx
│       ├── PauseIcon.tsx
│       ├── SoundOnIcon.tsx
│       └── SoundOffIcon.tsx
├── styles/
│   ├── _variables.scss                   # Shared SCSS tokens: colors + slide dimensions
│   ├── _fonts.scss                       # @font-face declarations for Larsseit
│   └── reboot.scss                       # Global CSS reset
└── index.scss                            # Imports fonts + reboot
```

### Generic `Carousel`

The carousel mechanism is independent of what each slide renders. It accepts an item array and a slot component:

```tsx
type CarouselSlotProps<T> = {
  item: T
  isActive: boolean
  position: number   // 0 = active, -1 = left buffer, etc.
  preload: boolean   // active slide and its neighbours
}

<Carousel
  items={items}
  SlotComponent={MySlot}
  title="Optional title"
/>
```

The render window is virtualised: only `visibleSlides + buffer` slots are in the DOM at any time, with their content rotating as the offset changes. The previously-active slide stays mounted one to the left so users can scroll back without a jump.

### `VideoCarousel`

A thin wrapper that supplies the video-specific concerns:

```tsx
<VideoSoundProvider>
  <Carousel items={slides} SlotComponent={VideoSlot} title={title} />
</VideoSoundProvider>
```

`VideoSlot` renders the `<video>` element inside a framed wrapper that picks up an outline when its slot is active, plus an optional caption below. All class names are scoped via CSS Modules — the SCSS uses plain identifiers (`.frame`, `.frameActive`, `.caption`) which the bundler hashes per file.

### Styling

Component styles live next to the component as `*.module.scss` files and are imported as `styles` objects. The shared partials in `src/styles/` provide:

- **`_variables.scss`** — color tokens (`$text-color`, `$cozey-blue`, `$cozey-gray`, …) and slide dimensions (`$slide-width`, `$slide-height`, `$slide-gap`). The slide-dimension SCSS tokens are interpolated into `--slide-width` / `--slide-gap` CSS custom properties on the carousel's track wrapper so `useCarouselMeasure` can read them at runtime.
- **`_fonts.scss`** — `@font-face` declarations for the project font (see Typography below).
- **`reboot.scss`** — minimal CSS reset.

## Scripts

| Command         | What it does                            |
| --------------- | --------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR.     |
| `npm run build`   | Type-check (`tsc -b`) and produce a production build. |
| `npm run preview` | Serve the production build locally.     |
| `npm run lint`    | Run ESLint over the project.            |
| `npm test`        | Run the Vitest suite.                   |

## Typography

The Figma wireframe is set in **Haffer XH**, which isn't part of the asset bundle for this demo. Of the fonts that *were* provided, **Larsseit** is the closest visual match, so it stands in as the project's typeface.

The font files live under `public/assets/fonts/Larsseit/` and the `@font-face` declarations are in `src/styles/_fonts.scss`. Only the two weights the UI actually uses are declared:

- `400` (Regular) — body copy and slide captions
- `700` (Bold) — section titles
