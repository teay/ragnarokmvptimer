# Architecture Plan: Chrome-like Tab System

## สถาปัตยกรรมปัจจุบัน (ก่อนเปลี่ยน)

```
MvpTimerApp
├── youtube_webview: Option<wry::WebView>     ← 1 instance, toggle on/off
├── SidePanel::right("yt_webview_panel")       ← resize ได้ 1 อัน
└── CentralPanel                                ← MVP timer UI
```

## สถาปัตยกรรมใหม่ (หลังเปลี่ยน)

```
MvpTimerApp
├── tab_manager: TabManager                     ← รายการ tabs ทั้งหมด
├── webview_manager: WebViewManager             ← จัดการ wry instances
├── dock_state: egui_dock::DockState            ← split panel layout tree
│   ├── Panel A: [Tab(index)]                   ← 1 panel = 1 tab
│   ├── Panel B: [Tab(index)]
│   └── ...
│       Supported layouts:
│       ├── 2-way: Horizontal([ Panel A | Panel B ])
│       ├── 3-way: Horizontal([ Panel A | Panel B | Panel C ])
│       └── Hybrid: Horizontal([ Vertical([A, B]) | C ])
└── CentralPanel (เดิม → ถูกลบ, dock ครอบคลุมทั้งหมด)
```

## Data Model

### `src/tab.rs` (ใหม่)

```rust
struct Tab {
    id: u64,
    label: String,           // "App" หรือ "Youtube" หรือ "Custom"
    content: TabContent,
}

enum TabContent {
    App,                     // Rust MVP timer UI
    Browser {
        url: String,
        title: String,
        history: Vec<String>,
        history_pos: usize,
        is_loading: bool,
    },
}
```

### `src/webview_manager.rs` (ใหม่)

```rust
struct WebViewManager {
    instances: HashMap<u64, WebViewInstance>,  // key = tab_id
}

struct WebViewInstance {
    webview: wry::WebView,
    tab_id: u64,
    last_bounds: egui::Rect,
}
```

## UI Flow (ใน `update()` แต่ละ frame)

```
1. ┌─ Toolbar ────────────────────────┐
   │ [+ Add Tab] [App] [YT] [Custom]  │
   │ ถ้า selected tab เป็น Browser:    │
   │ [←] [→] [⟳] [URL input........]  │
   └──────────────────────────────────┘
   
2. ┌─ egui_dock split tree ───────────────┐
   │  ┌────────┬──────────┬──────────┐    │
   │  │ App    │ Youtube  │ Custom   │    │
   │  │        │          │ (url...) │    │
   │  │        │ ← wry →  │ ← wry → │    │
   │  └────────┴──────────┴──────────┘    │
   │    33.3%    33.3%      33.4%        │
   │  ── ลาก divider ปรับขนาดได้ ────    │
   └──────────────────────────────────────┘

3. Sync: collect Rect ของทุก panel ที่มี Browser tab
   → webview_manager.sync_bounds(tab_rects)
   → set_bounds() สำหรับทุก wry instance
```

## วิธีใช้ `egui_dock`

`egui_dock` รองรับ tree-based split panels แบบนี้:

```rust
use egui_dock::{DockState, Style, TabViewer};

// สร้าง DockState ที่มี 3 tabs
let mut dock_state = DockState::new(vec!["App", "Youtube", "Custom"]);

// แบ่งเป็น 3 columns
if let Some(tree) = dock_state.main_surface_mut() {
    tree.split_left(0, SplitType::Vertical, 0.333);
    tree.split_left(1, SplitType::Vertical, 0.5);
    // → ได้ 3 panels: 33.3%, 33.3%, 33.4%
}

// Render
egui_dock::DockArea::new()
    .show(ctx, &mut dock_state, &mut tab_viewer);
```

## wry WebView Positioning Logic

