# Backend README

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   └── database.ts   # MongoDB connection
│   ├── controllers/      # Request handlers
│   │   ├── authController.ts
│   │   └── productController.ts
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Category.ts
│   │   └── Order.ts
│   ├── routes/          # Route definitions
│   │   ├── index.ts
│   │   ├── authRoutes.ts
│   │   ├── productRoutes.ts
│   │   └── ...
│   ├── middleware/      # Custom middleware
│   │   ├── auth.ts
│   │   └── errorHandler.ts
│   ├── services/        # Business logic (to be implemented)
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   └── server.ts        # App entry point
├── data/
│   └── seeds/           # Database seeders
│       ├── seed-bonsai.ts
│       └── bonsai/      # Bonsai product dataset (411+ products)
│           ├── complete_dataset.json
│           ├── products.json
│           ├── variants.json
│           ├── images_manifest.json
│           └── README.md
└── package.json
```

## Setup

1. Copy `.env.example` to `.env` and configure variables
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run seed:bonsai` - Import bonsai product dataset (411+ products)
- `npm run db:seed` - Alias for seed:bonsai

## Database Seeding

Import real bonsai products:

```bash
npm run seed:bonsai
```

This imports 411+ products from ZeroBonsai.com with full details and images.
See `data/seeds/bonsai/README.md` for more information.

## API Endpoints

See main project documentation for full API reference.
