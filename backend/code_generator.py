import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def _shell_css() -> str:
    """Simplified but premium CSS for the fallback shell."""
    return """
    :root {
      --bg: #f8fafc;
      --surface: #ffffff;
      --ink: #0f172a;
      --muted: #64748b;
      --brand: #6366f1;
      --brand-soft: #eef2ff;
      --line: #e2e8f0;
      --r: 12px;
    }
    * { box-sizing: border-box; }
    body { 
      margin: 0; 
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--ink);
    }
    .page-shell { 
      max-width: 1000px; 
      margin: 0 auto; 
      padding: 40px 20px; 
    }
    .surface { 
      background: var(--surface); 
      border: 1px solid var(--line); 
      border-radius: var(--r);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      padding: 24px;
    }
    .stack { display: flex; flex-direction: column; gap: 24px; }
    .hero-title { font-size: 2.5rem; font-weight: 800; margin: 0 0 8px; letter-spacing: -0.02em; }
    .hero-copy { color: var(--muted); font-size: 1.1rem; margin: 0; }
    
    /* Semantic Mockup Styles */
    .detected-layout { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
    .detected-row { display: flex; gap: 16px; width: 100%; }
    .detected-box { 
      background: #fff; 
      border: 1px solid var(--line); 
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px;
      position: relative;
    }
    .btn-mock { 
      background: var(--brand); 
      color: white; 
      font-weight: 600; 
      padding: 8px 16px; 
      border-radius: 6px; 
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .input-mock {
      border: 1px solid var(--line);
      background: #fdfdfd;
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 14px;
      color: var(--muted);
      width: 100%;
    }
    .card-mock {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      width: 100%; height: 100%;
    }
    .text-mock {
      font-size: 14px;
      color: var(--ink);
      font-weight: 500;
    }
    .img-mock {
       background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
       border-radius: 6px;
       width: 100%; height: 100%;
    }
    .tag-debug {
      position: absolute;
      top: -8px; left: 8px;
      background: var(--ink);
      color: white;
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      opacity: 0.7;
    }
    """


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
    min_height = max(42, min(int(component.get("height", 48)), 300))

    label = _component_label(component_type)
    inner_content = ""
    
    if component_type == "button":
        inner_content = f'<div class="btn-mock">{label}</div>'
    elif component_type == "input":
        inner_content = f'<div class="input-mock">Detected {label}...</div>'
    elif component_type == "text":
        inner_content = f'<div class="text-mock">Sample Text Content</div>'
    elif component_type == "image":
        inner_content = f'<div class="img-mock"></div>'
    elif component_type == "card":
        inner_content = f'<div class="card-mock"></div>'
    else:
        inner_content = f'<div class="card-mock"></div>'

    return (
        f'<article class="detected-box" style="flex-basis:{flex_basis}%; min-height:{min_height}px;">'
        f'<span class="tag-debug">{label}</span>'
        f'{inner_content}'
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
