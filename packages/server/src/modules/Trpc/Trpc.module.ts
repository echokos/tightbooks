import { Module } from '@nestjs/common';
import { TRPCModule } from 'nestjs-trpc';
import { TrpcService } from './Trpc.service';
import { TrpcContext } from './Trpc.context';
import { AccountsTrpcRouter } from './routers/Accounts.router';
import { AccountsModule } from '@/modules/Accounts/Accounts.module';

@Module({
  imports: [
    TRPCModule.forRoot({
      basePath: '/api/trpc',
      context: TrpcContext,
    }),
    AccountsModule,
  ],
  providers: [TrpcService, TrpcContext, AccountsTrpcRouter],
  exports: [TrpcService],
})
export class AppTrpcModule {}
