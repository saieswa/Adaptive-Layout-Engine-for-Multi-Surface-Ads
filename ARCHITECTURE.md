# Architecture

## 1. Specification

`src/spec.ts` contains a single ad specification.

The ad does not know anything about mobile, kiosk, broadcast, or any other surface.

```text
headline
product-image
cta
price
logo
```

Each element carries a role and priority.

## 2. Surface profile

`src/surfaces.ts` describes a rendering surface using constraints:

```text
width
height
safeArea
minTapTarget
minTextSize
touchOnly
viewingDistance
```

A new surface can be added as data without adding a resolver branch.

## 3. Constraint resolver

`src/resolver.ts` is framework-agnostic.

```text
AdSpec + SurfaceProfile
        |
        v
orientation inference
        |
        v
priority ordered candidate placement
        |
        v
hard-constraint checks
        |
        v
priority degradation + repack
        |
        v
ResolvedLayout
```

### Why aspect-ratio inference?

The resolver should generalize to an unknown surface. It therefore derives a broad composition mode from the input dimensions instead of checking a known surface ID.

### Why priority ordering?

Advertising content has different business value. Primary messaging and the action should survive space pressure before secondary branding.

### Why repacking?

After an element is dropped, the remaining elements must be repositioned. Otherwise removing a logo could leave an awkward gap or cause another element to overlap.

## 4. Renderer

`src/render-dom.ts` and `App.tsx` consume `ResolvedLayout`.

The renderer does not decide where content goes. It only translates resolved coordinates and sizes into DOM/CSS.

This means a Canvas renderer could consume the same `ResolvedLayout` later without changing the core algorithm.

## 5. Deliberate trade-offs

A full constraint solver would be excessive for this assignment. The implementation uses a transparent priority-ordered greedy strategy with candidate placement and validation.

The main goal is explainability:

- input constraints are visible
- priority is explicit
- degradation is predictable
- output is typed
- invalid output is rejected