```rust
// แต่ละ frame: สำหรับทุก External tab ที่ visible
for (tab_id, rect) in &visible_browser_tabs {
    let sf = ctx.input(|i| i.viewport().native_pixels_per_point.unwrap_or(1.0));
    let screen_rect = ctx.input(|i| i.viewport().inner_rect).unwrap();
    
    let web_x = (rect.min.x + screen_rect.left()) as f64 * sf;
    let web_y = (rect.min.y + screen_rect.top() + toolbar_height) as f64 * sf;
    let web_w = rect.width() as f64 * sf;
    let web_h = rect.height() as f64 * sf;
    
    wv.set_bounds(wry::Rect {
        position: PhysicalPosition::new(web_x, web_y),
        size: PhysicalSize::new(web_w, web_h),
    });
}
```

## Tab bar vs Dock interaction

Pattern: **global tab bar ส่วนกลาง** (ไม่แยกต่อ panel) → แต่ละ panel ใน dock ชี้ไปที่ tab index เดียวกันทั้งแอป (เหมือน VS Code ที่ tab เป็น global)

```
แนวคิด: "tab = content, panel = viewport"

Tab: [App] [Youtube] [Custom] [ChatGPT]
Panel 1: Youtube    ← ใช้ tab index 1
Panel 2: App        ← ใช้ tab index 0  
Panel 3: ChatGPT    ← ใช้ tab index 3
```

ถ้าต้องการให้ panel แต่ละอันมี tab bar ของตัวเอง (เหมือน Chrome จริงๆ) — ซับซ้อนขึ้นเยอะ แนะนำให้เริ่มจาก global tab ก่อน

## Dependencies เพิ่ม

```toml
egui_dock = "0.13"  
```

(หรือ version ล่าสุดที่ compatible กับ egui 0.31)

## รายการไฟล์ที่ต้องแก้ไข

| File | Action |
|---|---|
| `Cargo.toml` | + `egui_dock` |
| `src/tab.rs` | **ใหม่** — Tab, TabContent, TabManager |
| `src/webview_manager.rs` | **ใหม่** — WebView lifecycle, bounds sync |
| `src/app.rs` | แก้ไขเยอะ — เปลี่ยน struct fields, replace YT logic, integrate dock |
| `src/main.rs` | อาจไม่ต้องแก้ (ถ้าไม่มี module reg ใหม่) |

## Effort ประมาณ

| Component | Effort | Risk |
|---|---|---|
| TabManager struct | ~30 บรรทัด | ต่ำ |
| WebViewManager struct | ~100 บรรทัด | กลาง (wry lifecycle, multi-instance) |
| egui_dock integration | ~80 บรรทัด | ต่ำ (crate จัด layout ให้) |
| เปลี่ยน app.rs | ~100 บรรทัด | กลาง (ต้อง refactor update fn) |
| URL bar + navigation | ~50 บรรทัด | ต่ำ |
| Bounds syncing | ~40 บรรทัด | กลาง-สูง (coordinate math ถ้าผิด webview เลื่อนผิด) |
| **รวม** | **~400 บรรทัด** | **ปานกลาง** |

## ข้อเสนอแนะเพิ่มเติม

1. **เริ่มจาก 1-2 panels ก่อน** — อย่าเพิ่งทำ 3-way split รอบแรก, ทำ 2-way (ซ้ายขวา) ให้稳 ก่อน
2. **global tab ก่อน, per-panel tab ค่อยเพิ่มทีหลัง**
3. **ไม่จำเป็นต้องมี `egui_dock` ก็ได้** — ถ้าแค่ 2 panels แบ่งซ้ายขวา, เขียนเองด้วย `SidePanel` + `CentralPanel` ก็พอ (`egui_dock` จำเป็นเมื่อต้องการ n-way split แบบ complex tree)
4. **wry `set_bounds`** จะมี offset error ถ้า native_pixels_per_point ไม่ตรง — ต้อง test จริง บนจอ retina/non-retina
5. **UX tip:** ควรมีปุ่ม "Detach to window" สำหรับ external tab → เปิดเป็น native window แยก (wry สร้างเป็น child window ก็ได้) — ไม่จำเป็นรอบแรกแต่ future nice-to-have
