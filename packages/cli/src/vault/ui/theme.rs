use ratatui::style::{Color, Modifier, Style};

pub const FG: Color = Color::Rgb(0xf2, 0xf2, 0xf2);
pub const BG: Color = Color::Rgb(0x07, 0x07, 0x07);
pub const MUTED: Color = Color::Rgb(0x8a, 0x8a, 0x8a);
pub const FAINT: Color = Color::Rgb(0x55, 0x55, 0x55);
pub const SURFACE: Color = Color::Rgb(0x0d, 0x0d, 0x0d);
pub const DIM_SURFACE: Color = Color::Rgb(0x0a, 0x0a, 0x0a);
pub const MODAL_SURFACE: Color = Color::Rgb(0x11, 0x11, 0x11);
pub const INPUT_SURFACE: Color = Color::Rgb(0x1c, 0x1c, 0x1c);

pub fn base() -> Style {
    Style::default().fg(FG).bg(BG)
}

pub fn fg() -> Style {
    Style::default().fg(FG)
}

pub fn muted() -> Style {
    Style::default().fg(MUTED)
}

pub fn faint() -> Style {
    Style::default().fg(FAINT)
}

pub fn bold() -> Style {
    fg().add_modifier(Modifier::BOLD)
}

pub fn modal_fg() -> Style {
    fg().bg(MODAL_SURFACE)
}

pub fn modal_muted() -> Style {
    muted().bg(MODAL_SURFACE)
}

pub fn modal_faint() -> Style {
    faint().bg(MODAL_SURFACE)
}

pub fn modal_bold() -> Style {
    modal_fg().add_modifier(Modifier::BOLD)
}

pub fn input_fg(active: bool) -> Style {
    if active {
        fg().bg(INPUT_SURFACE)
    } else {
        muted().bg(Color::Rgb(0x18, 0x18, 0x18))
    }
}

pub fn surface() -> Style {
    fg().bg(SURFACE)
}

pub fn dim_surface() -> Style {
    muted().bg(DIM_SURFACE)
}

pub fn modal() -> Style {
    fg().bg(MODAL_SURFACE)
}

pub fn input(active: bool) -> Style {
    if active {
        fg().bg(INPUT_SURFACE)
    } else {
        muted().bg(Color::Rgb(0x18, 0x18, 0x18))
    }
}
