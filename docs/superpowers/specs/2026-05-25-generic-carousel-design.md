# Generic Carousel Extraction

**Date:** 2026-05-25
**Status:** Approved design — implementation pending

## Goal

Extract the carousel mechanics from `VideoCarousel` into a standalone, content-agnostic `Carousel` component. Split styles so each component owns its own `style.scss`.

After extraction:
- `Carousel` knows nothing about video, posters, sound, or captions. It manages layout measurement, navigation state, the virtualised slot window, touch drag, title, and chevron controls.
- `VideoCarousel` becomes a thin wrapper that supplies the video-specific slot renderer and the `VideoSoundProvider`.

## Non-goals

- Changing carousel behavior (navigation, drag, fade, virtualization all stay identical).
- Making title/controls overridable. Both stay built into `Carousel` as today.
- Publishing `Carousel` as a separate package.
- Adding new features (keyboard nav, autoscroll, etc.).

## Architecture

### Slot contract

The generic carousel accepts a slot component via a prop. The slot receives per-item state:

```ts
type CarouselSlotProps<T> = {
  item: T
  isActive: boolean
  position: number   // 0 = active, -1 = left buffer, etc.
  preload: boolean   // true for the active slide and its immediate neighbours
}
```

### `Carousel` props

```ts
type CarouselProps<T> = {
  items: T[]
  SlotComponent: ComponentType<CarouselSlotProps<T>>
  title?: string
}
```

`Carousel` is generic over `T`. The current `VideoCarousel.tsx` already wires up the hooks correctly; the change is to (a) replace `slides: VideoSrc[]` with the generic `items: T[]`, and (b) replace the direct `VideoPlayer` import inside the slot with `<SlotComponent item={...} ... />`.

### File layout

```
src/
  components/
    Carousel/
      Carousel.tsx
      CarouselSlot.tsx
      style.scss
      hooks/
        useCarouselMeasure.ts
        useCarouselNavigation.ts
        useCarouselNavigation.test.ts
        useTouchDrag.ts
      utils/
        velocityTracker.ts
        velocityTracker.test.ts
    VideoCarousel/
      VideoCarousel.tsx
      VideoSlot.tsx           # new
      VideoPlayer.tsx
      style.scss              # new (.video-player rules)
      contexts/
        VideoSoundContext.tsx
  styles/
    _variables.scss           # new (shared SCSS vars)
  index.scss                  # reduced to `@use './reboot';`
```

### Generic `Carousel.tsx`

Equivalent to today's `VideoCarouselContent`, with these differences:
- Generic over `T`.
- Props: `items`, `SlotComponent`, `title?`.
- Imports `./style.scss`.
- Renders `<CarouselSlot ... item={items[slideIndex]} SlotComponent={SlotComponent} />` in the slot map.

The outer default export does NOT wrap in `VideoSoundProvider` — that's a video concern handled by `VideoCarousel`.

### Generic `CarouselSlot.tsx`

Receives `{position, left, preload, item, SlotComponent}`. Renders only the outer positioned element; the consumer's slot component is responsible for the full inner structure (including the `__inner` wrapper if it wants the active-state outline):

```tsx
<div className={`carousel-slot ${isActive ? 'active' : ''} ${isLeftBuffer ? 'left-buffer' : ''}`} style={{left: `${left}px`}}>
  <SlotComponent item={item} isActive={isActive} position={position} preload={preload} />
</div>
```

Because the generic carousel does not render `.carousel-slot__inner` or `.carousel-slot__text`, their styles do NOT live in `Carousel/style.scss`. They move to `VideoCarousel/style.scss` alongside the consumer that renders them. This preserves the current DOM where the caption sits OUTSIDE the outlined inner box (sibling of `__inner`, not child).

### `VideoCarousel/VideoCarousel.tsx`

```tsx
export default function VideoCarousel({slides, title}: {slides: VideoSrc[]; title?: string}) {
  return (
    <VideoSoundProvider>
      <Carousel items={slides} SlotComponent={VideoSlot} title={title} />
    </VideoSoundProvider>
  )
}
```

