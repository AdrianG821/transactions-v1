import { Module } from "@nestjs/common";
import { UsersService } from './user.service';
import { PrismaServiceModule } from "src/database/PrismaService.module";


@Module({
  imports:  [PrismaServiceModule],
  providers: [UsersService],
  exports: [UsersService]
})
export class UserModule {}