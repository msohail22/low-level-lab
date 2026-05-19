import type { Context, Next } from "hono";

export const requestLogger = async(c: Context, next: Next) => {
  const start = Date.now();
  
  await next();

  console.log(
    c.req.method,
    c.req.path,
    c.res.status,
    `${Date.now() - start} ms`
  )
}