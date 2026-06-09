export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type GrowthScore = {
  score: number;
  explanation: string;
  improvementAreas: string[];
};

export type WeeklyAction = {
  title: string;
  priority: "low" | "medium" | "high";
  impact: string;
  reason: string;
  steps: string[];
};

export type GeneratedContent = {
  type: "facebook_post" | "instagram_post" | "email" | "newsletter";
  title: string;
  body: string;
};

export type UserRole = "user" | "admin";
export type SubscriptionPlan = "starter" | "pro";
export type ActionPriority = "low" | "medium" | "high";
export type ContentType = "facebook_post" | "instagram_post" | "email" | "newsletter";
export type NotificationChannel = "app" | "email";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  trial_ends_at: string;
  created_at: string;
  updated_at: string;
};

export type Business = {
  id: string;
  user_id: string;
  name: string;
  sector: string;
  city: string;
  main_offer: string;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  google_business_url: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Competitor = {
  id: string;
  business_id: string;
  name: string;
  website_url: string | null;
  created_at: string;
};

export type WeeklyReport = {
  id: string;
  business_id: string;
  week_starts_on: string;
  growth_score: number;
  score_explanation: string;
  arthur_summary: string;
  opportunities: Json[];
  email_sent_at: string | null;
  created_at: string;
};

export type Action = {
  id: string;
  weekly_report_id: string;
  title: string;
  priority: ActionPriority;
  impact: string;
  reason: string;
  steps: string[];
  completed_at: string | null;
  created_at: string;
};

export type ContentPiece = {
  id: string;
  business_id: string;
  weekly_report_id: string | null;
  type: ContentType;
  title: string;
  body: string;
  saved_at: string | null;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  weekly_report_id: string | null;
  channel: NotificationChannel;
  subject: string;
  body: string;
  provider_message_id: string | null;
  metadata: Json;
  opened_at: string | null;
  created_at: string;
};
