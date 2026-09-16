import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from '../prisma.service';
import { FirebaseService } from '../firebase/firebase.service';
import { AuthService } from '../auth/auth.service';

@Module({
  providers: [UserService, PrismaService, FirebaseService, AuthService],
  controllers: [UserController],
})
export class UserModule {}
