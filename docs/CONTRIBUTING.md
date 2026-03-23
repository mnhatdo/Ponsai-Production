# Contributing to Ponsai

Thank you for your interest in contributing to the Ponsai e-commerce platform! This document provides guidelines and best practices for contributing to the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Commit Guidelines](#commit-guidelines)
6. [Pull Request Process](#pull-request-process)
7. [Testing Guidelines](#testing-guidelines)
8. [Documentation](#documentation)

---

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person
- Help maintain a positive community

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB >= 6.0
- Git
- Code editor (VS Code recommended)

### Setup Development Environment

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/ponsai.git
cd ponsai-2.0.0

# 3. Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/ponsai.git

# 4. Install dependencies
npm run install:all

# 5. Create .env file
cp backend/.env.example backend/.env
# Edit backend/.env with your local configuration

# 6. Start development servers
npm run dev
```

---

## Development Workflow

### Branching Strategy

We use **Git Flow**:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes
- `release/*` - Release preparation

### Creating a Feature Branch

```bash
# Update develop branch
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name

# Work on your feature
# ...

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to your fork
git push origin feature/your-feature-name
```

---

## Coding Standards

### General Principles

1. **SOLID Principles**: Follow SOLID design principles
2. **DRY**: Don't Repeat Yourself
3. **KISS**: Keep It Simple, Stupid
4. **YAGNI**: You Aren't Gonna Need It

### TypeScript

- Use TypeScript for all new code
- Leverage type system fully (no `any` unless absolutely necessary)
- Define interfaces for all data structures
- Use enums for fixed sets of values

**Example:**
```typescript
// Good ✓
interface Product {
  id: string;
  name: string;
  price: number;
}

// Bad ✗
const product: any = { id: 1, name: 'Chair' };
```

### Angular (Frontend)

#### Component Structure

```typescript
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  // 1. Inputs/Outputs
  @Input() product!: Product;
  @Output() addToCart = new EventEmitter<Product>();

  // 2. Public properties
  isLoading = false;

  // 3. Private properties
  private destroy$ = new Subject<void>();

  // 4. Dependency injection
  private cartService = inject(CartService);

  // 5. Lifecycle hooks
  ngOnInit() { }
  ngOnDestroy() { 
    this.destroy$.next();
    this.destroy$.complete();
  }

  // 6. Public methods
  onAddToCart() {
    this.addToCart.emit(this.product);
  }

  // 7. Private methods
  private calculateDiscount() { }
}
```

#### Template Guidelines

- Use `async` pipe for observables
- Use `trackBy` with `*ngFor`
- Avoid complex logic in templates
- Use `OnPush` change detection when possible

```html
<!-- Good ✓ -->
<div *ngFor="let product of products$ | async; trackBy: trackById">
  {{ product.name }}
</div>

<!-- Bad ✗ -->
<div *ngFor="let product of getProducts()">
  {{ product.name }}
</div>
```

### Node.js/Express (Backend)

#### Controller Pattern

```typescript
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extract and validate input
    const { page, limit } = req.query;

    // 2. Call service/model
    const products = await Product.find()
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // 3. Return response
    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    next(error);
  }
};
```

#### Model Pattern

```typescript
const ProductSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name too long']
  }
}, {
  timestamps: true
});

// Indexes
ProductSchema.index({ name: 'text' });

// Methods
ProductSchema.methods.calculateDiscount = function() { };

export default mongoose.model<IProduct>('Product', ProductSchema);
```

---

## Commit Guidelines

We follow **Conventional Commits** specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(products): add product filtering by category

Add ability to filter products by category ID in the product list endpoint.
Includes query parameter validation and index optimization.

Closes #123

fix(auth): resolve token expiration issue

Token was expiring immediately due to incorrect JWT configuration.
Updated expiration time from seconds to days.

Fixes #456

docs(api): update product endpoints documentation

Added missing query parameters and response examples for GET /products.
```

### Commit Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit subject line to 72 characters
- Reference issues and pull requests in footer

---

## Pull Request Process

### Before Submitting

1. **Update from upstream**
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout your-branch
   git rebase develop
   ```

2. **Run tests** (when implemented)
   ```bash
   npm test
   ```

3. **Run linter**
   ```bash
   npm run lint
   ```

4. **Build successfully**
   ```bash
   npm run build
   ```

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Commented complex code
- [ ] Documentation updated
- [ ] No console.log() statements
- [ ] Tests passing
```

### PR Review Process

1. Create PR from your feature branch to `develop`
2. Wait for automated checks to pass
3. Request review from maintainers
4. Address feedback and update PR
5. Once approved, maintainer will merge

### PR Guidelines

- Keep PRs small and focused (one feature/fix per PR)
- Write clear PR description
- Link related issues
- Respond to review comments promptly
- Keep PR up-to-date with base branch

---

## Testing Guidelines

### Unit Tests

Test individual functions/components in isolation.

**Frontend (Jest/Jasmine):**
```typescript
describe('ProductService', () => {
  it('should fetch products', (done) => {
    service.getProducts().subscribe(response => {
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      done();
    });
  });
});
```

**Backend (Jest):**
```typescript
describe('Product Controller', () => {
  it('should return products list', async () => {
    const products = await Product.find();
    expect(products).toHaveLength(5);
  });
});
```

### Integration Tests

Test API endpoints and component interactions.

```typescript
describe('GET /api/v1/products', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/api/v1/products');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### E2E Tests (Future)

Test complete user flows.

```typescript
describe('Product Purchase Flow', () => {
  it('should complete checkout', () => {
    cy.visit('/shop');
    cy.get('.product-card').first().click();
    cy.get('.add-to-cart').click();
    cy.get('.cart-icon').click();
    cy.get('.checkout-button').click();
    // ... complete flow
  });
});
```

---

## Documentation

### Code Comments

- Comment **why**, not **what**
- Use JSDoc for functions/methods
- Avoid obvious comments

```typescript
// Good ✓
/**
 * Calculate discounted price based on user tier
 * Premium users get 20% off, regular users 10%
 */
calculateDiscount(price: number, userTier: string): number {
  return price * (userTier === 'premium' ? 0.8 : 0.9);
}

// Bad ✗
// This function calculates discount
calculateDiscount(price, userTier) {
  return price * 0.9; // multiply by 0.9
}
```

### API Documentation

- Update `docs/API.md` for new/changed endpoints
- Include request/response examples
- Document error cases

### Architecture Documentation

- Update `docs/ARCHITECTURE.md` for major structural changes
- Document design decisions and rationale

---

## Questions?

If you have questions:

1. Check existing documentation
2. Search closed issues
3. Ask in discussions/chat
4. Create a new issue with `question` label

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Ponsai! 🎉


