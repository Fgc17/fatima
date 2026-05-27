use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Paragraph, Widget};

use crate::vault::state::TextFieldState;
use crate::vault::theme;

pub fn render_field(
    area: Rect,
    buffer: &mut Buffer,
    label: &str,
    field: &TextFieldState,
    active: bool,
    mask: Option<char>,
) {
    if area.height < 3 {
        return;
    }
    Block::new().style(theme::modal()).render(area, buffer);
    let label_area = Rect { height: 1, ..area };
    let input_area = Rect {
        y: area.y + 2,
        height: 1,
        ..area
    };
    render_field_label(label_area, buffer, label, active);
    render_input(input_area, buffer, field, active, mask);
}

fn render_field_label(area: Rect, buffer: &mut Buffer, label: &str, active: bool) {
    Paragraph::new(label.to_string())
        .style(if active {
            theme::modal_fg()
        } else {
            theme::modal_muted()
        })
        .render(area, buffer);
}

fn render_input(
    area: Rect,
    buffer: &mut Buffer,
    field: &TextFieldState,
    active: bool,
    mask: Option<char>,
) {
    Block::new()
        .style(theme::input(active))
        .render(area, buffer);
    let visible = if let Some(mask) = mask {
        mask.to_string().repeat(field.value.chars().count())
    } else {
        field.value.clone()
    };
    Paragraph::new(Line::from(Span::styled(
        format!(" {}", visible),
        theme::input_fg(active),
    )))
    .style(theme::input(active))
    .render(area, buffer);
}
