import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma.service';
import { AuthController } from './auth.controller';

@Module({
  providers: [AuthService, FirebaseService, PrismaService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
