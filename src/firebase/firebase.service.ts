import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { UserStatus } from '@prisma/client';

@Injectable()
export class FirebaseService {
  @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin;

  async createUser(email: string, password: string): Promise<string> {
    const userRecord = await this.firebase.auth.createUser({
      email,
      password,
    });

    return userRecord.uid;
  }

  async updateUserStatus(
    firebaseUserId: string,
    status: UserStatus,
  ): Promise<void> {
    try {
      await this.firebase.auth.updateUser(firebaseUserId, {
        disabled: status === UserStatus.DISABLED,
      });
      //;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // ...

  async verifyIdToken(token: string): Promise<string> {
    try {
      const userRecord = await this.firebase.auth.verifyIdToken(token);
      //;
      // //;
      return userRecord.uid;
    } catch (error) {
      //;
      //;
      throw new UnauthorizedException('Invalid token');
    }
  }

  async deleteUser(firebaseUserId: string): Promise<void> {
    try {
      await this.firebase.auth.deleteUser(firebaseUserId);
      //;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}
