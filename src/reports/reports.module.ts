import { Module } from '@nestjs/common'
import { PrismaServiceModule } from 'src/database/PrismaService.module'
import { ReportsService } from './reports.service'
import { ReportsController } from './reports.controller'

@Module({
  imports: [PrismaServiceModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
