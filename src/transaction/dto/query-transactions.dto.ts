import { IsOptional, IsInt, Min, IsEnum, IsString } from 'class-validator'
import { Type as TransformType } from 'class-transformer'
import { TransactionType as TxType } from '@prisma/client'

export class QueryTransactionsDto {
    @IsOptional()
    @IsInt()
    @Min(1)
    @TransformType(()=> Number)
    page?: number = 1

    @IsOptional()
    @IsInt()
    @Min(1)
    @TransformType(()=> Number)
    limit?: number = 20

    @IsOptional()
    @IsEnum(TxType)
    type?: TxType

    @IsOptional()
    @IsInt()
    @Min(1)
    @TransformType(() => Number)
    walletId?: number

    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @TransformType(() => Date)
    from?: Date

    @IsOptional()
    @TransformType(() => Date)
    to?: Date   
}