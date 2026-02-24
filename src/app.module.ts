import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaServiceModule } from './database/PrismaService.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config'
import { WalletModule } from './wallet/wallet.module';
import { TransactionsModule } from './transaction/transaction.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaServiceModule , UserModule, ReportsModule , AuthModule , WalletModule,  TransactionsModule , BudgetsModule],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter
    },
    
  ],
})
export class AppModule {}
