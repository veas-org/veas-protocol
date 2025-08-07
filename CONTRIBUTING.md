# Contributing to Veas Protocol

Thank you for your interest in contributing to Veas Protocol! This document provides guidelines for contributing to the protocol specification, implementations, and ecosystem.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to Contribute](#how-to-contribute)
3. [Protocol Evolution Process](#protocol-evolution-process)
4. [Development Guidelines](#development-guidelines)
5. [Testing Requirements](#testing-requirements)
6. [Documentation Standards](#documentation-standards)
7. [Community Governance](#community-governance)

## Code of Conduct

### Our Pledge

We are committed to providing a friendly, safe, and welcoming environment for all contributors, regardless of experience level, gender identity and expression, sexual orientation, disability, personal appearance, body size, race, ethnicity, age, religion, nationality, or any other characteristic.

### Our Standards

**Examples of behavior that contributes to a positive environment:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Examples of unacceptable behavior:**
- Harassment of any kind
- Discriminatory language or actions
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@veas.org. All complaints will be reviewed and investigated promptly and fairly.

## How to Contribute

### Types of Contributions

1. **Protocol Improvements** - Propose changes to the protocol specification
2. **Implementations** - Create new provider implementations
3. **Bug Fixes** - Fix issues in reference implementations
4. **Documentation** - Improve guides, examples, and API docs
5. **Testing** - Add test cases and improve coverage
6. **Community** - Help others, answer questions, organize events

### Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/veas-org/veas-protocol.git
   cd veas-protocol
   ```

2. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the coding standards
   - Add tests for new features
   - Update documentation

4. **Run Tests**
   ```bash
   pnpm test
   pnpm typecheck
   pnpm lint
   ```

5. **Submit a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Ensure all checks pass

## Protocol Evolution Process

### Veas Improvement Proposals (VIPs)

Major protocol changes require a VIP. The process:

1. **Draft Stage**
   - Create an issue with the `VIP: Draft` label
   - Use the VIP template
   - Gather initial feedback

2. **Discussion Stage**
   - Community discussion for 2 weeks minimum
   - Address concerns and refine proposal
   - Build consensus

3. **Review Stage**
   - Technical review by maintainers
   - Implementation proof-of-concept
   - Final adjustments

4. **Acceptance**
   - Requires approval from 2+ maintainers
   - No unresolved major objections
   - Implementation plan defined

### VIP Template

```markdown
# VIP-[Number]: [Title]

## Summary
Brief description of the proposed change.

## Motivation
Why is this change necessary?

## Specification
Detailed technical specification.

## Backward Compatibility
How does this affect existing implementations?

## Reference Implementation
Link to proof-of-concept or implementation.

## Security Considerations
Any security implications?

## Copyright
This VIP is licensed under MIT.
```

### Minor Changes

Minor changes (bug fixes, clarifications) can be submitted as regular PRs without a VIP.

## Development Guidelines

### Code Style

**TypeScript:**
```typescript
// Use clear, descriptive names
export interface ArticleMetadata {
  readTime: number;    // in minutes
  wordCount: number;
  views: number;
}

// Document complex logic
/**
 * Transforms platform-specific article format to protocol format.
 * @param platformArticle - The platform's article representation
 * @returns Protocol-compliant Article object
 */
function transformArticle(platformArticle: any): Article {
  // Implementation
}

// Use async/await over promises
async function fetchArticle(id: string): Promise<Article> {
  const response = await fetch(`/articles/${id}`);
  return response.json();
}
```

### Commit Messages

Follow the Conventional Commits specification:

```
feat: add support for article versioning
fix: correct pagination offset calculation
docs: update implementation guide
test: add tests for error handling
refactor: simplify authentication flow
chore: update dependencies
```

### Branch Naming

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `test/` - Test improvements
- `refactor/` - Code refactoring
- `chore/` - Maintenance tasks

## Testing Requirements

### Unit Tests

All new code must include unit tests:

```typescript
describe('KnowledgeBaseProtocol', () => {
  it('should list articles with pagination', async () => {
    const result = await kb.listArticles({ limit: 10, offset: 0 });
    expect(result.items).toHaveLength(10);
    expect(result.total).toBeGreaterThan(10);
  });
  
  it('should handle errors gracefully', async () => {
    await expect(kb.getArticle('invalid')).rejects.toThrow('NOT_FOUND');
  });
});
```

### Integration Tests

For new provider implementations:

```typescript
describe('ProviderIntegration', () => {
  const suite = new ProtocolTestSuite(provider);
  
  it('should pass protocol compliance', async () => {
    const results = await suite.runAll();
    expect(results.passed).toBe(true);
  });
});
```

### Test Coverage

- Minimum 80% code coverage required
- Critical paths must have 100% coverage
- Run coverage with: `pnpm test:coverage`

## Documentation Standards

### Code Documentation

All public APIs must be documented:

```typescript
/**
 * Lists articles with optional filtering and pagination.
 * 
 * @param params - List parameters
 * @param params.limit - Maximum number of items to return (default: 20, max: 100)
 * @param params.offset - Number of items to skip for pagination
 * @param params.filters - Optional filters to apply
 * @returns Paginated list of articles
 * @throws {ProtocolError} With code 'AUTH_REQUIRED' if not authenticated
 * 
 * @example
 * ```typescript
 * const articles = await kb.listArticles({
 *   limit: 10,
 *   filters: { status: 'published' }
 * });
 * ```
 */
async listArticles(params: ListParams): Promise<ListResponse<Article>>
```

### Documentation Updates

When changing the protocol:
1. Update SPECIFICATION.md
2. Update relevant guides
3. Add/update examples
4. Update API reference

### Writing Style

- Use clear, concise language
- Provide practical examples
- Explain the "why" not just the "what"
- Keep beginner-friendly tone

## Community Governance

### Roles

**Contributors**
- Anyone who contributes code, docs, or ideas
- Can create issues and PRs
- Participate in discussions

**Maintainers**
- Merge PRs and manage releases
- Review and approve VIPs
- Guide protocol direction
- Selected based on sustained contributions

**Steering Committee**
- Strategic direction and governance
- Resolve major disputes
- Manage resources and partnerships
- Elected annually by maintainers

### Decision Making

**Consensus Building**
- Most decisions through lazy consensus
- No objections within 72 hours = approved
- Major changes require explicit approval

**Voting (when needed)**
- Maintainers have voting rights
- Simple majority for most decisions
- 2/3 majority for breaking changes
- Steering committee breaks ties

### Communication Channels

- **GitHub Discussions** - Protocol proposals and technical discussions
- **Discord** - Real-time chat and community support
- **Newsletter** - Monthly updates and announcements
- **Twitter/X** - Public announcements

## Recognition

### Contributors

We recognize all contributors in our:
- README.md contributors section
- Annual contributor report
- Conference speaking opportunities
- Exclusive contributor swag

### Becoming a Maintainer

Maintainers are selected based on:
- Sustained contributions (6+ months)
- Quality of contributions
- Community involvement
- Understanding of protocol goals

## Legal

### Contributor License Agreement

By contributing, you agree that:
- Your contributions are original or you have rights to submit
- You grant us a perpetual, worldwide, non-exclusive, royalty-free license
- Your contributions are licensed under MIT

### Copyright

All contributions are copyright of their respective authors and licensed under MIT.

## Getting Help

- **Documentation**: [docs.veas.org/protocol](https://docs.veas.org/protocol)
- **Discord**: [discord.gg/veas](https://discord.gg/veas)
- **GitHub Issues**: For bug reports and features
- **GitHub Discussions**: For questions and ideas
- **Email**: support@veas.org for private inquiries

## Thank You!

Your contributions make Veas Protocol better for everyone. We're grateful for your time, expertise, and passion for building a more interoperable future.

---

**Happy Contributing! 🚀**

*This document is licensed under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/).*