# API Documentation

## Base URL

**Development**: `http://localhost:3000/api/v1`  
**Production**: `https://your-domain.com/api/v1`

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## Endpoints

### Authentication

#### Register User

**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "phone": "+1234567890"
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

#### Login

**POST** `/auth/login`

Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

---

#### Get Current User

**GET** `/auth/me`

Get currently authenticated user details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": "+1234567890",
    "createdAt": "2025-12-31T00:00:00.000Z"
  }
}
```

---

### Products

#### Get All Products

**GET** `/products`

Retrieve paginated list of products with optional filters.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `category` (string, optional): Filter by category ID
- `featured` (boolean, optional): Filter featured products
- `search` (string, optional): Search in name/description

**Example:**
```
GET /products?page=1&limit=12&featured=true
```

**Response:** (200 OK)
```json
{
  "success": true,
  "count": 12,
  "total": 45,
  "page": 1,
  "pages": 4,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Nordic Chair",
      "description": "Modern minimalist chair with wooden legs",
      "price": 50.00,
      "category": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Chairs",
        "slug": "chairs"
      },
      "images": ["/assets/images/product-1.png"],
      "inStock": true,
      "stockQuantity": 25,
      "featured": true,
      "rating": 4.5,
      "reviews": 120,
      "createdAt": "2025-12-31T00:00:00.000Z"
    }
  ]
}
```

---

#### Get Single Product

**GET** `/products/:id`

Retrieve single product by ID.

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Nordic Chair",
    "description": "Modern minimalist chair with wooden legs and comfortable cushioning",
    "price": 50.00,
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Chairs",
      "slug": "chairs",
      "description": "Comfortable seating solutions"
    },
    "images": [
      "/assets/images/product-1.png",
      "/assets/images/product-1-alt.png"
    ],
    "inStock": true,
    "stockQuantity": 25,
    "featured": true,
    "dimensions": {
      "width": 60,
      "height": 85,
      "depth": 55,
      "unit": "cm"
    },
    "materials": ["Wood", "Fabric"],
    "colors": ["Gray", "Beige", "Black"],
    "rating": 4.5,
    "reviews": 120,
    "createdAt": "2025-12-31T00:00:00.000Z",
    "updatedAt": "2025-12-31T00:00:00.000Z"
  }
}
```

---

#### Create Product

**POST** `/products`

Create new product (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Modern Sofa",
  "description": "Comfortable 3-seater sofa with premium fabric",
  "price": 899.99,
  "category": "507f1f77bcf86cd799439012",
  "images": ["/assets/images/sofa-1.png"],
  "inStock": true,
  "stockQuantity": 10,
  "featured": false,
  "dimensions": {
    "width": 200,
    "height": 80,
    "depth": 90,
    "unit": "cm"
  },
  "materials": ["Wood", "Premium Fabric"],
  "colors": ["Gray", "Navy"]
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Modern Sofa",
    ...
  }
}
```

---

#### Update Product

**PUT** `/products/:id`

Update existing product (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:** (partial updates supported)
```json
{
  "price": 799.99,
  "stockQuantity": 8
}
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "price": 799.99,
    "stockQuantity": 8,
    ...
  }
}
```

---

#### Delete Product

**DELETE** `/products/:id`

Delete product (Admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {}
}
```

---

### Categories

#### Get All Categories

**GET** `/categories`

Retrieve all product categories.

**Response:** (200 OK)
```json
{
  "success": true,
  "data": []
}
```

*(To be fully implemented)*

---

### Orders

#### Get User Orders

**GET** `/orders`

Get all orders for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** (200 OK)
```json
{
  "success": true,
  "data": []
}
```

*(To be fully implemented)*

---

### Blog

#### Get All Posts

**GET** `/blog`

Retrieve all blog posts (public).

**Response:** (200 OK)
```json
{
  "success": true,
  "data": []
}
```

---

#### Get Single Post

**GET** `/blog/:id`

Retrieve single blog post.

**Response:** (200 OK)
```json
{
  "success": true,
  "data": {}
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes

- **200 OK**: Success
- **201 Created**: Resource created
- **400 Bad Request**: Invalid input
- **401 Unauthorized**: Authentication required/failed
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

---

## Rate Limiting

*(To be implemented)*

Rate limits will be enforced on authentication endpoints:
- 5 requests per 15 minutes for login/register

---

## Pagination

Paginated endpoints return:
```json
{
  "success": true,
  "count": 10,        // Items in current page
  "total": 45,        // Total items
  "page": 1,          // Current page
  "pages": 5,         // Total pages
  "data": [...]
}
```

---

## Common Query Parameters

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (prefix with `-` for descending)
- `fields`: Comma-separated fields to include

---

**API Version**: 1.0  
**Last Updated**: December 31, 2025
