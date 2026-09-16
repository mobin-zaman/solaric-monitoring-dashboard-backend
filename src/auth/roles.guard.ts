// import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
// import { Reflector } from '@nestjs/core';
// import { ROLES_KEY } from './roles.decorator';
//
// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {
//   }
//
//   canActivate(context: ExecutionContext): boolean {
//     //;
//     const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
//       context.getHandler(),
//       context.getClass(),
//     ]);
//     const { user } = context.switchToHttp().getRequest();
//
//     //;
//     if (!requiredRoles || requiredRoles.length === 0) {
//       return true;
//     }
//     if (!user) {
//       throw new UnauthorizedException('User not found');
//     }
//
//
//     const hasRole = requiredRoles.some((role) => user.role === role);
//     //;
//     if (!hasRole) {
//       throw new UnauthorizedException('User does not have the required role');
//     }
//
//     return true;
//   }
// }
//

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor() {}

  canActivate(context: ExecutionContext): boolean {
    //;
    // const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);

    const requiredRoles: string[] = Object.values(Role);
    //;

    const { user } = context.switchToHttp().getRequest();
    //;
    //;
    const result = requiredRoles.some((role) => user.role?.includes(role));
    //;
    return result;
  }
}
