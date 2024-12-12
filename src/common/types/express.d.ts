declare module 'express' {
  export interface Request {
    user?: {
      id: string;
    };
    token?: string;
    headers: {
      authorization?: string;
      [key: string]: string | undefined;
    };
  }

  export interface GraphQLContext {
    req: Request;
  }
}
