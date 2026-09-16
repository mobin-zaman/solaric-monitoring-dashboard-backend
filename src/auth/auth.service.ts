import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly prismaService: PrismaService,
  ) {}

  async validateUser(token: string): Promise<{ uid: string; role: UserRole }> {
    const uid = await this.firebaseService.verifyIdToken(token);
    const user = await this.prismaService.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { uid: user.firebaseUid, role: user.role };
  }

  async getCurrentUser(uid: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        firebaseUid: uid,
      },
    });
    return user;
  }
}
