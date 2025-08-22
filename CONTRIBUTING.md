# Contributing to NubemSecurity

First off, thank you for considering contributing to NubemSecurity! It's people like you that make NubemSecurity such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps to reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. If you've changed APIs, update the documentation
4. Ensure the test suite passes
5. Make sure your code follows the existing code style
6. Issue that pull request!

## Development Process

1. Clone the repository
```bash
git clone https://github.com/NUbem000/NubemSecurity.git
cd NubemSecurity
```

2. Install dependencies
```bash
npm install --legacy-peer-deps
```

3. Create a feature branch
```bash
git checkout -b feature/amazing-feature
```

4. Make your changes and test
```bash
npm test
npm run lint
```

5. Commit your changes
```bash
git commit -m 'feat: Add amazing feature'
```

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

* `feat:` - A new feature
* `fix:` - A bug fix
* `docs:` - Documentation only changes
* `style:` - Changes that don't affect the meaning of the code
* `refactor:` - A code change that neither fixes a bug nor adds a feature
* `perf:` - A code change that improves performance
* `test:` - Adding missing tests or correcting existing tests
* `chore:` - Changes to the build process or auxiliary tools

### Code Style

* Use 2 spaces for indentation
* Use single quotes for strings
* Add trailing commas in multi-line objects/arrays
* Use async/await over promises when possible
* Write descriptive variable and function names
* Add JSDoc comments for functions

### Testing

* Write unit tests for new functionality
* Ensure all tests pass before submitting PR
* Aim for >70% code coverage
* Test edge cases and error scenarios

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Security

* Never commit sensitive data (API keys, passwords, etc.)
* Always validate and sanitize user input
* Follow OWASP security guidelines
* Report security vulnerabilities privately to security@nubemsecurity.com

## Project Structure

```
NubemSecurity/
├── src/
│   ├── auth/          # Authentication modules
│   ├── middleware/    # Express middleware
│   ├── rag/          # RAG system components
│   ├── providers/    # AI provider integrations
│   ├── tools/        # Security tools integration
│   ├── server.js     # Main server
│   └── index.js      # CLI entry point
├── tests/            # Test files
├── scripts/          # Utility scripts
└── docker/           # Docker configurations
```

## Questions?

Feel free to open an issue with your question or contact the maintainers directly.

Thank you for contributing! 🎉