import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { PaymentsService } from './payments.service';

@Controller('assignments/:id/payment')
@ApiTags('Payments')
@ApiBearerAuth('access-token')
export class PaymentsController {
  constructor(private svc: PaymentsService) {}
  @Get() get(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.get(id, uid);
  }

  @Post('declare') declare(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.declare(id, uid);
  }
  
  @Post('confirm') @HttpCode(200) confirm(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.confirm(id, uid);
  }
}
