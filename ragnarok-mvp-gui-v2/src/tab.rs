#[derive(Debug, Clone, PartialEq)]
pub enum TabContent {
    App,
    Browser,
}

#[derive(Debug, Clone)]
pub struct Tab {
    pub id: u64,
    pub label: String,
    pub content: TabContent,
    pub url: String,
    pub _can_go_back: bool,
    pub _can_go_forward: bool,
    pub _is_loading: bool,
}

#[derive(Debug)]
pub struct TabManager {
    pub tabs: Vec<Tab>,
    next_id: u64,
}

impl TabManager {
    pub fn new() -> Self {
        Self {
            tabs: vec![Tab {
                id: 0,
                label: "App".to_string(),
                content: TabContent::App,
                url: String::new(),
                _can_go_back: false,
                _can_go_forward: false,
                _is_loading: false,
            }],
            next_id: 1,
        }
    }

    pub fn add_browser_tab(&mut self) -> u64 {
        let id = self.next_id;
        self.next_id += 1;
        self.tabs.push(Tab {
            id,
            label: "New Tab".to_string(),
            content: TabContent::Browser,
            url: String::new(),
            _can_go_back: false,
            _can_go_forward: false,
            _is_loading: false,
        });
        id
    }

    pub fn remove_tab(&mut self, index: usize) {
        if index > 0 && index < self.tabs.len() {
            self.tabs.remove(index);
        }
    }

    pub fn get_index_by_id(&self, id: u64) -> Option<usize> {
        self.tabs.iter().position(|t| t.id == id)
    }
}
