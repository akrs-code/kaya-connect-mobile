import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ObjectIdPipe } from '../../common/pipes/object-id.pipe';
import { ZodPipe } from '../../common/pipes/zod.pipe';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
  adminAssignmentsQuery,
  auditEventsQuery,
  adminOpportunitiesQuery,
  adminReviewsQuery,
  appealDecisionSchema,
  moderationReasonSchema,
  pageQuery,
  reportsQuery,
  resolveSchema,
} from './admin.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@ApiTags('Admin')
@ApiBearerAuth('access-token')
@Roles('admin') // class-level: every route below requires the admin account role
export class AdminController {
  constructor(private s: AdminService) {}

  @Get('reports')
  reports(@Query(new ZodPipe(reportsQuery)) q: any) {
    return this.s.listReports(q);
  }

  @Get('users/:id/moderation')
  userModeration(@Param('id', ObjectIdPipe) id: string) {
    return this.s.getUserModerationDetails(id);
  }

  @Get('opportunities')
  opportunities(@Query(new ZodPipe(adminOpportunitiesQuery)) q: any) {
    return this.s.listOpportunities(q);
  }

  @Get('assignments')
  assignments(@Query(new ZodPipe(adminAssignmentsQuery)) q: any) {
    return this.s.listAssignments(q);
  }

  @Get('reviews')
  reviews(@Query(new ZodPipe(adminReviewsQuery)) q: any) {
    return this.s.listReviews(q);
  }

  @Patch('reports/:id')
  resolve(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(resolveSchema)) b: any,
  ) {
    return this.s.resolveReport(id, uid, b);
  }

  @Patch('opportunities/:id/remove')
  remove(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(moderationReasonSchema)) b: { reason: string },
  ) {
    return this.s.removeOpportunity(id, uid, b.reason);
  }

  @Patch('users/:id/suspend')
  suspend(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(moderationReasonSchema)) b: { reason: string },
  ) {
    return this.s.setAccountStatus(id, uid, 'suspended', b.reason);
  }

  @Patch('users/:id/deactivate')
  deactivate(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(moderationReasonSchema)) b: { reason: string },
  ) {
    return this.s.setAccountStatus(id, uid, 'deactivated', b.reason);
  }

  @Patch('users/:id/reactivate')
  reactivate(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(moderationReasonSchema)) b: { reason: string },
  ) {
    return this.s.setAccountStatus(id, uid, 'active', b.reason);
  }

  @Patch('reviews/:id/hide')
  hide(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(moderationReasonSchema)) b: { reason: string },
  ) {
    return this.s.hideReview(id, uid, b.reason);
  }

  @Get('account-appeals')
  appeals(@Query(new ZodPipe(pageQuery)) q: any) {
    return this.s.listAppeals(q);
  }

  @Patch('users/:id/account-appeal')
  decideAppeal(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(appealDecisionSchema)) b: any,
  ) {
    return this.s.decideAppeal(id, uid, b);
  }

  @Post('categories')
  createCategory(
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(categoryCreateSchema)) b: { name: string },
  ) {
    return this.s.createCategory(uid, b.name);
  }

  @Get('categories')
  categories() {
    return this.s.listCategories();
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id', ObjectIdPipe) id: string,
    @CurrentUser('id') uid: string,
    @Body(new ZodPipe(categoryUpdateSchema)) b: any,
  ) {
    return this.s.updateCategory(uid, id, b);
  }

  @Get('audit-events')
  audit(@Query(new ZodPipe(auditEventsQuery)) q: any) {
    return this.s.auditEvents(q);
  }
}
