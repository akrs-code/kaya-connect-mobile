import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
  RegisterDto,
} from './auth.dto';
import { AuthService } from './auth.service';

const strict = { default: { ttl: 15 * 60_000, limit: 20 } }; // stricter limit on /auth/*

@Controller('auth')
@ApiTags('Authentication')
@Throttle(strict)
export class AuthController {
  constructor(private auth: AuthService) {}

  @Public()
  @Post('register')
  register(@Body(new ZodPipe(registerSchema)) body: RegisterDto) {
    return this.auth.register(body);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body(new ZodPipe(loginSchema)) b: { email: string; password: string },
  ) {
    return this.auth.login(b.email, b.password);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body(new ZodPipe(refreshSchema)) b: { refreshToken: string }) {
    return this.auth.refresh(b.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth('access-token')
  async logout(@Body(new ZodPipe(refreshSchema)) b: { refreshToken: string }) {
    await this.auth.logout(b.refreshToken);
  }
}
