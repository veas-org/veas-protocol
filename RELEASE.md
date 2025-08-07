# Release Process

This document describes the release process for the @veas/protocol package.

## Automated Releases

The package is automatically released when changes are pushed to the `main` branch or manually triggered via GitHub Actions.

### Automatic Version Detection

The workflow automatically determines the version bump type based on commit messages:
- **Major** (breaking change): Commits with `feat!:` or `feature!:` prefix
- **Minor** (new feature): Commits with `feat:` or `feature:` prefix  
- **Patch** (bug fix): All other commits

### Manual Release

You can manually trigger a release from the GitHub Actions tab:

1. Go to Actions → Release workflow
2. Click "Run workflow"
3. Select the release type (patch, minor, or major)
4. Click "Run workflow"

## Setup Requirements

### NPM Token

To publish to NPM, you need to set up an NPM access token:

1. **Create NPM Token**:
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to Account Settings → Access Tokens
   - Click "Generate New Token"
   - Choose "Automation" token type
   - Copy the generated token

2. **Add to GitHub Secrets**:
   - Go to your GitHub repository
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your NPM token
   - Click "Add secret"

### Permissions

Ensure your GitHub repository has the following permissions enabled:
- Actions: Read and write permissions
- Contents: Write permission (for creating tags and releases)
- Packages: Write permission

## Local Release (Manual)

If you need to release locally:

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build

# Bump version
pnpm version:patch  # or version:minor, version:major

# Publish to NPM
npm publish --access public

# Create and push git tag
git tag -a "v$(node -p "require('./package.json').version")" -m "Release v$(node -p "require('./package.json').version")"
git push origin main --tags
```

## Version Scripts

The following npm scripts are available for version management:

- `pnpm version:patch` - Bump patch version (1.0.0 → 1.0.1)
- `pnpm version:minor` - Bump minor version (1.0.0 → 1.1.0)
- `pnpm version:major` - Bump major version (1.0.0 → 2.0.0)
- `pnpm release:patch` - Bump patch version and publish
- `pnpm release:minor` - Bump minor version and publish
- `pnpm release:major` - Bump major version and publish

## Commit Message Convention

For automatic version detection, use these commit message prefixes:

- `feat:` or `feature:` - New features (triggers minor version bump)
- `fix:` - Bug fixes (triggers patch version bump)
- `docs:` - Documentation changes (triggers patch version bump)
- `chore:` - Maintenance tasks (triggers patch version bump)
- `feat!:` or `feature!:` - Breaking changes (triggers major version bump)

Examples:
```
feat: add knowledge base protocol
fix: correct authentication header handling
docs: update API documentation
feat!: change protocol interface signature
```

## Troubleshooting

### NPM Publishing Fails

1. Check that the `NPM_TOKEN` secret is correctly set
2. Verify the token has not expired
3. Ensure the package name is not already taken
4. Check that you have publish permissions for the package

### GitHub Actions Fails

1. Check the Actions tab for detailed error logs
2. Verify all required secrets are set
3. Ensure branch protection rules allow the workflow to push

### Version Already Exists

If a version already exists on NPM:
1. Manually bump the version in `package.json`
2. Commit and push the change
3. The workflow will publish the new version

## Changelog

The release workflow automatically generates a `CHANGELOG.md` file with all changes since the last release. This file is committed along with the version bump.