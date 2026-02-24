import {
  Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, ConflictException ,
  Param, ParseIntPipe, Body, Post, Query, Req, UseGuards,
  Patch
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Prisma } from '@prisma/client'
import { WalletService } from './wallet.service' 
import { CreateWalletDto } from './dto/create-wallet.dto' 


@Controller('wallets')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
    constructor(private readonly wallet: WalletService) {}


    
    @Post()
    async create(@Req() req: any , @Body() dto: CreateWalletDto){
        const userId = req.user.userId as number

        try { 
            return await this.wallet.create({
                userId,
                name: dto.name,
                balanceMinor: dto.balanceMinor,
                currency: dto.currency,
                status: dto.status,
            })
        } catch (err) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === 'P2002') {
                    throw new ConflictException( 'You already have a wallet with the same name!' )
                }
            }
            throw err
        }
    }



    @Get()
    async findMany( @Req() req: any) {
        const userId = req.user.userId as number

        const  items  = await this.wallet.findWalletsByUser(userId)
        return { data: items }
    }



    @Patch(':id/archive')
    async patchArchive(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = req.user.userId as number
        return await this.wallet.archiveWallet(id , userId)              
    }


    
    @Patch(':id/unarchive')
    async unPatchArchive(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
        const userId = req.user.userId as number
        return await this.wallet.activateWallet(id , userId)
    }



    @Patch(':id/default')
    async patchDefault(@Req() req: any, @Param('id', ParseIntPipe) id: number){
        const userId = req.user.userId as number
        return await this.wallet.makeDefault(id , userId)
    }
      


}