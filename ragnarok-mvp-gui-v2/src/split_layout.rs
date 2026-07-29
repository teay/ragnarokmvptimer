const DIVIDER_THICKNESS: f32 = 6.0;
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum SplitMode {
    Single,
    Dual,
    Triple,
}

impl SplitMode {
    pub fn panel_count(&self) -> usize {
        match self {
            SplitMode::Single => 1,
            SplitMode::Dual => 2,
            SplitMode::Triple => 3,
        }
    }
}

#[derive(Debug)]
pub struct SplitLayout {
    pub mode: SplitMode,
    pub panel_tabs: Vec<usize>,
    dividers: Vec<f32>,
}

impl SplitLayout {
    pub fn new() -> Self {
        Self {
            mode: SplitMode::Single,
            panel_tabs: vec![0],
            dividers: vec![],
        }
    }

    pub fn set_mode(&mut self, mode: SplitMode, total_tabs: usize) {
        match mode {
            SplitMode::Single => {
                self.dividers = vec![];
                self.panel_tabs = vec![self.panel_tabs[0].min(total_tabs - 1)];
            }
            SplitMode::Dual => {
                self.dividers = vec![0.5];
                let t0 = self.panel_tabs[0].min(total_tabs - 1);
                let t1 = if self.panel_tabs.len() > 1 {
                    self.panel_tabs[1].min(total_tabs - 1)
                } else {
                    (t0 + 1) % total_tabs
                };
                self.panel_tabs = vec![t0, t1];
            }
            SplitMode::Triple => {
                self.dividers = vec![1.0 / 3.0, 2.0 / 3.0];
                let t0 = self.panel_tabs[0].min(total_tabs - 1);
                let t1 = if self.panel_tabs.len() > 1 {
                    self.panel_tabs[1].min(total_tabs - 1)
                } else {
                    (t0 + 1) % total_tabs
                };
                let t2 = if self.panel_tabs.len() > 2 {
                    self.panel_tabs[2].min(total_tabs - 1)
                } else {
                    (t1 + 1) % total_tabs
                };
                self.panel_tabs = vec![t0, t1, t2];
            }
        }
        self.mode = mode;
    }

    pub fn get_panel_rects(&self, available: egui::Rect) -> Vec<(usize, egui::Rect)> {
        let count = self.mode.panel_count();
        let total_w = available.width();
        let mut results = Vec::with_capacity(count);

        match self.mode {
            SplitMode::Single => {
                results.push((self.panel_tabs[0], available));
            }
            SplitMode::Dual => {
                let d0 = self.dividers[0];
                let w0 = total_w * d0 - DIVIDER_THICKNESS / 2.0;
                let w1 = total_w * (1.0 - d0) - DIVIDER_THICKNESS / 2.0;

                let r0 = egui::Rect::from_min_size(
                    egui::pos2(available.min.x, available.min.y),
                    egui::vec2(w0.max(0.0), available.height()),
                );
                let r1 = egui::Rect::from_min_size(
                    egui::pos2(available.min.x + total_w * d0 + DIVIDER_THICKNESS / 2.0, available.min.y),
                    egui::vec2(w1.max(0.0), available.height()),
                );
                results.push((self.panel_tabs[0], r0));
                results.push((self.panel_tabs[1], r1));
            }
            SplitMode::Triple => {
                let d0 = self.dividers[0];
                let d1 = self.dividers[1];
                let seg_w = |a: f32, b: f32| {
                    ((b - a) * total_w - DIVIDER_THICKNESS * if b - a > 0.0 { 1.0 } else { 0.0 })
                        .max(0.0)
                };

                let w0 = seg_w(0.0, d0);
                let w1 = seg_w(d0, d1);
                let w2 = seg_w(d1, 1.0);

                let r0 = egui::Rect::from_min_size(
                    egui::pos2(available.min.x, available.min.y),
                    egui::vec2(w0, available.height()),
                );
                let r1 = egui::Rect::from_min_size(
                    egui::pos2(available.min.x + total_w * d0 + DIVIDER_THICKNESS / 2.0, available.min.y),
                    egui::vec2(w1, available.height()),
                );
                let r2 = egui::Rect::from_min_size(
                    egui::pos2(available.min.x + total_w * d1 + DIVIDER_THICKNESS / 2.0, available.min.y),
                    egui::vec2(w2, available.height()),
                );
                results.push((self.panel_tabs[0], r0));
                results.push((self.panel_tabs[1], r1));
                results.push((self.panel_tabs[2], r2));
            }
        }
        results
    }

    pub fn render_dividers(&mut self, ui: &mut egui::Ui, available: egui::Rect) {
        let count = self.mode.panel_count();
        if count < 2 {
            return;
        }

        let total_w = available.width();
        let y0 = available.min.y;
        let y1 = available.max.y;

        let divider_positions: Vec<f32> = match self.mode {
            SplitMode::Dual => vec![self.dividers[0] * total_w + available.min.x],
            SplitMode::Triple => vec![
                self.dividers[0] * total_w + available.min.x,
                self.dividers[1] * total_w + available.min.x,
            ],
            _ => vec![],
        };

        for (i, &x) in divider_positions.iter().enumerate() {
            let divider_rect = egui::Rect::from_min_size(
                egui::pos2(x - DIVIDER_THICKNESS / 2.0, y0),
                egui::vec2(DIVIDER_THICKNESS, y1 - y0),
            );

            ui.ctx().set_cursor_icon(egui::CursorIcon::ResizeHorizontal);

            let painter = ui.painter_at(divider_rect);
            painter.rect_filled(divider_rect, 0.0, egui::Color32::from_rgb(60, 60, 70));

            let hovered = divider_rect.contains(ui.input(|i| i.pointer.hover_pos().unwrap_or(egui::pos2(-1.0, -1.0))));
            if hovered {
                painter.rect_filled(divider_rect, 0.0, egui::Color32::from_rgb(80, 80, 100));
            }

            let pointer_down = ui.input(|i| i.pointer.any_down());
            let pointer_pos = ui.input(|i| i.pointer.hover_pos());

            if hovered && pointer_down {
                if let Some(pos) = pointer_pos {
                    let new_d = ((pos.x - available.min.x) / total_w).clamp(0.05, 0.95);

                    match self.mode {
                        SplitMode::Dual => {
                            self.dividers[0] = new_d;
                        }
                        SplitMode::Triple => {
                            if i == 0 {
                                self.dividers[0] = new_d.min(self.dividers[1] - 0.05);
                            } else {
                                self.dividers[1] = new_d.max(self.dividers[0] + 0.05);
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
    }

}
