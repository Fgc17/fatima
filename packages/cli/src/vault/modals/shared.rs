use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};

use crate::vault::ui::atoms::footer::{render_inline_footer, FooterAction};
use crate::vault::ui::atoms::header::render_split_header;
use crate::vault::ui::modal::render_modal_surface;

pub fn render_modal_body(area: Rect, buffer: &mut Buffer, title: &str) -> Rect {
    let inner = render_modal_surface(area, buffer);
    let [header, body] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(2), Constraint::Min(0)])
        .areas(inner);
    render_split_header(header, buffer, title, Some("esc close"));
    body
}

pub fn render_footer(area: Rect, buffer: &mut Buffer, action: &str) {
    render_inline_footer(
        area,
        buffer,
        &[
            FooterAction {
                key: "enter",
                label: action,
            },
            FooterAction {
                key: "↑↓",
                label: "move",
            },
            FooterAction {
                key: "esc",
                label: "close",
            },
        ],
    );
}
