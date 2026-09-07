"""Create an explicit source-only Docker build context; no credentials or local caches."""
from pathlib import Path
import tarfile

root = Path(__file__).resolve().parents[1]
target = root / "dist" / "cattfan-source.tar.gz"
target.parent.mkdir(exist_ok=True)
excluded = {"node_modules", ".next", "out", "test-results", "playwright-report", ".turbo", "__pycache__"}
roots = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".npmrc", "Dockerfile", ".dockerignore", "compose.yaml", "deploy", "packages", "apps/web"]
count = 0
with tarfile.open(target, "w:gz") as archive:
    for item in roots:
        path = root / item
        paths = [path] if path.is_file() else path.rglob("*")
        for file in paths:
            relative = file.relative_to(root)
            if not file.is_file() or file.is_symlink() or excluded.intersection(relative.parts):
                continue
            if file.name.startswith(".env") or file.suffix in {".pem", ".key", ".log", ".zip"}:
                continue
            archive.add(file, arcname=str(relative), recursive=False)
            count += 1
print(f"DEPLOY_PACKAGE_PASS: {count} files; {target.stat().st_size} bytes; {target}")
