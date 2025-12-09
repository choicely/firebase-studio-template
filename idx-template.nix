{ pkgs, app_key, api_key, ... }: {
  # Shell script that produces the final environment
  packages = [
      pkgs.curl
      pkgs.gzip
      pkgs.gnutar
      pkgs.nodejs_20
  ];
  bootstrap = ''
    set -eo pipefail
    # Copy the folder containing the `idx-template` files to the final
    # project folder for the new workspace. ${./.} inserts the directory
    # of the checked-out Git folder containing this template.
    cp -rf ${./.} "$out"
    # Set some permissions
    chmod -R +w "$out"
    # Remove the template files themselves and any connection to the template's
    # Git repository
    rm -rf "$out/.git" "$out/idx-template".{nix,json}
    cd "$out"
    printf '%s="%s"\n' "CHOICELY_APP_NAME" "$WS_NAME" >> default.env
    printf '%s=%s\n' "CHOICELY_APP_KEY" "${app_key}" >> default.env
    printf '%s=%s\n' "CHOICELY_API_KEY" "${api_key}" >> .env
    set -a
    [ -f default.env ] && source default.env
    [ -f .env ] && source .env
    set +a
    chmod -R a+x scripts
    ./scripts/update_tasks.sh "$CHOICELY_APP_KEY" &
    # Install npm dependencies
    curl -L "https://github.com/choicely/choicely-sdk-demo-react-native/releases/download/debug/node_modules-linux-x86_64-node20.tar.gz" | tar -xzf -
    npm install --no-audit --no-fund --progress=false
    wait
  '';
  # Faster setup: npm build
}
