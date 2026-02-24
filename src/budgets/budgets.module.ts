
import { Module } from '@nestjs/common'
import { PrismaServiceModule } from 'src/database/PrismaService.module'
import { BudgetsService } from './budgets.service'
import { BudgetsController } from './budgets.controller'

@Module({
  imports: [PrismaServiceModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
})
export class BudgetsModule {}
