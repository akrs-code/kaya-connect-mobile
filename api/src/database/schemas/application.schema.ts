import { Schema } from 'mongoose';
import { APP_STATUS } from '../../common/constants/statuses';
export const ApplicationSchema = new Schema(
  {
    opportunity: {
      type: Schema.Types.ObjectId,
      ref: 'Opportunity',
      required: true,
    },
    provider: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: { type: String, maxlength: 500 },
    status: { type: String, enum: APP_STATUS, default: 'submitted' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
// duplicate prevention: one ACTIVE application per provider per listing
ApplicationSchema.index(
  { opportunity: 1, provider: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);
