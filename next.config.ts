import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "better-auth",
    "@better-auth/mongo-adapter",
    "mongoose",
    "nodemailer",
    "react-email",
    "@react-email/render",
  ],
};

export default nextConfig;
