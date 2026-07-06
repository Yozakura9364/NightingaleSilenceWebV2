# NS Ops Runner

`ns-ops-runner` is a small localhost-only job runner for the AstrBot `/ns` plugin.
It exposes a fixed set of whitelisted jobs and never accepts arbitrary shell text
from QQ messages.

## Start

```powershell
Set-Location 'H:\NightingaleSilenceWeb\NightingaleSilenceWebV2'
$env:NS_OPS_TOKEN = 'replace-with-a-long-random-token'
node .\tools\ns-ops-runner\server.mjs
```

For local testing only, the runner falls back to `dev-local-token` when
`NS_OPS_TOKEN` is not set. Do not expose that default outside this machine.

The default endpoint is:

```text
http://127.0.0.1:18766
```

AstrBot runs in Docker, so the plugin should call:

```text
http://host.docker.internal:18766
```

## Current Jobs

- `system.status`
- `astrbot.logs`
- `v2.status`
- `v2.check`
- `armoire.check-store`
- `armoire.audit-store`
- `restart.astrbot` (requires confirmation)

## Safety

- Jobs are registered in code.
- QQ input selects a job id; it is never appended to a shell command.
- Restart jobs require an in-memory confirmation token.
- Logs are written to `tools/ns-ops-runner/logs/`, which is gitignored.
