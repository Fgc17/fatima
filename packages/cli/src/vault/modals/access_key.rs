use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::modals::shared::{render_footer, render_modal_body};
use crate::vault::models::ModalFocus;
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::atoms::footer::{render_balanced_footer, FooterAction};
use crate::vault::ui::atoms::text::truncate;
use crate::vault::ui::modal::modal_area;

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let area = modal_area(area, 17);
    let body = render_modal_body(area, buffer, "Generate access key");
    if let Some(key) = &state.generated_access_key {
        render_generated(body, buffer, state, key);
        return;
    }
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(3),
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Min(0),
            Constraint::Length(1),
            Constraint::Length(1),
        ])
        .split(body);
    render_field(
        rows[0],
        buffer,
        "Key name",
        &state.field_name,
        state.modal_focus == ModalFocus::Name,
        None,
    );
    Paragraph::new("Environments (tab to list, space toggles)")
        .style(theme::modal_muted())
        .render(rows[2], buffer);
    render_environment_list(rows[3], buffer, state);
    render_footer(rows[5], buffer, "create key");
}

fn render_environment_list(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    for (index, environment) in state.environment_list().iter().enumerate() {
        if index as u16 >= area.height {
            break;
        }
        let selected = state
            .access_environments
            .iter()
            .any(|value| value == environment);
        let active = state.modal_focus == ModalFocus::EnvironmentList
            && index == state.access_environment_cursor;
        let row = Rect {
            y: area.y + index as u16,
            height: 1,
            ..area
        };
        Paragraph::new(Line::from(vec![
            Span::styled(if active { "› " } else { "  " }, theme::modal_fg()),
            Span::styled(if selected { "● " } else { "○ " }, theme::modal_bold()),
            Span::styled(
                environment.clone(),
                if active {
                    theme::modal_bold()
                } else {
                    theme::modal_muted()
                },
            ),
        ]))
        .style(theme::modal())
        .render(row, buffer);
    }
}

fn render_generated(area: Rect, buffer: &mut Buffer, state: &VaultAppState, key: &str) {
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Min(0),
            Constraint::Length(1),
        ])
        .split(area);

    Paragraph::new("Access key")
        .style(theme::modal_fg())
        .render(rows[0], buffer);
    Paragraph::new(truncate(key, rows[2].width.saturating_sub(2) as usize))
        .style(theme::input_fg(true))
        .render(rows[2], buffer);
    Paragraph::new(if state.access_key_copied {
        "copied"
    } else {
        "shown once"
    })
    .style(theme::modal_faint())
    .render(rows[3], buffer);
    render_balanced_footer(
        rows[5],
        buffer,
        FooterAction {
            key: "c",
            label: "copy",
        },
        FooterAction {
            key: "esc",
            label: "close",
        },
    );
}
