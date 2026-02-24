import { Injectable } from '@nestjs/common'
import { Prisma, Currency as TxType } from '@prisma/client'
import { PrismaService } from 'src/database/PrismaService.service'
import { ConflictException } from '@nestjs/common'
import { periodBudget } from '@prisma/client'

type CreateBudgetsParams = {
    userId: number
    name: string
    description: string
    limitAmountMinor: number
    anchorDayOfMonth: number
    anchorWeekday: number
    period: periodBudget
    currency: TxType
    from: Date
    to: Date
}

@Injectable()
export class BudgetsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(params: CreateBudgetsParams) {
        const { userId, name , description , limitAmountMinor , currency , anchorDayOfMonth, period ,anchorWeekday , from , to } = params

        const existAlready = await this.prisma.prisma.budget.findFirst({
            where: { name: name , userId},
            select: { name: true, currency: true }
        })
        if(existAlready) throw new ConflictException('Budget with the same name already exists!')

        return this.prisma.prisma.budget.create({
            data:{ userId , name , limitAmountMinor , description , currency , period , anchorDayOfMonth , anchorWeekday},
            select: { id: true, userId: true,  name: true, limitAmountMinor: true , currency: true, anchorWeekday: true , anchorDayOfMonth: true , createdAt: true , updatedAt: true}
        })

    }

    async findBudgetsByUser (userId: number) {
        const where: Prisma.BudgetWhereInput = { userId }

        const items = await this.prisma.prisma.budget.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            select: { id: true , userId: true , name: true, limitAmountMinor: true , anchorDayOfMonth: true , anchorWeekday: true , rollover: true , period: true ,currency: true , status: true ,   }
        })
        return items
    }

    async archiveBudget(id: number, userId: number) {
        
        return this.prisma.prisma.$transaction(async (tx) =>{

            const exists = await tx.budget.findFirst({
                where: {id, userId, status: 'ACTIVE'},
                select: {id: true, userId: true , status: true}
            })

            if(exists) {
                return tx.budget.update({
                    where: { id , userId , status: 'ACTIVE'},
                    data: {
                        status: 'ARCHIVED'
                    }
                })
            } else {
                return tx.budget.update({
                    where: { id , userId , status: 'ARCHIVED'},
                    data: {
                        status: 'ACTIVE'
                    }
                })
            }
        })
    }


}
