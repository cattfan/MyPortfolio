"""Create an explicit source-only Docker build context; no credentials or local caches.

The archive is HEAD's tracked files (`git archive`), so a release always maps to a commit
and text files keep LF endings even when packaged from a Windows checkout.
"""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
target = root / "dist" / "cattfan-source.tar.gz"
target.parent.mkdir(exist_ok=True)
roots = ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".npmrc", "Dockerfile", ".dockerignore", "compose.yaml", "deploy", "packages", "apps/web"]


def git(*args):
    return subprocess.run(["git", "-c", "core.autocrlf=false", "-c", "core.eol=lf", *args], cwd=root, check=True, capture_output=True, text=True).stdout


if git("status", "--porcelain", "--", *roots).strip():
    raise SystemExit("Commit or stash changes first: the package is built from HEAD, not the working tree.")
files = git("ls-files", "--", *roots).splitlines()
risky = [file for file in files if Path(file).name.startswith(".env") or Path(file).suffix in {".pem", ".key", ".log", ".zip"}]
if risky:
    raise SystemExit(f"Refusing to package credential-like files: {risky}")
git("archive", "--format=tar.gz", f"--output={target}", "HEAD", "--", *roots)
print(f"DEPLOY_PACKAGE_PASS: {len(files)} files from {git('rev-parse', '--short', 'HEAD').strip()}; {target.stat().st_size} bytes; {target}")
