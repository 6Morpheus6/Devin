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

  // The official installer detects Windows (Git Bash / MSYS2 / Cygwin) on its
  // own and hands off to the PowerShell installer, so this single curl command
  // covers macOS, Linux, WSL, and Windows. It installs `devin` and then runs
  // `devin setup`.
  install: [{
    method: "shell.run",
    params: {
      // Use Pinokio's bundled bash so the pipe works on Windows too, where the
      // default shell is cmd.exe.
      shell: "bash",
      message: "curl -fsSL https://cli.devin.ai/install.sh | bash"
    }
  }, {
    method: "fs.write",
    params: {
      path: "{{dirname}}/.installed",
      text: "ok"
    }
  }],

  // Pinokio checks this before the first run and offers to install when false.
  installed: async (kernel, info, ctx) => {
    return await kernel.exists(ctx.dirname, ".installed")
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
    method: "shell.run",
    params: {
      shell: "bash",
      message: "curl -fsSL https://cli.devin.ai/install.sh | bash"
    }
  }],

  // Run inside the caller's folder so Devin works on the user's project.
  // The installer puts `devin` in ~/.local/bin on Unix, or on the Windows user
  // PATH, which the already-running Pinokio process may not see yet, so fall
  // back to the official install location when `devin` is not on PATH.
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
      shell: "bash",
      message: "\"${LOCALAPPDATA:-$USERPROFILE/AppData/Local}/devin/cli/bin/devin.exe\"",
      path: "{{args.cwd}}",
      input: true
    }
  }, {
    when: "{{platform !== 'win32' && !which('devin')}}",
    id: "run",
    method: "shell.run",
    params: {
      message: "\"${XDG_DATA_HOME:-$HOME/.local/share}/devin/cli/_versions/current/bin/devin\"",
      path: "{{args.cwd}}",
      input: true
    }
  }]
}
