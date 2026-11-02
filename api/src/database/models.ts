import { UserSchema } from './schemas/user.schema';
import { ProfileSchema } from './schemas/profile.schema';
import { RefreshTokenSchema } from './schemas/refresh-token.schema';
import { CategorySchema } from './schemas/category.schema';
import { OpportunitySchema } from './schemas/opportunity.schema';
import { ApplicationSchema } from './schemas/application.schema';
import {
  ConversationSchema,
  MessageSchema,
} from './schemas/conversation.schema';
import {
  AgreementEventSchema,
  AssignmentSchema,
} from './schemas/assignment.schema';
import { PaymentSchema } from './schemas/payment.schema';
import { ReviewSchema } from './schemas/review.schema';
import { ReportSchema } from './schemas/report.schema';
import { AuditEventSchema } from './schemas/audit-event.schema';
import { NotificationSchema } from './schemas/notification.schema';

// Inject with @InjectModel('<name>') private x: Model<any>
export const MODELS = [
  { name: 'User', schema: UserSchema },
  { name: 'Profile', schema: ProfileSchema },
  { name: 'RefreshToken', schema: RefreshTokenSchema },
  { name: 'Category', schema: CategorySchema },
  { name: 'Opportunity', schema: OpportunitySchema },
  { name: 'Application', schema: ApplicationSchema },
  { name: 'Conversation', schema: ConversationSchema },
  { name: 'Message', schema: MessageSchema },
  { name: 'Assignment', schema: AssignmentSchema },
  { name: 'AgreementEvent', schema: AgreementEventSchema },
  { name: 'Payment', schema: PaymentSchema },
  { name: 'Review', schema: ReviewSchema },
  { name: 'Report', schema: ReportSchema },
  { name: 'AuditEvent', schema: AuditEventSchema },
  { name: 'Notification', schema: NotificationSchema },
];
