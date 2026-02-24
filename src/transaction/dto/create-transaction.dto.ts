import { IsInt, Min, IsEnum, IsString, Length, IsOptional, IsUUID , ValidateIf} from 'class-validator'
import { Type as TransformType } from 'class-transformer'
import { Currency } from '@prisma/client'
import { TransactionKind } from '@prisma/client'

export class CreateTransactionDto {
    @IsUUID()
    sourceWalletId: string

    @IsUUID()
    @ValidateIf(o => o.kind === 'TRANSFER')
    destWalletId: string

    @IsInt()
    @Min(1)
    amountMinor: number

    @IsInt()
    @IsOptional()
    budget: number

    @IsEnum(TransactionKind)
    kind: TransactionKind

    @IsEnum(Currency)
    currency: Currency

    @IsString()
    @IsOptional()
    @Length(1, 255)
    description

    @IsOptional()
    @TransformType(()=> Date)
    date?: Date
}