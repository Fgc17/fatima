#[derive(Clone, Debug, Default)]
pub struct TextFieldState {
    pub value: String,
    pub cursor: usize,
}

impl TextFieldState {
    pub fn insert(&mut self, value: &str) {
        self.value.insert_str(self.cursor, value);
        self.cursor += value.len();
    }

    pub fn backspace(&mut self) {
        if self.cursor == 0 {
            return;
        }
        self.cursor -= 1;
        self.value.remove(self.cursor);
    }

    pub fn clear(&mut self) {
        self.value.clear();
        self.cursor = 0;
    }
}
