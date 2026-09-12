import { useMemo, useState } from "react";
import { Check, ChevronDown, CircleAlert, LayoutTemplate, ShieldCheck, Zap } from "lucide-react";
import { adSpec } from "./spec";
import { getSurface, surfaces } from "./surfaces";
import { resolveLayout } from "./resolver";
import { elementStyle } from "./render-dom";

export default function App() {
  const [surfaceId, setSurfaceId] = useState("mobile-portrait");
  const surface = getSurface(surfaceId);
  const layout = useMemo(() => resolveLayout(adSpec, surface), [surface]);

  const scale = Math.min(520 / surface.width, 560 / surface.height, 1);
  const previewWidth = surface.width * scale;
  const previewHeight = surface.height * scale;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><LayoutTemplate size={18} /></div>
          <div>
            <div className="eyebrow">FLAM ADS · R&D ASSIGNMENT</div>
            <h1>Adaptive Layout Engine</h1>
          </div>
        </div>
        <div className="header-status"><span className="dot" /> Resolver online</div>
      </header>

      <section className="hero">
        <div>
          <div className="pill"><Zap size={14} /> Constraint-driven composition</div>
          <h2>One ad spec.<br /><span>Every surface.</span></h2>
          <p>
            The same content specification is resolved by TypeScript into a
            valid composition for each screen — without surface-specific layout branches.
          </p>
        </div>
        <div className="flow">
          <div>AD SPEC</div><b>→</b><div>RESOLVER</div><b>→</b><div>LAYOUT</div><b>→</b><div>DOM</div>
        </div>
      </section>

      <section className="workspace">
        <aside className="panel controls">
          <div className="panel-title">SURFACE PROFILE</div>
          <label className="select-wrap">
            <select value={surfaceId} onChange={(e) => setSurfaceId(e.target.value)}>
              {surfaces.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>

          <div className="surface-meta">
            <div><span>Resolution</span><strong>{surface.width} × {surface.height}</strong></div>
            <div><span>Aspect ratio</span><strong>{(surface.width / surface.height).toFixed(2)}</strong></div>
            <div><span>Tap target</span><strong>{surface.minTapTarget ? `${surface.minTapTarget}px min` : "—"}</strong></div>
            <div><span>Text floor</span><strong>{surface.minTextSize ? `${surface.minTextSize}px min` : "—"}</strong></div>
          </div>

          <div className="panel-title spacing">ELEMENT PRIORITIES</div>
          {adSpec.elements.map((item) => (
            <div className="priority-row" key={item.id}>
              <span className={`priority p${item.priority}`}>{item.priority}</span>
              <div><strong>{item.id}</strong><small>{item.role}</small></div>
              <span className="type">{item.type}</span>
            </div>
          ))}
        </aside>

        <section className="panel preview-panel">
          <div className="preview-head">
            <div>
              <div className="panel-title">LIVE RESOLUTION</div>
              <strong>{surface.name}</strong>
            </div>
            <div className={`validity ${layout.valid ? "valid" : "invalid"}`}>
              {layout.valid ? <Check size={15} /> : <CircleAlert size={15} />}
              {layout.valid ? "Valid layout" : "Constraint failure"}
            </div>
          </div>

          <div className="preview-stage">
            <div
              className={`ad-preview ${surface.width / surface.height > 1.55 ? "wide" : surface.height / surface.width > 1.35 ? "tall" : "square"}`}
              style={{ width: previewWidth, height: previewHeight }}
            >
              {layout.elements.filter(e => e.visible).map((resolved) => {
                const spec = adSpec.elements.find(e => e.id === resolved.id)!;
                const base = elementStyle(resolved);
                const style = {
                  ...base,
                  left: `${resolved.x * scale}px`,
                  top: `${resolved.y * scale}px`,
                  width: `${resolved.width * scale}px`,
                  height: `${resolved.height * scale}px`,
                  fontSize: `${resolved.fontSize * scale}px`,
                };

                if (spec.type === "image") {
                  return <img key={spec.id} className={`ad-el image-el role-${spec.role}`} src={spec.content} alt="" style={style} />;
                }

                if (spec.type === "button") {
                  return <button key={spec.id} className="ad-el button-el" style={style}>{spec.content}</button>;
                }

                return (
                  <div key={spec.id} className={`ad-el text-el role-${spec.role}`} style={style}>
                    {spec.content}
                  </div>
                );
              })}
              <div className="preview-grid" />
            </div>
          </div>
        </section>

        <aside className="panel diagnostics">
          <div className="panel-title">RESOLVED OUTPUT</div>
          <div className="metric">
            <span>Visible elements</span><strong>{layout.elements.filter(e => e.visible).length}/{adSpec.elements.length}</strong>
          </div>
          <div className="metric">
            <span>Warnings</span><strong>{layout.warnings.length}</strong>
          </div>

          <div className="panel-title spacing">PLACEMENT</div>
          {layout.elements.map((item) => (
            <div className="placement" key={item.id}>
              <div className="placement-name">
                <span className={`status ${item.visible ? "on" : "off"}`} />
                <strong>{item.id}</strong>
              </div>
              {item.visible ? (
                <code>{Math.round(item.x)}, {Math.round(item.y)} · {Math.round(item.width)} × {Math.round(item.height)}</code>
              ) : (
                <small>{item.reason}</small>
              )}
            </div>
          ))}

          <div className="constraint-box">
            <ShieldCheck size={18} />
            <div>
              <strong>Hard constraints</strong>
              <p>Safe area · tap target · min text size · no overlap · no clipping</p>
            </div>
          </div>
        </aside>
      </section>

      <footer>
        <span>Single declarative ad spec</span>
        <span>•</span>
        <span>Framework-agnostic resolver</span>
        <span>•</span>
        <span>DOM renderer</span>
      </footer>
    </main>
  );
}
