import { Schema } from 'mongoose';
import { ASSIGNMENT_STATUS } from '../../common/constants/statuses';
export const AssignmentSchema = new Schema(
  {
    opportunity: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    agreementVersion: { type: Number, default: 1 },
    agreedDetails: {
      description: String,
      schedule: { start: Date, end: Date },
      location: String,
      compensationType: { type: String, enum: ['paid', 'unpaid'] },
      compensationAmount: Number,
      compensationUnit: { type: String, enum: ['per_task', 'per_hour'] },
    },
    requesterConfirmedAt: { type: Date, default: null },
    providerConfirmedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUS,
      default: 'awaiting_agreement',
    },
    providerReportedCompleteAt: { type: Date, default: null },
    requesterConfirmedCompleteAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
// at most one active assignment per listing
AssignmentSchema.index(
  { opportunity: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);

export const AgreementEventSchema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    version: Number,
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eventType: {
      type: String,
      enum: ['proposed', 'confirmed', 'rejected'],
      required: true,
    },
    agreementSnapshot: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
