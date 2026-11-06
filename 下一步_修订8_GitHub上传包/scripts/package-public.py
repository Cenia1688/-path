"""Build the keyless revision8 export using an explicit file allowlist."""
from pathlib import Path
import argparse
import hashlib
import json
import re
import shutil
import zipfile

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path, default=root.parent / 'output/websites/下一步_修订8_2026-11-06_无接口部署包.zip')
parser.add_argument('--export-dir', type=Path)
args = parser.parse_args()
output = args.output.resolve()
output.parent.mkdir(parents=True, exist_ok=True)
files = [root / s for s in ['server.mjs', 'package.json', 'Dockerfile', 'compose.yaml', '.gitignore', '.dockerignore', 'README.md', '启动网站.command', 'deploy/修订8说明.md', 'scripts/package-public.py']]
for directory in ['lib', 'config', 'public', 'test', 'docs']:
    files.extend(p for p in (root / directory).rglob('*') if p.is_file() and p.name not in {'.DS_Store', 'ASSET_NOTES.md'} and '__pycache__' not in p.parts)
files = sorted(files)
for p in files:
    rel = p.relative_to(root)
    assert not p.is_symlink() and p.is_file(), f'Missing or linked file: {rel}'
    assert '.env' not in rel.parts and not p.name.startswith('.env'), f'Environment file: {rel}'
    blob = p.read_bytes()
    assert not re.search(rb'sk-[A-Za-z0-9]{20,}', blob), f'Credential-like value: {rel}'
    assert not re.search(rb'gh[pousr]_[A-Za-z0-9]{20,}', blob), f'Credential-like value: {rel}'
# A release may not include an online model implementation, even without a key.
for rel in ['server.mjs', 'public/simple.mjs', 'lib/providers.mjs']:
    assert b'chat/completions' not in (root / rel).read_bytes(), rel
manifest = {'revision': 8, 'containsServerEnv': False, 'onlineAnalysis': False,
            'files': [{'path': str(p.relative_to(root)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
manifest_bytes = json.dumps(manifest, ensure_ascii=False, indent=2).encode()
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in files:
        z.write(p, 'career-path-web/' + str(p.relative_to(root)))
    z.writestr('career-path-web/DEPLOYMENT_MANIFEST.json', manifest_bytes)
with zipfile.ZipFile(output) as z:
    assert z.testzip() is None
    for item in manifest['files']:
        assert hashlib.sha256(z.read('career-path-web/' + item['path'])).hexdigest() == item['sha256']
if args.export_dir:
    dest = args.export_dir.resolve()
    dest.mkdir(parents=True, exist_ok=True)
    assert not list(dest.iterdir()), 'Export directory must be empty'
    for p in files:
        target = dest / p.relative_to(root)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)
    (dest / 'DEPLOYMENT_MANIFEST.json').write_bytes(manifest_bytes)
print(json.dumps({'archive': str(output), 'files': len(files) + 1, 'bytes': output.stat().st_size, 'containsServerEnv': False}, ensure_ascii=False))
