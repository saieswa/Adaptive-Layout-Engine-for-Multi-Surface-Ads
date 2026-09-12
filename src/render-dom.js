export function elementStyle(element) {
    return {
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        display: element.visible ? "flex" : "none",
        boxSizing: "border-box",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    };
}
export function renderText(element, resolved) {
    return {
        text: element.content,
        style: {
            ...elementStyle(resolved),
            fontSize: `${resolved.fontSize}px`,
            fontWeight: element.role === "primary" ? 900 : 700,
            lineHeight: 1.05,
            whiteSpace: resolved.truncated ? "nowrap" : "normal",
            textOverflow: resolved.truncated ? "ellipsis" : "clip",
        },
    };
}
