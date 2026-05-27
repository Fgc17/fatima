use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;

pub fn render_command_bar(area: Rect, buffer: &mut Buffer) {
    Paragraph::new(Line::from(vec![
        Span::styled("a", theme::bold()),
        Span::styled(" add  ", theme::muted()),
        Span::styled("e", theme::bold()),
        Span::styled(" edit  ", theme::muted()),
        Span::styled("d", theme::bold()),
        Span::styled(" delete  ", theme::muted()),
        Span::styled("r", theme::bold()),
        Span::styled(" reveal  ", theme::muted()),
        Span::styled("v", theme::bold()),
        Span::styled(" view  ", theme::muted()),
        Span::styled("q", theme::bold()),
        Span::styled(" quit", theme::muted()),
    ]))
    .style(theme::base())
    .render(area, buffer);
}
