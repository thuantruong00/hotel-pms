declare global {
  namespace Express {
    interface Request {
      /** Authenticated user, loaded server-side by `requireAuthentication`. */
      user?: {
        userId: string;
        username: string;
        displayName: string | null;
        role: string;
        status: string;
      };
    }
  }
}

export {};
