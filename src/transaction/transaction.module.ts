import { Module } from '@nestjs/common'
import { PrismaServiceModule } from 'src/database/PrismaService.module'
import { TransactionsService } from './transaction.service'
import { TransactionController } from './transaction.controller'

@Module({
  imports: [PrismaServiceModule],
  controllers: [TransactionController],
  providers: [TransactionsService],
})
export class TransactionsModule {}
