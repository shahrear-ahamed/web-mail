import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { magicLink } from "better-auth/plugins/magic-link";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined;
}

function getMongoClient(): MongoClient {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(process.env.MONGODB_URI!);
  }
  return global._mongoClient;
}

const magicLinkTransport = nodemailer.createTransport({
  host: process.env.MAGIC_LINK_SMTP_HOST,
  port: Number(process.env.MAGIC_LINK_SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.MAGIC_LINK_SMTP_USER,
    pass: process.env.MAGIC_LINK_SMTP_PASS,
  },
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: mongodbAdapter(getMongoClient().db("web-mail")),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await magicLinkTransport.sendMail({
          from: process.env.MAGIC_LINK_FROM,
          to: email,
          subject: "Sign in to Web Mail",
          html: `<p>Click <a href="${url}">here</a> to sign in. Link expires in 10 minutes.</p>`,
        });
      },
      expiresIn: 600,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
