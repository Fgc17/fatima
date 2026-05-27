use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};

use crate::vault::state::VaultAppState;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::atoms::footer::{render_balanced_footer, FooterAction};
use crate::vault::ui::atoms::header::render_split_header;
use crate::vault::ui::modal::{modal_area, render_modal_surface};

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let area = modal_area(area, 10);
    let inner = render_modal_surface(area, buffer);
    let [header, body] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(2), Constraint::Min(0)])
        .areas(inner);
    render_split_header(header, buffer, "Unlock vault", Some("esc close"));

    let double_space: Constraint = Constraint::Length(2);
    let field: Constraint = Constraint::Length(3);
    let footer: Constraint = Constraint::Length(1);

    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([field, double_space, footer])
        .split(body);

    render_field(
        rows[0],
        buffer,
        "Master password",
        &state.password,
        true,
        Some('*'),
    );
    render_footer(rows[2], buffer);
}

fn render_footer(area: Rect, buffer: &mut Buffer) {
    render_balanced_footer(
        area,
        buffer,
        FooterAction {
            key: "enter",
            label: "unlock",
        },
        FooterAction {
            key: "esc",
            label: "quit",
        },
    );
}
