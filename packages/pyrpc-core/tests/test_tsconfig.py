import re

import pytest
from pyrpc_core.tsconfig import configure_tsconfig


def test_missing_compiler_options(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "tsconfig.json"
    cfg.write_text("{\n  // A comment\n}", encoding="utf-8")
    
    assert configure_tsconfig(str(client_dir)) is True
    
    content = cfg.read_text(encoding="utf-8")
    assert '"@pyrpc/types":["./__pyrpc.ts"]' in re.sub(r'\s+', '', content)
    assert '// A comment' in content
    assert 'compilerOptions' in content

def test_missing_paths(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "tsconfig.json"
    cfg.write_text("""{
  /* block comment */
  "compilerOptions": {
    "strict": true
  },
  "include": ["src"]
}""", encoding="utf-8")
    
    assert configure_tsconfig(str(client_dir)) is True
    
    content = cfg.read_text(encoding="utf-8")
    assert '"@pyrpc/types":["./__pyrpc.ts"]' in re.sub(r'\s+', '', content)
    assert '/* block comment */' in content
    assert '"strict": true' in content
    assert '"include": ["src"]' in content

def test_existing_paths_with_comments_and_trailing_commas(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "tsconfig.json"
    original = """{
  "compilerOptions": {
    // some comment
    "paths": {
      "~/*": ["./src/*"], // existing alias
    }, /* trailing comma above! */
    "target": "ES2022"
  }
}"""
    cfg.write_text(original, encoding="utf-8")
    
    assert configure_tsconfig(str(client_dir)) is True
    
    content = cfg.read_text(encoding="utf-8")
    # Should contain the new alias
    assert '"@pyrpc/types":["./__pyrpc.ts"]' in re.sub(r'\s+', '', content)
    # Should preserve existing
    assert '"~/*":["./src/*"]' in re.sub(r'\s+', '', content)
    assert '// some comment' in content
    assert '// existing alias' in content
    assert '/* trailing comma above! */' in content
    assert '"target": "ES2022"' in content

def test_existing_correct_alias_is_idempotent(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "tsconfig.json"
    original = """{
  "compilerOptions": {
    "paths": {
      "@pyrpc/types": ["./__pyrpc.ts"]
    }
  }
}"""
    cfg.write_text(original, encoding="utf-8")
    
    assert configure_tsconfig(str(client_dir)) is True
    content = cfg.read_text(encoding="utf-8")
    assert content == original

def test_conflicting_alias_raises_error(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "tsconfig.json"
    cfg.write_text("""{
  "compilerOptions": {
    "paths": {
      "@pyrpc/types": ["./src/__pyrpc.ts"]
    }
  }
}""", encoding="utf-8")
    
    with pytest.raises(RuntimeError, match="already configured to point elsewhere"):
        configure_tsconfig(str(client_dir))

def test_repeated_execution_is_idempotent(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    cfg = client_dir / "tsconfig.json"
    cfg.write_text("""{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}""", encoding="utf-8")
    
    # First execution
    assert configure_tsconfig(str(client_dir)) is True
    content1 = cfg.read_text(encoding="utf-8")
    assert '"@pyrpc/types"' in content1
    
    # Second execution
    assert configure_tsconfig(str(client_dir)) is True
    content2 = cfg.read_text(encoding="utf-8")
    
    assert content1 == content2

def test_no_tsconfig_file(tmp_path):
    client_dir = tmp_path / "client"
    client_dir.mkdir()
    # No tsconfig.json created
    assert configure_tsconfig(str(client_dir)) is True
