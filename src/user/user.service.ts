import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { Prisma, User, UserRole } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private firebase: FirebaseService,
  ) {}

  async createUser(data: CreateUserDto, password: string): Promise<User> {
    //;
    const firebaseUid = await this.firebase.createUser(data.email, password);

    //;

    delete data.password;

    return await this.prisma.user.create({
      data: {
        ...data,
        firebaseUid,
      },
    });
  }

  async findAll(
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<User[]> {
    const pattern = search
      ? new RegExp(search.split(' ').join('.*'), 'i')
      : undefined;

    const or = pattern
      ? {
          OR: [
            { name: { contains: pattern.source, mode: 'insensitive' } },
            { email: { contains: pattern.source, mode: 'insensitive' } },
          ],
        }
      : {};

    return await this.prisma.user.findMany({
      where: {
        ...(or as any),
      },
      orderBy: {
        id: 'asc',
      },
      skip: skip || 0,
      take: take || undefined,
    });
  }

  async findUserRole(
    search?: string,
    skip?: number,
    take?: number,
  ): Promise<User[]> {
    const pattern = search
      ? new RegExp(search.split(' ').join('.*'), 'i')
      : undefined;

    const or = pattern
      ? {
          OR: [
            { name: { contains: pattern.source, mode: 'insensitive' } },
            { email: { contains: pattern.source, mode: 'insensitive' } },
          ],
        }
      : {};

    return await this.prisma.user.findMany({
      where: {
        ...(or as any),
        role: UserRole.USER,
      },
      orderBy: {
        id: 'asc',
      },
      skip: skip || 0,
      take: take || undefined,
    });
  }

  async findOne(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    try {
      //if only the status changes, the firebase update is called.
      if (data.status) {
        const user = await this.prisma.user.findUniqueOrThrow({
          where: { id },
        });
        await this.firebase.updateUserStatus(user.firebaseUid, data.status);
      }
      return this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      //;
      //;
      throw error;
    }
  }

  async deleteUser(id: number): Promise<User> {
    try {
      // const currentUser = await this.prisma.user.findUnique({
      //   where: {
      //     firebaseUid: userFirebaseUID,
      //   },
      // });

      // //;
      // //;

      // if (currentUser.id === id) {
      //   throw new Error('You can not delete yourself');
      // }

      const SUPER_ADMIN_ID = 8;

      if (id === SUPER_ADMIN_ID) {
        throw new Error('You can not delete SUPER ADMIN');
      }

      await this.prisma.userProject.deleteMany({
        where: {
          userId: id,
        },
      });

      const deletedUser = await this.prisma.user.delete({
        where: { id },
      });

      //now deleting the associated firebase user

      await this.firebase.deleteUser(deletedUser.firebaseUid);

      return deletedUser;
    } catch (error) {
      //;
      //;
      throw error;
    }
  }
}
