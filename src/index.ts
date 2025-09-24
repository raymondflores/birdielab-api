import "reflect-metadata";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { buildSchema } from "type-graphql";
import { ProfileResolver } from "./resolvers/ProfileResolver";
import { supabase } from "./config/supabase";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function startServer() {
  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing required Supabase environment variables");
    console.error("Please check your .env file and ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set");
    process.exit(1);
  }

  console.log("✅ Environment variables loaded successfully");

  // Build the GraphQL schema
  const schema = await buildSchema({
    resolvers: [ProfileResolver],
    validate: false,
    authChecker: ({ context }) => {
      // Check if user is authenticated
      return !!context.user;
    },
  });

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
  });

  // Create Express app
  const app = express();

  // Start Apollo Server
  await server.start();

  // Apply Apollo GraphQL middleware with JSON parsing
  app.use("/graphql", express.json(), expressMiddleware(server, {
    context: async ({ req }) => {
      // Extract user from authorization header
      let user = null;
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7); // Remove 'Bearer ' prefix
          const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
          
          if (!error && authUser) {
            user = authUser;
            console.log('User authenticated in context:', user.id, user.email);
          } else {
            console.log('Authentication failed in context:', error?.message);
          }
        } catch (error) {
          console.error('Error authenticating user in context:', error);
        }
      } else {
        console.log('No authorization header found in context');
      }
      
      return { req, user };
    },
  }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  // Start the server
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    console.log(`📊 Health check available at http://localhost:${PORT}/health`);
  });
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

// Start the server
startServer().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
