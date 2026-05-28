use std::{env, fs, io, path::Path, process::Command};
use zip::{write::FileOptions, CompressionMethod, ZipWriter};

const VERSION_FILES: &[&str] = &[
    "packages/js/package.json",
    "packages/cli/package.json",
    "packages/core/package.json",
];

#[derive(Clone, Copy)]
struct Target {
    asset: &'static str,
    triple: &'static str,
    binary: &'static str,
    archive: Archive,
    docker_builder: DockerBuilder,
}

#[derive(Clone, Copy)]
enum Archive {
    TarGz,
    Zip,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum DockerBuilder {
    Zigbuild,
    Xwin,
}

const TARGETS: &[Target] = &[
    Target {
        asset: "linux-x64",
        triple: "x86_64-unknown-linux-gnu",
        binary: "fatima",
        archive: Archive::TarGz,
        docker_builder: DockerBuilder::Zigbuild,
    },
    Target {
        asset: "linux-arm64",
        triple: "aarch64-unknown-linux-gnu",
        binary: "fatima",
        archive: Archive::TarGz,
        docker_builder: DockerBuilder::Zigbuild,
    },
    Target {
        asset: "linux-x64-musl",
        triple: "x86_64-unknown-linux-musl",
        binary: "fatima",
        archive: Archive::TarGz,
        docker_builder: DockerBuilder::Zigbuild,
    },
    Target {
        asset: "linux-arm64-musl",
        triple: "aarch64-unknown-linux-musl",
        binary: "fatima",
        archive: Archive::TarGz,
        docker_builder: DockerBuilder::Zigbuild,
    },
    Target {
        asset: "darwin-x64",
        triple: "x86_64-apple-darwin",
        binary: "fatima",
        archive: Archive::Zip,
        docker_builder: DockerBuilder::Zigbuild,
    },
    Target {
        asset: "darwin-arm64",
        triple: "aarch64-apple-darwin",
        binary: "fatima",
        archive: Archive::Zip,
        docker_builder: DockerBuilder::Zigbuild,
    },
    Target {
        asset: "windows-x64",
        triple: "x86_64-pc-windows-msvc",
        binary: "fatima.exe",
        archive: Archive::Zip,
        docker_builder: DockerBuilder::Xwin,
    },
    Target {
        asset: "windows-arm64",
        triple: "aarch64-pc-windows-msvc",
        binary: "fatima.exe",
        archive: Archive::Zip,
        docker_builder: DockerBuilder::Xwin,
    },
];

fn main() {
    if let Err(error) = run() {
        eprintln!("error: {error}");
        std::process::exit(1);
    }
}

fn run() -> Result<(), String> {
    let mut args = env::args().skip(1);
    let Some(command) = args.next() else {
        usage();
        return Err("missing command".into());
    };

    match command.as_str() {
        "build-binaries" => build_binaries(args.collect()),
        "set-version" => {
            let version = parse_version_arg(args.collect())?;
            set_version(&version)
        }
        "verify-release" => {
            let version = parse_version_arg(args.collect())?;
            verify_release(&version)
        }
        "help" | "--help" | "-h" => {
            usage();
            Ok(())
        }
        _ => Err(format!("unknown command `{command}`")),
    }
}

fn usage() {
    eprintln!(
        "Usage:\n  cargo run -p task -- build-binaries [--target <asset>|--host|--all]\n  cargo run -p task -- set-version --version <version>\n  cargo run -p task -- verify-release --version <version>"
    );
}

fn parse_version_arg(args: Vec<String>) -> Result<String, String> {
    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--version" | "-v" => return iter.next().ok_or("--version requires a value".into()),
            value if !value.starts_with('-') => return Ok(value.to_string()),
            _ => return Err(format!("unknown argument `{arg}`")),
        }
    }
    Err("missing version".into())
}

