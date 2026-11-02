import { Schema } from 'mongoose';
export const ReviewSchema = new Schema(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 500 },
    moderationStatus: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
ReviewSchema.index(
  { assignment: 1, reviewer: 1, reviewee: 1 },
  { unique: true },
);
