import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { createReportSchema, CreateReportDto } from './reports.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@ApiTags('Reports')
@ApiBearerAuth('access-token')
export class ReportsController {
  constructor(private svc: ReportsService) {}
  @Post() create(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(createReportSchema)) b: CreateReportDto,
  ) {
    return this.svc.create(uid, b);
  }
}
