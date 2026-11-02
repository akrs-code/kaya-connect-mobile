import { Schema } from 'mongoose';
export const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: { type: String, required: true },
    message: { type: String, required: true },
    refType: String,
    refId: Schema.Types.ObjectId,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);
