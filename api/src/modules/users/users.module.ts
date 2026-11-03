import { Module } from '@nestjs/common';
import { AssignmentsModule } from '../assignments/assignments.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
@Module({
  imports: [ReviewsModule, AssignmentsModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
