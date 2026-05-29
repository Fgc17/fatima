use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;

pub fn render_split_header(area: Rect, buffer: &mut Buffer, left: &str, right: Option<&str>) {
    let right = right.unwrap_or_default();
    let spacer = area
        .width
        .saturating_sub(left.len() as u16)
        .saturating_sub(right.len() as u16) as usize;
    Paragraph::new(Line::from(vec![
        Span::styled(left.to_string(), theme::modal_bold()),
        Span::styled(" ".repeat(spacer), theme::modal()),
        Span::styled(right.to_string(), theme::modal_faint()),
    ]))
    .style(theme::modal())
    .render(area, buffer);
}
