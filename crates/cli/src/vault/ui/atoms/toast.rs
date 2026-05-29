use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;

#[derive(Clone, Copy, Debug)]
pub enum ToastTone {
    Success,
    Info,
    Error,
}

pub fn render_toast(area: Rect, buffer: &mut Buffer, value: &str, error: bool) {
    render_toast_left(
        area,
        buffer,
        value,
        if error {
            ToastTone::Error
        } else {
            ToastTone::Info
        },
    );
}

pub fn render_toast_left(area: Rect, buffer: &mut Buffer, value: &str, tone: ToastTone) {
    let toast = Rect {
        x: area.x,
        y: area.y,
        width: area.width.min(value.len() as u16 + 2),
        height: 1,
    };
    render_toast_at(toast, buffer, value, tone);
}

pub fn render_toast_right(area: Rect, buffer: &mut Buffer, value: &str, tone: ToastTone) {
    let width = area.width.min(value.len() as u16 + 2);
    let toast = Rect {
        x: area.x + area.width.saturating_sub(width),
        y: area.y,
        width,
        height: 1,
    };
    render_toast_at(toast, buffer, value, tone);
}

fn render_toast_at(area: Rect, buffer: &mut Buffer, value: &str, _tone: ToastTone) {
    Paragraph::new(format!(" {value} "))
        .style(theme::base())
        .render(area, buffer);
}
