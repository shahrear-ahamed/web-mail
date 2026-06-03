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

export interface WelcomeEmailProps {
  name: string;
  appName?: string;
  ctaUrl?: string;
}

export default function WelcomeEmail({
  name = "there",
  appName = "Web Mail",
  ctaUrl = "https://example.com",
}: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {appName}, {name}!</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Welcome to {appName}</Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            We&apos;re thrilled to have you on board. {appName} lets you test SMTP providers,
            compose and send emails, and preview beautiful email templates — all in one place.
          </Text>
          <Section style={{ textAlign: "center", margin: "32px 0" }}>
            <Button style={button} href={ctaUrl}>
              Get Started
            </Button>
          </Section>
          <Text style={text}>
            If you have any questions, simply reply to this email — we&apos;re always happy to help.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            You received this email because you signed up for {appName}.
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
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = { color: "#999", fontSize: "13px", margin: "0" };
