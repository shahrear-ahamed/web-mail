import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-auth",
    "@better-auth/mongo-adapter",
    "@better-auth/kysely-adapter",
    "kysely",
    "mongoose",
    "nodemailer",
    "react-email",
    "@react-email/render",
  ],
};

export default nextConfig;
