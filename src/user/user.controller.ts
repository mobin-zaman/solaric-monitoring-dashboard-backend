import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './user.dto';
import { AuthGuard } from '../auth/auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { RolesGuard } from '../auth/roles.guard';

@Controller('user')
@UsePipes(ValidationPipe)
// @UseGuards(AuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/')
  // @Roles(Role.ADMIN)
  async create(
    @Body() createUserDto: CreateUserDto,
    @Body('password') password: string,
  ): Promise<User> {
    try {
      //;
      return await this.userService.createUser(createUserDto, password);
    } catch (error) {
      //;
      throw new BadRequestException(error.message);
    }
  }

  @Get('/')
  // @Roles(Role.ADMIN)
  async findAll(
    @Query('search') search?: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ): Promise<User[]> {
    // //;
    return await this.userService.findAll(search, skip, take);
  }

  @Get('/user-role/')
  async findUserRole(@Query('search') search?: string) {
    return await this.userService.findUserRole(search);
  }

  @Get(':id')
  // @Roles(Role.ADMIN)
  async findOne(@Param('id') id: number): Promise<User> {
    return await this.userService.findOne(id);
  }

  @Put(':id')
  // @Roles(Role.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    try {
      return await this.userService.updateUser(id, updateUserDto);
    } catch (error) {
      //;
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request,
  ): Promise<User> {
    try {
      return await this.userService.deleteUser(id);
    } catch (error) {
      //;

      throw new BadRequestException(error.message);
    }
  }
}
