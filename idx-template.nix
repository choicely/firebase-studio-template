{ pkgs, app_key, api_key, ... }: {
  packages = [
    pkgs.curl
    pkgs.gzip
    pkgs.gnutar
    pkgs.jq
    pkgs.rsync
  ];

  bootstrap = ''
    set -eo pipefail

    cp -rf ${./.} "$out"
    chmod -R +w "$out"
    rm -rf "$out/.git" "$out/idx-template".{nix,json}
    cd "$out"

    tmpdir="$(mktemp -d)"
    trap 'rm -rf "$tmpdir"' EXIT

    repo_tgz="$tmpdir/repo.tgz"
    mods_tgz="$tmpdir/node_modules.tgz"

    # --- timing helpers (seconds since epoch) ---
    now_s() { date +%s; }

    dl_start="$(now_s)"

    curl -fL --retry 3 --retry-delay 1 --compressed \
      "https://github.com/choicely/choicely-sdk-demo-react-native/archive/refs/heads/main.tar.gz" \
      -o "$repo_tgz" &

    curl -fL --retry 3 --retry-delay 1 --compressed \
      "https://github.com/choicely/choicely-sdk-demo-react-native/releases/download/v0.0.8-alpha/node_modules-linux-x86_64-node20.tar.gz" \
      -o "$mods_tgz" &

    wait

    dl_end="$(now_s)"
    dl_secs="$((dl_end - dl_start))"

    unarchive_start="$(now_s)"

    # Extract repo
    tar -xzf "$repo_tgz" -C "$tmpdir"
    rsync -a --ignore-existing \
      "$tmpdir"/choicely-sdk-demo-react-native-main/ \
      "$out"/

    # Extract node_modules
    tar -xzf "$mods_tgz" --keep-old-files >/dev/null 2>&1 || true

    unarchive_end="$(now_s)"
    unarchive_secs="$((unarchive_end - unarchive_start))"

    # Cleanup repo junk
    rm -rf \
      AGENTS.md \
      ios android gradle \
      gradlew gradlew.bat \
      settings.gradle gradle.properties build.gradle \
      || true

    printf '%s="%s"\n' "CHOICELY_APP_NAME" "$WS_NAME" >> default.env
    printf '%s=%s\n' "CHOICELY_APP_KEY" "${app_key}" >> default.env
    printf '%s=%s\n' "CHOICELY_API_KEY" "${api_key}" >> .env

    # --- write timings (seconds) ---
    printf '%s=%s\n' "BOOTSTRAP_DL_SECS" "$dl_secs" >> default.env
    printf '%s=%s\n' "BOOTSTRAP_UNARCHIVE_SECS" "$unarchive_secs" >> default.env

    jq --arg app_key "${app_key}" --arg api_key "${api_key}" \
      '.mcpServers."choicely-backend-http".headers."X-Choicely-App-Key" = $app_key
       | .mcpServers."choicely-backend-http".headers.Authorization = "Bearer " + $api_key' \
      .idx/mcp.json > .idx/mcp.json.tmp && mv .idx/mcp.json.tmp .idx/mcp.json

    chmod -R a+x scripts
  '';
}
