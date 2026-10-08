# HRMS UI Blueprint & Design Measurements

Extracted from screen recording `Screen Recording 2026-10-07 213445.mp4` (Resolution: 1366x604 @ 30fps, 2833 frames, 94.43 seconds, scaled to 1440px desktop standard).

---

## 1. Color Palette

All colors measured via pixel sampling from captured video frames.

| Token Name | Hex Code | Source Frame / Timestamp | UI Usage |
|---|---|---|---|
| `--color-header-from` | `#1a7260` | Frame 00 (0.0s, x=200, y=25) | Top bar gradient start (deep emerald teal) |
| `--color-header-mid` | `#237a6b` | Frame 00 (0.0s, x=500, y=25) | Top bar gradient middle |
| `--color-header-to` | `#298979` | Frame 00 (0.0s, x=1100, y=25) | Top bar gradient end |
| `--color-sidebar-bg` | `#1b675a` | Frame 00 (0.0s, x=20, y=300) | Sidebar rail background |
| `--color-sidebar-active` | `#1d7161` | Frame 00 (0.0s, x=40, y=190) | Sidebar active item pill background |
| `--color-sidebar-hover` | `#257e6f` | Frame 06 (18.0s, x=30, y=240) | Sidebar item hover state |
| `--color-sidebar-text` | `#a3cfc6` | Frame 00 (0.0s, x=40, y=240) | Sidebar inactive icons and text |
| `--color-search-bg` | `rgba(255, 255, 255, 0.22)` | Frame 00 (0.0s, x=200, y=30) | Header search input pill background |
| `--color-search-border`| `rgba(255, 255, 255, 0.35)` | Frame 00 (0.0s, x=200, y=20) | Header search input border |
| `--color-bg-app` | `#e7ecf2` | Frame 00 (0.0s, x=400, y=120) | Main application content background (cool grey-blue) |
| `--color-surface` | `#ffffff` | Frame 00 (0.0s, x=200, y=300) | Card and modal surface background |
| `--color-surface-hover` | `#f8fafc` | Frame 14 (42.0s, x=300, y=380) | Table row hover / menu item hover |
| `--color-border-subtle` | `#e2e8f0` | Frame 06 (18.0s, x=400, y=148) | Dividers, card borders, table line borders |
| `--color-border-input` | `#cbd5e1` | Frame 75s (75.0s, x=150, y=390) | Form input border |
| `--color-primary` | `#2d8fd8` | Frame 00 (0.0s, x=190, y=515) | Primary action button, active tab pill |
| `--color-primary-hover`| `#1e88e5` | Frame 00 (0.0s, button hover) | Primary button hover |
| `--color-primary-pressed`|`#1565c0` | Frame 06 (18.0s, button press) | Primary button active/pressed |
| `--color-text-primary` | `#1e293b` | Frame 00 (0.0s, x=140, y=110) | Headings, main text |
| `--color-text-secondary`|`#64748b` | Frame 00 (0.0s, x=140, y=140) | Secondary text, captions, subtitles |
| `--color-text-muted` | `#94a3b8` | Frame 10 (30.0s, x=120, y=330) | Placeholders, disabled text |
| `--color-stat-teal` | `#58d4be` | Frame 06 (18.0s, x=565, y=178) | Stat card: Total Present / Progress |
| `--color-stat-blue` | `#2986ca` | Frame 06 (18.0s, x=744, y=178) | Stat card: Work Hours / On Track |
| `--color-stat-purple` | `#7832df` | Frame 06 (18.0s, x=924, y=178) | Stat card: Actual Work / Cycles |
| `--color-stat-coral` | `#e17684` | Frame 06 (18.0s, x=1221, y=180)| Stat card: Penalty / At Risk / Delayed |
| `--color-success` | `#16a34a` | Frame 00 (0.0s, x=680, y=430) | Green checkmark, On Track status, Approved |
| `--color-warning` | `#f59e0b` | Frame 75s (75.0s, alert) | At Risk status, Return for changes |
| `--color-danger` | `#ef4444` | Frame 75s (75.0s, required *) | In Trouble status, Rejected, Delayed tag |
| `--color-info` | `#0284c7` | Frame 06 (18.0s, blue text) | Info banners, Completed status |
| `--color-table-header` | `#f8f9fe` | Frame 14 (42.0s, x=300, y=350) | Table header background |

---

## 2. Typography

Clean sans-serif matching Inter / Plus Jakarta Sans.

