use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;

const PANEL_INSET: u16 = 2;

pub fn render_panel_header(
    area: Rect,
    buffer: &mut Buffer,
    title: &str,
    subtitle: &str,
    focused: bool,
    dimmed: bool,
) -> Rect {
    let [top_gap, header, gap, body] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(2),
            Constraint::Length(1),
            Constraint::Min(0),
        ])
        .areas(area);
    let style = if focused {
        theme::bold()
    } else {
        theme::muted()
    };
    let panel_style = panel_style(dimmed);
    Paragraph::new("")
        .style(panel_style)
        .render(top_gap, buffer);
    let [title_row, subtitle_row] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(1), Constraint::Length(1)])
        .areas(inset(header));
    Paragraph::new(Line::from(Span::styled(
        title.to_uppercase(),
        style.add_modifier(ratatui::style::Modifier::BOLD),
    )))
    .style(panel_style)
    .render(title_row, buffer);
    Paragraph::new(Line::from(Span::styled(
        subtitle.to_string(),
        theme::faint(),
    )))
    .style(panel_style)
    .render(subtitle_row, buffer);
    Paragraph::new("").style(panel_style).render(gap, buffer);
    body
}

pub fn inset(area: Rect) -> Rect {
    area.inner(ratatui::layout::Margin {
        horizontal: PANEL_INSET.min(area.width / 2),
        vertical: 0,
    })
}

pub fn fill(area: Rect, buffer: &mut Buffer, _focused: bool, dimmed: bool) {
    let style = panel_style(dimmed);
    for y in area.y..area.y.saturating_add(area.height) {
        for x in area.x..area.x.saturating_add(area.width) {
            buffer[(x, y)].set_style(style);
        }
    }
}

fn panel_style(dimmed: bool) -> ratatui::style::Style {
    if dimmed {
        theme::dim_surface()
    } else {
        theme::surface()
    }
}
