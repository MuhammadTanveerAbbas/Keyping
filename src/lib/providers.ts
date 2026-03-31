export type Provider = {
  id: string;
  name: string;
  docsUrl: string;
  keyPatterns?: RegExp[];
};

export const PROVIDERS: Provider[] = [
  {
    id: "openai",
    name: "OpenAI",
    docsUrl: "https://platform.openai.com/docs/api-reference/authentication",
    keyPatterns: [/^sk-/],
  },
  {
    id: "groq",
    name: "Groq",
    docsUrl: "https://console.groq.com/docs/api-keys",
    keyPatterns: [/^gsk_/],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    docsUrl: "https://docs.anthropic.com/en/api/getting-started",
    keyPatterns: [/^sk-ant-/],
  },
  {
    id: "stripe",
    name: "Stripe",
    docsUrl: "https://docs.stripe.com/keys",
    keyPatterns: [/^sk_live_/, /^sk_test_/, /^rk_live_/, /^rk_test_/],
  },
  {
    id: "github",
    name: "GitHub",
    docsUrl: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    keyPatterns: [/^ghp_/, /^gho_/, /^ghu_/, /^ghs_/, /^ghr_/],
  },
  {
    id: "twitter",
    name: "Twitter/X",
    docsUrl: "https://developer.x.com/en/docs/authentication",
  },
  {
    id: "notion",
    name: "Notion",
    docsUrl: "https://developers.notion.com/docs/authorization",
    keyPatterns: [/^ntn_/, /^secret_/],
  },
  {
    id: "supabase",
    name: "Supabase",
    docsUrl: "https://supabase.com/docs/guides/api/api-keys",
    keyPatterns: [/^eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\./],
  },
  {
    id: "aws",
    name: "AWS",
    docsUrl: "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html",
    keyPatterns: [/^AKIA/, /^ASIA/],
  },
  {
    id: "gemini",
    name: "Gemini",
    docsUrl: "https://ai.google.dev/gemini-api/docs/api-key",
    keyPatterns: [/^AIza/],
  },
  {
    id: "custom",
    name: "Custom/Other",
    docsUrl: "",
  },
];

export function detectProvider(key: string): string | null {
  for (const provider of PROVIDERS) {
    if (provider.keyPatterns) {
      for (const pattern of provider.keyPatterns) {
        if (pattern.test(key)) return provider.id;
      }
    }
  }
  return null;
}
