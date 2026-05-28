use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;
use crate::vault::ui::atoms::toast::{render_toast_right, ToastTone};

pub fn render_command_bar(area: Rect, buffer: &mut Buffer, toast: Option<(&str, ToastTone)>) {
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
        Span::styled("o", theme::bold()),
        Span::styled(" output  ", theme::muted()),
        Span::styled("q", theme::bold()),
        Span::styled(" quit", theme::muted()),
    ]))
    .style(theme::base())
    .render(area, buffer);

    if let Some((value, tone)) = toast {
        render_toast_right(area, buffer, value, tone);
    }
}
