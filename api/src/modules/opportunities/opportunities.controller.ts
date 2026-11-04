import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { createSchema, listSchema, updateSchema } from './opportunities.dto';
import { OpportunitiesService } from './opportunities.service';

@Controller('opportunities')
@ApiTags('Opportunities')
@ApiBearerAuth('access-token')
export class OpportunitiesController {
  constructor(private svc: OpportunitiesService) {}

  @Post() create(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(createSchema)) b: any,
  ) {
    return this.svc.create(uid, b);
  }
  
  @Get() list(@Query(new ZodPipe(listSchema)) q: any) {
    return this.svc.list(q);
  }

  @Get('mine') mine(@CurrentUser('id') uid: string) {
    return this.svc.mine(uid);
  } // declared before ':id'

  @Get(':id') one(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.getOne(id, uid);
  }

  @Patch(':id') update(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(updateSchema)) b: any,
  ) {
    return this.svc.update(id, uid, b);
  }

  @Post(':id/publish') @HttpCode(200) publish(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.publish(id, uid);
  }
  
  @Post(':id/close') @HttpCode(200) close(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.svc.close(id, uid);
  }
}
