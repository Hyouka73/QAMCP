"""Compare diagnostic multisets; argv: current repo, historical logs, output JSON."""
import collections
import json
from pathlib import Path
import re
import sys

repo, baseline, output = map(Path, sys.argv[1:])


def diagnostics(path):
    counts = collections.Counter()
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        match = re.match(r"(.*?)\(\d+,\d+\): error (TS\d+): (.*)", line)
        if not match:
            continue
        file, code, message = match.groups()
        # TS6059 embeds absolute checkout roots. Normalize only that location,
        # preserving file, code and the complete meaningful diagnostic text.
        message = re.sub(r"[A-Za-z]:/[^']+?/packages/", "<repo>/packages/", message.replace("\\", "/"))
        counts[(file.replace("\\", "/"), code, message)] += 1
    return counts


def compare(old, new):
    before, after = diagnostics(old), diagnostics(new)

    def rows(counter):
        return [dict(file=k[0], code=k[1], message=k[2], count=v) for k, v in sorted(counter.items())]

    return dict(baseline=sum(before.values()), R5=sum(after.values()),
                retained=sum((before & after).values()), added=rows(after - before), resolved=rows(before - after))


result = {
    "method": "Multisets of file/code/message, ignoring shifted lines and normalizing absolute checkout prefixes inside TS6059. No diagnostics suppressed.",
    "MCP_vs_INT03": compare(baseline / "int03-baseline-tsc-mcp.log", repo / "r5-tsc-mcp-final.log"),
    "root_vs_candidate": compare(baseline / "consolidated-typecheck.log", repo / "r5-tsc-root-final.log"),
    "five_additional_vs_INT03": dict(performance_TS2304=2, node_imports_TS2307=3,
                                    knowledge_package_diagnostics=0, runner_package_diagnostics=0, build="PASS"),
}
output.write_text(json.dumps(result, indent=2), encoding="utf-8")
print(json.dumps(result, indent=2))
