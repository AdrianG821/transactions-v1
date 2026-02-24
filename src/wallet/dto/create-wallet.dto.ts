import { IsNotEmpty, IsEnum, IsString, MaxLength, MinLength, IsInt } from 'class-validator'
import { Transform } from 'class-transformer'
import { Currency } from '@prisma/client'
import { statusBudget } from '@prisma/client'

export class CreateWalletDto {

    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(25)
    name: string

    @IsInt()
    balanceMinor: number

    @IsEnum(Currency)
    currency: Currency

    @IsEnum(statusBudget)
    status: statusBudget

}