import { Injectable } from '@nestjs/common'
import { Prisma, Currency, TransactionType as TxType, TransactionType } from '@prisma/client'
import { TransactionKind } from '@prisma/client'
import { PrismaService } from 'src/database/PrismaService.service'


@Injectable()
export class ReportsService {

    constructor(private readonly prisma: PrismaService) {}

    async findManyByUser(
        userId: number,
    ) {
        const [ items ] = await this.prisma.prisma.$transaction([
        this.prisma.prisma.transaction.findMany({
            where: {userId},
            orderBy: { date: 'desc' },
            select: {
                id: true,
                userId: true,
                walletId: true,
                amountMinor: true,
                currency: true,
                type: true,
            },
        })
        ])

        const incomeAndExpenseAmount = items.reduce((sum, tx) => sum + tx.amountMinor, 0)
        const incomeAndExpenseTotal = items.length
        const incomeAndExpense = [{
            tamount: incomeAndExpenseAmount,
            total: incomeAndExpenseTotal
        }]

        const expenseReports = items.filter( i => i.type === 'EXPENSE')     
        const totalExpense = expenseReports.length
        const expenseAmount = expenseReports.reduce((sum, tx) => sum + tx.amountMinor, 0)
        const expenseTransactions = [{
            type: 'EXPENSE',
            tamount: expenseAmount,
            total: totalExpense,
        }]


        const incomeReports = items.filter( i => i.type === 'INCOME')
        const totalIncome = incomeReports.length
        const incomeAmount = incomeReports.reduce((sum, tx) => sum + tx.amountMinor, 0)
        const incomeTransactions = [{
            type: 'INCOME',
            tamount: incomeAmount,
            total: totalIncome,
        }]

        
        return { incomeAndExpense , expenseTransactions , incomeTransactions }
    }

    async findManyWallets(userId: number) {
        const [groupedWallets] = await this.prisma.prisma.$transaction([
            this.prisma.prisma.transaction.groupBy({
                by: ['walletId'],
                where: {type: 'EXPENSE', userId},
                _sum: { amountMinor: true },
                orderBy: { _sum: { amountMinor: 'desc' } }
            })]
        )
        const walletIds  = groupedWallets.map(g => g.walletId)
        const wallets = await this.prisma.prisma.wallet.findMany({
            where: { id: { in: walletIds } },
            select: {
                id: true,
                name: true,
                currency: true,
                status: true,
            }
            
        })
        const byId = Object.fromEntries(
            wallets.map(w => [w.id, w])
        )
        const walletsSum = groupedWallets.map(g => ({
            walletId: g.walletId,
            totalAmount: g._sum?.amountMinor ?? 0,
            wallet: byId[g.walletId] ?? null
            }))

        return  walletsSum
    }

}