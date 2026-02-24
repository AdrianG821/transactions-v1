import { MaxLength, MinLength, IsEnum, IsString , IsOptional } from 'class-validator'
import { Transform } from 'class-transformer'
import { Currency } from '@prisma/client'

export class QueryWalletDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @MinLength(1)
    name?: string

    @IsOptional()
    balanceMinor: Number

    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency
}