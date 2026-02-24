import { IsNotEmpty, IsEnum, IsString, MaxLength, IsOptional ,MinLength , Length , Min , IsInt } from 'class-validator'
import { Transform } from 'class-transformer'
import { Currency } from '@prisma/client'
import { Type as TransformType } from 'class-transformer'
import { periodBudget } from '@prisma/client'


export class CreateBudgetsDto {

    @IsString()
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsNotEmpty()
    @MinLength(4)
    @MaxLength(25)
    name: string

    @IsInt()
    @Min(1)
    limitAmountMinor: number

    @IsInt()
    @IsOptional()
    anchorDayOfMonth: number

    @IsInt()
    @IsOptional()
    anchorWeekday: number

    @IsString()
    @Length(0, 255)
    @IsOptional()
    description: string

    @IsOptional()
    @TransformType(() => Date)
    from: Date

    @IsOptional()
    @TransformType(() => Date)
    to: Date

    @IsEnum(Currency)
    currency: Currency

    @IsEnum(periodBudget)
    period: periodBudget
}