import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

export interface PasswordResetEmailProps {
  name?: string;
  resetUrl: string;
  appName?: string;
  expiresInMinutes?: number;
}

export default function PasswordResetEmail({
  name = "there",
  resetUrl = "https://example.com/reset",
  appName = "Web Mail",
  expiresInMinutes = 30,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {appName} password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Password Reset</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We received a request to reset the password for your {appName} account. Click the
            button below to choose a new password.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button style={button} href={resetUrl}>
              Reset Password
            </Button>
          </Section>
          <Text style={text}>
            This link expires in {expiresInMinutes} minutes. If you did not request a password
            reset, you can safely ignore this email — your password will not change.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If the button above does not work, copy and paste this URL into your browser:{" "}
            <span style={{ color: "#2563eb" }}>{resetUrl}</span>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  borderRadius: "8px",
  maxWidth: "480px",
};
const h1 = { color: "#1a1a1a", fontSize: "24px", fontWeight: "700", margin: "0 0 24px" };
const text = { color: "#444", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px" };
const button = {
  backgroundColor: "#dc2626",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = { color: "#999", fontSize: "13px", margin: "0" };
