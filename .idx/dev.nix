# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-25.05";
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.jdk17
    pkgs.cloudflared
    pkgs.qrencode
    pkgs.zip
    pkgs.zstd
    pkgs.watchman
  ];
  services.docker.enable = false;
  # Sets environment variables in the workspace
  env = { };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      "msjsdiag.vscode-react-native"
      "formulahendry.code-runner"
    ];
    workspace = {
      # Runs when a workspace is first created with this `dev.nix` file
      onCreate = {
        default.openFiles = [ ];
        bash-setup = ''
          set -eo pipefail
          PROJECT_DIR="$PWD"
          pushd "$HOME"
          cat > ~/.bashrc <<BASHRC
          unset PROMPT_COMMAND
          __vsc_prompt_cmd_original() { :; }
          unset -f command_not_found_handle 2>/dev/null || true
          # auto-export env vars from the original project dir
          if [ -d "$PROJECT_DIR" ]; then
            set -a
            [ -f "$PROJECT_DIR/default.env" ] && . "$PROJECT_DIR/default.env"
            [ -f "$PROJECT_DIR/.env" ] && . "$PROJECT_DIR/.env"
            set +a
          fi
          export PROJECT_DIR="$PROJECT_DIR"
          export ANDROID_SDK_ROOT="/home/$USER/.androidsdkroot"
          export ANDROID_HOME="/home/$USER/.androidsdkroot"
          export PATH="/home/$USER/.androidsdkroot/build-tools/36.0.0:/home/$USER/.androidsdkroot/platform-tools:$PATH"
          chmod -R a+x $PROJECT_DIR/scripts
          BASHRC
          popd
          exit
        '';
        create-env = ''
          set -a
          [ -f default.env ] && source default.env
          [ -f .env ] && source .env
          set +a
          # Fail fast if WEB_HOST isn't set
          : "''${WEB_HOST:?WEB_HOST is required}"
          cat >> .env <<EOF
          GEMINI_API_KEY=""
          EOF
          exit
        '';
      };
      # Runs when a workspace restarted
      onStart = {
        choicely-config-update = ''
          ./scripts/update_env.sh
        '';
        mobile-rn = ''
          set -eo pipefail
          echo -e "\033[1;33mStarting Metro development server...\033[0m"
          ./scripts/utils/http_retry_until.sh "http://localhost:''${RCT_METRO_PORT}/src/index.bundle?platform=android&dev=true&lazy=true&minify=false&app=com.choicely.sdk.rn.debug&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server" 200 &
          npm start
          wait
        '';
        web-rn = ''
          set -eo pipefail
          echo -e "\033[1;33mStarting web development server...\033[0m"
          npm run web
        '';
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = [
            "bash"
            "-lc"
            "source \"$HOME/.bashrc\" && npm run preview -- \"$PORT\""
          ];
          manager = "web";
        };
      };
    };
  };
}
