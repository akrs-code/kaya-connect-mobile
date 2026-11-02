import { Schema } from 'mongoose';
export const ConversationSchema = new Schema(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ],
    application: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      unique: true,
    },
    assignment: { type: Schema.Types.ObjectId, ref: 'Assignment' },
    lastMessageAt: Date,
  },
  { timestamps: true },
);
ConversationSchema.index({ participants: 1 });

export const MessageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 2000, default: '' },
    media: [{ publicId: String }],
    moderationStatus: {
      type: String,
      enum: ['visible', 'hidden'],
      default: 'visible',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
