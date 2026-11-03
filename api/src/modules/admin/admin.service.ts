import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { paginate } from '../../common/utils/zod';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { CategoriesService } from '../categories/categories.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel('Report') private reports: Model<any>,
    @InjectModel('Opportunity') private opps: Model<any>,
    @InjectModel('Application') private apps: Model<any>,
    @InjectModel('User') private users: Model<any>,
    @InjectModel('Review') private reviews: Model<any>,
    @InjectModel('Assignment') private assignments: Model<any>,
    @InjectModel('AuditEvent') private events: Model<any>,
    private audit: AuditService,
    private auth: AuthService,
    private categories: CategoriesService,
    private notifications: NotificationsService,
  ) {}

  async listReports(q: { status?: string; page: number; limit: number }) {
    const { skip, limit } = paginate(q);
    const reports = await this.reports
      .find(q.status ? { status: q.status } : {})
      .populate('reporter', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const idsByType = (type: string) =>
      reports
        .filter((r: any) => r.targetType === type)
        .map((r: any) => r.targetId);
    const [opportunities, users] = await Promise.all([
      this.opps
        .find({ _id: { $in: idsByType('opportunity') } })
        .select(
          'title description location compensationType compensationAmount compensationUnit status requester',
        )
        .lean(),
      this.users
        .find({ _id: { $in: idsByType('user') } })
        .select('fullName accountStatus')
        .lean(),
    ]);
    const byId = (rows: any[]) =>
      new Map(rows.map((row) => [row._id.toString(), row]));
    const opportunityById = byId(opportunities);
    const userById = byId(users);

    return reports.map((report: any) => {
      const targetId = report.targetId.toString();
      const target =
        report.targetType === 'opportunity'
          ? opportunityById.get(targetId)
          : userById.get(targetId);
      return { ...report, target };
    });
  }

  async resolveReport(
    id: string,
    adminId: string,
    d: { status: 'under_review' | 'resolved' | 'dismissed'; note: string },
  ) {
    const from = d.status === 'under_review' ? 'open' : 'under_review';
    const fields =
      d.status === 'under_review'
        ? { reviewedBy: adminId, reviewNote: d.note }
        : { resolvedBy: adminId, resolutionNote: d.note };
    const current = await this.reports.findOneAndUpdate(
      { _id: id, status: from },
      { status: d.status, ...fields },
      { new: true },
    );
    if (!current)
      throw new ConflictException(
        'Report not found or is not in a state for this action',
      );
    await this.audit.log(adminId, `report.${d.status}`, 'report', id, {
      reason: d.note,
    });
    this.notifications.notify(
      current.reporter,
      `report.${d.status}`,
      `Your report is ${d.status.replace('_', ' ')}: ${d.note}`,
      'report',
      id,
    );
    return current;
  }

  async getUserModerationDetails(id: string) {
    const user = await this.users
      .findOne({ _id: id, role: 'user' })
      .select('fullName accountStatus accountAppeal createdAt')
      .lean();
    if (!user || Array.isArray(user))
      throw new NotFoundException('User not found');

    const [
      submittedReports,
      reportsAboutUser,
      opportunities,
      assignments,
      reviews,
    ] = await Promise.all([
      this.reports
        .find({ reporter: id })
        .select('targetType targetId category description status createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      this.reports
        .find({ targetType: 'user', targetId: id })
        .populate('reporter', 'fullName')
        .sort({ createdAt: -1 })
        .lean(),
      this.opps
        .find({ requester: id })
        .select(
          'title description location compensationType compensationAmount compensationUnit status createdAt',
        )
        .sort({ createdAt: -1 })
        .lean(),
      this.assignments
        .find({ $or: [{ requester: id }, { provider: id }] })
        .select('opportunity requester provider status updatedAt')
        .populate('opportunity', 'title')
        .populate('requester', 'fullName')
        .populate('provider', 'fullName')
        .sort({ updatedAt: -1 })
        .lean(),
      this.reviews
        .find({ $or: [{ reviewer: id }, { reviewee: id }] })
        .select('reviewer reviewee rating comment moderationStatus createdAt')
        .populate('reviewer', 'fullName')
        .populate('reviewee', 'fullName')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        accountStatus: user.accountStatus,
        accountAppeal: user.accountAppeal,
        createdAt: user.createdAt,
      },
      submittedReports,
      reportsAboutUser,
      opportunities,
      assignments,
      reviews,
    };
  }

  async listOpportunities(q: { status?: string; page: number; limit: number }) {
    const { skip, limit } = paginate(q);
    return this.opps
      .find(q.status ? { status: q.status } : {})
      .select(
        'requester title description location compensationType compensationAmount compensationUnit status createdAt',
      )
      .populate('requester', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async listAssignments(q: { status?: string; page: number; limit: number }) {
    const { skip, limit } = paginate(q);
    return this.assignments
      .find(q.status ? { status: q.status } : {})
      .select('opportunity requester provider status updatedAt')
      .populate('opportunity', 'title')
      .populate('requester', 'fullName')
      .populate('provider', 'fullName')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async listReviews(q: {
    moderationStatus?: string;
    page: number;
    limit: number;
  }) {
    const { skip, limit } = paginate(q);
    return this.reviews
      .find(q.moderationStatus ? { moderationStatus: q.moderationStatus } : {})
      .select('reviewer reviewee rating comment moderationStatus createdAt')
      .populate('reviewer', 'fullName')
      .populate('reviewee', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async removeOpportunity(id: string, adminId: string, reason: string) {
    const o = await this.opps.findOneAndUpdate(
      { _id: id, status: { $ne: 'removed' } },
      { status: 'removed' },
      { new: true },
    );
    if (!o) throw new NotFoundException('Opportunity not found');
    await this.apps.updateMany(
      { opportunity: id, status: 'submitted' },
      { status: 'declined', active: false },
    );
    await this.audit.log(adminId, 'opportunity.removed', 'opportunity', id, {
      reason,
    });
    this.notifications.notify(
      o.requester,
      'moderation.removed',
      `Your listing "${o.title}" was removed: ${reason}`,
      'opportunity',
      id,
    );
    return o;
  }

  async setAccountStatus(
    id: string,
    adminId: string,
    status: 'active' | 'suspended' | 'deactivated',
    reason: string,
  ) {
    const filter: Record<string, unknown> = {
      _id: id,
      role: 'user',
      accountStatus:
        status === 'active'
          ? { $in: ['suspended', 'deactivated'] }
          : { $ne: status },
    };
    const u = await this.users.findOneAndUpdate(
      filter,
      { accountStatus: status },
      { new: true },
    );
    if (!u)
      throw new ConflictException(
        'User not found or account is not eligible for this action',
      );
    if (status !== 'active') await this.auth.revokeAll(id);
    const event =
      status === 'active'
        ? 'user.reactivated'
        : status === 'suspended'
          ? 'user.suspended'
          : 'user.deactivated';
    await this.audit.log(adminId, event, 'user', id, { reason });
    this.notifications.notify(
      id,
      event,
      status === 'active'
        ? `Your account has been reactivated: ${reason}`
        : `Your account has been ${status}: ${reason}`,
      'user',
      id,
    );
    return { id: u.id, fullName: u.fullName, accountStatus: u.accountStatus };
  }

  async hideReview(id: string, adminId: string, reason: string) {
    const r = await this.reviews.findOneAndUpdate(
      { _id: id, moderationStatus: 'visible' },
      { moderationStatus: 'hidden' },
      { new: true },
    );
    if (!r) throw new NotFoundException('Visible review not found');
    await this.audit.log(adminId, 'review.hidden', 'review', id, { reason });
    this.notifications.notify(
      r.reviewee,
      'review.hidden',
      `A review on your profile was hidden: ${reason}`,
      'review',
      id,
    );
    return r;
  }

  async listAppeals(q: { page: number; limit: number }) {
    const { skip, limit } = paginate(q);
    return this.users
      .find({ role: 'user', 'accountAppeal.status': 'pending' })
      .select('fullName accountStatus accountAppeal')
      .sort({ 'accountAppeal.submittedAt': 1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async decideAppeal(
    id: string,
    adminId: string,
    d: { decision: 'reinstate' | 'uphold'; note: string },
  ) {
    const appealStatus = d.decision === 'reinstate' ? 'reinstated' : 'upheld';
    const accountStatus = d.decision === 'reinstate' ? 'active' : undefined;
    const user = await this.users.findOneAndUpdate(
      { _id: id, role: 'user', 'accountAppeal.status': 'pending' },
      {
        $set: {
          'accountAppeal.status': appealStatus,
          'accountAppeal.reviewedBy': adminId,
          'accountAppeal.reviewedAt': new Date(),
          'accountAppeal.decisionNote': d.note,
          ...(accountStatus && { accountStatus }),
        },
      },
      { new: true },
    );
    if (!user) throw new ConflictException('No pending appeal for this user');
    const event = `account_appeal.${d.decision}`;
    await this.audit.log(adminId, event, 'user', id, { reason: d.note });
    this.notifications.notify(
      id,
      event,
      d.decision === 'reinstate'
        ? `Your account appeal was accepted and your account was reactivated: ${d.note}`
        : `Your account appeal was reviewed: ${d.note}`,
      'user',
      id,
    );
    return {
      id: user.id,
      accountStatus: user.accountStatus,
      appealStatus: user.accountAppeal.status,
    };
  }

  async createCategory(adminId: string, name: string) {
    const c = await this.categories.create(name);
    await this.audit.log(adminId, 'category.created', 'category', c._id);
    return c;
  }
  async updateCategory(adminId: string, id: string, d: object) {
    const c = await this.categories.update(id, d);
    await this.audit.log(adminId, 'category.updated', 'category', id, d);
    return c;
  }
  auditEvents(q: { page: number; limit: number }) {
    const { skip, limit } = paginate(q);
    return this.events
      .find()
      .populate('actor', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}
