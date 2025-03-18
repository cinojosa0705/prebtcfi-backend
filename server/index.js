const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load routes
const transactionsRoutes = require('./routes/transactions');
const queriesRoutes = require('./routes/queries');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Add BigInt serialization support
BigInt.prototype.toJSON = function() { return this.toString() };

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Swagger documentation setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Price Insurance Protocol API',
      version: '1.0.0',
      description: 'API for the Price Insurance Protocol',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
  },
  apis: ['./server/routes/*.js'], // Path to the API routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/transactions', transactionsRoutes);
app.use('/api/queries', queriesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Price Insurance Protocol API',
    documentation: `/api-docs`
  });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});