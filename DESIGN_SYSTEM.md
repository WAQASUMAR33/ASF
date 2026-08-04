# Airports Security Force (ASF) IMS - Official Design System & UI Specification

This document serves as the **Single Source of Truth (SSOT)** for all UI/UX design, layout, styling, and Material UI component implementations across the ASF Inventory Management System web application.

---

## 1. Color Palette & Brand Tokens (ASF Deep Forest Green)

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Primary (ASF Deep Forest Green)** | `#1e5631` / `#1b4d2e` | Main brand headers, primary buttons, table headers, logo badges |
| **Secondary (Muted Accent Green)** | `#2d6a4f` / `#386641` | Action triggers, status chips, quick selectors, success indicators |
| **Background Default** | `#faf8f5` / `#f8f9fa` | Warm off-white / light ivory portal background |
| **Background Paper** | `#ffffff` | Pure white cards, elevation surfaces, table containers, dialogs |
| **Input Fill Background** | `#f5f5f3` / `#f0f2ee` | Soft rounded input container fill (`borderRadius: 12px`) |
| **Border Color** | `#e0e2db` / `#e2e8f0` | Card dividers, table borders, list item outlines |
| **Text Primary** | `#191c1a` | Deep charcoal primary text |
| **Text Secondary** | `#56615b` / `#666666` | Muted subtitle text and captions |
| **Error Red** | `#c0392b` | Deficiency alerts, return notes, lock warnings |
| **Warning Amber** | `#d97706` | Pending approval statuses, warning chips |

---

## 2. Component Implementation Standards

### 2.1 Material UI (MUI v5)
- All pages must consume components exclusively from `@mui/material` and `@mui/icons-material`.
- Wrapped globally in `src/components/theme/ThemeRegistry.tsx` (`mode: 'light'`).
- Input TextFields use rounded corners (`borderRadius: 12px` / `0.75rem`) with soft fill (`#f5f5f3`).

### 2.2 Navigation Layout (Navbar & Sidebar)
- **Top Navbar:** Pure white (`#ffffff`) AppBar with `1px solid #e0e2db` bottom border.
  - Left: ASF Deep Forest Green (`#1e5631`) logo icon & brand title.
  - Right: User profile chips, station scope badges, 2FA status, and sign-out button.
- **Sidebar Drawer:** Pure white (`#ffffff`) background with `1px solid #e0e2db` right border.
  - Active Menu Item: Highlighted with `rgba(30, 86, 49, 0.08)` background and `#1e5631` border.

### 2.3 Portal Authentication (`/login`)
- **Header:** "WELCOME BACK" in tracked green (`#2d6a4f`), "Sign in" title in bold `#191c1a`.
- **Fields:** "FORCE NUMBER / USERNAME" and "PASSWORD" with rounded off-white inputs (`#f5f5f3`).
- **Button:** Deep Forest Green (`#1e5631`) sign-in button with smooth hover elevation.
- **Role Selector:** Muted Forest Green outline buttons (`#2d6a4f`).

### 2.4 Data Tables & Data Grids
- **Table Head (`TableHead`):** Deep Forest Green background (`#1e5631`) with bold white text (`#ffffff`).
- **Table Rows (`TableRow`):** Alternating hover states with crisp `#e0e2db` cell borders.

---

## 3. Strict Development Rules for AI Agents

1. **Always Read `DESIGN_SYSTEM.md`:** Before generating or modifying any UI component or page, inspect `DESIGN_SYSTEM.md` to ensure exact color token and component compliance.
2. **Strict Palette Enforcement:** Always use ASF Deep Forest Green (`#1e5631`) and Muted Green (`#2d6a4f`). Do not use dark navy or purple.
3. **MUI Consistency:** Ensure all modal dialogs, inputs, buttons, tables, chips, and cards use MUI v5 components wrapped in `ThemeRegistry`.
