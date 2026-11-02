import type { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const status = (err as { status?: number }).status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  // Never expose raw stack traces to the frontend
  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      ...(isProd ? {} : { code: (err as { code?: string }).code }),
    },
  });
}

