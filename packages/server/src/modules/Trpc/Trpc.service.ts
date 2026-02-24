import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

export interface TrpcContext {
  req: Request;
  res: Response;
  user: any;
  organizationId: number | null;
}

@Injectable()
export class TrpcService {
}
