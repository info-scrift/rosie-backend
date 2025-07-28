import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Rosie Backend API',
      version: '1.0.0',
      description: 'API documentation for Rosie Backend',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['src/routes/*.ts', 'src/controllers/*.ts', 'src/models/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
