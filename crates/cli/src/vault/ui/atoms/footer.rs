use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;

#[derive(Clone, Copy, Debug)]
pub struct FooterAction<'a> {
    pub key: &'a str,
    pub label: &'a str,
}

pub fn render_inline_footer(area: Rect, buffer: &mut Buffer, actions: &[FooterAction<'_>]) {
    let mut spans = Vec::new();
    for (index, action) in actions.iter().enumerate() {
        if index > 0 {
            spans.push(Span::styled("  ", theme::modal_muted()));
        }
        spans.push(Span::styled(action.key.to_string(), theme::modal_bold()));
        spans.push(Span::styled(
            format!(" {}", action.label),
            theme::modal_muted(),
        ));
    }
    Paragraph::new(Line::from(spans))
        .style(theme::modal())
        .render(area, buffer);
}

pub fn render_balanced_footer(
    area: Rect,
    buffer: &mut Buffer,
    left: FooterAction<'_>,
    right: FooterAction<'_>,
) {
    let left_width = left.key.len() + 1 + left.label.len();
    let right_width = right.key.len() + 1 + right.label.len();
    let spacer = area
        .width
        .saturating_sub(left_width as u16)
        .saturating_sub(right_width as u16) as usize;
    Paragraph::new(Line::from(vec![
        Span::styled(left.key.to_string(), theme::modal_bold()),
        Span::styled(format!(" {}", left.label), theme::modal_muted()),
        Span::styled(" ".repeat(spacer), theme::modal()),
        Span::styled(right.key.to_string(), theme::modal_bold()),
        Span::styled(format!(" {}", right.label), theme::modal_muted()),
    ]))
    .style(theme::modal())
    .render(area, buffer);
}
