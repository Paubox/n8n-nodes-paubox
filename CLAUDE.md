# CLAUDE.md

Guidance for Claude Code sessions working in this repo.

## Overview

`n8n-nodes-paubox` is an n8n community node package that adds a single
`Paubox` node for sending HIPAA-compliant email via the Paubox Email API.
It is a small TypeScript library: source compiles to `dist/` and is
published to npm as `n8n-nodes-paubox`. Users install it into their n8n
instance (cloud or self-hosted) via the Community Nodes UI. Two
operations are supported on the `message` resource: `send` (POST a
message) and `getDisposition` (look up delivery / tracking info by
`sourceTrackingId`).

## Layout

- `nodes/Paubox/Paubox.node.ts` — the n8n node. All UI fields, validation,
  request building, and HTTP calls live in this single ~550-line file.
  Two endpoints are hit:
  - `POST https://api.paubox.net/v1/{apiUsername}/messages`
  - `GET  https://api.paubox.net/v1/{apiUsername}/message_receipt?sourceTrackingId=...`
- `nodes/Paubox/paubox.svg` — node icon, copied to `dist/` at build time.
- `credentials/PauboxApi.credentials.ts` — `pauboxApi` credential type
  (apiUsername + apiKey). Declares a generic `authenticate` header but
  see "Conventions" below — it is not actually used at request time.
- `index.ts` — re-exports the node and credential class. Not required
  by n8n, kept for completeness.
- `package.json` — the `n8n` field tells n8n where the compiled
  credential and node entrypoints live in `dist/`. Update it if files
  move.
- `tsconfig.json` — strict, ES2019, commonjs, `outDir: ./dist`,
  `rootDir: .`, only `nodes/**/*` and `credentials/**/*` compiled.
- `.eslintrc.js` — uses `eslint-plugin-n8n-nodes-base` (the official
  community-node lint preset). Take its warnings seriously; they gate
  acceptance into the n8n npm registry.
- `reference/Paubox Email API v. 1.0.0.json` — vendored OpenAPI spec
  from Paubox. Reference only; not bundled.

## Commands

```bash
npm install                # install deps
npm run build              # tsc + copy SVG into dist/
npm run dev                # tsc --watch
npm run lint               # eslint nodes credentials --ext .ts
npm run lintfix            # eslint --fix
npm run format             # prettier write nodes/ credentials/
npm run prepublishOnly     # build + lint, runs automatically on publish
```

There is no test runner configured. Validation is manual: build, link
into a local n8n, exercise the node.

## Local testing in n8n

```bash
npm run build
npm link
cd ~/.n8n
npm link n8n-nodes-paubox
# restart n8n
```

The node should appear in the n8n editor as "Paubox" after restart.

## Credentials and config

- Credential type: `pauboxApi` (defined in
  `credentials/PauboxApi.credentials.ts`). Two fields:
  - `apiUsername` — Paubox API endpoint username (embedded in the
    request URL path).
  - `apiKey` — Paubox API token. Sent as
    `Authorization: Token token={apiKey}`.
- No environment variables are read by this package.
- The credential's commented-out `test` block can be re-enabled to
  validate credentials against `/message_receipt`; currently bad
  credentials only surface on first real call.

## Dependencies / external services

- `n8n-workflow` — peer dependency, provided by the host n8n install.
- Paubox Email API (`api.paubox.net`) — the only external service. No
  other Paubox infrastructure (Graylog, Sentry, internal LDAP, etc.) is
  involved; this repo is fully external-facing.

## Conventions

- **Tabs, not spaces.** Required by n8n's lint preset and the existing
  files.
- **All node UI lives in `Paubox.node.ts`.** Field visibility is driven
  by `displayOptions.show` keyed off `resource` and `operation`. There
  is no separate descriptions/ directory split — keep it that way until
  the file grows past ~1000 lines.
- **HTTP is done with `this.helpers.httpRequest` directly**, not
  `httpRequestWithAuthentication`. This means the `authenticate` block
  in `PauboxApi.credentials.ts` is effectively dead code for outbound
  requests — only the raw `apiUsername` / `apiKey` are read. If you
  change auth, update both places (the credential class and every
  `httpRequest` call in the node) or migrate the node to
  `httpRequestWithAuthentication` and delete the duplication.
- **Recipients are accepted as a comma-separated string** in the `to`,
  `cc`, and `bcc` fields and split inside `execute()`. Keep that
  contract; downstream users rely on it.
- **Validation uses `NodeOperationError`** with `itemIndex` so n8n can
  highlight the bad item. Honor `this.continueOnFail()` — see the
  `try/catch` at the bottom of `execute()`.
- **`additionalFields` is a single n8n collection** holding every
  optional flag, header, and attachment. Add new optional fields there
  rather than at the top level so the basic UI stays clean.
- **Compiled output paths must match `package.json`'s `n8n` field**
  (`dist/credentials/PauboxApi.credentials.js`,
  `dist/nodes/Paubox/Paubox.node.js`). Don't rename source files
  without updating that block.
- **Custom email headers must start with `X-`** (Paubox API rule,
  documented in the README and enforced server-side, not in this
  code).

## Publishing

`prepublishOnly` runs `npm run build && npm run lint`. Bump `version`
in `package.json`, ensure the working tree is clean, then `npm publish`.
The `files` field restricts the published tarball to `dist/`.

## Known papercuts

- README's manual-install example still says
  `git clone https://github.com/yourusername/n8n-nodes-paubox.git` —
  the placeholder was never replaced with `Paubox`. Safe to fix.
- Credential `test` request is commented out, so the n8n "Test"
  button on the credential does nothing useful.
