# Deployment

## Production target

- Full provider demo: https://hermes-vps.tail309730.ts.net:10001/
- Vercel UI mirror: https://codex-experiment-gallery.vercel.app/
- GitHub: https://github.com/igoingtodevx/codex-experiment-gallery

The full provider runtime runs on the existing Hermes VPS. Vercel Hobby serves the UI mirror; its 10-second function limit is below the measured Vision request time, so the Vercel deployment is not the provider target.

## VPS service

- Checkout: `/home/deploy/workspace/codex-experiment-gallery`
- User unit: `~/.config/systemd/user/codex-experiment-gallery.service`
- Local bind: `127.0.0.1:3005`
- Environment file: `/home/deploy/.hermes/.env` (never commit this file)
- Model: `gpt-5.6-luna`
- Public exposure: Tailscale Funnel HTTPS port `10001`

The service is a user-level systemd unit. The `deploy` user has linger enabled, so the unit survives logout and starts with the user manager.

## Lifecycle

```bash
systemctl --user status codex-experiment-gallery.service
systemctl --user restart codex-experiment-gallery.service
journalctl --user -u codex-experiment-gallery.service -n 80 --no-pager
curl -fsS http://127.0.0.1:3005/
tailscale funnel status
```

Do not change the existing Tailscale routes on ports `8443` and `10000`. Port `10001` is reserved for this app.

## Release sequence

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run browser:smoke
npm run browser:interaction
git push origin main
systemctl --user restart codex-experiment-gallery.service
```

After a release, verify the public URL with one invalid request and one representative request for each provider mode: Structured Output, Function Calling, and Vision. Provider requests consume quota; keep them out of the default test suite.

## Environment

Required server-side variable:

- `OPENAI_API_KEY` — supplied through the VPS environment only; never place it in Git, README files, Vercel source, browser code, or chat.

Optional variables:

- `OPENAI_MODEL` — defaults to `gpt-5.6-luna` in the application; the systemd unit pins the production target explicitly.
- `MAX_REQUEST_BYTES` — request ceiling, default `1500000`.
