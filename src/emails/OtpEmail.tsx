import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "react-email";

export interface OtpEmailProps {
  otp: string;
  appName?: string;
  expiresInMinutes?: number;
}

export default function OtpEmail({
  otp = "123456",
  appName = "Web Mail",
  expiresInMinutes = 10,
}: OtpEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {appName} verification code: {otp}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>{appName}</Heading>
          <Text style={text}>Your one-time verification code is:</Text>
          <Section style={codeSection}>
            <Text style={code}>{otp}</Text>
          </Section>
          <Text style={text}>
            This code expires in {expiresInMinutes} minutes. Do not share it with anyone.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            If you did not request this code, you can safely ignore this email.
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
const codeSection = {
  backgroundColor: "#f0f4ff",
  borderRadius: "6px",
  margin: "24px 0",
  padding: "16px",
  textAlign: "center" as const,
};
const code = {
  color: "#2563eb",
  fontSize: "36px",
  fontWeight: "700",
  letterSpacing: "8px",
  margin: "0",
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = { color: "#999", fontSize: "13px", margin: "0" };
