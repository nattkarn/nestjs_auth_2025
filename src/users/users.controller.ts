import { Controller, Get, Post, Body, Query, Res, HttpCode, UseGuards , Request, Param, Patch, Delete} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-email.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleUserDto } from './dto/update-role-user.dto';
import { Roles } from 'src/auth/strategies/roles.decorator';
import { RolesGuard } from 'src/auth/role.guard';


@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/auth/register')
  @HttpCode(201)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  
  @Post('/auth/resend-verification')
  @HttpCode(200)
  resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    return this.usersService.resendVerification(resendVerificationDto);
  }

  @Get('/auth/verify-email')
  @HttpCode(200)
  verifyEmail(@Query('token') token: string) {
    console.log('token',token);
    return this.usersService.verifyEmail(token);
  }

  @Post('/users/user-info')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  userInfo(@Request() req: any) {
    console.log('user',req.user);
    return this.usersService.findByUsername({ username: req.user.username });
  }

  @Get('/users/find-user/:username')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findUser(@Param('username') username: string) {
    return this.usersService.findByUsername({ username: username });
  }


  @Patch('/users/update-role/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard , RolesGuard)
  @Roles('ADMIN')
  updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleUserDto) {
    return this.usersService.updateRole(id, updateRoleDto);
  }

  @Patch('/users/update-user/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete('/users/delete-user/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Patch('/users/revive-user/:id')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  reviveUser(@Param('id') id: string) {
    return this.usersService.reviveUser(id);
  }
}
