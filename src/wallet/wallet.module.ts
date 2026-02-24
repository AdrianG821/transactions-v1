import { Module } from '@nestjs/common'
import { PrismaServiceModule } from 'src/database/PrismaService.module'
import { WalletService } from './wallet.service' 
import { WalletController } from './wallet.controller' 

@Module({
  imports: [PrismaServiceModule],
  controllers: [WalletController],
  providers: [WalletService],
})
export class WalletModule {}