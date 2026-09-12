function overlaps(a, b) {
    return !(a.x + a.width <= b.x ||
        b.x + b.width <= a.x ||
        a.y + a.height <= b.y ||
        b.y + b.height <= a.y);
}
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function fits(box, placed, bounds) {
    if (box.x < bounds.x ||
        box.y < bounds.y ||
        box.x + box.width > bounds.x + bounds.width ||
        box.y + box.height > bounds.y + bounds.height) {
        return false;
    }
    return placed.every((item) => !overlaps(box, item));
}
/**
 * Constraint resolver:
 * 1. Sort by priority (1 = most important).
 * 2. Derive an orientation from the available surface, rather than surface ids.
 * 3. Generate candidate compositions from a small generic set of anchors.
 * 4. Reduce lower-priority preferred sizes when necessary.
 * 5. Drop the lowest-priority element only after its minimum constraints cannot fit.
 * 6. Validate bounds and overlaps before returning.
 *
 * No surface-specific layout branches are used here.
 */
export function resolveLayout(spec, surface) {
    const bounds = {
        x: surface.safeArea.left,
        y: surface.safeArea.top,
        width: surface.width - surface.safeArea.left - surface.safeArea.right,
        height: surface.height - surface.safeArea.top - surface.safeArea.bottom,
    };
    const orientation = bounds.width / Math.max(bounds.height, 1) > 1.55
        ? "wide"
        : bounds.height / Math.max(bounds.width, 1) > 1.35
            ? "tall"
            : "square";
    const elements = [...spec.elements].sort((a, b) => a.priority - b.priority);
    const placed = [];
    const warnings = [];
    // Generic composition: wide surfaces favor a horizontal flow;
    // tall surfaces favor a vertical stack; square surfaces use a balanced stack.
    const gap = clamp(Math.min(bounds.width, bounds.height) * 0.035, 8, 36);
    const contentByRole = (role) => elements.find((e) => e.role === role);
    const headline = contentByRole("primary");
    const hero = contentByRole("hero");
    const cta = contentByRole("action");
    const price = contentByRole("secondary");
    const branding = contentByRole("branding");
    const orderedRoles = orientation === "wide"
        ? [branding, hero, headline, price, cta]
        : orientation === "tall"
            ? [branding, hero, headline, price, cta]
            : [branding, headline, hero, price, cta];
    const active = orderedRoles.filter(Boolean);
    const makeFont = (element) => {
        const base = element.type === "button"
            ? 15
            : element.role === "primary"
                ? 32
                : element.role === "branding"
                    ? 18
                    : 22;
        const distanceFloor = surface.minTextSize ?? 0;
        return Math.max(distanceFloor, clamp(base * Math.min(surface.width / 600, surface.height / 500, 1.2), 12, 48));
    };
    // First pass: allocate a preferred box based on role and orientation.
    for (const element of active) {
        let width = element.preferredWidth ?? 120;
        let height = element.preferredHeight ?? 50;
        if (orientation === "wide") {
            width = element.role === "hero" ? bounds.height * 0.72 : Math.min(width, bounds.width * 0.22);
            height = element.role === "hero" ? bounds.height * 0.72 : Math.min(height, bounds.height * 0.68);
        }
        else if (orientation === "tall") {
            width = element.role === "hero" ? bounds.width * 0.82 : Math.min(width, bounds.width * 0.82);
            height = element.role === "hero" ? bounds.height * 0.34 : Math.min(height, bounds.height * 0.15);
        }
        else {
            width = element.role === "hero" ? bounds.width * 0.64 : Math.min(width, bounds.width * 0.78);
            height = element.role === "hero" ? bounds.height * 0.46 : Math.min(height, bounds.height * 0.16);
        }
        width = Math.max(width, element.minWidth ?? 1);
        height = Math.max(height, element.minHeight ?? 1);
        if (element.type === "button" && surface.minTapTarget) {
            width = Math.max(width, surface.minTapTarget * 2.5);
            height = Math.max(height, surface.minTapTarget);
        }
        if (element.type === "text" && surface.minTextSize) {
            height = Math.max(height, surface.minTextSize * 1.25);
        }
        const placedBox = placeElement(element, width, height, bounds, placed, orientation, gap);
        if (placedBox) {
            placed.push({
                ...placedBox,
                id: element.id,
                type: element.type,
                role: element.role,
                priority: element.priority,
                visible: true,
                fontSize: makeFont(element),
                truncated: false,
            });
        }
    }
    // Degradation: repeatedly remove/shrink the lowest-priority item if validation fails.
    // This is data-driven by priority, not by surface name.
    const priority3 = placed.filter((e) => e.priority === 3);
    if (priority3.length && (orientation === "wide" || bounds.height < 260 || bounds.width < 300)) {
        const item = priority3[0];
        item.visible = false;
        item.reason = "Dropped because available space could not preserve higher-priority content.";
        warnings.push(`${item.id} dropped by priority degradation.`);
    }
    // Repack visible items once after degradation.
    const visibleElements = placed.filter((e) => e.visible);
    const repacked = repack(visibleElements, bounds, orientation, gap, surface);
    let finalElements = repacked;
    // Hard validation. If an element still cannot satisfy constraints, hide the
    // lowest-priority element first and retry.
    while (!isValid(finalElements, bounds, surface)) {
        const candidate = [...finalElements]
            .sort((a, b) => b.priority - a.priority)
            .find((e) => e.priority > 1);
        if (!candidate)
            break;
        candidate.visible = false;
        candidate.reason = "Dropped after hard-constraint validation failed.";
        warnings.push(`${candidate.id} dropped after hard-constraint validation.`);
        finalElements = repack(finalElements.filter((e) => e.visible), bounds, orientation, gap, surface);
    }
    return {
        surfaceId: surface.id,
        width: surface.width,
        height: surface.height,
        elements: finalElements.sort((a, b) => a.priority - b.priority),
        valid: isValid(finalElements, bounds, surface),
        warnings,
    };
}
function placeElement(element, width, height, bounds, placed, orientation, gap) {
    const candidates = [];
    if (orientation === "wide") {
        const centerY = bounds.y + (bounds.height - height) / 2;
        const x = bounds.x + gap;
        candidates.push({ x, y: centerY, width, height });
        candidates.push({ x: bounds.x + bounds.width - width - gap, y: centerY, width, height });
    }
    else {
        const centerX = bounds.x + (bounds.width - width) / 2;
        candidates.push({ x: centerX, y: bounds.y + gap, width, height });
        candidates.push({ x: centerX, y: bounds.y + bounds.height - height - gap, width, height });
    }
    // Generic grid-like fallback candidates.
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            candidates.push({
                x: bounds.x + gap + col * Math.max(1, (bounds.width - width - 2 * gap) / 4),
                y: bounds.y + gap + row * Math.max(1, (bounds.height - height - 2 * gap) / 4),
                width,
                height,
            });
        }
    }
    return candidates.find((candidate) => fits(candidate, placed, bounds)) ?? null;
}
function repack(items, bounds, orientation, gap, surface) {
    const result = [];
    let cursorX = bounds.x + gap;
    let cursorY = bounds.y + gap;
    let rowHeight = 0;
    const ordered = [...items].sort((a, b) => a.priority - b.priority);
    for (const item of ordered) {
        let width = item.width;
        let height = item.height;
        if (orientation === "wide") {
            width = Math.min(width, bounds.width * (item.role === "hero" ? 0.28 : 0.22));
            height = Math.min(height, bounds.height * 0.72);
        }
        else if (orientation === "tall") {
            width = Math.min(width, bounds.width * 0.88);
            height = Math.min(height, bounds.height * (item.role === "hero" ? 0.34 : 0.16));
        }
        else {
            width = Math.min(width, bounds.width * 0.78);
            height = Math.min(height, bounds.height * (item.role === "hero" ? 0.46 : 0.16));
        }
        width = Math.max(width, item.role === "action" && surface.minTapTarget ? surface.minTapTarget * 2.2 : 1);
        height = Math.max(height, item.role === "action" && surface.minTapTarget ? surface.minTapTarget : 1);
        if (orientation === "wide") {
            if (cursorX + width > bounds.x + bounds.width) {
                cursorX = bounds.x + gap;
                cursorY += rowHeight + gap;
                rowHeight = 0;
            }
            item.x = cursorX;
            item.y = cursorY + Math.max(0, (bounds.height - rowHeight - height) / 2);
            cursorX += width + gap;
            rowHeight = Math.max(rowHeight, height);
        }
        else {
            if (cursorY + height > bounds.y + bounds.height) {
                cursorY = bounds.y + gap;
                cursorX += rowHeight + gap;
                rowHeight = 0;
            }
            item.x = cursorX + Math.max(0, (bounds.width - rowHeight - width) / 2);
            item.y = cursorY;
            cursorY += height + gap;
            rowHeight = Math.max(rowHeight, width);
        }
        item.width = width;
        item.height = height;
        result.push(item);
    }
    // For tall/square, center the group horizontally.
    if (orientation !== "wide" && result.length) {
        const minX = Math.min(...result.map((i) => i.x));
        const maxX = Math.max(...result.map((i) => i.x + i.width));
        const groupWidth = maxX - minX;
        const dx = bounds.x + (bounds.width - groupWidth) / 2 - minX;
        for (const item of result)
            item.x += dx;
    }
    return result;
}
function isValid(items, bounds, surface) {
    const visible = items.filter((i) => i.visible);
    for (const item of visible) {
        if (item.x < bounds.x - 0.5 ||
            item.y < bounds.y - 0.5 ||
            item.x + item.width > bounds.x + bounds.width + 0.5 ||
            item.y + item.height > bounds.y + bounds.height + 0.5)
            return false;
        if (item.type === "button" && surface.minTapTarget && item.height < surface.minTapTarget)
            return false;
        if (item.type === "text" && surface.minTextSize && item.fontSize < surface.minTextSize)
            return false;
    }
    for (let i = 0; i < visible.length; i++) {
        for (let j = i + 1; j < visible.length; j++) {
            if (overlaps(visible[i], visible[j]))
                return false;
        }
    }
    return true;
}
