import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Column,
  Section,
  Text,
} from "react-email";

export interface NewsletterEmailProps {
  issueNumber?: number;
  title: string;
  previewText?: string;
  heroImageUrl?: string;
  articles?: Array<{ heading: string; summary: string; ctaUrl: string; ctaLabel?: string }>;
  unsubscribeUrl?: string;
}

export default function NewsletterEmail({
  issueNumber = 1,
  title = "Monthly Newsletter",
  previewText,
  heroImageUrl,
  articles = [
    {
      heading: "Article Heading",
      summary: "A brief summary of the article goes here. Keep it short and compelling.",
      ctaUrl: "https://example.com",
      ctaLabel: "Read more",
    },
  ],
  unsubscribeUrl = "https://example.com/unsubscribe",
}: NewsletterEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText ?? title}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={issueLabel}>Issue #{issueNumber}</Text>
            <Heading style={h1}>{title}</Heading>
          </Section>

          {/* Hero image */}
          {heroImageUrl && (
            <Img
              src={heroImageUrl}
              alt="Newsletter hero"
              width="560"
              style={{ borderRadius: "8px", display: "block", margin: "0 0 24px" }}
            />
          )}

          {/* Articles */}
          {articles.map((article, i) => (
            <Section key={i} style={articleSection}>
              <Heading as="h2" style={h2}>{article.heading}</Heading>
              <Text style={text}>{article.summary}</Text>
              <Button style={button} href={article.ctaUrl}>
                {article.ctaLabel ?? "Read more"}
              </Button>
              {i < articles.length - 1 && <Hr style={hr} />}
            </Section>
          ))}

          {/* Footer */}
          <Hr style={hr} />
          <Row>
            <Column>
              <Text style={footer}>
                You received this email because you subscribed to our newsletter.{" "}
                <a href={unsubscribeUrl} style={{ color: "#2563eb" }}>
                  Unsubscribe
                </a>
              </Text>
            </Column>
          </Row>
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
  maxWidth: "560px",
};
const header = { marginBottom: "24px" };
const issueLabel = { color: "#2563eb", fontSize: "13px", fontWeight: "600", margin: "0 0 8px", textTransform: "uppercase" as const, letterSpacing: "1px" };
const h1 = { color: "#1a1a1a", fontSize: "28px", fontWeight: "700", margin: "0" };
const h2 = { color: "#1a1a1a", fontSize: "18px", fontWeight: "600", margin: "0 0 8px" };
const articleSection = { margin: "0 0 24px" };
const text = { color: "#444", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px" };
const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "10px 22px",
  textDecoration: "none",
};
const hr = { borderColor: "#e4e4e7", margin: "24px 0" };
const footer = { color: "#999", fontSize: "13px", margin: "0" };
