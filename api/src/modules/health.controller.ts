import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Public() @Get() check() {
    return { status: 'ok' };
  }
}
