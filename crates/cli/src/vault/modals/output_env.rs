use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::modals::shared::{render_footer, render_modal_body};
use crate::vault::models::{ModalFocus, OutputFormat};
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::field::render_field;
use crate::vault::ui::modal::modal_area;

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let area = modal_area(area, 18);
    let body = render_modal_body(area, buffer, "Output environment");
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(4),
            Constraint::Length(1),
            Constraint::Length(3),
            Constraint::Length(1),
            Constraint::Length(4),
            Constraint::Length(1),
        ])
        .split(body);

    Paragraph::new("Environment")
        .style(theme::modal_muted())
        .render(rows[0], buffer);
    render_environment_list(rows[1], buffer, state);
    render_field(
        rows[3],
        buffer,
        "File path",
        &state.field_path,
        state.modal_focus == ModalFocus::Path,
        None,
    );
    Paragraph::new("Format")
        .style(theme::modal_muted())
        .render(rows[4], buffer);
    render_format_list(rows[5], buffer, state);
    render_footer(rows[6], buffer, "output");
}

fn render_environment_list(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    for (index, environment) in state.environment_list().iter().enumerate() {
        if index as u16 >= area.height {
            break;
        }
        let active = state.modal_focus == ModalFocus::EnvironmentList
            && index == state.output_environment_cursor;
        let selected = index == state.output_environment_cursor;
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

fn render_format_list(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    for (index, format) in OutputFormat::ALL.iter().enumerate() {
        if index as u16 >= area.height {
            break;
        }
        let active =
            state.modal_focus == ModalFocus::FormatList && index == state.output_format_cursor;
        let selected = index == state.output_format_cursor;
        let row = Rect {
            y: area.y + index as u16,
            height: 1,
            ..area
        };
        Paragraph::new(Line::from(vec![
            Span::styled(if active { "› " } else { "  " }, theme::modal_fg()),
            Span::styled(if selected { "● " } else { "○ " }, theme::modal_bold()),
            Span::styled(
                format.label(),
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