fn build_binaries(args: Vec<String>) -> Result<(), String> {
    let selected = parse_targets(args)?;
    if Path::new(".binaries").exists() {
        fs::remove_dir_all(".binaries").map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(".binaries/raw").map_err(|error| error.to_string())?;

    for target in selected {
        println!("building fatima for {} ({})", target.asset, target.triple);
        build_target(target)?;

        let raw_dir = Path::new(".binaries/raw").join(target.asset);
        if raw_dir.exists() {
            fs::remove_dir_all(&raw_dir).map_err(|error| error.to_string())?;
        }
        fs::create_dir_all(&raw_dir).map_err(|error| error.to_string())?;

        let built = Path::new("target")
            .join(target.triple)
            .join("release")
            .join(target.binary);
        let raw_binary = raw_dir.join(target.binary);
        fs::copy(&built, &raw_binary).map_err(|error| {
            format!(
                "failed to copy `{}` to `{}`: {error}",
                built.display(),
                raw_binary.display()
            )
        })?;

        package_target(target, &raw_dir)?;
    }

    Ok(())
}

fn build_target(target: Target) -> Result<(), String> {
    if should_use_docker(target)? {
        return build_target_with_docker(target);
    }

    run_command("rustup", &["target", "add", target.triple])?;
    run_command(
        "cargo",
        &[
            "build",
            "--release",
            "-p",
            "fatima-cli",
            "--bin",
            "fatima",
            "--target",
            target.triple,
        ],
    )
}

fn should_use_docker(target: Target) -> Result<bool, String> {
    match env::var("FATIMA_BINARY_BUILDER").as_deref() {
        Ok("cargo") => return Ok(false),
        Ok("docker") => return Ok(true),
        Ok(value) => return Err(format!("unknown FATIMA_BINARY_BUILDER `{value}`")),
        Err(_) => {}
    }

    if env::consts::OS == "linux" && !is_current_host_target(target) {
        if command_exists("docker") {
            return Ok(true);
        }
        return Err(format!(
            "cannot build {} from Linux with plain cargo. Install Docker or set FATIMA_BINARY_BUILDER=cargo and provide the target linker yourself. OpenCode can build every target on Ubuntu because it uses Bun's built-in cross compiler; Rust still needs a cross linker/toolchain.",
            target.asset
        ));
    }

    Ok(false)
}

fn build_target_with_docker(target: Target) -> Result<(), String> {
    let cwd = env::current_dir().map_err(|error| error.to_string())?;
    let workspace = cwd.to_string_lossy().into_owned();
    let user = docker_user_flag();
    let command = match target.docker_builder {
        DockerBuilder::Zigbuild => format!(
            "export PATH=/usr/local/cargo/bin:$PATH; cargo zigbuild --release -p fatima-cli --bin fatima --target {triple}",
            triple = target.triple
        ),
        DockerBuilder::Xwin => format!(
            "export PATH=/usr/local/cargo/bin:$PATH; XWIN_CROSS_COMPILER=clang cargo xwin build --release -p fatima-cli --bin fatima --target {triple}",
            triple = target.triple
        ),
    };
    let image = match target.docker_builder {
        DockerBuilder::Zigbuild => "ghcr.io/rust-cross/cargo-zigbuild",
        DockerBuilder::Xwin => "messense/cargo-xwin",
    };

    let mut args = vec!["run", "--rm"];
    let volume = format!("{workspace}:/io");
    if let Some(user) = user.as_deref() {
        args.extend(["--user", user]);
    }
    args.extend([
        "-e",
        "HOME=/tmp",
        "-e",
        "CARGO_ZIGBUILD_CACHE_DIR=/tmp/cargo-zigbuild",
        "-e",
        "XWIN_CACHE_DIR=/tmp/xwin",
        "-v",
        volume.as_str(),
        "-w",
        "/io",
        image,
        "sh",
        "-lc",
        command.as_str(),
    ]);

    run_command("docker", &args)
}

fn parse_targets(args: Vec<String>) -> Result<Vec<Target>, String> {
    if args.is_empty() {
        return Ok(TARGETS.to_vec());
    }

    let mut iter = args.into_iter();
    let mut targets = Vec::new();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--all" => return Ok(TARGETS.to_vec()),
            "--host" => {
                targets.push(
                    current_host_target().ok_or(
                        "could not infer current host target; use --target <asset> or --all",
                    )?,
                );
            }
            "--target" | "-t" => {
                let asset = iter.next().ok_or("--target requires a value")?;
                targets.push(find_target(&asset)?);
            }
            value if !value.starts_with('-') => targets.push(find_target(value)?),
            _ => return Err(format!("unknown argument `{arg}`")),
        }
    }
    Ok(targets)
}

fn current_host_target() -> Option<Target> {
    let os = env::consts::OS;
    let arch = env::consts::ARCH;
    let asset = match (os, arch) {
        ("linux", "x86_64") => "linux-x64",
        ("linux", "aarch64") => "linux-arm64",
        ("macos", "x86_64") => "darwin-x64",
        ("macos", "aarch64") => "darwin-arm64",
        ("windows", "x86_64") => "windows-x64",
        ("windows", "aarch64") => "windows-arm64",
        _ => return None,
    };
    TARGETS.iter().copied().find(|target| target.asset == asset)
}

fn is_current_host_target(target: Target) -> bool {
    current_host_target()
        .map(|host| host.asset == target.asset)
        .unwrap_or(false)
}

fn find_target(asset: &str) -> Result<Target, String> {
    TARGETS
        .iter()
        .copied()
        .find(|target| target.asset == asset)
        .ok_or_else(|| format!("unknown target `{asset}`"))
}

fn package_target(target: Target, raw_dir: &Path) -> Result<(), String> {
    let archive_name = match target.archive {
        Archive::TarGz => format!("fatima-{}.tar.gz", target.asset),
        Archive::Zip => format!("fatima-{}.zip", target.asset),
    };
    let archive = Path::new(".binaries").join(archive_name);
    remove_file_if_exists(&archive).map_err(|error| error.to_string())?;

    match target.archive {
        Archive::TarGz => run_command_in(
            raw_dir,
            "tar",
            &["-czf", archive_path(&archive)?.as_str(), target.binary],
        ),
        Archive::Zip => {
            write_zip(&archive, &raw_dir.join(target.binary), target.binary)?;
            Ok(())
        }
    }
}

