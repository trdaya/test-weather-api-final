import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest();
    const res = httpContext.getResponse();

    if (req && res) {
      return { req, res };
    }

    const gqlContext = GqlExecutionContext.create(context).getContext();
    return { req: gqlContext.req, res: gqlContext.res };
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      'unknown';

    return ip;
  }

  protected generateKey(context: ExecutionContext): string {
    const { req } = this.getRequestResponse(context);
    const tracker = req.ip || 'unknown';
    return tracker;
  }
}
