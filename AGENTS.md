Read the @README.md for the project overview, including what this project is and why it exists.

## Developer Documentation
Before starting any task, including planning, ALWAYS review this documentation index.

Use this documentation index to identify which linked documents are relevant to your task, then read the full text of each relevant document — the index entries are summaries only. Keep the available documentation in mind as you work, so you can review additional documents that become relevant as your understanding of the task deepens. Avoid going off task or doing incorrect work because you did not review the relevant documentation.

### Code Style Guide

@developer-docs/code-style-guide.md

**When to use this document:** Apply this guide whenever you are writing or modifying any JavaScript source file in this project. This includes:

- New functions, classes, modules, inline code comments, or any other JavaScript code you write from scratch.
- Edits to existing source files, including adding, updating, and improving inline code comments.
- Code review: Fix code style violations and update and clarify inline code comments even when not explicitly asked to.

**What this document provides:** The canonical JavaScript style conventions for this project — language standard, runtime boundaries, formatting rules, linting constraints, inline code comments, and project-specific patterns like destructuring, type detection, and private class members. Following this guide keeps code consistent with the linter and with the rest of the codebase.

### Code Quality Guide

@developer-docs/code-quality.md

**When to use this document:** Apply this guide whenever you are writing,
reviewing, or refactoring code in this project. This includes:

- Deciding whether behavior belongs in a class, module, helper function, or existing object.
- Improving code structure while making a scoped feature or bug fix.
- Reviewing abstractions for responsibility ownership, encapsulation, layering, naming, or accidental complexity.

**What this document provides:** General maintainability guidance for agents working in this codebase — how to choose responsible owners for behavior, when to use object-oriented design, when not to add a class, how to keep abstractions inside the existing architecture, and how to avoid refactors that add complexity or drift outside the current task.

### Code Documentation Guide

@developer-docs/code-documentation-guide.md

**When to use this document:** Apply this guide whenever you are writing, reviewing, or improving JSDoc block comments in any JavaScript source file in this project. This includes:

- Adding documentation to new functions, classes, methods, or modules you write.
- Reviewing or updating existing documentation for accuracy and completeness.
- Deciding whether a given symbol *needs* documentation at all.
- Choosing the right JSDoc tags for a given situation.
## Linting

Linting is configured in `./eslint.config.js`.

You should always run the linter on changed source code files after making changes.

Run linting with:

```bash
# Run the linter on all JavaScript files in the current working directory which are not ignored in eslint.config.js
node run-linter.js

# Run the linter on specified files or directories.
node run-linter.js [pathname ...]
```
Pathname arguments are optional. If omitted, the CLI uses the current working directory.

The eslint.config.js file is always loaded from the current working directory.

When a target pathname is a directory, linting walks it recursively and only lints .js files. Other file extensions are ignored during directory traversal. Multiple targets are linted in argument order, and files selected through overlapping targets are linted only once.

The `files` and `ignores` matching in eslint.config.js is literal path-segment matching (no glob support).

Diagnostic output is written to stderr, grouped by file.

Exit behavior:

- Exits 1 when any lint error is present (or when CLI/config loading fails).
- Exits 0 when results are warnings-only or fully clean.

## Unit Testing

Run tests with:

```bash
# Run all test files (*.test.js) in the ./test/ directory
node run-tests.js

# Run all test files (*.test.js) in the files and directories passed into run-tests.js
node run-tests.js [pathname ...]
```
Pathname arguments are optional. If omitted, the CLI uses `./test/`.

When a target pathname is a directory, the test script walks it recursively and only runs `*.test.js` files. Other file extensions are ignored during directory traversal.

Diagnostic output is written to stderr, grouped by file.

Exit behavior:

- Exits 1 when any test error is present (or when CLI/config loading fails).
- Exits 0 when results are warnings-only or fully clean.

## Planning

When the user makes a request for a new feature or significant refactoring:

You WILL NOT immediately begin writing code or making changes.

FIRST: Have a conversation with the user so you both have a shared understanding of the work to be done.

**Make sure you are clear on these points:**

1. **User Story** - What user or system behavior is changing? Define the observable behavior: URL, request/response shape, UI state, generated HTML, deployment effect, command behavior, or data mutation.
2. **What** - What are the runtime constraints? For Worker code, consider Cloudflare Workers limitations: no Node filesystem, no native Node modules, request-scoped execution, bindings, caches, KV/R2/D1 behavior, and fetch semantics.
3. **Dependencies** - What dependency stories will we need to implement first in order to achieve the subsequent user stories in the most maintainable way?

Ask the user if you should create an implementation plan or continue discussing the feature.

NEXT: When the user prompts you to create an implementation plan:

Considering the conversation with the user, create an implementation plan document.

Think hard to imagine all the user stories which would encapsulate the discussion.

Review all user stories you can think of and then plan to implement them cohesively for your implementation plan document.

The plan should begin with a brief Implementation Approach section (3–5 sentences) summarizing the overall strategy and any cross-cutting concerns across the stories.

The rest of the document is a TODO list. Break each user story into discrete technical tasks — one task per file change, component, route, or logical unit of work. Each TODO item must follow this exact format:

```
- [ ] **<Short title>**
  - **Story**: <User story ID or title>
  - **What**: <What to build or change, in concrete terms>
  - **Where**: <File path(s) or module(s) to create or modify>
  - **Depends on**: <Item titles this must come after, or "none">
```

Order items so that dependencies come first. Do not group items by story — sequence them by the order they should be implemented.

When completed, put the plan document in the prompts/plans/ directory.

## Explanatory Output

You should provide insightful explanations about how you are approaching a task and the tradeoffs you are making while remaining focused on the task. For non-trivial code changes, before and after writing code, provide brief insightful explanations about your implementation choices and your thinking supporting those choices using:

"★ Insight ─────────────────────────────────────
[2-3 key insightful points]
─────────────────────────────────────────────────"

These insights should be included in the conversation, not in the codebase. Focus on interesting insights that are specific to the codebase or the code you are writing, rather than general programming concepts. Do not wait until the end to provide insights. Provide them as you think about changes and write code.
