## Description

<!-- Provide a clear and concise description of what this PR does -->

## Motivation

<!-- Explain WHY this change is needed. What problem does it solve? -->

## Related Issue

<!-- Link to the issue this PR addresses. If there's no issue, explain why. -->

Closes #<!-- issue number -->

<!-- Or: Fixes #123, Relates to #456 -->
<!-- Or: No related issue - this PR addresses... -->

## Type of Change

<!-- Check all that apply -->

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🔧 Configuration/tooling change
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update

## Breaking Changes

<!-- If this is a breaking change, you MUST fill out this section -->

**Is this a breaking change?** <!-- Yes / No -->

<!-- If YES, answer these questions: -->

**What breaks?**
<!-- Describe what existing functionality will no longer work -->

**Why is this breaking change necessary?**
<!-- Explain why we can't maintain backwards compatibility -->

**Migration path:**
<!-- How should users update their code? Provide before/after examples -->

```typescript
// Before (old API)


// After (new API)

```

**Deprecation strategy:**
<!-- Can we deprecate the old API first? Or must we break immediately? -->

## Changes Made

<!-- Provide a detailed list of changes. Be specific. -->

- 
- 
- 

## Testing

<!-- Describe the tests you've added or updated -->

**New tests added:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] No new tests needed (explain why below)

**Test coverage:**
<!-- Does this maintain or improve test coverage? -->

**Manual testing performed:**
<!-- Describe how you manually tested this change -->

1. 
2. 
3. 

## Documentation

<!-- Documentation must be updated for user-facing changes -->

- [ ] Code comments added/updated
- [ ] README.md updated
- [ ] API documentation updated
- [ ] Migration guide created (if breaking change)
- [ ] CHANGELOG.md updated
- [ ] No documentation needed (explain why below)

## Code Quality Checklist

<!-- These are REQUIRED before your PR can be merged -->

- [ ] ✅ All tests pass locally (`pnpm test`)
- [ ] ✅ Linting passes (`pnpm lint`)
- [ ] ✅ Type checking passes (`pnpm typecheck`)
- [ ] ✅ Build succeeds (`pnpm build`)
- [ ] ✅ No console warnings or errors
- [ ] ✅ Code follows the project's style guidelines
- [ ] ✅ Commits are clear and descriptive

## Scope Discipline

<!-- Confirm your PR stays focused -->

- [ ] This PR addresses ONE logical change
- [ ] I have NOT included unrelated refactoring
- [ ] I have NOT included drive-by fixes (those belong in separate PRs)
- [ ] If I noticed other issues, I've opened separate issues/PRs for them

## Framework Compatibility

<!-- For framework-agnostic libraries -->

**Does this work across all supported environments?**
- [ ] ✅ Works in browser
- [ ] ✅ Works in Node.js
- [ ] ✅ Framework-agnostic (no React/Vue/etc. specific code)
- [ ] ⚠️ Framework-specific (justified in description above)
- [ ] N/A - not applicable to this change

## Performance Impact

<!-- Consider performance implications -->

- [ ] ✅ No performance impact
- [ ] ✅ Performance improved (provide benchmarks below)
- [ ] ⚠️ Potential performance impact (explained and justified below)

**Benchmarks (if applicable):**
<!-- Provide before/after performance metrics -->

## Dependencies

**Does this PR add new dependencies?**
- [ ] No new dependencies
- [ ] Yes (list and justify below)

<!-- If adding dependencies, answer: -->
<!-- 1. What dependency and why? -->
<!-- 2. Is it essential or could we implement it ourselves? -->
<!-- 3. What's the bundle size impact? -->
<!-- 4. Is it actively maintained? -->

## Screenshots/Recordings

<!-- If this changes UI or behavior, show it -->
<!-- Delete this section if not applicable -->

**Before:**


**After:**


## Backwards Compatibility

<!-- Even for non-breaking changes, consider compatibility -->

- [ ] ✅ Fully backwards compatible
- [ ] ⚠️ Deprecates old API (migration path provided above)
- [ ] 💥 Breaking change (thoroughly documented above)

## Reviewer Notes

<!-- Anything specific you want reviewers to focus on? -->
<!-- Areas where you're unsure? -->
<!-- Specific feedback you're looking for? -->

## Pre-Submission Checklist

<!-- ALL items must be checked before requesting review -->

- [ ] I have read the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
- [ ] I have linked the related issue (or explained why there isn't one)
- [ ] I have added/updated tests that prove my fix is effective or that my feature works
- [ ] I have added/updated documentation for user-facing changes
- [ ] I have run `pnpm test` and all tests pass
- [ ] I have run `pnpm lint` and there are no linting errors
- [ ] My code follows the project's code style
- [ ] This PR focuses on ONE logical change (no scope creep)
- [ ] I understand this PR may be rejected if it doesn't fit the project's goals
- [ ] For breaking changes: I have provided a clear migration path

## Additional Context

<!-- Any other information that reviewers should know -->

---

<!-- 
Thank you for contributing! 🎉

Please be patient with the review process. Maintainers may:
- Request changes
- Ask clarifying questions
- Suggest alternative approaches

This is normal and helps maintain code quality.
-->