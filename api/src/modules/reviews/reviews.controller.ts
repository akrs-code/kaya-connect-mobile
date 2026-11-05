import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { createReviewSchema, CreateReviewDto } from './reviews.dto';
import { ReviewsService } from './reviews.service';

@Controller('assignments')
@ApiTags('Reviews')
@ApiBearerAuth('access-token')
export class ReviewsController {
  constructor(private svc: ReviewsService) {}
  @Post(':id/reviews')
  create(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(createReviewSchema)) b: CreateReviewDto,
  ) {
    return this.svc.create(id, uid, b);
  }
}
