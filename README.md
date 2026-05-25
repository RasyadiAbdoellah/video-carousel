# Infinite Carousel

A working video carousel with infinite scroll, built in React + TypeScript with Vite.

The active slide is aligned to the container's left edge; the rest of the track overflows to the right. Slides are navigated one at a time via the left / right chevrons or by horizontal touch / pointer drag. The slide list wraps modulo N, so the carousel scrolls forever in both directions. There is no autoscroll.

The active slide auto-plays its video and is the only slide that shows the video controls. Immediate neighbours pre-load their media so playback starts without delay once navigation completes.

## Architecture

The carousel is split into a generic mechanism (`Carousel`) and a video-specific consumer (`VideoCarousel`). I chose to split the two to mirror the way I'd create them in a real-world project.

```
src/
├── components/
│   ├── Carousel/                # Generic, content-agnostic carousel
│   │   ├── Carousel.tsx         # Generic over T; takes items + SlotComponent
│   │   ├── CarouselSlot.tsx     # Positioned wrapper; delegates inner render to SlotComponent
│   │   ├── style.scss           # .carousel, .carousel-track, .carousel-slot rules
│   │   ├── hooks/
│   │   │   ├── useCarouselMeasure.ts      # Reads CSS vars + observes container resizes
│   │   │   ├── useCarouselNavigation.ts   # Navigation state, lazy buffer, snap-back
│   │   │   └── useTouchDrag.ts            # Pointer-driven drag with direction lock
│   │   └── utils/
│   │       └── velocityTracker.ts         # Trailing px/ms velocity for drag release
│   └── VideoCarousel/           # Video-specific wrapper around Carousel
│       ├── VideoCarousel.tsx    # Wraps Carousel in VideoSoundProvider
│       ├── VideoSlot.tsx        # Renders VideoPlayer + caption for each item
│       ├── VideoPlayer.tsx      # <video> with play/pause + sound controls
│       ├── style.scss           # .video-player, .video-slot rules
│       └── contexts/
│           └── VideoSoundContext.tsx      # Global muted/unmuted state
├── styles/
│   ├── _variables.scss          # Shared SCSS variables
│   └── reboot.scss              # Global CSS reset
└── index.scss                   # Imports reboot
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

`VideoSlot` renders the `<video>` element inside a framed wrapper (`video-slot__frame`) that picks up an outline when its slot is active, plus an optional caption (`video-slot__caption`).

## Scripts

| Command         | What it does                            |
| --------------- | --------------------------------------- |
| `npm run dev`     | Start the Vite dev server with HMR.     |
| `npm run build`   | Type-check (`tsc -b`) and produce a production build. |
| `npm run preview` | Serve the production build locally.     |
| `npm run lint`    | Run ESLint over the project.            |
| `npm test`        | Run the Vitest suite.                   |

## Typography

The project uses **Larsseit** (bundled under `public/assets/Fonts/Larsseit/`). The Figma wireframe uses a different typeface that we don't have access to, so Larsseit was chosen as the closest available match to the wireframe's visual character. Only the weights actually used (400, 700) are declared in `src/styles/_fonts.scss` to keep the initial payload small.

## Not yet implemented

- Keyboard arrow-key navigation
