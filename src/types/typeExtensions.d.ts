import { Request } from "express";

// Extend the existing Request type in Express
declare module "express" {
  interface Request {
    user?: {
      id: string;
    };
  }
}
