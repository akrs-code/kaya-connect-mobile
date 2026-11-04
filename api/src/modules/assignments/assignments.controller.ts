import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import {
  cancelSchema,
  proposeSchema,
  statusSchema,
  versionSchema,
} from './assignments.dto';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
@ApiTags('Assignments')
@ApiBearerAuth('access-token')
export class AssignmentsController {
  constructor(private s: AssignmentsService) {}

  @Get('mine') mine(@CurrentUser('id') uid: string) {
    return this.s.mine(uid);
  }

  @Get(':id') one(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.s.getOne(id, uid);
  }

  @Get(':id/agreement/history') history(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.s.agreementHistory(id, uid);
  }

  @Post(':id/agreement/propose')
  @HttpCode(200)
  propose(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(proposeSchema)) b: any,
  ) {
    return this.s.propose(id, uid, b);
  }

  @Post(':id/agreement/accept')
  @HttpCode(200)
  accept(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(versionSchema)) b: { version: number },
  ) {
    return this.s.accept(id, uid, b.version);
  }

  @Post(':id/agreement/reject')
  @HttpCode(200)
  reject(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(versionSchema)) b: { version: number },
  ) {
    return this.s.reject(id, uid, b.version);
  }

  @Patch(':id/status')
  start(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(statusSchema)) _b: unknown,
  ) {
    return this.s.startWork(id, uid);
  }

  @Post(':id/completion/report') @HttpCode(200) report(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.s.reportCompletion(id, uid);
  }

  @Post(':id/completion/confirm') @HttpCode(200) confirm(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.s.confirmCompletion(id, uid);
  }

  @Post(':id/completion/concern') @HttpCode(200) concern(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
  ) {
    return this.s.raiseConcern(id, uid);
  }
  
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(cancelSchema)) _b: unknown,
  ) {
    return this.s.cancel(id, uid);
  }
}
