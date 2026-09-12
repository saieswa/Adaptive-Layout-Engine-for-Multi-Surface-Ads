# Adaptive Layout Engine for Multi-Surface Ads

A constraint-driven layout engine built with React and TypeScript that adapts a single advertisement specification across multiple surfaces with different aspect ratios and constraints.

## Overview

The goal of this project is to define an advertisement once and automatically resolve its layout for different surfaces.

The same ad specification can be rendered on:

- Mobile Portrait
- Mobile Landscape
- Broadcast Lower Third
- Square Retail Kiosk
- Constrained test surfaces

The layout engine uses a TypeScript-based constraint resolution algorithm instead of hardcoded layouts or CSS media-query breakpoints.

---

## Problem

The same advertisement may need to run on screens with very different dimensions and constraints.

For example:

- A mobile portrait screen is tall and narrow.
- A mobile landscape screen is wide and short.
- A broadcast lower third is extremely wide and short.
- A square kiosk has equal width and height.

A single fixed layout cannot work well across all of these surfaces.

The problem this project solves is:

> Given one advertisement specification and one surface profile, automatically calculate a valid layout that adapts to the available space and constraints.

The engine must:

- Preserve high-priority content.
- Respect surface-specific constraints.
- Avoid overlapping elements.
- Avoid clipping and overflow.
- Adapt the composition instead of simply scaling everything.
- Gracefully remove or reduce lower-priority content when necessary.

---

# Solution

The application separates advertisement definition, constraint resolution, and rendering.

```text
Ad Spec + Surface Profile
            ↓
    Constraint Resolver
            ↓
     Resolved Layout
            ↓
       DOM Renderer
