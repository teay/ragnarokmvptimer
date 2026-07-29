use std::collections::HashMap;

pub struct WebViewInstance {
    pub webview: wry::WebView,
    #[allow(dead_code)]
    pub tab_id: u64,
}

pub struct WebViewManager {
    pub instances: HashMap<u64, WebViewInstance>,
}

impl WebViewManager {
    pub fn new() -> Self {
        Self {
            instances: HashMap::new(),
        }
    }

    pub fn create(&mut self, tab_id: u64, frame: &eframe::Frame, url: &str) {
        if self.instances.contains_key(&tab_id) {
            return;
        }
        let mut data_path = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|d| d.to_path_buf()))
            .unwrap_or_else(|| std::path::PathBuf::from("."));
        data_path.push("webview_data");
        let mut web_ctx = wry::WebContext::new(Some(data_path));
        if let Ok(webview) = wry::WebViewBuilder::new_with_web_context(&mut web_ctx)
            .with_url(url)
            .build_as_child(frame)
        {
            self.instances.insert(
                tab_id,
                WebViewInstance {
                    webview,
                    tab_id,
                },
            );
        }
    }

    pub fn ensure_created(&mut self, tab_id: u64, frame: &eframe::Frame) {
        if !self.instances.contains_key(&tab_id) {
            self.create(tab_id, frame, "about:blank");
            // Return focus to egui so the user can type in the URL bar
            if let Some(inst) = self.instances.get(&tab_id) {
                let _ = inst.webview.focus_parent();
            }
        }
    }

    pub fn load_url(&self, tab_id: u64, url: &str) {
        if let Some(inst) = self.instances.get(&tab_id) {
            let _ = inst.webview.load_url(url);
        }
    }

    pub fn load_blank(&self, tab_id: u64) {
        if let Some(inst) = self.instances.get(&tab_id) {
            let _ = inst.webview.load_url("about:blank");
        }
    }

    pub fn go_back(&self, tab_id: u64) {
        if let Some(inst) = self.instances.get(&tab_id) {
            let _ = inst.webview.evaluate_script("window.history.back()");
        }
    }

    pub fn go_forward(&self, tab_id: u64) {
        if let Some(inst) = self.instances.get(&tab_id) {
            let _ = inst.webview.evaluate_script("window.history.forward()");
        }
    }

    pub fn reload(&self, tab_id: u64) {
        if let Some(inst) = self.instances.get(&tab_id) {
            let _ = inst.webview.reload();
        }
    }

    pub fn remove(&mut self, tab_id: u64) {
        self.instances.remove(&tab_id);
    }

    pub fn cleanup(&mut self, active_ids: &[u64]) {
        let active: std::collections::HashSet<u64> = active_ids.iter().copied().collect();
        self.instances.retain(|id, _| active.contains(id));
    }

    pub fn sync_bounds(
        &self,
        panel_rects: &[(u64, egui::Rect)],
        sf: f64,
    ) {
        for (tab_id, rect) in panel_rects {
            if let Some(inst) = self.instances.get(tab_id) {
                let web_x = rect.min.x as f64 * sf;
                let web_y = rect.min.y as f64 * sf;
                let web_w = rect.width() as f64 * sf;
                let web_h = rect.height() as f64 * sf;

                if web_w > 50.0 && web_h > 50.0 {
                    let _ = inst.webview.set_bounds(wry::Rect {
                        position: wry::dpi::PhysicalPosition::new(web_x, web_y).into(),
                        size: wry::dpi::PhysicalSize::new(web_w, web_h).into(),
                    });
                }
            }
        }
    }
}
