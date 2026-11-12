import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectConnection() private conn: Connection,
    @InjectModel('Application') private apps: Model<any>,
    @InjectModel('Opportunity') private opps: Model<any>,
    @InjectModel('Assignment') private assignments: Model<any>,
    @InjectModel('Conversation') private conversations: Model<any>,
    @InjectModel('Profile') private profiles: Model<any>,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  async apply(oppId: string, providerId: string, message?: string) {
    const profile: any = await this.profiles.findOne({ user: providerId }).select('intent').lean();
    if (profile?.intent === 'requester')
      throw new ForbiddenException('Poster-only accounts cannot apply for listings');
    const opp = await this.opps.findById(oppId);
    if (!opp || opp.status !== 'published')
      throw new ConflictException('Listing is not open for applications');
    if (opp.requester.toString() === providerId)
      throw new ForbiddenException('You cannot apply to your own listing');
    const app = await this.apps.create({
      opportunity: oppId,
      provider: providerId,
      message,
    }); // duplicate active application -> 409
    await this.conversations.create({
      participants: [opp.requester, providerId],
      application: app.id,
    });
    this.notifications.notify(
      opp.requester,
      'application.new',
      `New application for "${opp.title}"`,
      'application',
      app.id,
    );
    return app;
  }

  async mine(providerId: string) {
    const applications = await this.apps
      .find({ provider: providerId })
      .populate('opportunity', 'title status schedule')
      .sort({ createdAt: -1 })
      .lean();
    const assignments = await this.assignments
      .find({ provider: providerId, application: { $in: applications.map((app: any) => app._id) } })
      .select('application')
      .lean();
    const assignmentByApplication = new Map(
      assignments.map((assignment: any) => [assignment.application.toString(), assignment._id.toString()]),
    );
    return applications.map((application: any) => ({
      ...application,
      assignmentId: assignmentByApplication.get(application._id.toString()),
    }));
  }

  async withdraw(id: string, providerId: string) {
    const app = await this.apps.findOneAndUpdate(
      { _id: id, provider: providerId, status: 'submitted' },
      { status: 'withdrawn', active: false },
      { new: true },
    );
    if (!app)
      throw new ConflictException(
        'Application not found or can no longer be withdrawn',
      );
    return app;
  }

  async listForOpportunity(oppId: string, ownerId: string) {
    if (!(await this.opps.exists({ _id: oppId, requester: ownerId })))
      throw new NotFoundException('Opportunity not found');
    return this.apps
      .find({ opportunity: oppId, status: { $in: ['submitted', 'selected'] } })
      .populate('provider', 'fullName')
      .sort({ createdAt: 1 })
      .lean();
  }

  /** Atomic applicant selection: the transaction + conditional update guarantee exactly one winner. */
  async select(appId: string, ownerId: string) {
    const session = await this.conn.startSession();
    let out: { assignment: any; declined: string[]; title: string };
    try {
      await session.withTransaction(async () => {
        const app = await this.apps.findById(appId).session(session);
        if (!app || app.status !== 'submitted')
          throw new ConflictException('Application is no longer eligible');
        // gate: only succeeds if the listing is still published AND owned by the caller
        const opp = await this.opps.findOneAndUpdate(
          { _id: app.opportunity, requester: ownerId, status: 'published' },
          { status: 'assigned' },
          { new: true, session },
        );
        if (!opp)
          throw new ConflictException(
            'Listing is not open, already filled, or not yours',
          );
        app.status = 'selected';
        await app.save({ session });
        const others = await this.apps
          .find({
            opportunity: app.opportunity,
            _id: { $ne: app._id },
            status: 'submitted',
          })
          .session(session);
        await this.apps.updateMany(
          { _id: { $in: others.map((o) => o._id) } },
          { status: 'declined', active: false },
          { session },
        );
        const [assignment] = await this.assignments.create(
          [
            {
              opportunity: opp._id,
              application: app._id,
              requester: ownerId,
              provider: app.provider,
              agreedDetails: {
                description: opp.description,
                schedule: opp.schedule,
                location: opp.location?.area,
                compensationType: opp.compensationType,
                compensationAmount: opp.compensationAmount,
                compensationUnit: opp.compensationUnit,
              },
            },
          ],
          { session },
        );
        await this.conversations.updateOne(
          { application: app._id },
          { assignment: assignment._id },
          { session },
        );
        await this.audit.log(
          ownerId,
          'applicant.selected',
          'assignment',
          assignment._id,
          { applicationId: app.id },
          session,
        );
        out = {
          assignment,
          declined: others.map((o) => o.provider.toString()),
          title: opp.title,
        };
      });
    } finally {
      await session.endSession();
    }
    this.notifications.notify(
      out.assignment.provider,
      'application.selected',
      `You were selected for "${out.title}"`,
      'assignment',
      out.assignment.id,
    );
    out.declined.forEach((p) =>
      this.notifications.notify(
        p,
        'application.declined',
        `Another applicant was selected for "${out.title}"`,
      ),
    );
    return out.assignment;
  }
}
