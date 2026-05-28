#!/usr/bin/env bash
set -euo pipefail

APP=fatima
REPO=Fgc17/fatima

MUTED='\033[0;2m'
RED='\033[0;31m'
ORANGE='\033[38;5;214m'
NC='\033[0m'

usage() {
    cat <<EOF
Fatima Installer

Usage: install.sh [options]

Options:
    -h, --help              Display this help message
    -v, --version <version> Install a specific version (e.g. 0.0.1)
    -b, --binary <path>     Install from a local binary instead of downloading
        --no-modify-path    Don't modify shell config files

Examples:
    curl -fsSL https://cdn.fatima.dev/install | bash
    curl -fsSL https://cdn.fatima.dev/install | bash -s -- --version 0.0.1
    ./install.sh --binary /path/to/fatima
EOF
}

requested_version=${VERSION:-}
binary_path=""
no_modify_path=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        -h|--help)
            usage
            exit 0
            ;;
        -v|--version)
            if [[ -z "${2:-}" ]]; then
                echo -e "${RED}Error: --version requires a version argument${NC}"
                exit 1
            fi
            requested_version="$2"
            shift 2
            ;;
        -b|--binary)
            if [[ -z "${2:-}" ]]; then
                echo -e "${RED}Error: --binary requires a path argument${NC}"
                exit 1
            fi
            binary_path="$2"
            shift 2
            ;;
        --no-modify-path)
            no_modify_path=true
            shift
            ;;
        *)
            echo -e "${ORANGE}Warning: Unknown option '$1'${NC}" >&2
            shift
            ;;
    esac
done

INSTALL_DIR="$HOME/.fatima/bin"
mkdir -p "$INSTALL_DIR"

print_message() {
    local level=$1
    local message=$2
    local color="$NC"
    if [[ "$level" == "error" ]]; then
        color="$RED"
    fi
    echo -e "${color}${message}${NC}"
}

normalize_version() {
    local version=$1
    version="${version#fatima@}"
    version="${version#v}"
    echo "$version"
}

detect_target() {
    local raw_os os arch combo is_musl target
    raw_os=$(uname -s)
    os=$(echo "$raw_os" | tr '[:upper:]' '[:lower:]')
    case "$raw_os" in
        Darwin*) os="darwin" ;;
        Linux*) os="linux" ;;
        MINGW*|MSYS*|CYGWIN*) os="windows" ;;
    esac

    arch=$(uname -m)
    case "$arch" in
        x86_64|amd64) arch="x64" ;;
        aarch64|arm64) arch="arm64" ;;
    esac

    if [[ "$os" == "darwin" && "$arch" == "x64" ]]; then
        rosetta_flag=$(sysctl -n sysctl.proc_translated 2>/dev/null || echo 0)
        if [[ "$rosetta_flag" == "1" ]]; then
            arch="arm64"
        fi
    fi

    combo="$os-$arch"
    case "$combo" in
        linux-x64|linux-arm64|darwin-x64|darwin-arm64|windows-x64|windows-arm64) ;;
        *)
            print_message error "Unsupported OS/Arch: $os/$arch"
            exit 1
            ;;
    esac

    is_musl=false
    if [[ "$os" == "linux" ]]; then
        if [[ -f /etc/alpine-release ]]; then
            is_musl=true
        fi
        if command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | grep -qi musl; then
            is_musl=true
        fi
    fi

    target="$combo"
    if [[ "$is_musl" == "true" ]]; then
        target="$target-musl"
    fi

    echo "$target"
}

install_from_binary() {
    if [[ ! -f "$binary_path" ]]; then
        print_message error "Error: Binary not found at $binary_path"
        exit 1
    fi
    print_message info "\n${MUTED}Installing/updating ${NC}$APP ${MUTED}from: ${NC}$binary_path"
    cp "$binary_path" "$INSTALL_DIR/fatima"
    chmod 755 "$INSTALL_DIR/fatima"
}

check_version() {
    local specific_version=$1
    if command -v fatima >/dev/null 2>&1; then
        installed_version=$(fatima --version 2>/dev/null || echo "")
        installed_version="${installed_version#fatima }"
        if [[ "$installed_version" == "$specific_version" ]]; then
            print_message info "${MUTED}Version ${NC}$specific_version${MUTED} already installed${NC}"
            exit 0
        fi
        print_message info "${MUTED}Installed version: ${NC}$installed_version"
    fi
}

