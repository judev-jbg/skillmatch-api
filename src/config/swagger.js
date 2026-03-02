import swaggerJsdoc from "swagger-jsdoc";

/**
 * Configuración base de OpenAPI 3.0 para SkillMatch API.
 * Los paths se cargan automáticamente desde los comentarios JSDoc en las rutas.
 */
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkillMatch API",
      version: "1.0.0",
      description:
        "API REST para la plataforma SkillMatch de conexión entre estudiantes y ONGs.",
    },
    servers: [
      { url: `http://localhost:${process.env.PORT ?? 3150}`, description: "Desarrollo local" },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["student", "ngo", "admin"] },
            created_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
