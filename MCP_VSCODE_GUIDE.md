# Using Postie as an MCP Server in VS Code

## Overview

Postie now exposes a bundled MCP server inside the VS Code extension.

This lets VS Code AI features use Postie as a local tool provider for:

- listing stored emails
- fetching a single email
- generating screenshots for HTML emails
- reopening generated screenshots as MCP resources

The MCP server is registered by the extension itself. You do not need to run a separate server manually.

## Prerequisites

Before using the MCP server in VS Code, make sure you have:

- a VS Code version with MCP support
- the Postie extension installed
- at least one email captured by Postie
- Chromium installed for Playwright screenshots

Screenshot support depends on Playwright Chromium. If screenshots fail because the browser runtime is missing, install it in the project or extension development environment with:

```bash
npx playwright install chromium
```

## How the MCP Server Appears in VS Code

When VS Code activates the Postie extension, it registers an MCP server definition provider and exposes a local stdio MCP server:

`Postie MCP Server`

VS Code launches it automatically through the extension when the MCP server is enabled and used.

## Enable the Server in VS Code

1. Open VS Code.
2. Install and enable the Postie extension.
3. Start the Postie SMTP server and make sure emails are being captured.
4. Open the Command Palette.
5. Run `MCP: List Servers`.
6. Find `Postie MCP Server`.
7. Enable or trust the server if VS Code asks.

If the server does not appear:

- reload the VS Code window
- confirm the Postie extension activated successfully
- make sure your VS Code build supports MCP servers

## Available MCP Tools

### `list_emails`

Lists stored Postie emails.

Input:

```json
{
  "limit": 20
}
```

Notes:

- `limit` is optional
- default is `20`
- maximum is `100`
- returns each email with `id`, `subject`, `from`, `to`, `receivedDateTime`, `opened`, `hasHtml`, and `attachmentCount`

Example prompt in chat:

```text
Use Postie to list the latest 10 emails.
```

### `get_email`

Fetches the full stored email using its `emailId`.

Input:

```json
{
  "emailId": "your-email-id"
}
```

Returns:

- sender and recipient fields
- `subject`
- `text`
- `html`
- `source`
- `hasSource`
- `hasHtml`
- `attachmentCount`
- attachment metadata

### `capture_email_screenshot`

Generates a PNG screenshot for an HTML email by `emailId`.

Input:

```json
{
  "emailId": "your-email-id",
  "preset": "desktop"
}
```

Supported presets:

- `desktop`
- `tablet`
- `mobile`

Returns:

- `emailId`
- `preset`
- screenshot `width`
- screenshot `height`
- saved `filePath`
- generated `resourceUri`
- `createdAt`

Example prompt in chat:

```text
Generate a mobile screenshot of my most recent email using Postie.
```

Important:

- screenshots only work for emails with HTML content
- text-only emails will return an error
- screenshots are saved under Postie extension storage, not in your workspace

## MCP Resources

Generated screenshots are also exposed as MCP resources.

Resource URI format:

```text
postie://screenshots/<emailId>/<preset>.png
```

Example:

```text
postie://screenshots/12345/mobile.png
```

You can use VS Code MCP resource browsing to reopen previously generated screenshots after they have been created.

## Typical Debugging Workflow

1. Send a test email from your app to Postie.
2. Ask VS Code chat to use `list_emails`.
3. Ask VS Code chat to use `get_email` if you need the HTML or attachment details.
4. Ask VS Code chat to use `capture_email_screenshot` with `desktop`, `tablet`, or `mobile`.
5. Open the returned MCP resource or file path to inspect the rendered output.

Example workflow in chat:

```text
Use Postie to list the latest emails, find the password reset email, then capture desktop and mobile screenshots for it.
```

## Use Postie MCP in Other Editors

If your editor supports MCP servers (for example Cursor, Claude Desktop, or Windsurf), you can run the bundled Postie MCP CLI from the extension folder and paste the generated config into your editor's MCP settings.

Alternatively, run the new VS Code command `Postie: Setup MCP for Other Editors` to automatically write the MCP config into both `~/.cursor/mcp.json` and `<workspace>/.cursor/mcp.json`.

If multiple Postie storage folders are found (for example VS Code and VS Code Insiders), Postie will prompt you to pick one and save the choice in `postie.mcpStoragePath`.

## Use Postie MCP in Codex

Codex supports MCP stdio servers in both the CLI and the IDE extension. Postie can configure Codex automatically via the VS Code command `Postie: Setup MCP for Codex`.

You can also configure Codex manually using `~/.codex/config.toml` or `.codex/config.toml`:

```toml
[mcp_servers.postie]
command = "node"
args = ["/absolute/path/to/out/mcpServer.js"]

[mcp_servers.postie.env]
POSTIE_STORAGE_PATH = "/absolute/path/to/Postie.postie"
POSTIE_VERSION = "1.1.0"
```

## Use Postie MCP in Claude Code

Claude Code accepts stdio MCP servers via `.mcp.json`. Postie can configure Claude Code automatically via the VS Code command `Postie: Setup MCP for Claude Code`.

You can also add the following to `~/.mcp.json` or `.mcp.json`:

```json
{
  "mcpServers": {
    "postie": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/out/mcpServer.js"],
      "env": {
        "POSTIE_STORAGE_PATH": "/absolute/path/to/Postie.postie",
        "POSTIE_VERSION": "1.1.0"
      }
    }
  }
}
```

Print a ready-to-paste MCP config snippet:

```bash
node <extension>/out/postie-mcp.js --print-config
```

Start the server directly:

```bash
node <extension>/out/postie-mcp.js --serve
```

If auto-discovery fails, pass the storage path explicitly:

```bash
node <extension>/out/postie-mcp.js --print-config --storage-path "/absolute/path/to/globalStorage/Postie.postie"
```

## Recommended Prompts

Use prompts like these in VS Code chat:

```text
Use Postie to list the latest 5 emails.
```

```text
Use Postie to inspect email id 12345 and summarize the HTML structure.
```

```text
Use Postie to capture a tablet screenshot for email id 12345.
```

```text
Use Postie to compare mobile and desktop screenshots for email id 12345 and look for layout regressions.
```

## Troubleshooting

### The server does not appear in MCP

Check:

- the Postie extension is installed and enabled
- VS Code supports MCP servers
- the window was reloaded after installation

### `capture_email_screenshot` fails with browser errors

Install the Playwright Chromium runtime:

```bash
npx playwright install chromium
```

### `get_email` or screenshot tools fail with `Email not found`

Check:

- Postie has actually received the email
- you are using the exact `emailId` returned by `list_emails`

### Screenshot capture fails for a valid email

Check:

- the email contains HTML
- the HTML does not depend on blocked remote assets for critical layout

## Notes

- Postie MCP uses `emailId` as the canonical reference for every email operation.
- The MCP server is local and extension-managed.
- Screenshot output is PNG only.
