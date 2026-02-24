import {
  Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, ConflictException ,
  Param, ParseIntPipe,Patch , Body, Post, Query, Req, UseGuards
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Currency, Prisma } from '@prisma/client'
import { BudgetsService } from './budgets.service' 
import { CreateBudgetsDto } from './dto/create-budgets.dto'

@Controller('budgets')
@UseGuards(AuthGuard('jwt'))
export class BudgetsController{
    constructor(private readonly budget: BudgetsService) {}

    @Post()
    async create(@Req() req: any, @Body() dto: CreateBudgetsDto) {
        const userId = req.user.userId as number

        try {
            return await this.budget.create({
                userId,
                name: dto.name,
                limitAmountMinor: dto.limitAmountMinor,
                description: dto.description,
                currency: dto.currency,
                period: dto.period,
                from: dto.from,
                anchorDayOfMonth: dto.anchorDayOfMonth,
                anchorWeekday: dto.anchorWeekday,
                to: dto.to,
            })
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if(err.code === 'P2002') {
                    throw new ConflictException('You already have a budget with the same name!')
                }
            }
            throw err
        }
    }


    @Get()
    async findMany(@Req() req: any) {
        const userId = req.user.userId as number

        const items = await this.budget.findBudgetsByUser(userId)
        return { data: items }
    }

    @Patch(':id/archive')
    async archiveBudget(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = req.user.userId as number

        return await this.budget.archiveBudget(id, userId)
    }
}