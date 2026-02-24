import {
  Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException,
  Param, ParseIntPipe, Body, Post, Query, Req, UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Prisma } from '@prisma/client'
import { ReportsService } from './reports.service'
import { CreateTransactionDto } from '../transaction/dto/create-transaction.dto'
import { QueryTransactionsDto } from '../transaction/dto/query-transactions.dto'

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {

  constructor(private readonly transactions: ReportsService) {}

  @Get()
  async findMany(@Req() req: any) {
    const userId = req.user.userId as number

    const { incomeAndExpense , expenseTransactions  ,  incomeTransactions ,  } = await this.transactions.findManyByUser(userId)
    const walletsSum = await this.transactions.findManyWallets(userId)
    
    return { incomeAndExpense , expenseTransactions ,  incomeTransactions , groupedWallets: walletsSum }
  }


}