# Contributing to ABR Protocol

First off, thank you for considering contributing to ABR Protocol! It's people like you that make ABR such a great project.

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- Use a clear and descriptive title
- Describe the exact steps to reproduce the problem
- Provide specific examples (commands, code snippets)
- Describe the behavior you observed vs what you expected
- Include your OS, Python version, and ABR version

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- A clear and descriptive title
- Step-by-step description of the suggested enhancement
- Specific examples of how it would work
- Why this enhancement would be useful to most ABR users

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue that pull request!

## Development Process

### Setting Up Development Environment

```bash
# Clone your fork
git clone https://github.com/your-username/abrchain.git
cd abrchain

# Add upstream remote
git remote add upstream https://github.com/abrchain/abrchain.git

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements-dev.txt
pip install -e .

# Run tests
python -m pytest
Branch Naming Convention
feature/ - New features

fix/ - Bug fixes

docs/ - Documentation updates

test/ - Test improvements

refactor/ - Code refactoring

Example: feature/trading-engine-enhancements

Commit Messages
Follow the Conventional Commits specification:

text
<type>(<scope>): <description>

[optional body]

[optional footer]
Types:

feat: New feature

fix: Bug fix

docs: Documentation

style: Code style (formatting, missing semi-colons)

refactor: Code refactoring

test: Adding tests

chore: Maintenance

Example:

text
feat(trading): add SEPA settlement integration

- Add SEPA XML parser
- Implement SWIFT message formatting
- Add settlement confirmation webhook

Closes #123
Testing Guidelines
Write unit tests for all new code

Ensure integration tests pass

Test on both mainnet and testnet

Verify genesis block consistency

bash
# Run specific test
python -m pytest test/unit/test_blockchain.py -v

# Run with coverage
python -m pytest --cov=abrchain tests/

# Run integration tests
python -m pytest test/integration/ -v
Code Style
We use:

Black for Python code formatting

Flake8 for linting

MyPy for type checking

ESLint for JavaScript

bash
# Format code
black .

# Lint code
flake8

# Type check
mypy abrchain
Documentation
Update README.md if you change functionality

Document new features in docs/

Include docstrings for all public functions

Add examples for API endpoints

Release Process
Update version in setup.py and package.json

Update CHANGELOG.md

Create a new release on GitHub

Tag the release (v2.0.1)

Build and publish to PyPI

Getting Help
Join our Discord

Follow @AbrChain on Twitter

Read the documentation

Recognition
Contributors will be recognized in our README and on our website. Thank you for helping build Africa's financial future!

Genesis Hash: 3da515799179d2f8bf0fbb86167bef332ea2bbb972631922b6ca98ce64aff3a7
