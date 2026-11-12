import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AllowRestrictedAccount } from '../../common/decorators/allow-restricted-account.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import { pageQuery } from '../../common/utils/zod';
import { ImageUpload } from '../../common/utils/upload';
import { AssignmentsService } from '../assignments/assignments.service';
import { ReviewsService } from '../reviews/reviews.service';
import {
  accountAppealSchema,
  portfolioSchema,
  profileSchema,
  updateMeSchema,
} from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(
    private svc: UsersService,
    private reviews: ReviewsService,
    private assignments: AssignmentsService,
  ) {}

  @Get('me') me(@CurrentUser('id') uid: string) {
    return this.svc.getMe(uid);
  }

  @Post('me/account-appeal')
  @AllowRestrictedAccount()
  appeal(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(accountAppealSchema)) b: { reason: string },
  ) {
    return this.svc.submitAccountAppeal(uid, b.reason);
  }

  @Patch('me') updateMe(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(updateMeSchema)) b: any,
  ) {
    return this.svc.updateMe(uid, b);
  }

  @Put('me/profile') profile(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(profileSchema)) b: any,
  ) {
    return this.svc.upsertProfile(uid, b);
  }

  @Post('me/avatar')
  @UseInterceptors(ImageUpload())
  uploadAvatar(
    @CurrentUser('id') uid: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.uploadAvatar(uid, file);
  }

  @Post('me/portfolio')
  @UseInterceptors(ImageUpload())
  addPortfolio(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(portfolioSchema)) b: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.svc.addPortfolio(uid, b, file);
  }

  @Delete('me/portfolio/:id')
  @HttpCode(204)
  async removePortfolio(
    @CurrentUser('id') uid: string,
    @Param('id', ObjectIdPipe) id: string,
  ) {
    await this.svc.removePortfolio(uid, id);
  }

  @Get(':id/profile') publicProfile(@Param('id', ObjectIdPipe) id: string) {
    return this.svc.getPublicProfile(id);
  }

  @Get(':id/reviews') userReviews(
    @Param('id', ObjectIdPipe) id: string,
    @Query(new ZodPipe(pageQuery)) q: any,
  ) {
    return this.reviews.listForUser(id, q);
  }
  
  @Get(':id/history') history(@Param('id', ObjectIdPipe) id: string) {
    return this.assignments.historyFor(id);
  }
}
