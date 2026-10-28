/** Error handling + async wrapping shared by every route. */

export function httpError(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` } });
}

/** Central error responder: JSON always, never leaks a stack trace. */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR');
  const message = err.message || 'Something went wrong.';

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.path}:`, err);
  }
  if (process.env.NODE_ENV !== 'test') {
    try {
      // Lazily imported to avoid a cycle in tests.
      import('../services/storage.js').then(({ recordMetric }) =>
        recordMetric({ status, code, message, path: req.path, method: req.method }),
      );
    } catch { /* metrics are best effort */ }
  }

  res.status(status).json({
    error: {
      code,
      message,
      details: Array.isArray(err.details) ? err.details : undefined,
    },
  });
}
