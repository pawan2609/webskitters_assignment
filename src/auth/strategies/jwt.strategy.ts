
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secret-key',
    });
   
  }

  async validate(payload: any) {
    
    if (!payload.sub) {
     
      throw new UnauthorizedException('Invalid token payload');
    }
    
    try {
      const user = await this.authService.validateUser(payload.sub);
      
      if (!user) {
       
        throw new UnauthorizedException('User not found');
      }
      
      return { 
        userId: payload.sub, 
        email: payload.email, 
        role: payload.role 
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}