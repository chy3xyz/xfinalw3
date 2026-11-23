import { StartServer, createHandler } from "@solidjs/start/server"

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="en" class="dark">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {assets}
        </head>
        <body class="bg-void min-h-[100dvh] text-gray-100">
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
))
