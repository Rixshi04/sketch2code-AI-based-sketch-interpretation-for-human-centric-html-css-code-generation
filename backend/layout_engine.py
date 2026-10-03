from typing import Any, Dict, List


def build_layout_tree(detected: Dict[str, Any], description: str = "") -> Dict[str, Any]:
    components = [dict(c) for c in detected.get("layout", []) if isinstance(c, dict)]
    components.sort(key=lambda c: (int(c.get("y", 0)), int(c.get("x", 0))))
    rows: List[Dict[str, Any]] = []
    tolerance = 24
    for component in components:
        y = int(component.get("y", 0))
        row = next((r for r in rows if abs(int(r["y"]) - y) <= tolerance), None)
        if row is None:
            row = {"y": y, "components": []}
            rows.append(row)
        row["components"].append(component)
    rows.sort(key=lambda r: r["y"])
    sections = [
        {"name": "section-" + str(i + 1), "kind": row["components"][0].get("type", "container"), "y": row["y"]}
        for i, row in enumerate(rows) if row["components"]
    ]
    template = detected.get("template") or detected.get("analysis", {}).get("template") or "landing"
    return {**detected, "rows": rows, "sections": sections, "template": template, "description": description or detected.get("description", "")}
