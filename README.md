# Devin CLI Pinokio Plugin

A Pinokio plugin that installs and launches [Devin CLI](https://devin.ai/cli) in any app or workspace folder.

Devin CLI is Cognition's local coding agent: it runs in your terminal, works with the repository, shell, and credentials already on your machine, supports every frontier model (Anthropic, OpenAI, Google, Cognition, and open-weight models), and can hand a session off to Devin Cloud with `/handoff`.

## What it does

- **Install** downloads and installs the latest `devin` binary with the official installer.
- **Run / Open in** starts the interactive Devin terminal UI inside the folder you launched it from.
- **Update** pulls the launcher and re-runs the official installer to get the latest build.
- **Uninstall** removes the plugin folder. The CLI itself and its data (credentials, session history) are left in place.

## Installation

The plugin uses one command for every OS:

```bash
curl -fsSL https://cli.devin.ai/install.sh | bash
```

The installer detects Windows (Git Bash / MSYS2 / Cygwin) and hands off to Cognition's PowerShell installer automatically, so the same command works on macOS, Linux, WSL, and Windows. Pinokio runs it through its bundled `bash`, which is required on Windows because the default shell there is `cmd.exe`.

Install locations used by the plugin's launcher fallback:

- macOS / Linux: `$XDG_DATA_HOME/devin/cli/_versions/current/bin/devin` (defaults to `~/.local/share/devin/cli/_versions/current/bin/devin`)
- Windows: `%LOCALAPPDATA%\devin\cli\bin\devin.exe`

## Usage

1. Open the plugin from Pinokio's plugin list, or use **Open in** on an app/workspace.
2. Click **Install** the first time.
3. Click **Run**. Devin starts in that folder.
4. On first use, run `/login` inside Devin to authenticate with your Devin account.

Useful commands inside a session:

```
/model            # pick any model, effort level, or Fusion pairing
/plan             # agree on an approach before editing
/accept-edits     # auto-approve edits in the workspace
/handoff          # continue the session in Devin Cloud
/resume           # pick up a previous session
```

## Programmatic access

Devin CLI is a terminal application, so it has no HTTP server or REST endpoint. The programmatic surface is its single-turn mode, which prints the answer to stdout and exits:

```bash
devin -p "summarize the failing tests in this repo"
```

Use `--` before the prompt when it could be mistaken for a subcommand:

```bash
devin -p -- "check out this code and suggest a feasible feature"
```

### JavaScript

```javascript
const { spawnSync } = require("node:child_process");

const run = spawnSync("devin", ["-p", "list the endpoints this service exposes"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (run.error) throw run.error;
if (run.status !== 0) throw new Error(run.stderr);
process.stdout.write(run.stdout);
```

### Python

```python
import subprocess

result = subprocess.run(
    ["devin", "-p", "list the endpoints this service exposes"],
    capture_output=True,
    text=True,
    check=True,
)

print(result.stdout)
```

### Curl

There is no HTTP API to call. `curl` is only used to install the CLI:

```bash
curl -fsSL https://cli.devin.ai/install.sh | bash
```

For non-interactive automation, call the installed binary as shown above (`devin -p "..."`), or use Devin Cloud's own API instead.

## Notes

- The plugin runs Devin against `{{args.cwd}}`, the folder you launched it from, never the plugin folder itself.
- The installer's `devin setup` step runs at the end of installation, so no extra setup script is needed.
- If `devin` is not yet visible on PATH in the running Pinokio process, the plugin falls back to the official install location listed above.
