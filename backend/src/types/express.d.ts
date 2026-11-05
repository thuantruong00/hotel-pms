declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: string;
        username?: string;
        role: string;
        status?: string;
        [key: string]: unknown;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    user?: {
      user_id: string;
      username?: string;
      role: string;
      status?: string;
      [key: string]: unknown;
    };
  }
}

export {};