fn write_zip(archive: &Path, source: &Path, name: &str) -> Result<(), String> {
    let file = fs::File::create(archive)
        .map_err(|error| format!("failed to create `{}`: {error}", archive.display()))?;
    let mut zip = ZipWriter::new(file);
    let options = FileOptions::default()
        .compression_method(CompressionMethod::Deflated)
        .unix_permissions(0o755);
    zip.start_file(name, options)
        .map_err(|error| error.to_string())?;

    let mut source = fs::File::open(source)
        .map_err(|error| format!("failed to open `{}`: {error}", source.display()))?;
    io::copy(&mut source, &mut zip).map_err(|error| error.to_string())?;
    zip.finish().map_err(|error| error.to_string())?;
    Ok(())
}

fn archive_path(path: &Path) -> Result<String, String> {
    path.canonicalize()
        .or_else(|_| Ok::<_, io::Error>(env::current_dir()?.join(path)))
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(|error| error.to_string())
}

fn set_version(version: &str) -> Result<(), String> {
    replace_in_file("Cargo.toml", |content| {
        content
            .lines()
            .map(|line| {
                if line.trim_start().starts_with("version = ") {
                    format!("version = \"{version}\"")
                } else if line.trim_start().starts_with("fatima-core = ") {
                    format!("fatima-core = {{ path = \"packages/core\", version = \"{version}\" }}")
                } else {
                    line.to_string()
                }
            })
            .collect::<Vec<_>>()
            .join("\n")
            + "\n"
    })?;

    for file in VERSION_FILES {
        replace_in_file(file, |content| replace_json_version(&content, version))?;
    }

    Ok(())
}

fn replace_json_version(content: &str, version: &str) -> String {
    content
        .lines()
        .map(|line| {
            let trimmed = line.trim_start();
            if trimmed.starts_with("\"version\":") {
                let indent = &line[..line.len() - trimmed.len()];
                let comma = if trimmed.ends_with(',') { "," } else { "" };
                format!("{indent}\"version\": \"{version}\"{comma}")
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<_>>()
        .join("\n")
        + "\n"
}

fn replace_in_file(path: &str, replace: impl FnOnce(String) -> String) -> Result<(), String> {
    let content =
        fs::read_to_string(path).map_err(|error| format!("failed to read {path}: {error}"))?;
    let next = replace(content);
    fs::write(path, next).map_err(|error| format!("failed to write {path}: {error}"))
}

fn verify_release(version: &str) -> Result<(), String> {
    let cargo = fs::read_to_string("Cargo.toml").map_err(|error| error.to_string())?;
    ensure_contains(
        &cargo,
        &format!("version = \"{version}\""),
        "Cargo workspace version",
    )?;
    ensure_contains(
        &cargo,
        &format!("fatima-core = {{ path = \"packages/core\", version = \"{version}\" }}"),
        "fatima-core workspace dependency version",
    )?;

    for file in VERSION_FILES {
        let content = fs::read_to_string(file).map_err(|error| error.to_string())?;
        ensure_contains(
            &content,
            &format!("\"version\": \"{version}\""),
            &format!("{file} version"),
        )?;
    }

    for (file, needle) in [
        ("packages/core/Cargo.toml", "description.workspace = true"),
        ("packages/cli/Cargo.toml", "description.workspace = true"),
    ] {
        let content = fs::read_to_string(file).map_err(|error| error.to_string())?;
        ensure_contains(&content, needle, file)?;
    }

    Ok(())
}

fn ensure_contains(content: &str, needle: &str, label: &str) -> Result<(), String> {
    if content.contains(needle) {
        Ok(())
    } else {
        Err(format!("{label} is not synchronized; missing `{needle}`"))
    }
}

fn run_command(command: &str, args: &[&str]) -> Result<(), String> {
    run_command_in(Path::new("."), command, args)
}

fn command_exists(command: &str) -> bool {
    Command::new(command)
        .arg("--version")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|status| status.success())
        .unwrap_or(false)
}

fn docker_user_flag() -> Option<String> {
    if !cfg!(unix) {
        return None;
    }
    let uid = command_output("id", &["-u"]).ok()?;
    let gid = command_output("id", &["-g"]).ok()?;
    Some(format!("{uid}:{gid}"))
}

fn command_output(command: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new(command)
        .args(args)
        .output()
        .map_err(|error| format!("failed to run {command}: {error}"))?;
    if !output.status.success() {
        return Err(format!("{command} exited with {}", output.status));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

fn run_command_in(cwd: &Path, command: &str, args: &[&str]) -> Result<(), String> {
    let status = Command::new(command)
        .args(args)
        .current_dir(cwd)
        .status()
        .map_err(|error| format!("failed to run {command}: {error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!("{command} exited with {status}"))
    }
}

fn remove_file_if_exists(path: &Path) -> io::Result<()> {
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error),
    }
}
