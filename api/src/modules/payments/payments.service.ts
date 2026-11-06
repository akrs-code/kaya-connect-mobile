import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AssignmentsService } from '../assignments/assignments.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Payment') private payments: Model<any>,
    private assignments: AssignmentsService,
    private audit: AuditService,
    private notifications: NotificationsService,
  ) {}

  private async paidAssignment(id: string, uid: string) {
    const a = await this.assignments.load(id, uid);
    if (a.agreedDetails?.compensationType !== 'paid')
      throw new ConflictException(
        'Payment acknowledgment applies only to paid assignments',
      );
    if (!['in_progress', 'completion_pending', 'completed'].includes(a.status))
      throw new ConflictException('Assignment is not at a payable stage');
    return a;
  }

  async get(id: string, uid: string) {
    await this.assignments.load(id, uid);
    return this.payments.findOne({ assignment: id }).lean();
  }

  async declare(id: string, uid: string) {
    const a = await this.paidAssignment(id, uid);
    if (a.requester.toString() !== uid)
      throw new ForbiddenException('Only the requester can declare payment');
    if (await this.payments.exists({ assignment: id }))
      throw new ConflictException('Payment was already declared');
    const p = await this.payments.create({
      assignment: id,
      agreedAmount: a.agreedDetails.compensationAmount,
      requesterDeclaredPaidAt: new Date(),
      status: 'requester_declared_paid',
    });
    await this.audit.log(uid, 'payment.declared', 'assignment', id);
    this.notifications.notify(
      a.provider,
      'payment.declared',
      'The requester says payment was made. Please confirm if you received it.',
      'assignment',
      id,
    );
    return p; // a requester declaration alone is never shown as mutually acknowledged
  }

  async confirm(id: string, uid: string) {
    const a = await this.paidAssignment(id, uid);
    if (a.provider.toString() !== uid)
      throw new ForbiddenException('Only the provider can confirm receipt');
    const p = await this.payments.findOneAndUpdate(
      { assignment: id, status: 'requester_declared_paid' },
      {
        status: 'mutually_acknowledged',
        providerConfirmedReceivedAt: new Date(),
      },
      { new: true },
    );
    if (!p)
      throw new ConflictException('No pending payment declaration to confirm');
    await this.audit.log(uid, 'payment.confirmed', 'assignment', id);
    this.notifications.notify(
      a.requester,
      'payment.confirmed',
      'The provider confirmed receipt',
      'assignment',
      id,
    );
    return p;
  }
}
