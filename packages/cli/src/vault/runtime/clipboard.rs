use std::io::{self, Write};

use base64::Engine;

pub fn copy_osc52(value: &str) -> io::Result<()> {
    let encoded = base64::engine::general_purpose::STANDARD.encode(value.as_bytes());
    let mut stdout = io::stdout();
    write!(stdout, "\x1b]52;c;{encoded}\x07")?;
    stdout.flush()
}
