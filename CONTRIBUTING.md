# Contributing to ui-theme

Thanks for your interest in contributing to ui-theme. We're happy to have you here.

Please take a moment to review this document before submitting your first pull request.

## About This Repository

This repository is a monorepo using:

- [pnpm](https://pnpm.io) and [workspaces](https://pnpm.io/workspaces) for package management
- [Turborepo](https://turbo.build/repo) as the build system
- [Changesets](https://github.com/changesets/changesets) for release management

## Repository Structure

```
ui-theme/
├── packages/
│   └── ui-theme/          # Main package
│       ├── src/
│       │   ├── core/      # Framework-agnostic core
│       │   └── react/     # React-specific implementation
│       └── package.json
├── package.json           # Root package
├── pnpm-workspace.yaml    # Workspace configuration
└── turbo.json            # Turborepo configuration
```

| Path                          | Description                            |
| ----------------------------- | -------------------------------------- |
| `packages/ui-theme/src/core`  | Framework-agnostic theme core logic    |
| `packages/ui-theme/src/react` | React providers, hooks, and components |

## Development Workflow

### 1. Fork and Clone

Fork this repository and clone it to your local machine:

```bash
git clone https://github.com/your-username/ui-theme.git
cd ui-theme
```

### 2. Create a Branch

```bash
git checkout -b feat/my-feature
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Build the Package

```bash
pnpm build
```

### 5. Run in Development Mode

```bash
pnpm dev
```

### 6. Run Tests

```bash
pnpm test
```

### 7. Type Check

```bash
pnpm typecheck
```

### 8. Format Code

```bash
pnpm format
```

## Making Changes

### When Adding Features

1. Implement changes in the appropriate directory (`core` for framework-agnostic, `react` for React-specific)
2. Add or update tests
3. Update documentation
4. Run `pnpm build` to ensure it compiles
5. Run `pnpm test` to ensure tests pass
6. Run `pnpm typecheck` to ensure type safety

### When Fixing Bugs

1. Add a test that reproduces the bug (if applicable)
2. Fix the bug
3. Ensure the test passes
4. Update documentation if needed

## Commit Convention

Follow the [Udacity Git Commit Style Guide](https://udacity.github.io/git-styleguide/) for commit messages.

### Message Structure

```
type: Subject

body

footer
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Formatting, missing semicolons, etc (no code change)
- **refactor**: Refactoring production code
- **test**: Adding tests, refactoring tests (no production code change)
- **chore**: Updating build tasks, package configs, etc (no production code change)

### Guidelines

- **Subject**: Maximum 50 characters, capitalized, no period, imperative tone
- **Body**: Wrap at 72 characters, explain _what_ and _why_ (not _how_)
- **Footer**: Reference issue tracker IDs

### Example

```
feat: Add slide animation support

Add new SLIDE animation type to ThemeAnimationType enum.
Implement slide animation with configurable direction
and custom start/end coordinates.

Resolves: #123
```

### Important

- Keep subjects under 50 characters
- Use imperative mood: "Add feature" not "Added feature"
- Move additional details to the body
- Reference issues in the footer

## Pull Request Process

1. Ensure your code builds and passes all tests
2. Update the documentation for any API changes
3. Run `pnpm format` before committing
4. Create a changeset if your changes affect the public API:
   ```bash
   pnpm changeset
   ```
5. Push your branch and open a pull request
6. Link any related issues in the PR description

## Changesets

For changes that affect the public API, create a changeset:

```bash
pnpm changeset
```

Follow the prompts to:

1. Select the packages you've changed
2. Choose the version bump type (major, minor, patch)
3. Write a summary of your changes

This creates a markdown file in `.changeset/` that will be used to generate the changelog and bump versions.

## Project Scripts

| Command                  | Description                     |
| ------------------------ | ------------------------------- |
| `pnpm build`             | Build all packages              |
| `pnpm dev`               | Run in development mode         |
| `pnpm test`              | Run all tests                   |
| `pnpm typecheck`         | Run TypeScript type checking    |
| `pnpm lint`              | Lint all packages               |
| `pnpm format`            | Format code with Prettier       |
| `pnpm format:check`      | Check code formatting           |
| `pnpm changeset`         | Create a changeset              |
| `pnpm changeset:version` | Update versions from changesets |
| `pnpm changeset:publish` | Publish packages                |

## Code Style

We follow the TypeScript and React best practices:

- Use functional components and hooks (no class components)
- Use TypeScript for all code
- Export types alongside implementations
- Document public APIs with JSDoc comments
- Follow existing code patterns in the repository

## Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for high test coverage
- Test both happy paths and edge cases

## Documentation

When adding new features:

- Update the main README if needed
- Add or update setup guides in `docs/`
- Include code examples
- Document all public APIs

## Questions?

If you need help or have questions:

- Check existing issues and discussions
- Open a new issue with the `question` label
- Reach out to the maintainers

## License

By contributing to ui-theme, you agree that your contributions will be licensed under the MIT License.
