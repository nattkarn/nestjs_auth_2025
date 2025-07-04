import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async validateUser(username: string, password: string) {
        const isUserExist = await this.userService.findByUsernameHavePassword({
          username,
        });
    
        // console.log(isUserExist);
    
        if (
          isUserExist &&
          (await bcrypt.compare(password, isUserExist.data.password))
        ) {
          return {
            id: isUserExist.data.id,
            username: isUserExist.data.username,
            level: isUserExist.data.level,
          };
        }
        throw new NotFoundException('User not found or password not match');
      }

      async login(user: any) {
        const payload = { username: user.username, id: user.id, level: user.level };
    
        const checkStatus = await this.userService.findByUsername({
          
          username: user.username,
          
        });
    
        if (checkStatus.data.status !== AccountStatus.ACTIVE) {
          return {
            message: 'User not active',
            httpStatus: 401,
          };
        }
    
        console.log('payload', payload);
        return {
          message: 'User logged in successfully',
          httpStatus: 200,
          username: user.username,
          level: user.level,
          token: this.jwtService.sign(payload),
        };
      }
    
      async verifyToken(token: string) {
        try {
          const verifyToken = await this.jwtService.verify(token);
          if (verifyToken) {
            console.log("token is verify",verifyToken);
            return true;
          } else {
            console.log("token is not verify");
            return false;
          }
        } catch (error) {
          console.log("token is not verify",error);
          return false;
        }
      }
}
