import { Schema } from 'mongoose';
import { OPP_STATUS, OPP_TYPES } from '../../common/constants/statuses';
export const OpportunitySchema = new Schema(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 3000 },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    opportunityType: { type: String, enum: OPP_TYPES, required: true },
    location: {
      area: { type: String, required: true, lowercase: true, trim: true },
      address: String,
    },
    schedule: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    compensationType: {
      type: String,
      enum: ['paid', 'unpaid'],
      required: true,
    },
    compensationAmount: { type: Number, min: 0 },
    compensationUnit: { type: String, enum: ['per_task', 'per_hour'] },
    qualifications: [{ type: String, lowercase: true, trim: true }],
    status: { type: String, enum: OPP_STATUS, default: 'draft', index: true },
  },
  { timestamps: true },
);
OpportunitySchema.index({ title: 'text', description: 'text' });
