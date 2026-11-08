# uitheme-cli

Add animated theme controls to your app.

## Preview first

Use the `--dry-run` flag on any command to see the plan without writing files.

```bash
npx uitheme-cli init --dry-run
```

## info

Use the `info` command to see what the CLI detects in your app.

```bash
npx uitheme-cli info
```

## init

Use the `init` command to set up UI-Theme in your app.

The `init` command installs `uitheme-web`, adds the theme provider, and adds the
theme CSS.

```bash
npx uitheme-cli init
```

## add

Use the `add` command to add controls to your app.

```bash
npx uitheme-cli add [control]
```

### Example

```bash
npx uitheme-cli add theme-toggle
```

You can also add several controls at once.

```bash
npx uitheme-cli add theme-toggle color-theme-selector
```

If you've changed a file, the CLI asks before replacing it. Use `--overwrite` to
replace it without asking.

## list

Use the `list` command to see the available controls.

```bash
npx uitheme-cli list
```

## diff

Use the `diff` command to compare a control in your app with the registry
version.

```bash
npx uitheme-cli diff theme-toggle
```

## migrate

Use the `migrate` command to move an app from UI-Theme v1 to v2.

The `migrate` command previews the changes. Add `--yes` to apply them.

```bash
npx uitheme-cli migrate
```

## Documentation

Visit https://www.ui-theme.dev/docs/cli to view the documentation.

## License

MIT
