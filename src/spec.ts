export type ElementType = "text" | "image" | "button";
export type ElementRole = "primary" | "hero" | "action" | "secondary" | "branding";

export interface AdElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  priority: 1 | 2 | 3;
  content: string;
  minWidth?: number;
  minHeight?: number;
  preferredWidth?: number;
  preferredHeight?: number;
}

export interface AdSpec {
  id: string;
  name: string;
  elements: AdElement[];
}

export function defineAd(spec: AdSpec): AdSpec {
  const ids = new Set<string>();
  for (const element of spec.elements) {
    if (ids.has(element.id)) {
      throw new Error(`Duplicate element id: ${element.id}`);
    }
    ids.add(element.id);
  }
  return spec;
}

export const adSpec = defineAd({
  id: "nova-runner",
  name: "Nova Runner",
  elements: [
    {
      id: "headline",
      type: "text",
      role: "primary",
      priority: 1,
      content: "RUN LIGHTER. GO FURTHER.",
      minWidth: 120,
      minHeight: 34,
      preferredWidth: 420,
      preferredHeight: 64,
    },
    {
      id: "product-image",
      type: "image",
      role: "hero",
      priority: 1,
      content: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85",
      minWidth: 110,
      minHeight: 90,
      preferredWidth: 360,
      preferredHeight: 250,
    },
    {
      id: "cta",
      type: "button",
      role: "action",
      priority: 2,
      content: "SHOP NOW",
      minWidth: 130,
      minHeight: 44,
      preferredWidth: 150,
      preferredHeight: 52,
    },
    {
      id: "price",
      type: "text",
      role: "secondary",
      priority: 2,
      content: "₹4,999",
      minWidth: 65,
      minHeight: 30,
      preferredWidth: 100,
      preferredHeight: 42,
    },
    {
      id: "logo",
      type: "text",
      role: "branding",
      priority: 3,
      content: "NOVA",
      minWidth: 50,
      minHeight: 24,
      preferredWidth: 90,
      preferredHeight: 34,
    },
  ],
});
