# Vathavaran Variables

Encrypted environment files for your GitHub repositories, across terminal, web,
and mobile. Share the configuration your team needs without passing secrets
around in messages.

[Open your workspace](https://vathavaran-variable.vercel.app) ·
[Read the guides](https://vathavaran-variable.vercel.app/docs)

## Start with the CLI

The native Go CLI is available as [varte on npm](https://www.npmjs.com/package/varte).
Install or upgrade with Node.js 18 or newer:

```sh
npm install -g varte@latest
varte --version
varte login
varte status
```

Varte supports Linux, macOS, and Windows on x64 and arm64. You do not need to
install Go or compile anything yourself.

## Share an environment file

Inside your GitHub repository:

```sh
varte push -f .env -d backend -n .env.production
varte list
varte pull -d backend --name .env.production --output .env
```

Use `--owner` and `--repo` when selecting a repository explicitly. Each upload adds
a saved version while keeping earlier versions available. Pull asks before replacing
an existing file; `--force` allows an intentional replacement in a script.

Your GitHub account determines repository access. Uploading requires write access.
Public source repositories do not make their environment files public.

## Use the website and mobile app

The [web workspace](https://vathavaran-variable.vercel.app) lets you browse
repositories, upload versions, and open or download saved configuration.

The Android app is available as a [preview APK](https://expo.dev/artifacts/eas/k-OK0GGHhh5ieZAVBmlW_tqWIDgADnl30EbHG3yrxcM.apk).
It is an internal preview; physical-device verification is still pending.

Both clients default to dark mode and offer appearance preferences. The
[web guide](https://vathavaran-variable.vercel.app/docs/guides/web) and
[mobile guide](https://vathavaran-variable.vercel.app/docs/guides/mobile) explain their controls.

## Keep configuration private

File contents are encrypted before upload and stay encrypted in storage.
Downloaded files and copied text are readable secrets. Keep them out of Git,
public logs, screenshots, and shared build artifacts. Sign out after using a
shared device and keep a separate backup of critical project configuration.

Read the [privacy and access guide](https://vathavaran-variable.vercel.app/docs/security)
for practical handling advice and the [troubleshooting guide](https://vathavaran-variable.vercel.app/docs/troubleshooting)
for sign-in, permissions, and file-selection problems.
