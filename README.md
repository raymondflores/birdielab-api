# BirdieLab API

An Express server with TypeGraphQL for building type-safe GraphQL APIs.

## Features

- 🚀 Express.js server
- 📊 TypeGraphQL v2.0.0-rc.2 for type-safe GraphQL schema
- 🔧 TypeScript support
- 🏥 Health check endpoint
- 👤 User management example
- ⚡ Apollo Server v5 for modern GraphQL features

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server with hot reloading at `http://localhost:4000/graphql`.

### Production

```bash
npm run build
npm start
```

## API Endpoints

- **GraphQL Playground**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

## Example GraphQL Queries

### Get all users
```graphql
query {
  users {
    id
    name
    email
    createdAt
  }
}
```

### Get a specific user
```graphql
query {
  user(id: "1") {
    id
    name
    email
    createdAt
  }
}
```

### Create a new user
```graphql
mutation {
  createUser(name: "Alice Johnson", email: "alice@example.com") {
    id
    name
    email
    createdAt
  }
}
```

### Update a user
```graphql
mutation {
  updateUser(id: "1", name: "John Updated") {
    id
    name
    email
  }
}
```

### Delete a user
```graphql
mutation {
  deleteUser(id: "1")
}
```

## Project Structure

```
src/
├── entities/          # GraphQL type definitions
│   └── User.ts
├── resolvers/         # GraphQL resolvers
│   └── UserResolver.ts
└── index.ts          # Main server file
```

## Scripts

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build the project
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking
