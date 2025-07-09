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
    console.log('user req', req.user);
    const login = await this.authService.login(req.user);

    res.cookie('AppName_user_token', login.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, //15 นาที
    });

    res.cookie('AppName_refresh_token', login.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
    });

    res.cookie('AppName_user_role', login.role, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, //15 นาที
    });

    res.cookie('AppName_user_name', login.username, {
      httpOnly: false,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, //15 นาที
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

    res.cookie('AppName_refresh_token', '', {
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

  @Post('/refresh-token')
  @HttpCode(200)
  @SkipThrottle()
  async refreshToken(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['AppName_refresh_token'];
    const result = await this.authService.refresh(refreshToken);

    // เซต access token ใหม่
    res.cookie('AppName_user_token', result.token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 นาที
    });

    return result;
  }

  @Post('/verify-token')
  @HttpCode(200)
  async verifyToken(@Request() req: any) {
    const verifyToken = await this.authService.verifyToken(req.body.token);
    return verifyToken;
  }

  @Post('/check-token-expired')
  @SkipThrottle()
  async checkTokenExpired(@Body() body: { token: string }) {
    const checkTokenExpired = await this.authService.verifyToken(body.token);
    return checkTokenExpired;
  }
}
