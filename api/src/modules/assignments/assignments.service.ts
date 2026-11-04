import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssignmentStatus } from '../../common/constants/statuses';
import {
  assertCompensation,
  assertSchedule,
} from '../../common/utils/compensation';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { assertTransition } from './state-machine';

type Party = 'requester' | 'provider';
const BOTH: Party[] = ['requester', 'provider'];
const roleOf = (a: any, uid: string): Party =>
  a.requester.toString() === uid ? 'requester' : 'provider';
const other = (a: any, uid: string) =>
  roleOf(a, uid) === 'requester' ? a.provider : a.requester;

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel('Assignment') private assignments: Model<any>,
    @InjectModel('AgreementEvent') private events: Model<any>,
    @InjectModel('Opportunity') private opps: Model<any>,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  /** Participant guard. Non-participants get 404 so they cannot learn the record exists. */
  async load(id: string, uid: string) {
    const a = await this.assignments.findById(id);
    if (!a || ![a.requester.toString(), a.provider.toString()].includes(uid))
      throw new NotFoundException('Assignment not found');
    return a;
  }

  mine(uid: string) {
    return this.assignments
      .find({ $or: [{ requester: uid }, { provider: uid }] })
      .populate('opportunity', 'title')
      .sort({ updatedAt: -1 })
      .lean();
  }
  async getOne(id: string, uid: string) {
    return (await this.load(id, uid)).populate('opportunity', 'title');
  }
  async agreementHistory(id: string, uid: string) {
    await this.load(id, uid);
    return this.events.find({ assignment: id }).sort({ createdAt: 1 }).lean();
  }

  async propose(id: string, uid: string, d: any) {
    const a = await this.load(id, uid);
    if (roleOf(a, uid) !== 'requester')
      throw new ForbiddenException(
        'Only the requester can propose agreement terms',
      );
    if (a.status !== 'awaiting_agreement')
      assertTransition(a.status, 'awaiting_agreement');
    const opp = await this.opps
      .findById(a.opportunity)
      .select('compensationType');
    if (d.compensationType !== opp.compensationType)
      throw new BadRequestException('Compensation type must match the listing');
    assertSchedule(d.schedule);
    assertCompensation(d);
    const u = await this.assignments.findOneAndUpdate(
      {
        _id: id,
        status: { $in: ['awaiting_agreement', 'agreed'] },
        agreementVersion: a.agreementVersion,
      },
      {
        $inc: { agreementVersion: 1 },
        $set: {
          agreedDetails: d,
          status: 'awaiting_agreement',
          requesterConfirmedAt: new Date(),
          providerConfirmedAt: null,
        },
      },
      { new: true },
    );
    if (!u) throw new ConflictException('Agreement can no longer be changed');
    await this.events.create({
      assignment: id,
      version: u.agreementVersion,
      actor: uid,
      eventType: 'proposed',
      agreementSnapshot: d,
    });
    await this.audit.log(uid, 'agreement.proposed', 'assignment', id, {
      version: u.agreementVersion,
    });
    this.notifications.notify(
      u.provider,
      'agreement.proposed',
      'The requester proposed new agreement terms',
      'assignment',
      id,
    );
    return u;
  }

  async accept(id: string, uid: string, version: number) {
    const a = await this.load(id, uid);
    const field =
      roleOf(a, uid) === 'requester'
        ? 'requesterConfirmedAt'
        : 'providerConfirmedAt';
    const u = await this.assignments.findOneAndUpdate(
      {
        _id: id,
        status: 'awaiting_agreement',
        agreementVersion: version,
        [field]: null,
      },
      { [field]: new Date() },
      { new: true },
    );
    if (!u)
      throw new ConflictException(
        'That agreement version is not awaiting your confirmation',
      );
    await this.events.create({
      assignment: id,
      version,
      actor: uid,
      eventType: 'confirmed',
      agreementSnapshot: u.agreedDetails,
    });
    if (u.requesterConfirmedAt && u.providerConfirmedAt) {
      // only the SAME version confirmed by BOTH parties makes the agreement "agreed"
      await this.assignments.updateOne(
        { _id: id, status: 'awaiting_agreement', agreementVersion: version },
        { status: 'agreed' },
      );
      await this.audit.log(uid, 'agreement.confirmed', 'assignment', id, {
        version,
      });
    }
    this.notifications.notify(
      other(a, uid),
      'agreement.accepted',
      'The other party accepted the agreement',
      'assignment',
      id,
    );
    return this.assignments.findById(id);
  }

  async reject(id: string, uid: string, version: number) {
    const a = await this.load(id, uid);
    if (a.status !== 'awaiting_agreement' || a.agreementVersion !== version)
      throw new ConflictException('Nothing to reject for that version');
    await this.events.create({
      assignment: id,
      version,
      actor: uid,
      eventType: 'rejected',
      agreementSnapshot: a.agreedDetails,
    });
    this.notifications.notify(
      other(a, uid),
      'agreement.rejected',
      'The other party rejected the agreement. Please revise the terms.',
      'assignment',
      id,
    );
    return a; // stays unconfirmed
  }

  /** Atomic transition: the current status is part of the filter, so double-clicks and races are harmless. */
  private async transition(
    id: string,
    uid: string,
    from: AssignmentStatus[],
    to: AssignmentStatus,
    roles: Party[],
    extra: object = {},
  ) {
    const a = await this.load(id, uid);
    if (!roles.includes(roleOf(a, uid)))
      throw new ForbiddenException(
        'Not allowed for your role on this assignment',
      );
    if (!from.includes(a.status))
      throw new ConflictException(
        `Not allowed while assignment is ${a.status}`,
      );
    assertTransition(a.status, to);
    const u = await this.assignments.findOneAndUpdate(
      { _id: id, status: a.status },
      { status: to, ...extra },
      { new: true },
    );
    if (!u)
      throw new ConflictException('Assignment status changed, please refresh');
    if (to === 'completed' || to === 'cancelled')
      await this.opps.updateOne({ _id: a.opportunity }, { status: 'closed' });
    await this.audit.log(uid, `assignment.${to}`, 'assignment', id, {
      from: a.status,
    });
    this.notifications.notify(
      other(a, uid),
      `assignment.${to}`,
      `Assignment is now ${to.replace('_', ' ')}`,
      'assignment',
      id,
    );
    return u;
  }
  startWork(id: string, uid: string) {
    return this.transition(id, uid, ['agreed'], 'in_progress', BOTH);
  }
  reportCompletion(id: string, uid: string) {
    return this.transition(
      id,
      uid,
      ['in_progress'],
      'completion_pending',
      ['provider'],
      { providerReportedCompleteAt: new Date() },
    );
  }
  confirmCompletion(id: string, uid: string) {
    return this.transition(
      id,
      uid,
      ['completion_pending'],
      'completed',
      ['requester'],
      { requesterConfirmedCompleteAt: new Date(), isActive: false },
    );
  }
  raiseConcern(id: string, uid: string) {
    return this.transition(
      id,
      uid,
      ['completion_pending'],
      'in_progress',
      ['requester'],
      { providerReportedCompleteAt: null },
    );
  }
  cancel(id: string, uid: string) {
    return this.transition(
      id,
      uid,
      ['awaiting_agreement', 'agreed', 'in_progress', 'completion_pending'],
      'cancelled',
      BOTH,
      { isActive: false },
    );
  }

  /** Public, limited view of a user's finished work (no agreement details or messages). */
  async historyFor(userId: string) {
    const rows = await this.assignments
      .find({
        status: 'completed',
        $or: [{ requester: userId }, { provider: userId }],
      })
      .populate('opportunity', 'title')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    return rows.map((a: any) => ({
      assignmentId: a._id,
      title: a.opportunity?.title,
      role: a.provider.toString() === userId ? 'provider' : 'requester',
      completedAt: a.requesterConfirmedCompleteAt,
    }));
  }
}