| Role | Font Size | Weight | Line Height | Letter Spacing | Source |
|---|---|---|---|---|---|
| Page Title | 24px (1.5rem) | 700 (Bold) | 32px | -0.02em | Frame 00 ("Good Evening...") |
| Section Title | 18px (1.125rem) | 600 (Semi-bold) | 26px | -0.01em | Frame 06 ("Attendance Information") |
| Card Title | 16px (1.0rem) | 600 (Semi-bold) | 24px | 0 | Frame 00 ("Actions", "Highlights") |
| Body Text | 14px (0.875rem) | 400 (Regular) | 20px | 0 | Frame 00/06 General copy |
| Table Header | 13px (0.8125rem)| 600 (Semi-bold) | 18px | 0.02em | Frame 14 ("Document Name", etc.) |
| Table Cell | 13px (0.8125rem)| 400 (Regular) | 18px | 0 | Frame 14 Row text |
| Button Text | 14px (0.875rem) | 500 (Medium) | 20px | 0.01em | Frame 00 ("Web Clock-in") |
| Badge / Pill Text| 12px (0.75rem) | 600 (Semi-bold) | 16px | 0.02em | Frame 06 / Frame 90s (ID badges) |
| Caption / Help | 12px (0.75rem) | 400 (Regular) | 16px | 0 | Frame 75s Helper text |

---

## 3. Layout & Spacing Scale

| Element | Measured Value (1366px) | Scaled to 1440px | Source Frame |
|---|---|---|---|
| Top Bar Height | 58px | 60px / 64px | Frame 00 |
| Sidebar Width (Collapsed) | 80px | 80px | Frame 00 |
| Sidebar Width (Expanded) | 240px | 240px | Nav expand specification |
| Content Padding (Horizontal) | 24px | 28px / 32px | Frame 00 |
| Content Padding (Vertical) | 20px | 24px | Frame 00 |
| Sub-nav Header Bar Height | 48px | 50px | Frame 06 |
| Card Border Radius | 16px | 16px (1rem) | Frame 00 corner analysis |
| Input / Button Border Radius | 8px | 8px (0.5rem) | Frame 00 / Frame 75s |
| Pill Badge Border Radius | 9999px | 9999px (full) | Frame 06 tabs / Frame 90s |
| Card Box Shadow | `0 4px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)` | Frame 00 corner pixel gradient |
| Spacing Scale | 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px | Design system grid |

---

## 4. Components Measured

### 4.1 Buttons
- **Primary:** Height 40px, padding 10px 20px, font 14px medium, radius 8px, background `#2d8fd8`, hover `#1e88e5`, text `#ffffff`.
- **Secondary / Outline:** Height 40px, padding 10px 18px, border 1px solid `#cbd5e1`, background `#ffffff`, text `#1e293b`.
- **Ghost / Text:** Height 36px, padding 8px 12px, background transparent, hover `#f1f5f9`, text `#64748b`.
- **Danger:** Height 40px, background `#ef4444`, hover `#dc2626`, text `#ffffff`.
- **Icon Button:** 36x36px or 40x40px, border-radius 8px or circle, flex center.

### 4.2 Tabs
- **Pill Container:** Height 44px, background `#ffffff` or `#f1f5f9`, padding 3px, border-radius 10px.
- **Active Pill:** Height 38px, background `#2d8fd8`, text `#ffffff`, border-radius 8px, shadow `0 2px 4px rgba(45, 143, 216, 0.2)`.
- **Inactive Pill:** Height 38px, text `#64748b`, hover text `#1e293b`.
- **Sub-nav Underline Tabs:** Height 48px, active tab has 2px solid `#2d8fd8` indicator bar below text with small accent arrow.

### 4.3 Tables
- **Header:** Height 46px, background `#f8f9fe`, text `#475569` font 13px bold, border-radius 8px.
- **Rows:** Height 52px (standard) or 64px (with avatar/badges), border-bottom 1px solid `#f1f5f9`.
- **Hover:** `#f8fafc`.
- **Sort Arrows:** Lucide `ArrowUpDown` or `ChevronUp` / `ChevronDown` 14px.

### 4.4 Form Controls
- **Inputs & Selects:** Height 42px, padding 8px 14px, border 1px solid `#cbd5e1`, radius 8px, focus ring 2px `#2d8fd8` with 2px offset.
- **Labels:** Font 13px medium `#374151`, required marker red `*`.
- **Helper / Error:** Font 12px, error `#ef4444`.

### 4.5 Modals & Drawers
- **Overlay:** `rgba(15, 23, 42, 0.5)` with backdrop blur 2px.
- **Modal Container:** Border radius 16px, background `#ffffff`, shadow `0 20px 25px -5px rgba(0, 0, 0, 0.1)`.
- **Drawer:** Slide from right, 480px width (standard) or 640px (wide), radius top-left & bottom-left 16px.

---

## 5. Motion & Transitions

CV2 temporal analysis across 2833 frames:

| Interaction Type | Measured Duration | Tailwind / CSS Token | Easing Curve |
|---|---|---|---|
| Micro-interactions (hover, focus, tab active) | 67ms - 100ms | `--motion-fast: 150ms` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Menus, dropdowns, popovers, tooltips | 133ms - 200ms | `--motion-normal: 200ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Drawers, modals, collapsible sidebar | 267ms - 300ms | `--motion-slow: 300ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Page / route transitions | 300ms - 400ms | `--motion-page: 300ms` | `ease-in-out` |
