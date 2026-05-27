pub fn green(value: impl AsRef<str>) -> String {
    paint("32", value)
}

pub fn red(value: impl AsRef<str>) -> String {
    paint("31", value)
}

pub fn cyan(value: impl AsRef<str>) -> String {
    paint("36", value)
}

pub fn dim(value: impl AsRef<str>) -> String {
    paint("2", value)
}

fn paint(code: &str, value: impl AsRef<str>) -> String {
    format!("\x1b[{code}m{}\x1b[0m", value.as_ref())
}
