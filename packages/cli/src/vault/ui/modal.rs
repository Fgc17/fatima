use ratatui::buffer::Buffer;
use ratatui::layout::Rect;

use crate::vault::theme;

pub fn modal_area(area: Rect, desired_height: u16) -> Rect {
    let target_width = ((area.width as f32 * 0.55).floor() as u16).clamp(48, 68);
    let width = target_width.min(area.width.saturating_sub(4)).max(1);
    let top = ((area.height as f32 * 0.12).floor() as u16).min(2);
    Rect {
        x: area.x + area.width.saturating_sub(width) / 2,
        y: area.y + top,
        width,
        height: desired_height.min(area.height.saturating_sub(top)).max(1),
    }
}

pub fn render_modal_surface(area: Rect, buffer: &mut Buffer) -> Rect {
    fill_solid(area, buffer);
    area.inner(ratatui::layout::Margin {
        horizontal: 3,
        vertical: 1,
    })
}

fn fill_solid(area: Rect, buffer: &mut Buffer) {
    let style = theme::modal();
    for y in area.y..area.y.saturating_add(area.height) {
        for x in area.x..area.x.saturating_add(area.width) {
            buffer[(x, y)].set_symbol(" ").set_style(style);
        }
    }
}
