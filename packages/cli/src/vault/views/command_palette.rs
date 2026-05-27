use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::controllers::command_items;
use crate::vault::state::VaultAppState;
use crate::vault::theme;
use crate::vault::ui::atoms::header::render_split_header;
use crate::vault::ui::atoms::text::truncate;
use crate::vault::ui::modal::{modal_area, render_modal_surface};
use crate::vault::view_partials::vault::visible_window;

pub fn render(area: Rect, buffer: &mut Buffer, state: &VaultAppState) {
    let items = command_items(state);
    let height = (items.len() as u16).min(8) + 5;
    let area = modal_area(area, height);
    let inner = render_modal_surface(area, buffer);
    let [header, body] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(2), Constraint::Min(0)])
        .areas(inner);
    render_split_header(header, buffer, "Command palette", Some("esc close"));
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(2),
            Constraint::Min(0),
            Constraint::Length(1),
        ])
        .split(body);

    Paragraph::new("Type a shortcut, or use ↑/↓ and enter.")
        .style(theme::modal_muted())
        .render(rows[0], buffer);

    let max_visible = rows[1].height as usize;
    let (start, end) = visible_window(items.len(), state.command_cursor, max_visible);
    for (offset, item) in items[start..end.min(items.len())].iter().enumerate() {
        let index = start + offset;
        let active = index == state.command_cursor;
        let row = Rect {
            y: rows[1].y + offset as u16,
            height: 1,
            ..rows[1]
        };
        let desc_width = row.width.saturating_sub(31) as usize;
        Paragraph::new(Line::from(vec![
            Span::styled(if active { "› " } else { "  " }, theme::modal_fg()),
            Span::styled(format!("{}  ", item.key), theme::modal_bold()),
            Span::styled(
                truncate(&item.title, 22),
                if active {
                    theme::modal_bold()
                } else {
                    theme::modal_muted()
                },
            ),
            Span::styled(
                truncate(&item.description, desc_width.max(8)),
                theme::modal_faint(),
            ),
        ]))
        .style(theme::modal())
        .render(row, buffer);
    }

    Paragraph::new(Line::from(vec![
        Span::styled("enter", theme::modal_bold()),
        Span::styled(" run  ", theme::modal_muted()),
        Span::styled("esc", theme::modal_bold()),
        Span::styled(" close", theme::modal_muted()),
    ]))
    .style(theme::modal())
    .render(rows[2], buffer);
}
