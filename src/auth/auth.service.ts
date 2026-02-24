import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from 'src/user/user.service' 
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt'
import { Role, User } from '@prisma/client'


@Injectable()

export class AuthService {

    constructor (
        private readonly users: UsersService,
        private readonly jwt: JwtService,
    ) {}

    private signToken(user: Pick<User, 'id' | 'email' | 'roles' >) {
        const payload = { sub: user.id , email: user.email , roles: user.roles }
        return this.jwt.sign(payload , {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
        })

    }

    async register(dto: RegisterDto) {
        const saltRounds = Number(process.env.BYCRYPT_SALT_ROUNDS ?? 12)
        const passwordHash = await bcrypt.hash(dto.password , saltRounds)
        const user = await this.users.create({ name: dto.name , email: dto.email , passwordHash})
        const accesToken = this.signToken(user as any)
        return { user , accesToken}
    }


    async login ( dto: LoginDto ) {
        const found = await this.users.findByEmail(dto.email)
        if(!found) throw new UnauthorizedException('Emailul este gresit!')

        const ok = await bcrypt.compare(dto.password , found.passwordHash)
        if (!ok) throw new UnauthorizedException('Parola este gresita!')

        const user = {
            id: found.id ,
            name: found.name ,
            email: found.email , 
            roles: found.roles as Role[] ,
            createdAt: found.createdAt ,
            updatedAt: found.updatedAt ,
        }

        const accessToken = this.signToken(user as any)
        return { user , accessToken}
    }

    async me( userId: number ){
        return this.users.findById(userId)
    }

}