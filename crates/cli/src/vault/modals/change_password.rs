use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::modals::shared::{render_footer, render_modal_body};
use crate::vault::models::ModalFocus;
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::modal::modal_area;

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let area = modal_area(area, 15);
    let body = render_modal_body(area, buffer, "Rotate password");
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Length(3),
            Constraint::Length(1),
            Constraint::Length(3),
            Constraint::Length(1),
            Constraint::Length(1),
        ])
        .split(body);
    Paragraph::new("User keys remain active.")
        .style(theme::modal_muted())
        .render(rows[0], buffer);
    render_field(
        rows[2],
        buffer,
        "New password",
        &state.field_password,
        state.modal_focus == ModalFocus::Password,
        Some('*'),
    );
    render_field(
        rows[4],
        buffer,
        "Confirm password",
        &state.field_confirm_password,
        state.modal_focus == ModalFocus::ConfirmPassword,
        Some('*'),
    );
    render_footer(rows[6], buffer, "change password");
}
