import {
  Controller,
  HttpCode,
  Post,
  UseGuards,
  Request,
  Res,
  Body,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { Response } from 'express';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @HttpCode(200)
  @SkipThrottle()
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    console.log('user req',req.user);
    const login = await this.authService.login(req.user);

    res.cookie('AppName_user_token', login.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 1000,
    });

    res.cookie('role', login.role, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 1000,
    });

    res.cookie('AppName_user_name', login.username, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 1000,
    });
    return login;
  }

  @Post('/logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('AppName_user_token', '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
    });

    res.cookie('AppName_user_role', '', {
      httpOnly: false,
      maxAge: 0,
      path: '/',
    });

    res.cookie('AppName_user_name', '', {
      httpOnly: false,
      maxAge: 0,
      path: '/',
    });

    return { success: true };
  }

  @Post('/verify-token')
  @HttpCode(200)
  async verifyToken(@Request() req: any) {
    const verifyToken = await this.authService.verifyToken(req.body.token);
    return verifyToken;
  }

  @Post('/check-token-expired')
  @SkipThrottle()
  checkTokenExpired(@Body() body: { token: string }) {
    const checkTokenExpired = this.authService.verifyToken(body.token);
    return checkTokenExpired;
  }
}
