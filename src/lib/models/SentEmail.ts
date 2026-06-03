import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISentEmail extends Document {
  userId: string;
  providerId: mongoose.Types.ObjectId;
  providerSnapshot: {
    name: string;
    host: string;
    fromEmail: string;
  };
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  htmlSnapshot: string;
  mode: "richtext" | "template";
  templateId?: string;
  templateProps?: Record<string, unknown>;
  smtpResponse: {
    messageId: string;
    response: string;
    accepted: string[];
    rejected: string[];
    latencyMs: number;
  };
  status: "sent" | "failed";
  errorMessage?: string;
  sentAt: Date;
}

const SentEmailSchema = new Schema<ISentEmail>(
  {
    userId: { type: String, required: true, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: "SmtpProvider", required: true },
    providerSnapshot: {
      name: String,
      host: String,
      fromEmail: String,
    },
    to: [{ type: String }],
    cc: [{ type: String }],
    bcc: [{ type: String }],
    subject: { type: String, required: true },
    htmlSnapshot: { type: String, required: true },
    mode: { type: String, enum: ["richtext", "template"], required: true },
    templateId: String,
    templateProps: { type: Schema.Types.Mixed },
    smtpResponse: {
      messageId: String,
      response: String,
      accepted: [String],
      rejected: [String],
      latencyMs: Number,
    },
    status: { type: String, enum: ["sent", "failed"], required: true },
    errorMessage: String,
    sentAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

SentEmailSchema.index({ userId: 1, sentAt: -1 });

export const SentEmail: Model<ISentEmail> =
  mongoose.models.SentEmail ??
  mongoose.model<ISentEmail>("SentEmail", SentEmailSchema);
