# NSArmoire Local Helper

NSArmoire local helper reads the local FFXIV game process and exposes a loopback-only JSON API for the V2 web page.

Current MVP scope:

- Reads `ffxiv_dx11.exe`.
- Locates glamour dresser memory using the adapted `ffxiv-dresser-analyze` signature route.
- Exposes `nsarmoire.snapshot.v1`.
- Supports only `glamourDresser` entries for now.

## Run

```powershell
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj
```

Optional arguments:

```powershell
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj -- --port 8015
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj -- --pid 12345
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj -- --allow-origin https://example.com
dotnet run --project .\tools\nsarmoire-helper\NsArmoire.Helper.csproj -- --web-url "http://localhost:5173/#/ffxiv/armoire"
```

Default endpoint:

```text
http://127.0.0.1:8015
```

## API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/health` | Helper status and supported containers. |
| `GET` | `/processes` | List selectable `ffxiv_dx11` processes. |
| `POST` | `/process/select` | Select a target process with `{ "pid": number }`. |
| `GET` | `/snapshot` | Read current glamour dresser data as `nsarmoire.snapshot.v1`. |
| `POST` | `/snapshot/refresh` | Read current glamour dresser data again. |
| `GET` | `/open-v2` | Open the configured V2 NSArmoire page in the system browser. |

The helper intentionally does not expose local game paths, process paths, stack traces, tokens, or cookies in API errors.
