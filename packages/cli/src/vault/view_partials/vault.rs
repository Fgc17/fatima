use std::collections::BTreeMap;

use fatima_core::vault::SecretRecord;
use ratatui::buffer::Buffer;
use ratatui::layout::Rect;
use ratatui::text::{Line, Span};
use ratatui::widgets::{Paragraph, Widget};

use crate::vault::theme;
use crate::vault::ui::atoms::panel::inset;
use crate::vault::ui::atoms::text::truncate;

const MATRIX_KEY_WIDTH: usize = 22;
const MATRIX_MIN_COLUMN_WIDTH: usize = 12;

pub fn mask_value(value: &str) -> String {
    "•".repeat(value.len().clamp(8, 16))
}

pub fn visible_window(total: usize, selected: usize, max_visible: usize) -> (usize, usize) {
    let visible_count = total.min(max_visible).max(1);
    let safe = selected.min(total.saturating_sub(1));
    let start = safe
        .saturating_sub(visible_count / 2)
        .min(total.saturating_sub(visible_count));
    (start, start + visible_count)
}

pub fn render_environment_tabs(
    area: Rect,
    buffer: &mut Buffer,
    environments: &[String],
    selected: &str,
    counts: &BTreeMap<String, usize>,
    dimmed: bool,
) {
    let row_style = if dimmed {
        theme::dim_surface()
    } else {
        theme::surface()
    };
    for (index, environment) in environments.iter().enumerate() {
        if index as u16 >= area.height {
            break;
        }
        let active = environment == selected;
        let count = counts.get(environment).copied().unwrap_or(0);
        let line = Line::from(vec![
            Span::styled(
                if active { "› " } else { "  " },
                if active { theme::fg() } else { theme::muted() },
            ),
            Span::styled(
                environment.clone(),
                if active {
                    theme::bold()
                } else {
                    theme::muted()
                },
            ),
            Span::styled(format!(" {count}"), theme::faint()),
        ]);
        let row = Rect {
            y: area.y + index as u16,
            height: 1,
            ..area
        };
        Paragraph::new(line)
            .style(row_style)
            .render(inset(row), buffer);
    }
}

pub fn render_secret_table(
    area: Rect,
    buffer: &mut Buffer,
    secrets: &[SecretRecord],
    selected_index: usize,
    revealed: bool,
    dimmed: bool,
) {
    if area.height == 0 {
        return;
    }
    let row_style = if dimmed {
        theme::dim_surface()
    } else {
        theme::surface()
    };
    let header = inset(Rect { height: 1, ..area });
    Paragraph::new(secret_table_line(
        "key",
        "value",
        header.width,
        theme::faint(),
        theme::faint(),
    ))
    .style(row_style)
    .render(header, buffer);

    if secrets.is_empty() {
        Paragraph::new(Line::from(vec![Span::styled(
            "No secrets yet. Press 'a' to add your first secret, or 'i' to import a .env file.",
            theme::muted(),
        )]))
        .style(row_style)
        .render(
            inset(Rect {
                y: area.y + 2,
                height: 1,
                ..area
            }),
            buffer,
        );
        return;
    }

    let max_rows = area.height.saturating_sub(1) as usize;
    let (start, end) = visible_window(secrets.len(), selected_index, max_rows);
    for (offset, secret) in secrets[start..end].iter().enumerate() {
        let row_index = start + offset;
        let active = row_index == selected_index;
        let value = if revealed || active {
            secret.value.clone()
        } else {
            mask_value(&secret.value)
        };
        let row = inset(Rect {
            y: area.y + 1 + offset as u16,
            height: 1,
            ..area
        });
        let key_style = if active {
            theme::bold()
        } else {
            theme::muted()
        };
        let value_style = if active { theme::fg() } else { theme::muted() };
        let selector = if active { "› " } else { "  " };
        Paragraph::new(secret_table_line(
            &format!("{selector}{}", secret.key),
            &value,
            row.width,
            key_style,
            value_style,
        ))
        .style(row_style)
        .render(row, buffer);
    }
}

fn secret_table_line(
    key: &str,
    value: &str,
    width: u16,
    key_style: ratatui::style::Style,
    value_style: ratatui::style::Style,
) -> Line<'static> {
    let key_width = 32usize.min(width.saturating_sub(12) as usize);
    let value_width = (width as usize).saturating_sub(key_width);
    Line::from(vec![
        Span::styled(
            format!("{:<key_width$}", truncate(key, key_width)),
            key_style,
        ),
        Span::styled(truncate(value, value_width), value_style),
    ])
}

pub fn render_secret_matrix(
    area: Rect,
    buffer: &mut Buffer,
    environments: &[String],
    vault: &BTreeMap<String, Vec<SecretRecord>>,
    keys: &[String],
    selected_row: usize,
    selected_column: usize,
    revealed: bool,
    dimmed: bool,
) {
    let row_style = if dimmed {
        theme::dim_surface()
    } else {
        theme::surface()
    };
    let content = inset(area);
    let available = content.width as usize;
    let visible_columns = environments
        .len()
        .max(1)
        .min(available.saturating_sub(MATRIX_KEY_WIDTH + 2) / (MATRIX_MIN_COLUMN_WIDTH + 1).max(1))
        .max(1);
    let (column_start, column_end) =
        visible_window(environments.len(), selected_column, visible_columns);
    let visible_envs = &environments[column_start..column_end.min(environments.len())];
    let column_width = MATRIX_MIN_COLUMN_WIDTH
        .max(available.saturating_sub(MATRIX_KEY_WIDTH + 2) / visible_envs.len().max(1));
    let mut header = vec![Span::styled(
        truncate("key", MATRIX_KEY_WIDTH),
        theme::faint(),
    )];
    for (offset, env) in visible_envs.iter().enumerate() {
        let active = column_start + offset == selected_column;
        header.push(Span::styled(
            truncate(env, column_width),
            if active {
                theme::bold()
            } else {
                theme::muted()
            },
        ));
    }
    Paragraph::new(Line::from(header)).style(row_style).render(
        Rect {
            height: 1,
            ..content
        },
        buffer,
    );

    let max_rows = area.height.saturating_sub(1) as usize;
    let (start, end) = visible_window(keys.len(), selected_row, max_rows);
    for (offset, key) in keys[start..end.min(keys.len())].iter().enumerate() {
        let row_index = start + offset;
        let row_active = row_index == selected_row;
        let mut line = vec![
            Span::styled(
                if row_active { "› " } else { "  " },
                if row_active {
                    theme::fg()
                } else {
                    theme::muted()
                },
            ),
            Span::styled(
                truncate(key, MATRIX_KEY_WIDTH),
                if row_active {
                    theme::bold()
                } else {
                    theme::muted()
                },
            ),
        ];
        for (env_offset, env) in visible_envs.iter().enumerate() {
            let column = column_start + env_offset;
            let secret = vault
                .get(env)
                .and_then(|items| items.iter().find(|secret| secret.key == *key));
            let content = secret
                .map(|secret| {
                    if revealed {
                        secret.value.clone()
                    } else {
                        mask_value(&secret.value)
                    }
                })
                .unwrap_or_else(|| "-".to_string());
            let active = row_active && column == selected_column;
            line.push(Span::styled(
                truncate(&content, column_width),
                if active { theme::fg() } else { theme::muted() },
            ));
        }
        Paragraph::new(Line::from(line)).style(row_style).render(
            Rect {
                y: content.y + 1 + offset as u16,
                height: 1,
                ..content
            },
            buffer,
        );
    }
}
