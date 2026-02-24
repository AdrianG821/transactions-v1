import { Injectable } from "@nestjs/common"
import { PrismaService } from "src/database/PrismaService.service"
import { Role } from "@prisma/client"

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService){}

    async create(params: { name: string ; email: string; passwordHash: string}) {
        const { name, email, passwordHash } = params;
        return this.prisma.prisma.user.create({
            data: { name, email, passwordHash , roles: [] as Role[] },
            select: { id: true, name: true, email: true, roles: true, createdAt: true, updatedAt: true },
        })
    }

    findByEmail(email: string){
        return this.prisma.prisma.user.findUnique({
            where: { email },
        })
    }

    findById(id: number) {
        return this.prisma.prisma.user.findUnique({
            where: { id } ,
            select: { id: true, name: true, roles: true , createdAt: true , updatedAt: true }
        })
    }
    

}