const fs = require("fs")
const path = require("path")

// Both official installers finish by launching Devin's interactive login
// wizard. End the step as soon as the wizard appears: the binary and PATH
// entry are already in place by then, and login happens on the first run
// (`/login`) instead of blocking an unattended install.
const stopAtLoginWizard = [{
  event: "/(How would you like to log in|esc cancel)/",
  kill: true
}]

module.exports = {
  version: "7.0",

  // Plugin launchers keep their metadata in the root `pinokio.js`.
  // This is a standalone global plugin, installed under PINOKIO_HOME/plugin/Devin.
  title: "Devin CLI",
  icon: "icon.png",
  description: "Devin, the AI software engineer, in your terminal.",
  link: "https://devin.ai/cli",
  path: "plugin",
  launch_type: "terminal",

  // Install with the platform's default shell. On Windows the curl | bash
  // pipeline is handed to PowerShell's installer directly, because Pinokio's
  // `shell: "bash"` override starts a shell that never executes the command.
  // Both installers are Cognition's official ones and end with `devin setup`.
  install: [{
    when: "{{platform === 'win32'}}",
    method: "shell.run",
    params: {
      message: "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"irm https://static.devin.ai/cli/setup.ps1 | iex\"",
      // Keyboard access is the fallback if the wizard event below does not fire.
      input: true,
      on: stopAtLoginWizard
    }
  }, {
    when: "{{platform !== 'win32'}}",
    method: "shell.run",
    params: {
      message: "curl -fsSL https://cli.devin.ai/install.sh | bash",
      input: true,
      on: stopAtLoginWizard
    }
  }, {
    method: "fs.write",
    params: {
      path: "{{dirname}}/.installed",
      text: "ok"
    }
  }],

  // Pinokio checks this before the first run and offers to install when false.
  // Use the plugin folder directly: Pinokio does not pass `ctx` to this check.
  installed: async () => {
    return fs.existsSync(path.join(__dirname, ".installed"))
  },

  // Devin keeps credentials and session history in its own data folder, so
  // uninstall only removes the plugin and leaves the CLI data untouched.
  uninstall: [{
    method: "fs.rm",
    params: {
      path: "."
    }
  }],

  // Pull the launcher, then re-run the official installer for the latest build.
  update: [{
    method: "shell.run",
    params: {
      message: "git pull"
    }
  }, {
    when: "{{platform === 'win32'}}",
    method: "shell.run",
    params: {
      message: "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command \"irm https://static.devin.ai/cli/setup.ps1 | iex\"",
      input: true,
      on: stopAtLoginWizard
    }
  }, {
    when: "{{platform !== 'win32'}}",
    method: "shell.run",
    params: {
      message: "curl -fsSL https://cli.devin.ai/install.sh | bash",
      input: true,
      on: stopAtLoginWizard
    }
  }],

  // Run inside the caller's folder so Devin works on the user's project.
  // The installer puts `devin` in ~/.local/bin on Unix, or on the Windows user
  // PATH, which the already-running Pinokio process may not see yet, so fall
  // back to the installer's own entry point when `devin` is not on PATH.
  // Keep the default shells here; `shell: "bash"` produces an empty terminal.
  run: [{
    when: "{{which('devin')}}",
    id: "run",
    method: "shell.run",
    params: {
      message: "devin",
      path: "{{args.cwd}}",
      // Keep stdin attached for the interactive terminal interface.
      input: true
    }
  }, {
    when: "{{platform === 'win32' && !which('devin')}}",
    id: "run",
    method: "shell.run",
    params: {
      message: "\"%LOCALAPPDATA%\\devin\\cli\\bin\\devin.exe\"",
      path: "{{args.cwd}}",
      input: true
    }
  }, {
    when: "{{platform !== 'win32' && !which('devin')}}",
    id: "run",
    method: "shell.run",
    params: {
      message: "\"$HOME/.local/bin/devin\"",
      path: "{{args.cwd}}",
      input: true
    }
  }]
}
