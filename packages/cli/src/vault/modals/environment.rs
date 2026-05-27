use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::modals::secret::render_confirm;
use crate::vault::modals::shared::{render_footer, render_modal_body};
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::modal::modal_area;

pub fn render_name_form(
    area: Rect,
    buffer: &mut Buffer,
    state: &VaultAppState,
    title: &str,
    label: &str,
    action: &str,
) {
    let area = modal_area(area, 11);
    let body = render_modal_body(area, buffer, title);
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Length(3),
            Constraint::Length(1),
            Constraint::Length(1),
        ])
        .split(body);
    Paragraph::new("Project vault environment.")
        .style(theme::modal_muted())
        .render(rows[0], buffer);
    render_field(rows[2], buffer, label, &state.field_name, true, None);
    render_footer(rows[4], buffer, action);
}

pub fn render_delete(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    render_confirm(
        area,
        buffer,
        "Delete environment",
        &format!(
            "Delete {} and all its secrets?",
            state.focused_environment()
        ),
        "delete",
    );
}
