use ratatui::buffer::Buffer;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Paragraph, Widget};

use crate::vault::models::Mode;
use crate::vault::state::VaultAppState;
use crate::vault::theme;

pub struct ShellAreas {
    pub body: Rect,
}

pub fn render_app_shell(area: Rect, buffer: &mut Buffer, state: &VaultAppState) -> ShellAreas {
    Block::new().style(theme::base()).render(area, buffer);
    let padded = area.inner(ratatui::layout::Margin {
        horizontal: 2,
        vertical: 1,
    });
    let [header, gap, body, footer] = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(1),
            Constraint::Length(1),
            Constraint::Min(0),
            Constraint::Length(1),
        ])
        .areas(padded);

    let project_name = std::env::current_dir()
        .ok()
        .and_then(|path| {
            path.file_name()
                .map(|name| name.to_string_lossy().to_string())
        })
        .unwrap_or_else(|| "project".to_string());
    let status = status_label(state.mode);

    Block::new().style(theme::base()).render(header, buffer);
    let header_right = "local vault ".len() as u16 + status.len() as u16;
    let header_left = Rect {
        width: header.width.saturating_sub(header_right),
        ..header
    };
    let header_right = Rect {
        x: header.x + header.width.saturating_sub(header_right),
        width: header_right,
        ..header
    };
    Paragraph::new(Line::from(vec![
        Span::styled(" ⚿  ", theme::fg()),
        Span::styled("fatima", theme::bold()),
        Span::styled(" / ", theme::muted()),
        Span::styled(project_name, theme::fg()),
    ]))
    .style(theme::base())
    .render(header_left, buffer);
    Paragraph::new(Line::from(vec![
        Span::styled("local vault ", theme::muted()),
        Span::styled(status, theme::bold()),
    ]))
    .style(theme::base())
    .render(header_right, buffer);

    Block::new().style(theme::base()).render(gap, buffer);

    let left = format!(
        "{} · {} secrets · {} environments",
        status,
        state.total_secret_count(),
        state.environment_list().len()
    );
    let right = "/ commands";
    Block::new().style(theme::base()).render(footer, buffer);
    let footer_right = right.len() as u16;
    let footer_left = Rect {
        width: footer.width.saturating_sub(footer_right),
        ..footer
    };
    let footer_right = Rect {
        x: footer.x + footer.width.saturating_sub(footer_right),
        width: footer_right,
        ..footer
    };
    Paragraph::new(Line::from(Span::styled(left, theme::muted())))
        .style(theme::base())
        .render(footer_left, buffer);
    Paragraph::new(Line::from(Span::styled(right, theme::muted())))
        .style(theme::base())
        .render(footer_right, buffer);

    ShellAreas { body }
}

fn status_label(mode: Mode) -> &'static str {
    match mode {
        Mode::Loading => "locked",
        Mode::Onboarding => "setup",
        Mode::Unlock => "locked",
        Mode::Vault => "unlocked",
    }
}
