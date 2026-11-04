import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { applySchema } from './applications.dto';
import { ApplicationsService } from './applications.service';

// No route prefix: this controller owns both /opportunities/:id/applications and /applications/*
@Controller()
@ApiTags('Applications')
@ApiBearerAuth('access-token')
export class ApplicationsController {
  constructor(private svc: ApplicationsService) {}

  @Post('opportunities/:id/applications')
  apply(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(applySchema)) b: { message?: string },
  ) {
    return this.svc.apply(id, uid, b.message);
  }

  @Get('opportunities/:id/applications')
  forListing(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.listForOpportunity(id, uid);
  }

  @Get('applications/mine') mine(@CurrentUser('id') uid: string) {
    return this.svc.mine(uid);
  }

  @Post('applications/:id/withdraw')
  @HttpCode(200)
  withdraw(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.withdraw(id, uid);
  }
  
  @Post('applications/:id/select')
  select(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.select(id, uid);
  }
}
