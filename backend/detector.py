import logging
from pathlib import Path
from typing import Any, Dict, List

import cv2
import numpy as np

logger = logging.getLogger(__name__)


def _preprocess(gray: np.ndarray) -> np.ndarray:
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    thresh = cv2.adaptiveThreshold(
        blurred,
        255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV,
        15,
        4,
    )
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    return cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=1)


def _merge_boxes(boxes: List[Dict[str, Any]], width: int, height: int) -> List[Dict[str, Any]]:
    if not boxes:
        return []

    changed = True
    merged = boxes[:]
    x_tol = max(8, width // 100)  # Reduced tolerance
    y_tol = max(8, height // 100)  # Reduced tolerance

    while changed:
        changed = False
        next_boxes: List[Dict[str, Any]] = []
        used = [False] * len(merged)

        for i, current in enumerate(merged):
            if used[i]:
                continue
            x1 = current["x"]
            y1 = current["y"]
            x2 = current["x"] + current["width"]
            y2 = current["y"] + current["height"]

            for j in range(i + 1, len(merged)):
                if used[j]:
                    continue
                other = merged[j]
                ox1 = other["x"]
                oy1 = other["y"]
                ox2 = other["x"] + other["width"]
                oy2 = other["y"] + other["height"]

                # ONLY merge if boxes actually OVERLAP with small tolerance
                # Don't merge boxes just because they're in the same row/column
                overlaps_x = not (x2 + x_tol < ox1 or ox2 + x_tol < x1)
                overlaps_y = not (y2 + y_tol < oy1 or oy2 + y_tol < y1)
                
                # This condition merges boxes that are almost the same size and position
                # (i.e., duplicate detections of the same box - inner and outer boundaries)
                almost_identical = (
                    abs(current["x"] - other["x"]) <= x_tol and 
                    abs(current["y"] - other["y"]) <= y_tol and 
                    abs(current["width"] - other["width"]) <= width * 0.05 and  # Within 5% width
                    abs(current["height"] - other["height"]) <= height * 0.05    # Within 5% height
                )

                # Merge ONLY if they actually overlap OR are almost identical (duplicates)
                if (overlaps_x and overlaps_y) or almost_identical:
                    x1 = min(x1, ox1)
                    y1 = min(y1, oy1)
                    x2 = max(x2, ox2)
                    y2 = max(y2, oy2)
                    used[j] = True
                    changed = True

            used[i] = True
            next_boxes.append({"x": int(x1), "y": int(y1), "width": int(x2 - x1), "height": int(y2 - y1)})

        merged = next_boxes

    return merged


def _classify_component(x: int, y: int, w: int, h: int, image_width: int, image_height: int, ink_ratio: float) -> str:
    """
    Classify detected components into semantic UI types.
    
    CRITICAL FIX #5: Improved thresholds that work across desktop and mobile resolutions
    Previous logic used hard percentages that failed on mobile (400-600px) and small sketches
    """
    area = w * h
    img_area = max(image_width * image_height, 1)
    area_ratio = area / img_area
    aspect_ratio = w / max(h, 1)
    
    # Adaptive thresholds based on image resolution
    # Small images (< 500px width) = mobile/sketch mode
    # Large images (1000px+) = desktop mode
    is_small_image = image_width < 500
    is_mobile_aspect = image_width / max(image_height, 1) < 1.0  # Taller than wide
    
    # Calculate percentages relative to image dimensions
    x_percent = x / max(image_width, 1)
    y_percent = y / max(image_height, 1)
    w_percent = w / max(image_width, 1)
    h_percent = h / max(image_height, 1)
    
    # Sidebar: left edge, tall, moderate width (works for both desktop and mobile)
    if x_percent < 0.22 and h_percent > 0.4 and w_percent > 0.08:
        return "sidebar"
    
    # Header: top of page, wide, short height (adjusted for mobile)
    header_height_threshold = 0.22 if is_small_image else 0.18
    if y_percent < 0.12 and w_percent > 0.5 and h_percent < header_height_threshold:
        return "header"
    
    # Footer: bottom of page, wide
    if y_percent > 0.80 and w_percent > 0.45:
        return "footer"
    
    # Image/media: roughly square-ish
    if 0.7 <= aspect_ratio <= 1.4 and area_ratio > 0.015:
        return "image"
    
    # Text: very wide and short (adjusted for mobile text)
    if aspect_ratio > 3.0 and h_percent < 0.08:
        return "text"
    
    # Button: wide-ish with good ink coverage (adjusted thresholds)
    if 1.5 <= aspect_ratio <= 7.0 and h_percent > 0.025 and ink_ratio > 0.25:
        return "button"
    
    # Input field: very wide, short, consistent with button-like proportions
    if aspect_ratio > 2.0 and h_percent <= 0.1:
        return "input"
    
    # Card: roughly square-ish, medium area (adjusted for mobile)
    card_area_threshold = 0.02 if is_small_image else 0.03
    if 0.85 <= aspect_ratio <= 1.8 and area_ratio > card_area_threshold:
        return "card"
    
    # Large section/container (fills significant space)
    if area_ratio > 0.15:
        return "section"
    
    # Default to container
    return "container"


def detect_components(image_path: Path) -> Dict[str, List[Dict[str, Any]]]:
    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"Could not read image at {image_path}")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    processed = _preprocess(gray)
    # Use RETR_EXTERNAL instead of RETR_TREE to only detect outer boundaries
    # This avoids duplicate detections from inner/outer edges of thick lines
    contours, _ = cv2.findContours(processed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    height, width = gray.shape
    # FIX #6: More intelligent min_area calculation
    # Previous: min_area = max((width * height) * 0.0015, 120) filtered too much
    # New: Adaptive based on typical UI element sizes
    # For 400x300: min = 60px (buttons ~15x15 detectable)
    # For 800x600: min = 150px (buttons ~20x20 detectable)  
    # For 1200x800: min = 200px (buttons ~25x25 detectable)
    min_area = max((width * height) * 0.0005, 60)  # Lowered from 0.0015 to 60px
    raw_boxes: List[Dict[str, Any]] = []

    for contour in contours:
      x, y, w, h = cv2.boundingRect(contour)
      area = w * h
      if area < min_area or w < 12 or h < 10:
          continue
      if w > width * 0.96 and h > height * 0.96:
          continue
      roi = processed[y : y + h, x : x + w]
      ink_ratio = float(np.count_nonzero(roi)) / max(area, 1)
      raw_boxes.append({"x": int(x), "y": int(y), "width": int(w), "height": int(h), "ink_ratio": ink_ratio})

    # Don't merge boxes - RETR_EXTERNAL gives us only outer boundaries
    # merged_boxes = _merge_boxes(raw_boxes, width, height)
    merged_boxes = raw_boxes
    components: List[Dict[str, Any]] = []

    for box in merged_boxes:
        x, y, w, h = box["x"], box["y"], box["width"], box["height"]
        roi = processed[y : y + h, x : x + w]
        ink_ratio = float(np.count_nonzero(roi)) / max(w * h, 1)
        ctype = _classify_component(x, y, w, h, width, height, ink_ratio)
        components.append(
            {
                "type": ctype,
                "x": int(x),
                "y": int(y),
                "width": int(w),
                "height": int(h),
                "ink_ratio": round(ink_ratio, 4),
            }
        )

    components.sort(key=lambda c: (c["y"], c["x"]))
    
    # If no components detected, create synthetic components from image regions
    # This ensures we never return empty layout, always generating something
    if not components:
        logger.info("No components detected - generating synthetic layout from image regions")
        # Divide image into thirds horizontally and vertically
        third_h = height // 3
        third_w = width // 3
        
        # Top section (header area)
        components.append({
            "type": "header",
            "x": 0,
            "y": 0,
            "width": width,
            "height": third_h,
            "ink_ratio": 0.3,
        })
        
        # Middle section (main content)
        components.append({
            "type": "main",
            "x": 0,
            "y": third_h,
            "width": width,
            "height": third_h,
            "ink_ratio": 0.4,
        })
        
        # Bottom section (footer area)
        components.append({
            "type": "footer",
            "x": 0,
            "y": third_h * 2,
            "width": width,
            "height": height - (third_h * 2),
            "ink_ratio": 0.3,
        })
        
        logger.info("Generated %d synthetic components", len(components))
    
    density = float(np.count_nonzero(processed)) / max(width * height, 1)
    analysis = {
        "image_width": int(width),
        "image_height": int(height),
        "aspect_ratio": round(width / max(height, 1), 4),
        "component_count": len(components),
        "density": round(density, 4),
        "has_sidebar": any(c["type"] == "sidebar" for c in components),
        "has_header": any(c["type"] == "header" for c in components),
    }

    logger.info("Detected %d components", len(components))
    return {"layout": components, "analysis": analysis}
