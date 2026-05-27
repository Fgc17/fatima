use super::style::{cyan, dim, green, red};

pub fn success(message: impl AsRef<str>) -> String {
    format!("{} {}", green("✔"), message.as_ref())
}

pub fn failure(message: impl AsRef<str>) -> String {
    format!("{} {}", red("✗"), message.as_ref())
}

pub fn generated(path: impl AsRef<str>) -> String {
    success(format!("Generated {}", cyan(path)))
}

pub fn meta(message: impl AsRef<str>) -> String {
    dim(message)
}

pub fn error_block(title: impl AsRef<str>, details: impl AsRef<str>) -> String {
    let details = details.as_ref().trim();
    if details.is_empty() {
        failure(title)
    } else {
        format!("{}\n{}", failure(title), diagnostic(details))
    }
}

fn diagnostic(details: &str) -> String {
    let mut lines = details.lines();
    let Some(title) = lines.next() else {
        return String::new();
    };

    let mut output = vec![format!("× {title}")];
    for line in lines {
        output.push(if line.is_empty() {
            "│".to_string()
        } else {
            format!("│ {line}")
        });
    }

    red(output.join("\n"))
}
