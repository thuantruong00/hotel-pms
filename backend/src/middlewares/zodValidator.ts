import { ZodType, treeifyError } from "zod";
import { Request, Response, NextFunction } from "express";

type DataSource = "query" | "params" | "body";

type SchemaMap = Partial<Record<DataSource, ZodType>>;

/**
 * Validates request params/query/body against zod schemas. Parsed values
 * replace the raw ones (`req.query` is stored on `res.locals.query` because it
 * is a getter in Express 5 and may not be reassignable).
 */
export function validate(schemas: SchemaMap) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const key of ["params", "query", "body"] as DataSource[]) {
      const schema = schemas[key];
      if (!schema) continue;

      const result = schema.safeParse(req[key] ?? {});
      if (!result.success) {
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: `Invalid request ${key}`,
            details: treeifyError(result.error),
          },
        });
      }

      if (key === "query") {
        res.locals.query = result.data;
      } else {
        (req as any)[key] = result.data;
      }
    }

    next();
  };
}

/** Reads the validated query object set by `validate({ query })`. */
export const validatedQuery = <T>(res: Response): T => res.locals.query as T;