download_and_install() {
    local target os archive_ext filename url version tmp_dir binary_name install_name
    target=$(detect_target)
    os="${target%%-*}"
    archive_ext=".zip"
    if [[ "$os" == "linux" ]]; then
        archive_ext=".tar.gz"
    fi

    if [[ "$os" == "linux" ]]; then
        if ! command -v tar >/dev/null 2>&1; then
            print_message error "Error: 'tar' is required but not installed."
            exit 1
        fi
    elif ! command -v unzip >/dev/null 2>&1; then
        print_message error "Error: 'unzip' is required but not installed."
        exit 1
    fi

    filename="$APP-$target$archive_ext"
    if [[ -z "$requested_version" ]]; then
        url="https://github.com/$REPO/releases/latest/download/$filename"
        version=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')
    else
        version=$(normalize_version "$requested_version")
        url="https://github.com/$REPO/releases/download/v$version/$filename"
        http_status=$(curl -sI -o /dev/null -w "%{http_code}" "https://github.com/$REPO/releases/tag/v$version")
        if [[ "$http_status" == "404" ]]; then
            print_message error "Error: Release v$version not found"
            print_message info "${MUTED}Available releases: https://github.com/$REPO/releases${NC}"
            exit 1
        fi
    fi

    if [[ -z "$version" ]]; then
        print_message error "Failed to fetch version information"
        exit 1
    fi

    check_version "$version"

    binary_name="fatima"
    install_name="fatima"
    if [[ "$os" == "windows" ]]; then
        binary_name="fatima.exe"
        install_name="fatima.exe"
    fi

    print_message info "\n${MUTED}Installing/updating ${NC}$APP ${MUTED}version: ${NC}$version"
    tmp_dir="${TMPDIR:-/tmp}/fatima_install_$$"
    mkdir -p "$tmp_dir"
    trap 'rm -rf "$tmp_dir"' EXIT

    curl -# -L -o "$tmp_dir/$filename" "$url"

    if [[ "$os" == "linux" ]]; then
        tar -xzf "$tmp_dir/$filename" -C "$tmp_dir"
    else
        unzip -q "$tmp_dir/$filename" -d "$tmp_dir"
    fi

    mv "$tmp_dir/$binary_name" "$INSTALL_DIR/$install_name"
    chmod 755 "$INSTALL_DIR/$install_name"
    if [[ "$install_name" != "fatima" ]]; then
        ln -sf "$INSTALL_DIR/$install_name" "$INSTALL_DIR/fatima" 2>/dev/null || true
    fi
}

add_to_path() {
    local config_file=$1
    local command=$2
    if grep -Fxq "$command" "$config_file"; then
        print_message info "Command already exists in $config_file, skipping write."
    elif [[ -w "$config_file" ]]; then
        echo -e "\n# fatima" >> "$config_file"
        echo "$command" >> "$config_file"
        print_message info "${MUTED}Added ${NC}fatima ${MUTED}to PATH in ${NC}$config_file"
    else
        print_message info "Manually add to PATH: $command"
    fi
}

if [[ -n "$binary_path" ]]; then
    install_from_binary
else
    download_and_install
fi

XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-$HOME/.config}

if [[ "$no_modify_path" != "true" ]]; then
    current_shell=$(basename "${SHELL:-sh}")
    case "$current_shell" in
        fish)
            config_files="$HOME/.config/fish/config.fish"
            command="fish_add_path $INSTALL_DIR"
            ;;
        zsh)
            config_files="${ZDOTDIR:-$HOME}/.zshrc ${ZDOTDIR:-$HOME}/.zshenv $XDG_CONFIG_HOME/zsh/.zshrc $XDG_CONFIG_HOME/zsh/.zshenv"
            command="export PATH=$INSTALL_DIR:\$PATH"
            ;;
        bash)
            config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile $XDG_CONFIG_HOME/bash/.bashrc $XDG_CONFIG_HOME/bash/.bash_profile"
            command="export PATH=$INSTALL_DIR:\$PATH"
            ;;
        ash|sh)
            config_files="$HOME/.ashrc $HOME/.profile /etc/profile"
            command="export PATH=$INSTALL_DIR:\$PATH"
            ;;
        *)
            config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile"
            command="export PATH=$INSTALL_DIR:\$PATH"
            ;;
    esac

    config_file=""
    for file in $config_files; do
        if [[ -f "$file" ]]; then
            config_file=$file
            break
        fi
    done

    if [[ -z "$config_file" ]]; then
        print_message info "Manually add to PATH: $command"
    elif [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        add_to_path "$config_file" "$command"
    fi
fi

if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
    echo "$INSTALL_DIR" >> "$GITHUB_PATH"
fi

echo -e "\n${MUTED}fatima installed to ${NC}$INSTALL_DIR/fatima"
echo -e "${MUTED}Run ${NC}fatima --help${MUTED} to get started.${NC}\n"
