const { build, context } = require('esbuild')
const { copy } = require('esbuild-plugin-copy')
const fs = require('fs')
const path = require('path')

//@ts-check
/** @typedef {import('esbuild').BuildOptions} BuildOptions **/

/** @type BuildOptions */
const baseConfig = {
  bundle: true,
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
}

// Config for extension source code (to be run in a Node-based context)
/** @type BuildOptions */
const extensionConfig = {
  ...baseConfig,
  platform: 'node',
  mainFields: ['module', 'main'],
  format: 'cjs',
  entryPoints: ['./src/extension.ts'],
  outfile: './out/extension.js',
  external: ['vscode', 'canvas'],
}

/** @type BuildOptions */
const mcpServerConfig = {
  ...baseConfig,
  platform: 'node',
  mainFields: ['module', 'main'],
  format: 'cjs',
  entryPoints: ['./src/mcp/server.ts'],
  outfile: './out/mcpServer.js',
  external: [
    'playwright',
  ],
}

/** @type BuildOptions */
const mcpCliConfig = {
  ...baseConfig,
  platform: 'node',
  mainFields: ['module', 'main'],
  format: 'cjs',
  entryPoints: ['./src/mcp/cli.ts'],
  outfile: './out/postie-mcp.js',
}

// Config for webview source code (to be run in a web-based context)
/** @type BuildOptions */
const webviewConfig = {
  ...baseConfig,
  target: 'es2020',
  format: 'esm',
  entryPoints: ['./src/webview/main.tsx'],
  outfile: './out/webview.js',
  jsx: 'automatic',
  plugins: [
    copy({
      resolveFrom: 'cwd',
      assets: {
        from: [
          './node_modules/@vscode/codicons/dist/*.css',
          './node_modules/@vscode/codicons/dist/*.ttf',
        ],
        to: ['./out'],
      },
    }),
    copy({
      resolveFrom: 'cwd',
      assets: {
        from: ['./src/media/*'],
        to: ['./out'],
      },
    }),
  ],
}

// Build script
;(async () => {
  const args = process.argv.slice(2)
  try {
    if (args.includes('--watch')) {
      console.log('[watch] build started')
      const extensionContext = await context(extensionConfig)
      const mcpServerContext = await context(mcpServerConfig)
      const mcpCliContext = await context(mcpCliConfig)
      const webviewContext = await context(webviewConfig)

      await Promise.all([
        extensionContext.watch(),
        mcpServerContext.watch(),
        mcpCliContext.watch(),
        webviewContext.watch(),
      ])

      const mediaDir = path.join(process.cwd(), 'src', 'media')
      let rebuildingMedia = false
      let mediaRebuildPending = false

      const rebuildWebviewForMediaChange = async () => {
        if (rebuildingMedia) {
          mediaRebuildPending = true
          return
        }

        rebuildingMedia = true
        try {
          do {
            mediaRebuildPending = false
            await webviewContext.rebuild()
          } while (mediaRebuildPending)
        } catch (err) {
          console.error('[watch] media rebuild failed', err.message || err)
        } finally {
          rebuildingMedia = false
        }
      }

      const mediaWatcher = fs.watch(mediaDir, { recursive: true }, () => {
        void rebuildWebviewForMediaChange()
      })

      console.log('[watch] watching for changes')

      const stopWatching = async () => {
        mediaWatcher.close()
        await Promise.all([
          extensionContext.dispose(),
          mcpServerContext.dispose(),
          mcpCliContext.dispose(),
          webviewContext.dispose(),
        ])
        process.exit(0)
      }

      process.on('SIGINT', stopWatching)
      process.on('SIGTERM', stopWatching)
    } else {
      // Build extension and webview code
      await build(extensionConfig)
      await build(mcpServerConfig)
      await build(mcpCliConfig)
      await build(webviewConfig)
      console.log('build complete')
    }
  } catch (err) {
    console.error(err.message || err)
    process.exit(1)
  }
})()
