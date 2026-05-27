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
    let [header, body] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(2), Constraint::Min(0)])
        .areas(area);
    let style = if focused {
        theme::bold()
    } else {
        theme::muted()
    };
    let panel_style = panel_style(dimmed);
    let header_content = inset(header);
    Paragraph::new(Line::from(vec![
        Span::styled(title.to_string(), style),
        Span::raw(" "),
        Span::styled(subtitle.to_string(), theme::muted()),
    ]))
    .style(panel_style)
    .render(header_content, buffer);
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
