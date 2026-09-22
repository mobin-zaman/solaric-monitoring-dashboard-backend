import { Get, Controller, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @UseGuards(AuthGuard)
  @Get('current-user')
  async getCurrentUser(@Req() request) {
    // return request.user;
    return await this.authService.getCurrentUser(request.user.uid);
  }
}
