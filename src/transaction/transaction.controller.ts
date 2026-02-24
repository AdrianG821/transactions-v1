import {
  Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException,
  Param, ParseIntPipe, Body, Post, Query, Req, UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Prisma } from '@prisma/client'
import { TransactionsService } from './transaction.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { QueryTransactionsDto } from './dto/query-transactions.dto'

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTransactionDto) {
    const userId = req.user.userId as number

    try {
      return await this.transactions.create({
        userId,
        sourceWalletId: dto.sourceWalletId,
        destWalletId: dto.destWalletId,
        kind: dto.kind,
        currency: dto.currency,
        amountMinor: dto.amountMinor,
        description: dto.description,
        budget: dto.budget,
        date: dto.date,
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2003') {
          throw new NotFoundException('WALLET NOT FOUND OR DOES NOT BELONG TO YOU')
        }
      }
      throw err
    }
  }

  @Get()
  async findMany(@Req() req: any, @Query() q: QueryTransactionsDto) {
    const userId = req.user.userId as number
    const page = q.page ?? 1
    const limit = Math.min(q.limit ?? 20, 100)
    const skip = (page - 1) * limit

    const { items, total } = await this.transactions.findManyByUser(userId, {
      skip,
      take: limit,
      filters: {
        type: q.type,
        walletId: q.walletId,
        search: q.search,
        from: q.from,
        to: q.to,
      },
    })
    return { data: items, page, limit, total }
  }


  @Get('/wallets')
  async findMyWallets(@Req() req: any, @Query() q: QueryTransactionsDto) {
    const userId = req.user.userId as number
    const items = await this.transactions.findMyOwnWallets(userId)
    return { data: items }
  }

  @Get('/budgets')
  async fMyBudgets(@Req() req: any, @Query() q: QueryTransactionsDto) {
    const userId = req.user.userId as number
    const items = await this.transactions.findMyBudgets(userId)
    return { data: items }
  }


  @Get(':id')
  async findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId as number
    const tx = await this.transactions.findByIdOwned(userId, id)
    if (!tx) throw new NotFoundException('TRANSACTION NOT FOUND')
    return tx
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const userId = req.user.userId as number
    const ok = await this.transactions.deleteOwned(userId, id)
    if (!ok) throw new NotFoundException('TRANSACTION NOT FOUND')
    return
  }
}
