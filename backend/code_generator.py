import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def _shell_css() -> str:
    """Minified CSS with essential styling only."""
    return ":root{--bg:#f4f7fb;--surface:#fff;--ink:#0f172a;--muted:#475569;--line:#dbe4f0;--brand:#2563eb;--brand-soft:#dbeafe;--shadow:0 24px 60px rgba(15,23,42,.12);--r:22px}*{box-sizing:border-box}body{margin:0;font-family:system-ui,sans-serif;background:linear-gradient(135deg,#f8fbff 0%,#eef3fb 50%,#e7eef7 100%);color:var(--ink)}.page-shell{max-width:1200px;margin:0 auto;padding:32px 24px}.surface{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--shadow)}.eyebrow{display:inline-block;padding:6px 12px;border-radius:999px;background:var(--brand-soft);color:var(--brand);font-size:11px;font-weight:700;text-transform:uppercase}.hero-title{margin:18px 0 12px;font-size:clamp(2rem,5vw,3.8rem);line-height:1.05}.hero-copy{margin:0;color:var(--muted);max-width:640px;font-size:1.05rem}.primary-btn{display:inline-block;padding:12px 20px;border-radius:12px;border:0;background:linear-gradient(135deg,var(--brand),#1d4ed8);color:#fff;font-weight:700;cursor:pointer;font-size:14px}.secondary-btn{display:inline-block;padding:12px 20px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font-weight:700;cursor:pointer;font-size:14px}.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.stack{display:flex;flex-direction:column;gap:18px}.card{padding:22px;border-radius:16px;background:var(--surface);border:1px solid var(--line)}.metric{padding:18px;border-radius:16px;background:linear-gradient(180deg,#fff,#f6faff);border:1px solid var(--line)}.metric strong{display:block;margin:8px 0 0;font-size:1.8rem}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:12px;border-bottom:1px solid var(--line);text-align:left}.table th{color:var(--muted);font-size:11px;font-weight:700;text-transform:uppercase}.form-shell{max-width:420px;margin:36px auto 0;padding:30px}.field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}.field input,.field textarea{width:100%;padding:12px 14px;border:1px solid var(--line);border-radius:12px;font:inherit;background:#fbfdff}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.thumb{aspect-ratio:4/3;border-radius:14px;background:linear-gradient(135deg,#dbeafe,#bfdbfe 55%,#93c5fd)}.dashboard{display:grid;grid-template-columns:240px 1fr;gap:18px}.sidebar{padding:18px;min-height:600px}.sidebar nav{display:flex;flex-direction:column;gap:8px;margin-top:16px}.sidebar nav a{padding:10px 12px;border-radius:10px;color:var(--muted);text-decoration:none}.sidebar nav a.active{background:var(--brand-soft);color:var(--brand);font-weight:700}.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;margin-bottom:14px}@media(max-width:768px){.dashboard,.grid-3,.grid-4,.gallery{grid-template-columns:1fr}.page-shell{padding:18px 16px}}"


def _landing_markup() -> str:
    return """<div class="page-shell stack"><section class="surface" style="padding:32px"><span class="eyebrow">Layout</span><h1 class="hero-title">Generated from sketch</h1><p class="hero-copy">Produced by sketch-to-code pipeline analysis.</p><div style="display:flex;gap:12px;margin-top:20px"><button class="primary-btn">Action</button><button class="secondary-btn">Learn</button></div></section><section class="grid-3"><article class="card"><h3>Component 1</h3><p>Detected and analyzed from sketch.</p></article><article class="card"><h3>Component 2</h3><p>Converted to responsive HTML.</p></article><article class="card"><h3>Component 3</h3><p>Ready for production use.</p></article></section></div>"""


def _login_markup() -> str:
    return """<div class="page-shell"><section class="surface form-shell"><span class="eyebrow">Login</span><h1 class="hero-title" style="font-size:2rem">Sign in</h1><p class="hero-copy">Enter credentials to continue.</p><div style="margin-top:20px"><label class="field"><span>Email</span><input type="email" placeholder="you@example.com"/></label><label class="field"><span>Password</span><input type="password" placeholder="••••••••"/></label><button class="primary-btn" style="width:100%;margin-top:6px">Sign In</button><p style="text-align:center;margin:12px 0 0;color:var(--muted);font-size:0.9rem">Forgot password?</p></div></section></div>"""


def _form_markup() -> str:
    return """<div class="page-shell"><section class="surface form-shell"><span class="eyebrow">Form</span><h1 class="hero-title" style="font-size:2.1rem">Submit</h1><p class="hero-copy">Complete the form below.</p><div style="margin-top:20px"><label class="field"><span>Name</span><input type="text" placeholder="Your name"/></label><label class="field"><span>Email</span><input type="email" placeholder="your@email.com"/></label><label class="field"><span>Message</span><textarea rows="4" placeholder="Your message..."></textarea></label><button class="primary-btn" style="width:100%">Submit</button></div></section></div>"""


