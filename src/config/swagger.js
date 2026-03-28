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
        NgoProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "ngo" },
            created_at: { type: "string", format: "date-time" },
            organization_name: { type: "string" },
            description: { type: "string", nullable: true },
            area: { type: "string" },
            verified: { type: "boolean" },
          },
        },
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            ngo_id: { type: "string", format: "uuid" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            objectives: { type: "string", nullable: true },
            estimated_hours: { type: "integer", nullable: true },
            deadline: { type: "string", format: "date", nullable: true },
            modality: { type: "string", nullable: true },
            status: { type: "string", enum: ["pending", "assigned", "in_progress", "in_review", "rejected", "completed", "cancelled"] },
            created_at: { type: "string", format: "date-time" },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill_id: { type: "string", format: "uuid" },
                  required_level: { type: "string", enum: ["basic", "intermediate", "advanced"] },
                },
              },
            },
          },
        },
        Application: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            project_id: { type: "string", format: "uuid" },
            student_id: { type: "string", format: "uuid" },
            compatibility_score: { type: "number", nullable: true },
            status: { type: "string", enum: ["pending", "approved", "rejected"] },
            student_name: { type: "string" },
            student_email: { type: "string", format: "email" },
          },
        },
        Assignment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            project_id: { type: "string", format: "uuid" },
            student_id: { type: "string", format: "uuid" },
            student_name: { type: "string" },
            student_email: { type: "string", format: "email" },
            agreement_data: { type: "object", nullable: true },
            start_date: { type: "string", format: "date-time" },
            end_date: { type: "string", format: "date-time", nullable: true },
          },
        },
        Skill: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            category: { type: "string", enum: ["Desarrollo", "Diseno", "CMS", "Marketing"] },
          },
        },
        StudentProfile: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "student" },
            created_at: { type: "string", format: "date-time" },
            availability: { type: "boolean" },
            portfolio_url: { type: "string", format: "uri", nullable: true },
            skills: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skill_id: { type: "string", format: "uuid" },
                  level: { type: "string", enum: ["basic", "intermediate", "advanced"] },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
