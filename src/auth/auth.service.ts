// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class AuthService {}
// D:\assignment\event_management\src\auth\auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
    const payload = { sub: user._id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto) {
    console.log('Login request received:', loginDto);
    const user = await this.userService.findByEmail(loginDto.email);
    console.log('User found in DB:', user); 
    if (!user) {
        console.log('User not found!');
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    console.log('Password valid?', isPasswordValid);

    if (!isPasswordValid) {
        console.log('Password mismatch!');
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
const token = this.jwtService.sign(payload);
    console.log('JWT payload:', payload);
  console.log('JWT token:', token);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  async validateUser(userId: string) {
    return this.userService.findById(userId);
  }
}
