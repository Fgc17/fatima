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
    -v, --version <version> Install a specific version (e.g. 1.0.0)
    -b, --binary <path>     Install from a local binary instead of downloading
        --no-modify-path    Don't modify shell config files

Examples:
    curl -fsSL https://cdn.fatima.dev/install | bash
    curl -fsSL https://cdn.fatima.dev/install | bash -s -- --version 1.0.0
    ./install.sh --binary /path/to/fatima
EOF
}

requested_version=${VERSION:-}
binary_path=""
no_modify_path=false

while [[ $# -gt 0 ]]; do
	case "$1" in
		-h|--help) usage; exit 0 ;;
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
		--no-modify-path) no_modify_path=true; shift ;;
		*) echo -e "${ORANGE}Warning: Unknown option '$1'${NC}" >&2; shift ;;
	esac
done

INSTALL_DIR="$HOME/.fatima/bin"
mkdir -p "$INSTALL_DIR"

print_message() {
	local level=$1
	local message=$2
	local color="$NC"
	if [[ "$level" == "error" ]]; then color="$RED"; fi
	echo -e "${color}${message}${NC}"
}

normalize_version() {
	local version=$1
	version="${version#fatima@}"
	version="${version#v}"
	echo "$version"
}

detect_target() {
	local raw_os os arch target is_musl
	raw_os=$(uname -s)
	os=$(echo "$raw_os" | tr '[:upper:]' '[:lower:]')
	case "$raw_os" in
		Darwin*) os="darwin" ;;
		Linux*) os="linux" ;;
		MINGW*|MSYS*|CYGWIN*) os="win32" ;;
	esac

	arch=$(uname -m)
	case "$arch" in
		x86_64|amd64) arch="x64" ;;
		aarch64|arm64) arch="arm64" ;;
	esac

	is_musl=false
	if [[ "$os" == "linux" ]]; then
		if [[ -f /etc/alpine-release ]]; then is_musl=true; fi
		if command -v ldd >/dev/null 2>&1 && ldd --version 2>&1 | grep -qi musl; then is_musl=true; fi
	fi

	target="$os-$arch"
	if [[ "$is_musl" == "true" ]]; then target="$target-musl"; fi

	case "$target" in
		linux-x64|linux-arm64|linux-x64-musl|linux-arm64-musl|darwin-x64|darwin-arm64|win32-x64)
			echo "$target"
			;;
		*)
			print_message error "Unsupported OS/Arch: $os/$arch"
			exit 1
			;;
	esac
}

install_from_binary() {
	if [[ ! -f "$binary_path" ]]; then
		print_message error "Error: Binary not found at $binary_path"
		exit 1
	fi
	print_message info "\n${MUTED}Installing/updating ${NC}fatima ${MUTED}from: ${NC}$binary_path"
	cp "$binary_path" "$INSTALL_DIR/fatima"
	chmod 755 "$INSTALL_DIR/fatima"
}

resolve_latest_version() {
	curl -fsSL "https://api.github.com/repos/$REPO/releases?per_page=30" \
		| awk -F'"' '/"tag_name": "fatima@/{ sub(/^fatima@v?/, "", $4); print $4; exit }'
}

download_and_install() {
	local target version filename url tmp_dir binary_name install_name
	target=$(detect_target)
	binary_name="fatima"
	install_name="fatima"
	if [[ "$target" == win32-* ]]; then
		binary_name="fatima.exe"
		install_name="fatima.exe"
	fi

	if [[ -z "$requested_version" ]]; then
		version=$(resolve_latest_version)
	else
		version=$(normalize_version "$requested_version")
	fi

	if [[ -z "$version" ]]; then
		print_message error "Failed to fetch version information"
		exit 1
	fi

	filename="fatima-v$version-$target.zip"
	url="https://github.com/$REPO/releases/download/fatima@$version/$filename"

	print_message info "\n${MUTED}Installing/updating ${NC}fatima ${MUTED}version: ${NC}$version"
	tmp_dir="${TMPDIR:-/tmp}/fatima_install_$$"
	mkdir -p "$tmp_dir"
	trap 'rm -rf "$tmp_dir"' EXIT

	curl -# -L -o "$tmp_dir/$filename" "$url"
	unzip -q "$tmp_dir/$filename" -d "$tmp_dir"

	mv "$tmp_dir/$binary_name" "$INSTALL_DIR/$install_name"
	chmod 755 "$INSTALL_DIR/$install_name"
	if [[ "$install_name" != "fatima" ]]; then
		ln -sf "$INSTALL_DIR/$install_name" "$INSTALL_DIR/fatima"
	fi
}

add_to_path() {
	local config_file=$1
	local command=$2
	if grep -Fxq "$command" "$config_file"; then
		return
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

if [[ "$no_modify_path" != "true" ]]; then
	current_shell=$(basename "${SHELL:-sh}")
	case "$current_shell" in
		fish) config_files="$HOME/.config/fish/config.fish"; command="fish_add_path $INSTALL_DIR" ;;
		zsh) config_files="${ZDOTDIR:-$HOME}/.zshrc ${ZDOTDIR:-$HOME}/.zshenv"; command="export PATH=$INSTALL_DIR:\$PATH" ;;
		*) config_files="$HOME/.bashrc $HOME/.bash_profile $HOME/.profile"; command="export PATH=$INSTALL_DIR:\$PATH" ;;
	esac

	for file in $config_files; do
		if [[ -f "$file" ]]; then
			add_to_path "$file" "$command"
			break
		fi
	done
fi

if [[ "${GITHUB_ACTIONS:-}" == "true" ]]; then
	echo "$INSTALL_DIR" >> "$GITHUB_PATH"
fi

echo -e "\n${MUTED}fatima installed to ${NC}$INSTALL_DIR/fatima"
echo -e "${MUTED}Run ${NC}fatima --help${MUTED} to get started.${NC}\n"
