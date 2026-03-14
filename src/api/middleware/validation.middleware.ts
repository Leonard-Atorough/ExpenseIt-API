import { ZodObject } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ValidationError } from "@src/application/errors";

export default function validationHandler(schema: ZodObject<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return next(ValidationError.fromZodErrors(result.error));
      }
      req.body = result.data.body;
      next();
    } catch (err) {
      next(err);
    }
  };
}
