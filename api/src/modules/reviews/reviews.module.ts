import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
@Module({
  imports: [AssignmentsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
