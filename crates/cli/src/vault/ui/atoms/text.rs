pub fn truncate(value: &str, width: usize) -> String {
    if value.chars().count() > width {
        let take = width.saturating_sub(1);
        format!("{}…", value.chars().take(take).collect::<String>())
    } else {
        format!("{value:<width$}")
    }
}