def _dashboard_markup() -> str:
    return """<div class="page-shell dashboard"><aside class="surface sidebar"><span class="eyebrow">Admin</span><h2 style="margin:14px 0 6px;font-size:1.2rem">Dashboard</h2><nav><a class="active" href="#">Overview</a><a href="#">Reports</a><a href="#">Settings</a></nav></aside><main><section class="surface toolbar"><div><span class="eyebrow">Today</span><h1 style="margin:8px 0 0;font-size:1.8rem">Metrics</h1></div><button class="primary-btn">Export</button></section><section class="grid-4" style="margin-bottom:14px"><article class="metric"><span>Revenue</span><strong>$128K</strong></article><article class="metric"><span>Users</span><strong>9.2K</strong></article><article class="metric"><span>Conv.</span><strong>6.4%</strong></article><article class="metric"><span>Ret.</span><strong>82%</strong></article></section><section class="surface card"><h3 style="margin-top:0">Activity</h3><table class="table"><thead><tr><th>Item</th><th>Status</th><th>Owner</th><th>Value</th></tr></thead><tbody><tr><td>Campaign A</td><td>Active</td><td>-</td><td>-</td></tr><tr><td>Campaign B</td><td>Active</td><td>-</td><td>-</td></tr><tr><td>Campaign C</td><td>Closed</td><td>-</td><td>-</td></tr></tbody></table></section></main></div>"""


def _gallery_markup() -> str:
    return """<div class="page-shell stack"><section class="surface" style="padding:28px"><span class="eyebrow">Gallery</span><h1 class="hero-title" style="font-size:2.4rem">Showcase</h1><p class="hero-copy">Display items in a clean card grid.</p></section><section class="gallery"><article class="card"><div class="thumb"></div><h3>Item 1</h3><p>First showcase item.</p></article><article class="card"><div class="thumb"></div><h3>Item 2</h3><p>Second showcase item.</p></article><article class="card"><div class="thumb"></div><h3>Item 3</h3><p>Third showcase item.</p></article></section></div>"""


def _component_label(component_type: str) -> str:
    return {
        "header": "Header",
        "footer": "Footer",
        "sidebar": "Sidebar",
        "input": "Input",
        "button": "Button",
        "text": "Text",
        "image": "Image",
        "card": "Card",
        "section": "Section",
        "container": "Block",
    }.get(component_type, component_type.title())


def _component_markup(component: Dict[str, Any], image_width: int) -> str:
    component_type = component.get("type", "container")
    width = max(int(component.get("width", 120)), 1)
    width_ratio = min(max(width / max(image_width, 1), 0.12), 1.0)
    flex_basis = max(18, min(int(width_ratio * 100), 100))
    min_height = max(42, min(int(component.get("height", 48)), 180))

    extra_class = ""
    if component_type == "button":
        extra_class = " detected-button"
    elif component_type == "input":
        extra_class = " detected-input"
    elif component_type == "text":
        extra_class = " detected-text"
    elif component_type == "image":
        extra_class = " detected-image"
    elif component_type == "sidebar":
        extra_class = " detected-sidebar"

    return (
        f'<article class="detected-box{extra_class}" style="flex-basis:{flex_basis}%; min-height:{min_height}px;">'
        f'<span class="detected-tag">{_component_label(component_type)}</span>'
        f'<div class="detected-fill"></div>'
        f'</article>'
    )


def _detected_markup(layout: Dict[str, Any]) -> str:
    rows = layout.get("rows", [])
    analysis = layout.get("analysis", {})
    image_width = int(analysis.get("image_width", 1200))
    template = layout.get("template", "wireframe")

    row_html: List[str] = []
    for row in rows:
        components = row.get("components", [])
        if not components:
            continue
        items = "".join(_component_markup(component, image_width) for component in components)
        row_html.append(f'<section class="detected-row">{items}</section>')

    if not row_html:
        row_html.append(
            '<section class="detected-row"><article class="detected-box" style="flex-basis:100%; min-height:180px;">'
            '<span class="detected-tag">Sketch</span><div class="detected-fill"></div></article></section>'
        )

    description = layout.get("description", "")
    summary = description.strip() or "Detected layout rendered directly from sketch structure."
    return f"""
    <div class="page-shell stack">
      <section class="surface" style="padding: 30px;">
        <span class="eyebrow">CUDA Sketch Layout</span>
        <h1 class="hero-title" style="font-size:2.3rem;">{template.title()} structure preview</h1>
        <p class="hero-copy">{summary}</p>
      </section>
      <section class="surface detected-layout">
        {''.join(row_html)}
      </section>
    </div>
    """


def generate_html(layout: Dict[str, Any]) -> Dict[str, str]:
    template = layout.get("template", "landing")
    rows = layout.get("rows", [])

    # BUGFIX: Don't use detected markup for semantic templates - use proper templates!
    # The detected markup is ONLY for fallback when template is unknown
    if template == "dashboard":
        body_html = _dashboard_markup()
    elif template == "login":
        body_html = _login_markup()
    elif template == "form":
        body_html = _form_markup()
    elif template == "gallery":
        body_html = _gallery_markup()
    elif template == "landing":
        body_html = _landing_markup()
    else:
        # Only use detected markup if we don't recognize the template
        body_html = _detected_markup(layout)

    html_document = f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sketch Layout</title>
    <style>{_shell_css()}</style>
  </head>
  <body>
    {body_html}
  </body>
</html>
"""

    logger.info("Generated semantic HTML from template=%s", template)
    return {"html": html_document, "css": "", "template": template}
