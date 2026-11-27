import './types/express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { swaggerSpec } from './docs/swagger';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import employeeRoutes from './modules/employees/employee.routes';
import departmentRoutes from './modules/departments/department.routes';
import { AppError } from './utils/AppError';
import { sendSuccess } from './utils/response';

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

const allowedOrigins = new Set(
  [
    ...env.corsOrigins,
    ...(env.PUBLIC_API_URL ? [env.PUBLIC_API_URL] : []),
    ...(env.VERCEL_URL ? [`https://${env.VERCEL_URL.replace(/^https?:\/\//, '')}`] : []),
  ]
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter((o) => o.length > 0),
);

app.use(
  cors({
    origin: (origin, callback) => {
      const normalized = origin ? origin.replace(/\/+$/, '') : '';
      if (!origin || allowedOrigins.has('*') || allowedOrigins.has(normalized)) {
        callback(null, true);
        return;
      }
      callback(new AppError(403, `Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  }),
);

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  sendSuccess(res, 200, 'Server is healthy', {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(swaggerSpec);
});

const SWAGGER_CDN_VERSION = '5.17.14';
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl: `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_CDN_VERSION}/swagger-ui.min.css`,
    customJs: [
      `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_CDN_VERSION}/swagger-ui-bundle.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_CDN_VERSION}/swagger-ui-standalone-preset.js`,
    ],
  }),
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);

app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found'));
});

app.use(errorHandler);

export default app;
