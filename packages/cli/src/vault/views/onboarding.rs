use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::models::FormFocus;
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::atoms::header::render_split_header;
use crate::vault::ui::modal::{modal_area, render_modal_surface};

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let area = modal_area(area, 15);
    let inner = render_modal_surface(area, buffer);
    let [header, body] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(2), Constraint::Min(0)])
        .areas(inner);
    render_split_header(header, buffer, "Create vault", Some("esc close"));
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
    Paragraph::new("Encrypted local secrets for this project.")
        .style(theme::modal_muted())
        .render(rows[0], buffer);
    render_field(
        rows[2],
        buffer,
        "Master password",
        &state.password,
        state.form_focus == FormFocus::Password,
        Some('*'),
    );
    render_field(
        rows[4],
        buffer,
        "Confirm password",
        &state.confirm_password,
        state.form_focus == FormFocus::ConfirmPassword,
        Some('*'),
    );
    Paragraph::new(Line::from(vec![
        Span::styled("enter", theme::modal_bold()),
        Span::styled(
            if state.form_focus == FormFocus::Password {
                " next  "
            } else {
                " create vault  "
            },
            theme::modal_muted(),
        ),
        Span::styled("↑↓", theme::modal_bold()),
        Span::styled(" move  ", theme::modal_muted()),
        Span::styled("esc", theme::modal_bold()),
        Span::styled(" quit", theme::modal_muted()),
    ]))
    .style(theme::modal())
    .render(rows[6], buffer);
}
