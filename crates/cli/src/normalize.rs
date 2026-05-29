use std::ffi::OsString;

pub fn normalize_args(args: Vec<OsString>) -> Vec<OsString> {
    let Some((program, rest)) = args.split_first() else {
        return args;
    };
    let known = [
        "api", "generate", "init", "run", "secrets", "validate", "vault", "help",
    ];
    let mut normalized = vec![program.clone()];
    let rest_strings = rest
        .iter()
        .map(|value| value.to_string_lossy().to_string())
        .collect::<Vec<_>>();

    if rest_strings.is_empty() {
        normalized.push("run".into());
        return normalized;
    }

    if rest_strings.first().map(String::as_str) == Some("--") {
        normalized.push("run".into());
        normalized.extend(rest.iter().cloned());
        return normalized;
    }

    if let Some(separator) = rest_strings.iter().position(|value| value == "--") {
        normalized.push("run".into());
        normalized.extend(rest[..separator].iter().cloned());
        normalized.push("--".into());
        normalized.extend(rest[separator + 1..].iter().cloned());
        return normalized;
    }

    let first_non_flag = rest_strings
        .iter()
        .position(|value| !value.starts_with('-'));
    match first_non_flag
        .and_then(|index| rest_strings.get(index).map(|value| (index, value.as_str())))
    {
        Some((_, command))
            if known.contains(&command) || command == "--help" || command == "--version" =>
        {
            normalized.extend(rest.iter().cloned())
        }
        Some((index, _)) => {
            normalized.push("run".into());
            normalized.extend(rest[..index].iter().cloned());
            normalized.push("--".into());
            normalized.extend(rest[index..].iter().cloned());
        }
        None => normalized.extend(rest.iter().cloned()),
    }

    normalized
}
