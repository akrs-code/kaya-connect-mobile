import { Schema } from 'mongoose';
import { PAYMENT_STATUS } from '../../common/constants/statuses';
export const PaymentSchema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      unique: true,
    },
    agreedAmount: { type: Number, required: true },
    currency: { type: String, default: 'PHP' },
    requesterDeclaredPaidAt: Date,
    providerConfirmedReceivedAt: Date,
    status: { type: String, enum: PAYMENT_STATUS, required: true },
  },
  { timestamps: true },
);
