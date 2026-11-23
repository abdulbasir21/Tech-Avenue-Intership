import fs from 'node:fs';
import path from 'node:path';
import swaggerJsdoc from 'swagger-jsdoc';
import { env } from '../config/env';

const servers: Array<{ url: string; description: string }> = [];

if (env.PUBLIC_API_URL && env.PUBLIC_API_URL.trim().length > 0) {
  servers.push({
    url: env.PUBLIC_API_URL.trim().replace(/\/+$/, ''),
    description: 'Public API server',
  });
} else if (env.VERCEL_URL && env.VERCEL_URL.trim().length > 0) {
  servers.push({
    url: `https://${env.VERCEL_URL.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')}`,
    description: 'Vercel deployment server',
  });
}

servers.push({
  url: `http://localhost:${env.PORT}`,
  description: 'Local development server',
});

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Leave Management System API',
    version: '1.0.0',
    description:
      'User Management API (Auth, Employees, Departments) for the Leave Management System. Every endpoint returns `{ success, message, data }`. Users with `mustChangePassword = true` can only call `GET /api/v1/auth/me` and `POST /api/v1/auth/change-password`; all other authenticated routes return HTTP 403 with `code: "MUST_CHANGE_PASSWORD"`.',
  },
  servers,
  tags: [
    {
      name: 'Auth',
      description: 'Authentication, session refresh, password change, and OTP password reset',
    },
    {
      name: 'Employees',
      description: 'Employee lifecycle management (requires `employees.manage` permission; ADMIN bypasses)',
    },
    {
      name: 'Departments',
      description:
        'Department management (`GET /departments` open to all authenticated users; write/single-get/delete require `employees.manage`)',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter the JWT accessToken returned by POST /api/v1/auth/login',
      },
    },
    schemas: {
      UserRole: {
        type: 'string',
        enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
        example: 'EMPLOYEE',
      },
      UserStatus: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE'],
        example: 'ACTIVE',
      },
      DepartmentSummary: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string', format: 'uuid', example: '8a6f8f5c-3e1c-4d21-9b0c-1234567890ab' },
          name: { type: 'string', example: 'IT' },
        },
      },
      ManagerSummary: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'string', format: 'uuid', example: '7b5e4d3c-2a1b-4c5d-8e9f-0987654321fe' },
          name: { type: 'string', example: 'Sample Manager' },
          employeeCode: { type: 'string', example: 'EMP-0002' },
        },
      },
      EmployeeDto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '11111111-2222-3333-4444-555555555555' },
          userId: { type: 'string', format: 'uuid', example: '66666666-7777-8888-9999-000000000000' },
          organizationId: { type: 'string', format: 'uuid' },
          departmentId: { type: 'string', format: 'uuid', nullable: true },
          reportingManagerId: { type: 'string', format: 'uuid', nullable: true },
          employeeCode: { type: 'string', example: 'EMP-0004' },
          name: { type: 'string', example: 'Ayesha Khan' },
          phone: { type: 'string', nullable: true, example: '+92-300-1234567' },
          designation: { type: 'string', nullable: true, example: 'Senior Software Engineer' },
          joinDate: { type: 'string', format: 'date', nullable: true, example: '2026-01-15' },
          email: { type: 'string', format: 'email', example: 'ayesha.khan@example.com' },
          role: { $ref: '#/components/schemas/UserRole' },
          status: { $ref: '#/components/schemas/UserStatus' },
          mustChangePassword: { type: 'boolean', example: true },
          lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
          department: { $ref: '#/components/schemas/DepartmentSummary' },
          reportingManager: { $ref: '#/components/schemas/ManagerSummary' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DepartmentDto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '8a6f8f5c-3e1c-4d21-9b0c-1234567890ab' },
          organizationId: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'IT' },
          description: { type: 'string', nullable: true, example: 'Information Technology Department' },
          employeeCount: { type: 'integer', example: 5 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@example.com' },
          password: { type: 'string', example: 'SecretPass123' },
          rememberMe: { type: 'boolean', default: false, example: false },
        },
      },
      LoginSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Login successful' },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email', example: 'admin@example.com' },
                  role: { $ref: '#/components/schemas/UserRole' },
                  mustChangePassword: { type: 'boolean', example: true },
                  employee: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      name: { type: 'string', example: 'System Administrator' },
                      employeeCode: { type: 'string', example: 'EMP-0001' },
                      departmentId: { type: 'string', format: 'uuid', nullable: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        },
      },
      RefreshSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Access token refreshed successfully' },
          data: {
            type: 'object',
            properties: {
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
      },
      MeSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Current user profile fetched successfully' },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email', example: 'employee@example.com' },
                  role: { $ref: '#/components/schemas/UserRole' },
                  status: { $ref: '#/components/schemas/UserStatus' },
                  mustChangePassword: { type: 'boolean', example: false },
                  lastLoginAt: { type: 'string', format: 'date-time', nullable: true },
                  preference: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      colorMode: { type: 'string', enum: ['LIGHT', 'DARK'], example: 'LIGHT' },
                    },
                  },
                  employee: { $ref: '#/components/schemas/EmployeeDto' },
                },
              },
            },
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', example: 'TempPass123' },
          newPassword: {
            type: 'string',
            minLength: 8,
            description: 'Minimum 8 characters with letters and numbers',
            example: 'NewStrongPass123',
          },
        },
      },
      ForgotPasswordRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'employee@example.com' },
        },
      },
      VerifyOtpRequest: {
        type: 'object',
        required: ['email', 'otp'],
        properties: {
          email: { type: 'string', format: 'email', example: 'employee@example.com' },
          otp: { type: 'string', pattern: '^\\d{6}$', example: '482913' },
        },
      },
      VerifyOtpSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'OTP verified successfully' },
          data: {
            type: 'object',
            properties: {
              resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            },
          },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['resetToken', 'newPassword'],
        properties: {
          resetToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          newPassword: {
            type: 'string',
            minLength: 8,
            description: 'Minimum 8 characters with letters and numbers',
            example: 'UpdatedPass456',
          },
        },
      },
      CreateEmployeeRequest: {
        type: 'object',
        required: ['name', 'email', 'role', 'temporaryPassword'],
        properties: {
          name: { type: 'string', example: 'Ayesha Khan' },
          email: { type: 'string', format: 'email', example: 'ayesha.khan@example.com' },
          phone: { type: 'string', nullable: true, example: '+92-300-1234567' },
          designation: { type: 'string', nullable: true, example: 'Software Engineer' },
          departmentId: { type: 'string', format: 'uuid', nullable: true },
          reportingManagerId: { type: 'string', format: 'uuid', nullable: true },
          joinDate: { type: 'string', format: 'date', nullable: true, example: '2026-02-01' },
          role: { $ref: '#/components/schemas/UserRole' },
          temporaryPassword: {
            type: 'string',
            minLength: 8,
            description: 'Minimum 8 characters with letters and numbers',
            example: 'WelcomePass123',
          },
          employeeCode: {
            type: 'string',
            description: 'Optional; auto-generated as EMP-0002, EMP-0003... if omitted',
            example: 'EMP-0004',
          },
        },
      },
      UpdateEmployeeRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Ayesha Khan' },
          phone: { type: 'string', nullable: true, example: '+92-300-7654321' },
          designation: { type: 'string', nullable: true, example: 'Lead Engineer' },
          departmentId: { type: 'string', format: 'uuid', nullable: true },
          reportingManagerId: { type: 'string', format: 'uuid', nullable: true },
          joinDate: { type: 'string', format: 'date', nullable: true, example: '2026-02-01' },
          role: { $ref: '#/components/schemas/UserRole' },
          employeeCode: { type: 'string', example: 'EMP-0004' },
        },
      },
      UpdateEmployeeStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { $ref: '#/components/schemas/UserStatus' },
        },
      },
      ResetEmployeePasswordRequest: {
        type: 'object',
        required: ['temporaryPassword'],
        properties: {
          temporaryPassword: {
            type: 'string',
            minLength: 8,
            description: 'Minimum 8 characters with letters and numbers',
            example: 'TempReset99',
          },
        },
      },
      ResetEmployeePasswordResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Employee temporary password reset successfully' },
          data: {
            type: 'object',
            properties: {
              employeeId: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              mustChangePassword: { type: 'boolean', example: true },
            },
          },
        },
      },
      EmployeeSingleResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Employee fetched successfully' },
          data: {
            type: 'object',
            properties: {
              employee: { $ref: '#/components/schemas/EmployeeDto' },
            },
          },
        },
      },
      EmployeeListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Employees fetched successfully' },
          data: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/EmployeeDto' },
              },
              pagination: {
                type: 'object',
                properties: {
                  page: { type: 'integer', example: 1 },
                  limit: { type: 'integer', example: 10 },
                  total: { type: 'integer', example: 3 },
                  totalPages: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
      },
      CreateDepartmentRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Engineering' },
          description: { type: 'string', nullable: true, example: 'Product engineering team' },
        },
      },
      UpdateDepartmentRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Platform Engineering' },
          description: { type: 'string', nullable: true, example: 'Core backend and infrastructure' },
        },
      },
      DepartmentSingleResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Department fetched successfully' },
          data: {
            type: 'object',
            properties: {
              department: { $ref: '#/components/schemas/DepartmentDto' },
            },
          },
        },
      },
      DepartmentListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Departments fetched successfully' },
          data: {
            type: 'object',
            properties: {
              departments: {
                type: 'array',
                items: { $ref: '#/components/schemas/DepartmentDto' },
              },
            },
          },
        },
      },
      NullDataSuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object', nullable: true, example: null },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Invalid request' },
          data: { type: 'object', nullable: true, example: null },
          code: { type: 'string', nullable: true },
        },
      },
      ForbiddenErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: {
            type: 'string',
            example: 'You must change your temporary password before accessing other resources',
          },
          data: { type: 'object', nullable: true, example: null },
          code: {
            type: 'string',
            enum: ['MUST_CHANGE_PASSWORD', 'ACCOUNT_INACTIVE', 'FORBIDDEN'],
            example: 'MUST_CHANGE_PASSWORD',
          },
        },
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Validation failed' },
          data: {
            type: 'object',
            properties: {
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string', example: 'newPassword' },
                    message: {
                      type: 'string',
                      example: 'Password must contain at least one letter and one number',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

const candidateRouteFiles = [
  path.resolve(__dirname, '../modules/auth/auth.routes.ts'),
  path.resolve(__dirname, '../modules/employees/employee.routes.ts'),
  path.resolve(__dirname, '../modules/departments/department.routes.ts'),
  path.resolve(__dirname, '../modules/auth/auth.routes.js'),
  path.resolve(__dirname, '../modules/employees/employee.routes.js'),
  path.resolve(__dirname, '../modules/departments/department.routes.js'),
];

const routeApis = candidateRouteFiles
  .filter((filePath) => fs.existsSync(filePath))
  .map((filePath) => filePath.replace(/\\/g, '/'));

interface OpenApiSpecShape {
  paths?: Record<string, unknown>;
  servers?: Array<{ url: string; description: string }>;
  [key: string]: unknown;
}

const generatedSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: routeApis,
}) as OpenApiSpecShape;

function loadPreExportedSpec(): OpenApiSpecShape | null {
  const candidates = [
    path.join(process.cwd(), 'docs', 'openapi.json'),
    path.resolve(__dirname, '../../docs/openapi.json'),
    path.resolve(__dirname, '../../../docs/openapi.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8')) as OpenApiSpecShape;
      return { ...parsed, servers };
    }
  }
  return null;
}

export const swaggerSpec: OpenApiSpecShape =
  generatedSpec.paths && Object.keys(generatedSpec.paths).length > 0
    ? generatedSpec
    : (loadPreExportedSpec() ?? generatedSpec);
