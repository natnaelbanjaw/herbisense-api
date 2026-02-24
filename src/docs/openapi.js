const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Herbisense API",
    version: "1.0.0",
    description: "API documentation for Herbisense routes."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Health", description: "Service health endpoints" },
    { name: "Docs", description: "OpenAPI documentation endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
    { name: "Herbs", description: "Herb resource endpoints" },
    { name: "Favorites", description: "User favorite herb endpoints" },
    { name: "Protected", description: "Protected route examples" }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid credentials" }
        }
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          full_name: { type: "string", example: "Nati User" },
          email: { type: "string", format: "email", example: "nati@example.com" },
          role: { type: "string", example: "USER" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["fullName", "email", "password"],
        properties: {
          fullName: { type: "string", example: "Nati User" },
          email: { type: "string", format: "email", example: "nati@example.com" },
          password: { type: "string", minLength: 6, example: "strongpassword123" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "nati@example.com" },
          password: { type: "string", example: "strongpassword123" }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: { $ref: "#/components/schemas/AuthUser" },
              token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
            }
          }
        }
      },
      Herb: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid", example: "4c26c842-0646-4dc0-a4ff-5f80f2b3c1d5" },
          name: { type: "string", example: "Ginger" },
          scientific_name: { type: "string", example: "Zingiber officinale" },
          description: { type: "string", example: "A flowering plant whose rhizome is widely used." },
          preparation: { type: "string", example: "Boil sliced root in water for tea." },
          safety_warning: { type: "string", example: "Use carefully with blood thinners." },
          status: { type: "string", example: "PUBLISHED" },
          created_by: { type: "integer", example: 1 },
          created_at: { type: "string", format: "date-time" },
          updated_at: { type: "string", format: "date-time" }
        }
      },
      HerbCreateRequest: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string", maxLength: 150, example: "Ginger" },
          scientificName: { type: "string", maxLength: 200, example: "Zingiber officinale" },
          description: { type: "string", example: "Used in traditional medicine." },
          preparation: { type: "string", example: "Infusion or decoction." },
          safetyWarning: { type: "string", example: "Avoid excessive use during pregnancy." }
        }
      },
      HerbListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Herb" }
          }
        }
      },
      Pagination: {
        type: "object",
        properties: {
          total: { type: "integer", example: 42 },
          totalPages: { type: "integer", example: 5 },
          currentPage: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 }
        }
      },
      HerbPaginatedResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          pagination: { $ref: "#/components/schemas/Pagination" },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Herb" }
          }
        }
      },
      HerbCreateResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/Herb" }
        }
      },
      Favorite: {
        type: "object",
        properties: {
          id: { type: "integer", example: 7 },
          user_id: { type: "integer", example: 1 },
          herb_id: {
            type: "string",
            format: "uuid",
            example: "4c26c842-0646-4dc0-a4ff-5f80f2b3c1d5"
          }
        }
      },
      FavoriteCreateRequest: {
        type: "object",
        required: ["herbId"],
        properties: {
          herbId: {
            type: "string",
            format: "uuid",
            example: "4c26c842-0646-4dc0-a4ff-5f80f2b3c1d5"
          }
        }
      },
      FavoriteCreateResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/Favorite" }
        }
      },
      FavoriteHerbListResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: { $ref: "#/components/schemas/Herb" }
          }
        }
      },
      HerbStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["PENDING", "PUBLISHED", "ARCHIVED"],
            example: "PUBLISHED"
          }
        }
      },
      MessageResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Herb deleted successfully" }
        }
      },
      ProtectedResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "Access granted" },
          user: {
            type: "object",
            properties: {
              id: { type: "integer", example: 1 },
              role: { type: "string", example: "USER" }
            }
          }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: { type: "string", example: "OK" },
          uptime: { type: "number", example: 12.34 },
          timestamp: { type: "integer", example: 1739900000000 }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" }
              }
            }
          }
        }
      }
    },
    "/api/docs.json": {
      get: {
        tags: ["Docs"],
        summary: "Get OpenAPI specification",
        responses: {
          200: {
            description: "OpenAPI JSON document"
          }
        }
      }
    },
    "/api-docs": {
      get: {
        tags: ["Docs"],
        summary: "Swagger UI",
        responses: {
          200: {
            description: "Swagger UI page"
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          400: {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/herbs/published": {
      get: {
        tags: ["Herbs"],
        summary: "Get published herbs",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 10 }
          }
        ],
        responses: {
          200: {
            description: "Published herbs fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HerbPaginatedResponse" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/herbs/unpublished": {
      get: {
        tags: ["Herbs"],
        summary: "Get unpublished herbs",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 10 }
          }
        ],
        responses: {
          200: {
            description: "Unpublished herbs fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HerbPaginatedResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/herbs": {
      post: {
        tags: ["Herbs"],
        summary: "Create a herb",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HerbCreateRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Herb created successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HerbCreateResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/herbs/search": {
      get: {
        tags: ["Herbs"],
        summary: "Search published herbs",
        parameters: [
          {
            name: "search",
            in: "query",
            required: false,
            schema: { type: "string", example: "ginger" }
          },
          {
            name: "conditionId",
            in: "query",
            required: false,
            schema: { type: "string", format: "uuid" }
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, example: 10 }
          },
          {
            name: "sort",
            in: "query",
            required: false,
            schema: { type: "string", example: "created_at" }
          }
        ],
        responses: {
          200: {
            description: "Herbs fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HerbListResponse" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/herbs/{id}": {
      put: {
        tags: ["Herbs"],
        summary: "Update a herb",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HerbCreateRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Herb updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HerbCreateResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          404: {
            description: "Herb not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Herbs"],
        summary: "Delete a herb",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: {
            description: "Herb deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          404: {
            description: "Herb not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/herbs/{id}/status": {
      patch: {
        tags: ["Herbs"],
        summary: "Update herb status",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/HerbStatusUpdateRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Herb status updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HerbCreateResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          403: {
            description: "Forbidden - Admin only",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/favorites": {
      post: {
        tags: ["Favorites"],
        summary: "Add herb to favorites",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/FavoriteCreateRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Favorite added successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FavoriteCreateResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      get: {
        tags: ["Favorites"],
        summary: "Get user favorite herbs",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Favorites fetched successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FavoriteHerbListResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/favorites/{herbId}": {
      delete: {
        tags: ["Favorites"],
        summary: "Remove herb from favorites",
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "herbId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        responses: {
          200: {
            description: "Favorite removed successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MessageResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          500: {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/protected": {
      get: {
        tags: ["Protected"],
        summary: "Protected route",
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: "Access granted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProtectedResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
};

export default openApiSpec;
