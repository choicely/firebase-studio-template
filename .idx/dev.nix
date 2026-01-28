# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-25.05";
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
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
      };
      # Runs when a workspace restarted
      onStart = {
        choicely-config-update = ''
          ./scripts/update_env.sh
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
