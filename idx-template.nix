{ pkgs, app_key, api_key, ... }: {
  # Shell script that produces the final environment
  packages = [
      pkgs.curl
      pkgs.gzip
      pkgs.gnutar
      pkgs.jq
      pkgs.rsync
  ];
  bootstrap = ''
    set -eo pipefail
    # Copy the folder containing the `idx-template` files to the final
    # project folder for the new workspace. ${./.} inserts the directory
    # of the checked-out Git folder containing this template.
    cp -rf ${./.} "$out"
    chmod -R +w "$out"
    rm -rf "$out/.git" "$out/idx-template".{nix,json}
    cd "$out"

    tmpdir="$(mktemp -d)"
    trap 'rm -rf "$tmpdir"' EXIT

    repo_tgz="$tmpdir/repo.tgz"
    mods_tgz="$tmpdir/node_modules.tgz"

    curl -fL --retry 3 --retry-delay 1 --compressed \
      "https://github.com/choicely/choicely-sdk-demo-react-native/archive/refs/heads/realtime-updates.tar.gz" \
      -o "$repo_tgz" &

    curl -fL --retry 3 --retry-delay 1 --compressed \
      "https://github.com/choicely/choicely-sdk-demo-react-native/releases/download/v0.0.9-alpha/node_modules-linux-x86_64-node20.tar.gz" \
      -o "$mods_tgz" &

    wait

    # Extract node_modules
    tar -xzf "$mods_tgz" --keep-old-files >/dev/null 2>&1 || true

    # Extract repo
    tar -xzf "$repo_tgz" -C "$tmpdir"

    rsync -a --ignore-existing \
      "$tmpdir"/choicely-sdk-demo-react-native-realtime-updates/ \
      "$out"/
    # Cleanup repo junk
    rm -rf \
      AGENTS.md \
      ios android gradle \
      gradlew gradlew.bat \
      settings.gradle gradle.properties build.gradle \
      || true

    chmod -R a+x scripts

    printf '%s="%s"\n' "CHOICELY_APP_NAME" "$WS_NAME" >> default.env
    printf '%s=%s\n' "CHOICELY_APP_KEY" "${app_key}" >> default.env
    printf '%s=%s\n' "CHOICELY_API_KEY" "${api_key}" >> .env

    jq --arg app_key "${app_key}" --arg api_key "${api_key}" \
      '.mcpServers."choicely-backend-http".headers."X-Choicely-App-Key" = $app_key
       | .mcpServers."choicely-backend-http".headers.Authorization = "Bearer " + $api_key' \
      .idx/mcp.json > .idx/mcp.json.tmp && mv .idx/mcp.json.tmp .idx/mcp.json
  '';
}
