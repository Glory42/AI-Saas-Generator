# Contributing to AI SaaS Generator

First off, thanks for taking the time to contribute! 🎉

We welcome contributions from everyone. Whether you're fixing a bug, improving documentation, or adding a new feature, your help is appreciated.

## Development Workflow

1.  **Fork the repository** to your own GitHub account.
2.  **Clone the project** to your machine.
3.  **Create a branch** for your fix or feature:
    ```bash
    git checkout -b feat/amazing-new-feature
    # or
    git checkout -b fix/annoying-bug
    ```
4.  **Make your changes** and test them locally.
5.  **Commit your changes** using descriptive commit messages (Conventional Commits preferred):
    ```bash
    git commit -m "feat: add support for dark mode"
    ```
6.  **Push to your branch**:
    ```bash
    git push origin feat/amazing-new-feature
    ```
7.  **Open a Pull Request** (PR) on the main repository.

## Code Style & Standards

- **Runtime:** We use [Bun](https://bun.sh/). Please do not use `npm` or `yarn` lockfiles.
- **TypeScript:** Stick to strict typing where possible. Avoid `any` unless absolutely necessary (e.g., experimental AI SDK features).
- **Formatting:** Code should be clean and readable. 

## Testing

Before submitting a PR, please ensure:
- The server starts without errors (`bun run dev`).
- The basic flows (Auth -> Upload -> Generate) work as expected.

## Reporting Bugs

If you find a bug, please create an issue including:
- Steps to reproduce.
- Expected vs. actual behavior.
- Screenshots or log snippets if applicable.

## Contact

If you have any questions, feel free to reach out to me at `me@gorkemkaryol.dev`.

Happy Coding! 🚀