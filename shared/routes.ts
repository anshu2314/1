
import { z } from 'zod';
import { insertAccountSchema, accounts, logs } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  accounts: {
    list: {
      method: 'GET' as const,
      path: '/api/accounts' as const,
      responses: {
        200: z.array(z.custom<typeof accounts.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/accounts' as const,
      input: insertAccountSchema,
      responses: {
        201: z.custom<typeof accounts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/accounts/:id' as const,
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/accounts/:id' as const,
      input: insertAccountSchema.partial(),
      responses: {
        200: z.custom<typeof accounts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/accounts/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    start: {
      method: 'POST' as const,
      path: '/api/accounts/:id/start' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    stop: {
      method: 'POST' as const,
      path: '/api/accounts/:id/stop' as const,
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    command: {
      method: 'POST' as const,
      path: '/api/accounts/:id/command' as const,
      input: z.object({
        type: z.enum(['say', 'market_buy', 'click']),
        payload: z.string()
      }),
      responses: {
        200: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    solveCaptcha: {
      method: 'POST' as const,
      path: '/api/accounts/:id/captcha' as const,
      input: z.object({ solution: z.string() }), // Just marks as solved or resumes
      responses: {
        200: z.object({ message: z.string() }),
      },
    }
  },
  logs: {
    list: {
      method: 'GET' as const,
      path: '/api/logs' as const,
      input: z.object({
        accountId: z.string().optional(),
        limit: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof logs.$inferSelect>()),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
