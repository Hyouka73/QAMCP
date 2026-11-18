import collections
import json
import re
import sys
from pathlib import Path

root = Path(__file__).parent
logs = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'logs'

def types(name):
    text = (logs / name).read_text(encoding='utf-8-sig')
    return collections.Counter(
        f'{path} {code} {message}'
        for path, code, message in re.findall(r'^(.+?)\(\d+,\d+\): error (TS\d+): (.+)$', text, re.M)
    )

def lint(name):
    result = collections.Counter()
    current = None
    for line in (logs / name).read_text(encoding='utf-8-sig').splitlines():
        if re.match(r'^C:\\', line):
            current = re.split(r'mvp01-bva-rbac[\\/]', line, maxsplit=1)[-1].replace('\\', '/')
        match = re.match(r'^\s+\d+:\d+\s+(error|warning)\s+(.+?)\s{2,}(\S+)\s*$', line)
        if match and current:
            result[f'{current} {match[1]} {match[3]} {match[2]}'] += 1
    return result

def compare(before, after, other=None):
    introduced = after - before
    return {
        'baseline': sum(before.values()), 'consolidated': sum(after.values()),
        'retained': sum((before & after).values()),
        'resolved': dict(before - after),
        'addedVsINT03': dict(introduced),
        'addedInheritedFromR4': dict(introduced & other) if other is not None else {},
        'newNotInEitherParent': dict(introduced - other) if other is not None else dict(introduced),
    }

report = {
    'method': 'Diagnostic multiset by relative file, code/rule and message; ignores shifted positions. No diagnostics suppressed.',
    'lint': compare(lint('int03-baseline-lint.log'), lint('consolidated-lint.log'), lint('r4-lint.log')),
    'rootTypecheck': compare(types('int03-baseline-typecheck.log'), types('consolidated-typecheck.log'), types('r4-typecheck.log')),
    'packageTypecheck': {},
}
for package in ['shared', 'engine', 'knowledge', 'playwright-runner', 'mcp']:
    other = types('r4-tsc-knowledge.log') if package == 'knowledge' else None
    report['packageTypecheck'][package] = compare(
        types(f'int03-baseline-tsc-{package}.log'), types(f'consolidated-tsc-{package}.log'), other,
    )
output = root / 'diagnostics-comparison.json'
output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
for name, item in [('lint', report['lint']), ('root', report['rootTypecheck']), *report['packageTypecheck'].items()]:
    print(name, 'baseline', item['baseline'], 'consolidated', item['consolidated'], 'added', sum(item['addedVsINT03'].values()), 'newNotInEitherParent', sum(item['newNotInEitherParent'].values()))
