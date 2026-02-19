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
      HerbCreateResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { $ref: "#/components/schemas/Herb" }
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
    "/api/herbs": {
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
      },
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