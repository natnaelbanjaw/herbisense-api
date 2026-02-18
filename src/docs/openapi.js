const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Herbisense API",
    version: "1.0.0",
    description: "API documentation for authentication and health endpoints."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Health", description: "Service health endpoints" },
    { name: "Auth", description: "Authentication endpoints" },
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
      AuthUser: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          full_name: { type: "string", example: "Nati User" },
          email: { type: "string", format: "email", example: "nati@example.com" },
          role: { type: "string", example: "user" }
        }
      },
      RegisterResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "object",
            properties: {
              user: {
                allOf: [
                  { $ref: "#/components/schemas/AuthUser" },
                  {
                    properties: {
                      password: { type: "string", example: "$2b$10$..." }
                    }
                  }
                ]
              },
              token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
            }
          }
        }
      },
      LoginResponse: {
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
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Invalid credentials" }
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
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "OK" },
                    uptime: { type: "number", example: 12.34 },
                    timestamp: { type: "integer", example: 1739900000000 }
                  }
                }
              }
            }
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
                schema: { $ref: "#/components/schemas/RegisterResponse" }
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
                schema: { $ref: "#/components/schemas/LoginResponse" }
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
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string", example: "Access granted" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        role: { type: "string", example: "user" }
                      }
                    }
                  }
                }
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
