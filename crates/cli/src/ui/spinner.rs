use std::time::Duration;

use indicatif::{ProgressBar, ProgressStyle};

pub struct Spinner {
    inner: ProgressBar,
}

impl Spinner {
    pub fn start(message: impl Into<String>) -> Self {
        let inner = ProgressBar::new_spinner();
        inner.set_style(
            ProgressStyle::with_template("{spinner:.green} {msg}")
                .expect("spinner template should be valid"),
        );
        inner.enable_steady_tick(Duration::from_millis(120));
        inner.set_message(message.into());
        Self { inner }
    }

    pub fn clear(self) {
        self.inner.finish_and_clear();
    }
}
