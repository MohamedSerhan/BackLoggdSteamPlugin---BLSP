# Contributing to BackLoggd Steam Plugin

First off, thank you for considering contributing to BLSP! It's people like you that make BLSP such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by common sense and mutual respect. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, error messages, etc.)
- **Describe the behavior you observed** and what you expected to see
- **Include your environment details** (OS, Node version, npm version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other applications** if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `master`
2. **Install dependencies**: `npm install`
3. **Make your changes** following the code style guidelines
4. **Add tests** if you're adding functionality
5. **Ensure tests pass**: `npm test`
6. **Run linting**: `npm run lint:fix`
7. **Format code**: `npm run format`
8. **Commit your changes** with a clear commit message
9. **Push to your fork** and submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/BackLoggdSteamPlugin---BLSP.git
cd BackLoggdSteamPlugin---BLSP

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Build TypeScript
npm run build

# Run in development mode
npm run dev
```

## Style Guides

### Git Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
  - ✨ `:sparkles:` new feature
  - 🐛 `:bug:` bug fix
  - 📝 `:memo:` documentation
  - 🎨 `:art:` code structure/format
  - ⚡ `:zap:` performance improvement
  - ✅ `:white_check_mark:` tests
  - 🔧 `:wrench:` configuration

### JavaScript/TypeScript Style Guide

- **Follow ESLint rules** defined in `.eslintrc.js`
- **Use Prettier** for consistent formatting
- **Write JSDoc comments** for all exported functions
- **Use meaningful variable names** (no single letters except in loops)
- **Prefer const over let**, never use var
- **Use async/await** over Promises where possible
- **Handle errors properly** - don't swallow errors silently
- **Keep functions small and focused** - one responsibility per function

### TypeScript Specific

- **Define types explicitly** where inference isn't obvious
- **Avoid `any`** - use `unknown` if type is truly unknown
- **Use interfaces for object shapes**
- **Export types that cross module boundaries**
- **Never use `@ts-ignore`** without a detailed comment explaining why

### File Organization

- **Services**: External API interactions (`services/`)
- **Utils**: Shared utility functions (`utils/`)
- **Config**: Configuration and constants (`config/`)
- **API**: TypeScript Express server (`api/Backloggd-API/src/`)
- **Tests**: Place tests adjacent to the code or in `__tests__/` directory

## Testing

- Write unit tests for new functionality
- Ensure existing tests pass: `npm test`
- Aim for good test coverage
- Test edge cases and error scenarios

Example test structure:

```javascript
const { normalizeGameName } = require('./index');

describe('normalizeGameName', () => {
    it('should convert to lowercase', () => {
        expect(normalizeGameName('GAME')).toBe('game');
    });

    it('should remove special characters', () => {
        expect(normalizeGameName('Game: Edition!')).toBe('game edition');
    });
});
```

## Documentation

- Update the README.md if you change functionality
- Add JSDoc comments to new functions
- Update type definitions if you change interfaces
- Include examples in documentation where helpful

## Project Architecture

### Key Concepts

1. **Caching**: All external API calls are cached for 24 hours using the centralized `cacheManager`
2. **Error Handling**: Errors should be logged and thrown, not silently caught
3. **Configuration**: Magic numbers go in `config/constants.js`
4. **Type Safety**: TypeScript for API layer, JSDoc for JavaScript files

### Adding a New Feature

1. **Plan**: Think about where the feature fits in the architecture
2. **Constants**: Add any configuration to `config/constants.js`
3. **Types**: Define TypeScript types or JSDoc comments
4. **Implementation**: Write the code following style guidelines
5. **Tests**: Add comprehensive tests
6. **Documentation**: Update README and add code comments
7. **Example**: Consider adding an example of usage

## Need Help?

- **Discord**: Open an issue and tag it with `question`
- **Documentation**: Check the README.md and code comments
- **Examples**: Look at existing code for patterns

## Recognition

Contributors will be recognized in the README.md. Thank you for your contributions!

---

## Quick Checklist

Before submitting a PR, ensure:

- [ ] Code follows the style guidelines
- [ ] JSDoc comments added for new functions
- [ ] Tests added for new functionality
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] README updated if needed
- [ ] Commit messages are clear and descriptive
- [ ] No console.logs or debugging code left in
- [ ] No sensitive information in code or commits

**Thank you for contributing!** 🎉
