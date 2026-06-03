import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISmtpProvider extends Document {
  userId: string;
  name: string;
  preset: "gmail" | "outlook" | "custom";
  host: string;
  port: number;
  secure: boolean;
  username: string;
  passwordCiphertext: string;
  passwordIv: string;
  passwordAuthTag: string;
  fromName: string;
  fromEmail: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SmtpProviderSchema = new Schema<ISmtpProvider>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    preset: { type: String, enum: ["gmail", "outlook", "custom"], required: true },
    host: { type: String, required: true },
    port: { type: Number, required: true },
    secure: { type: Boolean, default: false },
    username: { type: String, required: true },
    passwordCiphertext: { type: String, required: true },
    passwordIv: { type: String, required: true },
    passwordAuthTag: { type: String, required: true },
    fromName: { type: String },
    fromEmail: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SmtpProvider: Model<ISmtpProvider> =
  mongoose.models.SmtpProvider ??
  mongoose.model<ISmtpProvider>("SmtpProvider", SmtpProviderSchema);
