import { Schema } from 'mongoose';
export const ReportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: {
      type: String,
      enum: ['opportunity', 'user'],
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    category: {
      type: String,
      enum: ['inappropriate', 'fraud', 'harassment', 'spam', 'other'],
      required: true,
    },
    description: { type: String, required: true, minlength: 5, maxlength: 500 },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'dismissed'],
      default: 'open',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewNote: String,
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: String,
  },
  { timestamps: true },
);
