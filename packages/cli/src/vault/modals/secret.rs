use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::modals::shared::{render_footer, render_modal_body};
use crate::vault::models::ModalFocus;
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::modal::modal_area;

pub fn render_form(
    area: Rect,
    buffer: &mut Buffer,
    state: &VaultAppState,
    title: &str,
    action: &str,
) {
    let area = modal_area(area, 15);
    let body = render_modal_body(area, buffer, title);
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
    Paragraph::new(format!("Environment: {}", state.focused_environment()))
        .style(theme::modal_muted())
        .render(rows[0], buffer);
    render_field(
        rows[2],
        buffer,
        "Key",
        &state.field_key,
        state.modal_focus == ModalFocus::Key,
        None,
    );
    render_field(
        rows[4],
        buffer,
        "Value",
        &state.field_value,
        state.modal_focus == ModalFocus::Value,
        None,
    );
    render_footer(rows[6], buffer, action);
}

pub fn render_delete(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let name = state
        .active_secret()
        .map(|secret| secret.key)
        .unwrap_or_default();
    render_confirm(
        area,
        buffer,
        "Delete secret",
        &format!("Delete {name}? This cannot be undone."),
        "delete",
    );
}

pub fn render_confirm(area: Rect, buffer: &mut Buffer, title: &str, message: &str, action: &str) {
    let area = modal_area(area, 8);
    let body = render_modal_body(area, buffer, title);
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(2), Constraint::Length(1)])
        .split(body);
    Paragraph::new(message)
        .style(theme::modal_muted())
        .render(rows[0], buffer);
    render_footer(rows[1], buffer, action);
}
