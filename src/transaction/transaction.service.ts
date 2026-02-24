import { Injectable } from '@nestjs/common'
import { Prisma, Currency, TransactionType as TxType, TransactionType, periodBudget } from '@prisma/client'
import { TransactionKind } from '@prisma/client'
import { PrismaService } from 'src/database/PrismaService.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { randomUUID } from 'crypto'

type CreateTxParams = {
  userId: number
  sourceWalletId: string
  destWalletId: string
  budget?: number
  currency: Currency
  amountMinor: number
  kind: TransactionKind
  description?: string
  date?: Date
}

type FindManyFilters = {
  type?: TxType
  walletId?: number
  search?: string
  from?: Date
  to?: Date
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateTxParams) {

    const { userId, sourceWalletId, destWalletId , currency , budget ,amountMinor, kind, description, date } = params

    if (amountMinor <= 0) throw new BadRequestException('amountMinor must be > 0')

    const txDate = date ?? new Date()

  
    return this.prisma.prisma.$transaction(async (tx) => {

      //aducem portofelul sursa,
      const source = await tx.wallet.findFirst({
        where: { publicId: sourceWalletId, userId },
        select: { id: true, currency: true , status: true, balanceMinor: true,  },
      })

      if (!source) throw new NotFoundException('Wallet not found')
      if(source.status !== 'ACTIVE') throw new NotFoundException('SOURCE WALLET NOT ACTIVE')
      if (source.currency !== currency) throw new BadRequestException('Currency mismatch with source wallet')

      if (kind === TransactionKind.TRANSFER) {
        if(!destWalletId) throw new BadRequestException('Destination wallet is required for Transfer')

        const dest = await tx.wallet.findFirst({
          where: { publicId: destWalletId },
          select: { id: true, currency: true , status: true },
        })

         // aducem portofelul destinatar
        if (!dest) throw new NotFoundException('Wallet not found')
        if(dest.status !== 'ACTIVE') throw new NotFoundException('DESTINATION WALLET IS NOT ACTIVE')

        //validari
        //comparam id-ul sa nu fie laffel
        if(source.id === dest.id) {
          throw new BadRequestException('SOURCE AND DESTINATION WALLET MUST BE DIFFRENT')
        }
        //comparam currencyul sa fie la fel
        if(source.currency !== dest.currency) {
          throw new BadRequestException('CURRENCY MUST BE THE SAME')
        }
        //asa legam tranzactiile
        const transferGroupId = randomUUID()
        
        const transactionSource = await tx.transaction.create({
          data: {  userId , walletId: source.id , amountMinor, type: TransactionType.EXPENSE, transferGroupId , currency: source.currency, kind: TransactionKind.TRANSFER ,description: description?.trim() ?? null, date: date ?? new Date() },
          select: {
            id: true,
            userId: true,
            walletId: true,
            amountMinor: true,
            currency: true,
            type: true,
            kind: true,
            transferGroupId: true,
            description: true,
            date: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        const transactionDest = await tx.transaction.create({
          data: { userId , walletId: dest.id , amountMinor, currency: dest.currency, transferGroupId ,type: TransactionType.INCOME , kind: TransactionKind.TRANSFER ,description: description?.trim() ?? null, date: date ?? new Date()  },
          select: {
            id: true,
            userId: true,
            walletId: true,
            amountMinor: true,
            currency: true,
            type: true,
            transferGroupId: true,
            kind: true,
            description: true,
            date: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      

          //updatam walleturile adica din unul scadem si din altul crestem
        await tx.wallet.update({
          where: {id: source.id},
          data: {
            balanceMinor: { decrement: amountMinor }
          }
        })

        await tx.wallet.update({
          where: { id: dest.id },
          data: {
            balanceMinor: { increment: amountMinor }
          }
        })
        return { transferGroupId, transactionDest , transactionSource }

      }
      
  let budgetPeriodId: number | null = null

  if (budget) {
    const bgt = await this.verifyBudget(tx, budget, userId, source.currency)

    const { periodStart , periodEnd } = this.calculatePeriod(txDate, bgt)

    const bp = await this.findOrCreateBudgetPeriod(tx, bgt, periodStart, periodEnd)
    budgetPeriodId = bp.id

  }
  const t = await tx.transaction.create({
    data: {
      userId,
      walletId: source.id,
      amountMinor,
      currency: source.currency,
      type: TransactionType.EXPENSE,
      kind: TransactionKind.NORMAL,
      description: description?.trim() ?? null,
      date: txDate
    },
    select: {
      id: true, walletId: true, amountMinor: true, currency: true, type: true, kind: true, date: true,
    }
  })
  await tx.wallet.update({
    where: { id: source.id},
    data: { balanceMinor: { decrement: amountMinor }}
  })
  
  if(budgetPeriodId) {
    await tx.budgetPeriod.update({
      where: { id: budgetPeriodId },
      data: { spentMinor: { increment: amountMinor }}
    })
  }

  return { transactions: t}

  }) 
  }



  private calculatePeriod(txDate: Date, budget:{
    period: periodBudget,
    anchorWeekday: number | null,
    anchorDayOfMonth: number | null,
  }) {
    const atMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
    const d = atMidnight(txDate)

    const addDays = (date: Date, days: number) => {
      const x = new Date(date)
      x.setDate(x.getDate() + days)
      return x
    }
    const addMonths = (date: Date, months: number) => {
      const x = new Date(date)
      x.setMonth(x.getMonth() + months)
      return x
    }

    if (budget.period === 'WEEKLY') {
      const anchor = budget.anchorWeekday || 1
      const jsDow = d.getDay() === 0 ? 7 : d.getDay()
      const delta = jsDow - anchor
      const start = addDays(d, delta >= 0 ? -delta : -(7 + delta))
      const end = addDays(start, 7)
      return { periodStart: start, periodEnd: end }
    }

    if (budget.period === 'MONTHLY') {
      const anchor = budget.anchorDayOfMonth || 1
      const yyyy = d.getFullYear()
      const mm = d.getMonth()
      const dd = d.getDate()

      const start =
        dd >= anchor ? new Date(yyyy, mm, anchor, 0, 0, 0, 0) : new Date(yyyy, mm - 1, anchor, 0, 0, 0, 0)
      const end = addMonths(start, 1) 
      return { periodStart: start, periodEnd: end }
    }
    throw new BadRequestException('Unsupported period')
  }

  private async verifyBudget(tx: Prisma.TransactionClient , budgetId: number, userId: number, expectedCurrency: Currency ) {


    const budget = await tx.budget.findFirst({
      where: { id: budgetId , userId , status: 'ACTIVE' },
      select: {
        id: true,
        userId: true,
        currency: true,
        anchorDayOfMonth: true,
        anchorWeekday: true,
        limitAmountMinor: true,
        rollover: true,
        period: true,
      }
    })
    if(!budget) throw new BadRequestException('No budget found or inactive')
    if(budget.currency !== expectedCurrency) {
      throw new BadRequestException('Budget currency not the same')
    }
    
    return budget 
  }

  private async findOrCreateBudgetPeriod(
    tx: Prisma.TransactionClient,
    budget: {
      id: number,
      limitAmountMinor: number,
      rollover: boolean,
    },
    periodStart: Date,
    periodEnd: Date,
  ) {
    let bp = await tx.budgetPeriod.findFirst({
      where: { budgetId: budget.id, periodStart , periodEnd },
      select: { id: true, budgetId: true , spentMinor: true , limitAmountMinor: true , status: true }
    })
    if(!bp) {
      bp = await tx.budgetPeriod.create({
        data: {
          budgetId: budget.id,
          periodStart,
          periodEnd,
          limitAmountMinor: budget.limitAmountMinor,
          spentMinor: 0,
          status: 'OPEN'
        },
        select: { id: true , budgetId: true, spentMinor: true, limitAmountMinor: true, status: true },
      })
    }
    return bp
  }

  async findManyByUser(
    userId: number,
    opts: { skip?: number; take?: number; filters?: FindManyFilters } = {},
  ) {
    const where: Prisma.TransactionWhereInput = { wallet: { userId: userId}  }

    if (opts.filters?.type) where.type = opts.filters.type
    if (opts.filters?.walletId) where.walletId = opts.filters.walletId
    if (opts.filters?.search) 
      where.description = { contains: opts.filters.search, mode: 'insensitive' }
    if (opts.filters?.from || opts.filters?.to) {
      where.date = {}
      if (opts.filters.from) (where.date as Prisma.DateTimeFilter).gte = opts.filters.from
      if (opts.filters.to) (where.date as Prisma.DateTimeFilter).lte = opts.filters.to
    }

    const [items, total] = await this.prisma.prisma.$transaction([
      this.prisma.prisma.transaction.findMany({
         where,
         orderBy: { date: 'desc' },
         skip: opts.skip ?? 0,
         take: opts.take ?? 20,
         select: {
           id: true,
           userId: true,
           wallet: {
            select: {
              publicId: true,
              name:true,
              currency: true,
              isDefault: true,
            }
          },
           walletId: true,
           amountMinor: true,
           currency: true,
           type: true,
           description: true,
           date: true,
           createdAt: true,
           updatedAt: true,
         },
         
      }),
      this.prisma.prisma.transaction.count({ where })
  ])

    return { items, total }
  }

  

  async findByIdOwned(userId: number, id: number) {
    return this.prisma.prisma.transaction.findFirst({
      where: { id, userId },
      select: {
        id: true,
        userId: true,
        walletId: true,
        amountMinor: true,
        currency: true,
        type: true,
        description: true,
        date: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }



  async deleteOwned(userId: number, id: number) {
    const res = await this.prisma.prisma.transaction.deleteMany({
      where: { id, userId },
    })
    return res.count === 1
  }

  async findMyOwnWallets(userId: number) {
    const where: Prisma.WalletWhereInput = {userId}

    const items = await this.prisma.prisma.wallet.findMany({
      where,
      select: {
        id: true,
        publicId: true,
        name: true,
        currency: true,
        isDefault: true,
        status: true,
      }
    })
    return items
  }

  async findMyBudgets (userId: number) {

    const items = await this.prisma.prisma.budget.findMany({
      where: {userId, status: 'ACTIVE'},
      select: {id: true , userId: true , name: true, limitAmountMinor: true , anchorDayOfMonth: true , anchorWeekday: true , rollover: true , period: true ,currency: true , status: true}
    })

    return items
  }
}
