import { Schema } from 'mongoose';
import { ROLES } from '../../common/constants/roles';
export const UserSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'deactivated'],
      default: 'active',
    },
    avatarUrl: { type: String },
    avatarPublicId: { type: String },
    accountAppeal: {
      status: { type: String, enum: ['pending', 'upheld', 'reinstated'] },
      reason: { type: String, maxlength: 500 },
      submittedAt: Date,
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      decisionNote: { type: String, maxlength: 300 },
    },
  },
  { timestamps: true },
);
