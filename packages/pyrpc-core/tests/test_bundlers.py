from pyrpc_core.bundlers import configure_bundler

_VITE_ALIAS = '"@pyrpc/types": "./__pyrpc.ts"'
_NEXT_ALIAS = '"@pyrpc/types": "./__pyrpc.ts"'


def test_no_config_file_is_a_noop(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    assert configure_bundler(str(client_dir)) is True


def test_vite_defineconfig_gets_alias(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "vite.config.ts"
    cfg.write_text(
        "import { defineConfig } from 'vite'\n"
        "export default defineConfig({\n"
        "  plugins: [vue()],\n"
        "})\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert "resolve: { alias: { \"@pyrpc/types\": \"./__pyrpc.ts\" } }" in content
    assert "plugins: [vue()]" in content
    assert content.endswith("})\n")


def test_vite_config_with_braces_in_strings(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "vite.config.js"
    cfg.write_text(
        "module.exports = defineConfig({\n"
        "  define: { __MY_VAR__: '{\"x\": 1}' },\n"
        "  server: { proxy: { '/api': 'http://localhost:8000' } },\n"
        "})\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert '__MY_VAR__' in content
    assert "'{\"x\": 1}'" in content
    assert _VITE_ALIAS in content


def test_vite_already_aliased_is_idempotent(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "vite.config.ts"
    original = (
        "import { defineConfig } from 'vite'\n"
        "export default defineConfig({\n"
        "  plugins: [vue()],\n"
        '  resolve: { alias: { "@pyrpc/types": "./__pyrpc.ts" } },\n'
        "})\n"
    )
    cfg.write_text(original, encoding="utf-8")

    assert configure_bundler(str(client_dir)) is True
    assert cfg.read_text(encoding="utf-8") == original


def test_vite_without_defineconfig_returns_false(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "vite.config.ts"
    cfg.write_text("export default { plugins: [vue()] }\n", encoding="utf-8")

    assert configure_bundler(str(client_dir)) is False
    assert _VITE_ALIAS not in cfg.read_text(encoding="utf-8")


def test_next_export_default_gets_alias(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.ts"
    cfg.write_text(
        "import type { NextConfig } from 'next'\n"
        "const nextConfig: NextConfig = {}\n"
        "export default nextConfig\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert "turbopack: { resolveAlias: { \"@pyrpc/types\": \"./__pyrpc.ts\" } }" in content


def test_next_const_object_gets_alias(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.js"
    cfg.write_text(
        "const nextConfig = {\n"
        "  reactStrictMode: true,\n"
        "}\n"
        "module.exports = nextConfig\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert "turbopack: { resolveAlias: { \"@pyrpc/types\": \"./__pyrpc.ts\" } }" in content
    assert "reactStrictMode: true" in content


def test_next_module_exports_object_returns_false(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.js"
    cfg.write_text(
        "module.exports = { reactStrictMode: true }\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is False
    assert _NEXT_ALIAS not in cfg.read_text(encoding="utf-8")


def test_next_already_aliased_is_idempotent(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.ts"
    original = (
        "const nextConfig = {\n"
        "  reactStrictMode: true,\n"
        '  turbopack: { resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" } },\n'
        "}\n"
        "export default nextConfig\n"
    )
    cfg.write_text(original, encoding="utf-8")

    assert configure_bundler(str(client_dir)) is True
    assert cfg.read_text(encoding="utf-8") == original


def test_next_comment_only_object_gets_alias_without_leading_comma(tmp_path):
    """Issue #129: a comment-only body must not produce a leading comma."""
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.ts"
    cfg.write_text(
        "import type { NextConfig } from 'next'\n"
        "const nextConfig: NextConfig = {\n"
        "  /* config options here */\n"
        "}\n"
        "export default nextConfig\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert _NEXT_ALIAS in content
    assert content == (
        "import type { NextConfig } from 'next'\n"
        "const nextConfig: NextConfig = {\n"
        "  /* config options here */\n"
        'turbopack: { resolveAlias: { "@pyrpc/types": "./__pyrpc.ts" } }}\n'
        "export default nextConfig\n"
    )


def test_next_same_line_comment_only_object_gets_alias(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.ts"
    cfg.write_text(
        "const nextConfig: NextConfig = { /* config options here */ }\n"
        "export default nextConfig\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert _NEXT_ALIAS in content
    assert ", turbopack:" not in content


def test_next_comment_and_props_still_get_comma_separated_alias(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "next.config.ts"
    cfg.write_text(
        "const nextConfig: NextConfig = {\n"
        "  reactStrictMode: true, /* keep me */\n"
        "}\n"
        "export default nextConfig\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert _NEXT_ALIAS in content
    assert "reactStrictMode: true" in content
    assert ", turbopack:" in content


def test_vite_comment_only_object_gets_alias_without_leading_comma(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "vite.config.ts"
    cfg.write_text(
        "import { defineConfig } from 'vite'\n"
        "export default defineConfig({\n"
        "  /* config options here */\n"
        "})\n",
        encoding="utf-8",
    )

    assert configure_bundler(str(client_dir)) is True

    content = cfg.read_text(encoding="utf-8")
    assert _VITE_ALIAS in content
    assert ", resolve:" not in content


def test_ts_config_takes_precedence_over_js(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    ts_cfg = client_dir / "next.config.ts"
    ts_cfg.write_text("const nextConfig = {}\nexport default nextConfig\n", encoding="utf-8")
    js_cfg = client_dir / "next.config.js"
    js_cfg.write_text("const nextConfig = {}\nmodule.exports = nextConfig\n", encoding="utf-8")

    assert configure_bundler(str(client_dir)) is True

    assert _NEXT_ALIAS in ts_cfg.read_text(encoding="utf-8")
    assert _NEXT_ALIAS not in js_cfg.read_text(encoding="utf-8")
