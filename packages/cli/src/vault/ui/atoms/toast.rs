use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::style::Color;
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;

pub fn render_toast(area: Rect, buffer: &mut Buffer, value: &str, error: bool) {
    let toast = Rect {
        x: area.x,
        y: area.y,
        width: area.width.min(value.len() as u16 + 4),
        height: 1,
    };
    let style = if error {
        theme::fg().bg(Color::Rgb(0x1c, 0x0d, 0x0d))
    } else {
        theme::surface()
    };
    Paragraph::new(format!(" {value} "))
        .style(style)
        .render(toast, buffer);
}
