import { Injectable } from '@nestjs/common'
import { Prisma, Currency as TxType } from '@prisma/client'
import { PrismaService } from 'src/database/PrismaService.service'
import { ConflictException } from '@nestjs/common'
import { NotFoundException } from '@nestjs/common'
import { statusBudget } from '@prisma/client'

type CreateWxParams = {
    userId: number
    name: string
    balanceMinor: number
    currency: TxType
    status: statusBudget

}


@Injectable()
export class WalletService {
    constructor(private readonly prisma: PrismaService) {}


    async create(params: CreateWxParams) {
        const { userId, name, balanceMinor , currency , status} = params

        const existAlreadyWallet = await this.prisma.prisma.wallet.findFirst({
            where: { name: name, userId },
            select: { name: true, currency: true },
        })

        if(existAlreadyWallet) throw new ConflictException('Ai deja un card cu acelasi nume!')

        return this.prisma.prisma.wallet.create({
            data: { userId, name , currency , balanceMinor , status},
            select: { id: true, userId: true, name: true, balanceMinor: true , currency: true, createdAt: true, updatedAt: true }
        })
    }




    async findWalletsByUser( userId: number) {

        const where: Prisma.WalletWhereInput = { userId }

        const items = await this.prisma.prisma.wallet.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                select: { id: true, userId: true, name: true, balanceMinor: true, isDefault: true, status: true ,archivedAt: true ,currency: true, createdAt: true, updatedAt: true }
            })
        return items
    }

    
    async archiveWallet(id: number, userId: number) {

        const exists = await this.prisma.prisma.wallet.findUnique({ where: {id , userId} });
        if(!exists) throw new NotFoundException(`WALLET ${id} NOT FOUND`);

        return this.prisma.prisma.wallet.update({
            where: {id, userId},
            data: {
                status: 'ARCHIVED',
                archivedAt: new Date(),
                updatedAt: new Date()
            }
        })
    }

    async activateWallet(id: number, userId: number) {

        const exists = await this.prisma.prisma.wallet.findUnique({ where: {id , userId} });
        if(!exists) throw new NotFoundException(`WALLET ${id} NOT FOUND`);

        return this.prisma.prisma.wallet.update({
            where: {id, userId},
            data: {
                status: 'ACTIVE',
                archivedAt: null,
                updatedAt: new Date()
            }
        })
    }

    
    async makeDefault(id: number, userId: number) {


        return this.prisma.prisma.$transaction(async (tx) => {

            const exists = await tx.wallet.findFirst({ where: {id, userId, status: 'ACTIVE' }, select: {id: true, status: true , isDefault: true} });
            if(!exists) throw new NotFoundException(`WALLET ${id} NOT FOUND`);
            if(exists.isDefault === true) {
                return tx.wallet.update({
                    where: {id: exists.id},
                    data: {
                        isDefault: false
                    }
                })
            }

            await tx.wallet.updateMany({
                where: { userId , isDefault: true},
                data: {
                    isDefault: false,
                }
            })
                     
             const updated = await tx.wallet.update({
                where: {id: exists.id},
                data: {
                    isDefault: true,
                }
            })

            return updated
        })
       
    }

}