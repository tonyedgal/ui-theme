# Beginner's Guide to Contributing

Welcome! 👋 This guide is for you if you're:

- New to open source
- Making your first contribution
- Still learning Git and GitHub
- Unsure about the contribution process

**Don't worry if you make mistakes—everyone does!** This guide will help you understand how everything works and how to recover when things go wrong.

## Table of Contents

1. [What is Open Source?](#what-is-open-source)
2. [Understanding GitHub Concepts](#understanding-github-concepts)
3. [What are pnpm Workspaces?](#what-are-pnpm-workspaces)
4. [The Contribution Process](#the-contribution-process)
5. [What Maintainers Expect](#what-maintainers-expect)
6. [Common Mistakes and How to Fix Them](#common-mistakes-and-how-to-fix-them)
7. [Getting Help](#getting-help)

## What is Open Source?

Open source means the code is publicly available for anyone to:

- **View** - Read the code to learn how it works
- **Use** - Run the software for free
- **Modify** - Change it to fit your needs
- **Share** - Distribute your modifications

When you contribute to open source, you're:

- Adding features or fixing bugs
- Improving documentation
- Helping others learn
- Building your portfolio and skills

**Important:** When you contribute, your code becomes part of the project under the project's license (MIT in our case). This means anyone can use it freely.

## Understanding GitHub Concepts

### Repository (Repo)

Think of a repository as a **project folder** that contains all the code, documentation, and history of changes. It lives on GitHub's servers.

### Fork

A **fork** is **your personal copy** of someone else's repository.

- You can't accidentally break the original project
- You work in your fork, then propose changes back
- It's like getting a photocopy of a book to make notes in

**How to fork:**
1. Go to the project's GitHub page
2. Click the "Fork" button in the top right
3. GitHub creates a copy under your account

### Clone

**Cloning** means downloading a repository to your computer so you can work on it locally.

```bash
# This downloads YOUR fork to your computer
git clone https://github.com/YOUR_USERNAME/PROJECT_NAME.git
```

### Branch

A **branch** is a separate version of the code where you can make changes without affecting the main code.

Think of it like this:
- `main` branch = the published book
- Your branch = your draft edits that aren't published yet

```bash
# Create a new branch
git checkout -b feature/my-new-feature

# This means: "Create a branch called 'feature/my-new-feature' and switch to it"
```

**Why branches?**
- You can work on multiple things at once
- If you mess up, the main code is safe
- Others can review your changes before they're merged

### Issues

**Issues** are conversations about the project. They can be:

- Bug reports ("The login button doesn't work")
- Feature requests ("Can we add dark mode?")
- Questions ("How do I set up the database?")
- Task tracking ("Update documentation for v2.0")

**Issues are NOT:**
- Code changes (that's what Pull Requests are for)
- Places to submit code

**When to create an issue:**
- Before starting major work (to discuss your idea)
- When you find a bug
- When you have a question

### Pull Requests (PRs)

A **Pull Request** is how you submit your code changes to the project.

Think of it like this:
1. You made edits in your copy (fork)
2. You're asking the maintainers to "pull" your changes into the main project
3. They review it, possibly ask for changes
4. If approved, your code becomes part of the project!

**Key difference:**
- **Issue** = "Hey, there's a problem" or "Can we discuss this idea?"
- **Pull Request** = "Here's my code that fixes/adds something"

### Commits

A **commit** is a saved snapshot of your changes.

```bash
git add .                          # Stage your changes
git commit -m "Add user login"     # Save snapshot with a message
```

Think of commits like save points in a video game—you can always go back if needed.

**Good commit messages:**
- ✅ "Fix validation bug in email field"
- ✅ "Add loading spinner to submit button"
- ❌ "Fixed stuff"
- ❌ "Updates"

## What are pnpm Workspaces?

### What is pnpm?

**pnpm** is a package manager—a tool that downloads and manages the code libraries (dependencies) your project needs.

Think of it like an app store for code:
- `pnpm install` = download all the libraries this project needs
- `pnpm add lodash` = install a specific library called "lodash"

### Why pnpm instead of npm?

You might have heard of `npm` (Node Package Manager). We use `pnpm` instead because it's:

- **Faster** - Installs packages more quickly
- **Smaller** - Uses less disk space
- **Stricter** - Catches errors that npm might miss

**Important:** Only use `pnpm` in this project, not `npm` or `yarn`.

### What are Workspaces?

**Workspaces** let one repository contain multiple related packages (sub-projects).

Imagine a project with:
```
my-project/
├── packages/
│   ├── website/      (the main website)
│   ├── mobile-app/   (mobile version)
│   └── shared/       (code used by both)
```

Instead of three separate projects, workspaces let them live together and share code.

**In plain English:**
- One `pnpm install` installs dependencies for ALL packages
- Packages can import from each other easily
- Changes in `shared/` automatically affect `website/` and `mobile-app/`

**You don't need to fully understand workspaces to contribute!** Just know:
1. Run `pnpm install` at the root (top level)
2. This installs everything for all packages
3. When you run tests, they test the whole project

## The Contribution Process

Here's the complete process, step by step:

### Step 1: Find Something to Work On

**Option A:** Browse existing issues
- Look for issues labeled `good first issue` or `beginner-friendly`
- Read the issue discussion
- Comment: "I'd like to work on this!"

**Option B:** Found a bug or have an idea?
- Create an issue first to discuss it
- Wait for maintainer feedback before starting work
- This prevents wasted effort if your idea doesn't fit the project

### Step 2: Set Up Your Environment

```bash
# 1. Fork the repository on GitHub (click the Fork button)

# 2. Clone YOUR fork to your computer
git clone https://github.com/YOUR_USERNAME/PROJECT_NAME.git
cd PROJECT_NAME

# 3. Install dependencies
pnpm install

# 4. Create a branch for your work
git checkout -b fix/button-color-bug
```

### Step 3: Make Your Changes

- Edit the code in your text editor
- Test your changes frequently: `pnpm test`
- Make sure the code still works!

### Step 4: Commit Your Changes

```bash
# See what files you changed
git status

# Stage your changes
git add .

# Commit with a clear message
git commit -m "Fix: Correct button color in dark mode"
```

### Step 5: Push to GitHub

```bash
# Push your branch to YOUR fork on GitHub
git push origin fix/button-color-bug
```

### Step 6: Create a Pull Request

1. Go to the original repository on GitHub
2. Click "Pull Requests" → "New Pull Request"
3. Click "compare across forks"
4. Select your fork and branch
5. Fill out the PR template:
   - **Title:** Clear summary (e.g., "Fix button color in dark mode")
   - **Description:** Explain what you changed and why
   - Reference related issues (e.g., "Fixes #123")
6. Click "Create Pull Request"

### Step 7: Respond to Feedback

Maintainers will review your code. They might:

- ✅ Approve it immediately (great job!)
- 💬 Ask questions or request clarification
- 🔧 Request changes

**If changes are requested:**

```bash
# Make the requested changes in your branch
# Edit files...

# Commit the updates
git add .
git commit -m "Address review feedback: update button selector"

# Push to the same branch
git push origin fix/button-color-bug
```

The PR automatically updates with your new commits!

### Step 8: Merge

Once approved, a maintainer will merge your PR. Congratulations! 🎉

Your code is now part of the project and your name is in the contributor list!

## What Maintainers Expect

Maintainers are the people who run the project. They're usually friendly and helpful, but they're also busy. Here's what they appreciate:

### 1. Read the Documentation First

Before asking questions:
- ✅ Read `README.md`
- ✅ Read `CONTRIBUTING.md`
- ✅ Search existing issues
- ✅ Check closed PRs for similar work

### 2. Communicate Clearly

**Good issue:**
> "The login button on `/auth/login` throws a 500 error when I click it with an empty email field. Steps to reproduce: 1) Go to login page, 2) Click submit without entering email. Expected: validation error. Actual: server error."

**Bad issue:**
> "Login doesn't work"

### 3. Make Focused Changes

**One PR = One logical change**

- ✅ Good: PR that fixes the login bug
- ❌ Bad: PR that fixes login, refactors the entire auth system, updates docs, and adds a new feature

If you notice other issues, open separate PRs.

### 4. Test Your Code

Before submitting:

```bash
pnpm test      # Run tests
pnpm lint      # Check code style
pnpm build     # Make sure it builds
```

**Never submit a PR that fails tests.** Fix issues first.

### 5. Be Patient and Respectful

- Maintainers are often volunteers
- They might take days or weeks to respond
- If you don't hear back after a week, politely follow up
- Accept feedback graciously—it's about the code, not you

### 6. Follow the Project's Conventions

- Use the same code style as existing code
- Follow the branch naming format
- Write commit messages like existing ones
- Use the project's patterns and structure

## Common Mistakes and How to Fix Them

Don't panic! Everyone makes these mistakes. Here's how to fix them:

### Mistake 1: Committed to the Wrong Branch

**Problem:** You made changes directly on `main` instead of a feature branch.

**Fix:**

```bash
# 1. Create the branch you should have made
git checkout -b feature/my-feature

# 2. Go back to main
git checkout main

# 3. Reset main to match the original
git reset --hard origin/main

# Your changes are safe in feature/my-feature!
```

### Mistake 2: Need to Update Your Fork

**Problem:** The original project has new changes and your fork is outdated.

**Fix:**

```bash
# 1. Add the original repo as "upstream" (only do this once)
git remote add upstream https://github.com/ORIGINAL_OWNER/PROJECT_NAME.git

# 2. Get the latest changes
git fetch upstream

# 3. Update your main branch
git checkout main
git merge upstream/main

# 4. Push updates to your fork
git push origin main
```

### Mistake 3: Made Too Many Commits

**Problem:** You have 20 tiny commits like "fix typo", "oops", "fixed again".

**Fix (Squashing):**

```bash
# Combine last 5 commits into one
git rebase -i HEAD~5

# In the editor that opens:
# - Leave the first line as "pick"
# - Change others from "pick" to "squash"
# - Save and close
# - Write a single good commit message
```

### Mistake 4: Merge Conflicts

**Problem:** Your changes conflict with someone else's changes.

**Fix:**

```bash
# 1. Update your branch with latest main
git checkout main
git pull upstream main
git checkout your-branch
git merge main

# 2. Git will mark conflicts in files like this:
# <<<<<<< HEAD
# Your changes
# =======
# Their changes
# >>>>>>> main

# 3. Edit the files to resolve conflicts
# 4. Remove the conflict markers
# 5. Save the files

# 6. Mark as resolved and commit
git add .
git commit -m "Resolve merge conflicts"
```

### Mistake 5: Pushed Sensitive Information

**Problem:** You accidentally committed passwords, API keys, or secrets.

**Fix:**

1. **Immediately** change the exposed credentials (passwords, API keys, etc.)
2. Contact a maintainer—they can help remove it from history
3. For the future: Use `.gitignore` and environment variables

**Never commit:**
- Passwords
- API keys
- Private keys
- Personal data

### Mistake 6: Broke the Tests

**Problem:** You submitted a PR and tests failed.

**Fix:**

```bash
# 1. Run tests locally to see the errors
pnpm test

# 2. Fix the issues in your code

# 3. Commit the fixes
git add .
git commit -m "Fix failing tests"

# 4. Push to update your PR
git push origin your-branch
```

### Mistake 7: Want to Undo Everything

**Problem:** You messed up badly and want to start over.

**Fix:**

```bash
# Save your work just in case
git stash

# Reset to the last good state
git reset --hard origin/main

# If you want your changes back
git stash pop

# Or start completely fresh
git checkout -b new-clean-branch
```

## Getting Help

### Before Asking for Help

1. Read this guide thoroughly
2. Search existing issues and discussions
3. Try to debug the problem yourself
4. Read error messages carefully

### Where to Ask

- **GitHub Issues:** For bugs or feature discussions
- **Pull Request comments:** For questions about your specific PR
- **Project Discord/Slack:** If available (check README)

### How to Ask Good Questions

**Bad question:**
> "It doesn't work. Help!"

**Good question:**
> "I'm getting an error 'Cannot find module pnpm' when running `pnpm install`. I'm on Windows 11 and Node v18.2.0. I installed pnpm with `npm install -g pnpm`. Here's the full error: [paste error]. What am I missing?"

Include:
- What you're trying to do
- What you expected to happen
- What actually happened
- Error messages (full text)
- Your environment (OS, Node version, etc.)
- What you've already tried

## Final Encouragement

Contributing to open source is a journey:

- ✅ **Your first PR will be imperfect—that's okay!**
- ✅ **You'll make mistakes—everyone does!**
- ✅ **You'll learn more from one contribution than from 10 tutorials**
- ✅ **The community wants you to succeed**

### Remember:

1. Maintainers were beginners once too
2. Every expert started with their first contribution
3. Asking questions shows you're engaged and learning
4. The worst that can happen is a polite "no thanks"
5. You can't break anything permanently—Git has your back

### Take Your Time

- Don't rush your first contribution
- Read the code, understand it first
- Start with small, simple issues
- Learn the tools and workflow
- Ask questions when stuck

## Next Steps

Ready to contribute?

1. ✅ Read the main [CONTRIBUTING.md](CONTRIBUTING.md)
2. ✅ Browse issues labeled `good first issue`
3. ✅ Set up your development environment
4. ✅ Pick a small task to start
5. ✅ Ask questions if you're stuck

**You've got this!** 🚀

Welcome to open source. We're glad you're here.

---

*Have suggestions for improving this guide? Open an issue or PR—we're always learning too!*