import { Injectable } from '@nestjs/common';
import { TRPCContext, ContextOptions } from 'nestjs-trpc';

@Injectable()
export class TrpcContext implements TRPCContext {
  async create(opts: ContextOptions): Promise<Record<string, unknown>> {
    const { req } = opts;

    // Extract auth token and organization from headers
    const token = req.headers['x-access-token'];
    const organizationId = req.headers['organization-id'];

    return {
      token,
      organizationId: organizationId ? parseInt(organizationId as string, 10) : null,
      req,
    };
  }
}
