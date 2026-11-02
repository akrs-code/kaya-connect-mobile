import { Schema } from 'mongoose';
export const CategorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 60,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
