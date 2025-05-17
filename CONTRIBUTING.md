# Contributing to BrightSide

Thank you for your interest in contributing to BrightSide! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please ensure that all interactions are respectful, inclusive, and free from harassment.

## How to Contribute

### Reporting Bugs

If you find a bug in the application, please create an issue with the following information:

1. A clear, descriptive title
2. A detailed description of the issue, including steps to reproduce
3. Your environment information (OS, browser, etc.)
4. Any relevant screenshots or logs
5. Suggested solutions if you have any

### Suggesting Features

We welcome feature suggestions! Please create an issue with:

1. A clear, descriptive title
2. A detailed description of the proposed feature
3. Any relevant context or examples
4. Mock-ups or wireframes if applicable

### Pull Requests

1. Fork the repository
2. Create a new branch for your changes (`git checkout -b feature/amazing-feature`)
3. Make your changes and commit them with clear, descriptive messages
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Create a new Pull Request

#### Pull Request Guidelines

- Follow the existing code style
- Write or update tests as needed
- Keep changes focused on a single issue
- Document new code based on the project standards
- Update documentation if necessary

### Development Setup

1. Clone the repository
```bash
git clone https://github.com/yourusername/brightside.git
cd brightside
```

2. Install dependencies
```bash
npm install
```

3. Set up Python environment for the backend
```bash
cd python_backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

4. Set up environment variables
```bash
cp .env.example .env
cp python_backend/.env.example python_backend/.env
```
Edit the `.env` files with your values

5. Start development servers
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd python_backend
source venv/bin/activate
python start_server.py
```

## Testing

- Frontend tests: `npm test`
- Backend tests: `cd python_backend && python -m pytest`

## Style Guidelines

### Code Style

- Frontend: Follow the ESLint configuration
- Backend: Follow PEP 8 style guide

### Commit Messages

Use clear, descriptive commit messages:

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests after the first line

## Documentation

- Update README.md with any necessary changes
- Comment your code when adding complex functionality
- Update API documentation when endpoints change

## Questions?

Feel free to create an issue if you have questions about contributing.

Thank you for helping to make BrightSide better!
