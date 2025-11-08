// import { Injectable } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';

// @Injectable()
// export class JwtAuthGuard extends AuthGuard('jwt') {
    
// }

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
   
    const request = context.switchToHttp().getRequest();
   
    
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
 
    
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token or user not found');
    }
    return user;
  }
}