### `VideoCarousel/VideoSlot.tsx` (new)

```tsx
function VideoSlot({item, isActive, preload}: CarouselSlotProps<VideoSrc>) {
  return (
    <>
      <div className="carousel-slot__inner">
        <VideoPlayer videoSrc={item.videoSrc} posterSrc={item.posterSrc} active={isActive} preload={preload} />
      </div>
      <p className="carousel-slot__text">{item.text}</p>
    </>
  )
}
```

`VideoSlot` renders the caption element. The CSS rule for `.carousel-slot__text` still lives in `Carousel/style.scss` (BEM slot reserved by the generic carousel; consumers may opt in by rendering the element).

### `VideoPlayer.tsx`

Unchanged behavior. Adds one line: `import './style.scss'`.

## Styling

### `src/styles/_variables.scss` (new)

```scss
$text-color: #0B2341;
$text-color-light: #4F6076;
$cozey-blue: #69A2FF;
$cozey-gray: #D0CEC4;
```

### `src/components/Carousel/style.scss` (new)

```scss
@use 'src/styles/variables' as *;

.carousel { /* ...moved verbatim from index.scss... */ }

@keyframes slideFadeIn { /* moved */ }
@keyframes slideFadeOut { /* moved */ }
```

Contents moved from `src/index.scss`:
- `.carousel` and nested selectors (`-top`, `-container`, `-track-wrapper`, `-controls`, `-track`).
- `.carousel-slot` rule with `position`, `top`, `width: var(--slide-width)`, and the `&.left-buffer { opacity: 0; }` modifier. The `__inner` and `__text` element rules do NOT move here.
- `@keyframes slideFadeIn` and `@keyframes slideFadeOut` (referenced by `.carousel-track.fade-in/out`).

### `src/components/VideoCarousel/style.scss` (new)

```scss
@use 'src/styles/variables' as *;

.video-player { /* ...moved verbatim from index.scss... */ }

.carousel-slot {
  &__inner {
    border-radius: 20px;
    overflow: hidden;
    transition: border 0.2s ease-in-out, outline 0.2s ease-in-out;
    box-sizing: border-box;
    border: 2px solid transparent;
    outline: 4px solid transparent;
    outline-offset: 4px;
    .carousel-slot.active & {
      border: 2px solid $cozey-gray;
      outline: 4px solid $cozey-blue;
      outline-offset: 4px;
    }
  }
  &__text {
    margin-top: 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 20px;
    color: $text-color;
  }
}
```

Note: the `.active &` selector is rewritten as `.carousel-slot.active &` because the parent `.carousel-slot` selector no longer wraps `__inner` in this file. Behavior is identical — the outline appears on the active slot's inner box.

### `src/index.scss` (after)

```scss
@use './reboot';
```

All variable definitions and component rules are removed.

### Import wiring

- `Carousel.tsx` adds `import './style.scss'`.
- `VideoPlayer.tsx` adds `import './style.scss'`.

The `@use 'src/styles/variables'` path assumes Vite's SCSS resolver handles absolute-from-root paths. If it doesn't, fall back to relative paths (`../../../styles/variables`).

## Behavioural parity

Nothing about navigation, drag, fade, sound, or rendering changes. The implementation passes the same data through one extra component boundary. Existing tests (`useCarouselNavigation.test.ts`, `velocityTracker.test.ts`) move with their source files and continue to pass without modification.

## Risks

- **SCSS import path resolution** — `@use 'src/styles/variables' as *;` may need to be a relative path depending on Vite config. Resolve at implementation time.
- **CSS load order** — multiple `import './style.scss'` statements load in module-import order. There are no cross-component selector conflicts (carousel rules don't fight with video-player rules), so order shouldn't matter.
- **Generic type inference** — `<Carousel<VideoSrc> items={slides} SlotComponent={VideoSlot} />` may need an explicit type arg if TS can't infer through the `SlotComponent` prop. Worst case: add the explicit `<VideoSrc>`.

## Out of scope

- Storybook entries or demo pages for the generic carousel.
- Renaming `carousel-slot__text` to something more generic.
- Extracting reboot or other global styles.
