export const surfaces = [
    {
        id: "mobile-portrait",
        name: "Mobile Portrait",
        width: 320,
        height: 480,
        safeArea: { top: 18, right: 16, bottom: 18, left: 16 },
        minTapTarget: 44,
        touchOnly: true,
    },
    {
        id: "mobile-landscape",
        name: "Mobile Landscape",
        width: 640,
        height: 360,
        safeArea: { top: 14, right: 18, bottom: 14, left: 18 },
        minTapTarget: 44,
        touchOnly: true,
    },
    {
        id: "broadcast",
        name: "Broadcast Lower Third",
        width: 1920,
        height: 250,
        safeArea: { top: 18, right: 42, bottom: 22, left: 42 },
        minTextSize: 32,
        viewingDistance: "far",
    },
    {
        id: "square-kiosk",
        name: "Square Kiosk",
        width: 1080,
        height: 1080,
        safeArea: { top: 40, right: 40, bottom: 40, left: 40 },
        minTapTarget: 60,
        touchOnly: true,
    },
    {
        id: "compact-test",
        name: "Compact Stress Test",
        width: 260,
        height: 230,
        safeArea: { top: 12, right: 12, bottom: 12, left: 12 },
        minTapTarget: 44,
        touchOnly: true,
    },
];
export function getSurface(id) {
    const surface = surfaces.find((item) => item.id === id);
    if (!surface)
        throw new Error(`Unknown surface: ${id}`);
    return surface;
}
