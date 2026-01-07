import { FeatureCard } from "@/components/feature-card";
import { LogoCloud } from "@/components/logo-cloud";
import { MetricsSection } from "@/components/metrics-section";
import { PlatformModuleCard } from "@/components/platform-module-card";
import { WorkflowPreview } from "@/components/workflow-preview";
import {
  ClientCreationGraphic,
  JobCreationGraphic,
  CandidateSourcingGraphic,
  ApplicationReviewGraphic,
  InterviewSchedulingGraphic,
  OnboardingGraphic,
} from "@/components/workflow-graphics";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Mail,
  Shield,
  Sparkles,
  Workflow,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  BarChart3,
  Database,
  Building2,
  FileCheck,
  UserPlus,
  Handshake,
} from "lucide-react";
import { Link } from "react-router-dom";

// Import logo images
import openaiLogo from "@/assets/logo/openai.png";
import zoomLogo from "@/assets/logo/zoom.png";
import resendLogo from "@/assets/logo/resend.png";
import herokuLogo from "@/assets/logo/heroku.png";
import cloudinaryLogo from "@/assets/logo/cloudinary.png";
import vercelLogo from "@/assets/logo/vercel.png";

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: "AI Resume Parser",
      description:
        "Extract and validate candidate data automatically with OpenAI-powered intelligent parsing",
    },
    {
      icon: Mail,
      title: "Email Automation",
      description:
        "Send automated interview invites, status updates, and notifications with custom templates via Resend",
    },
    {
      icon: Workflow,
      title: "Multi-Stage Pipeline",
      description:
        "Manage candidates through customizable hiring stages with drag-and-drop workflow automation",
    },
    {
      icon: Shield,
      title: "Role-Based Access",
      description:
        "Enterprise-grade security with granular permissions and comprehensive RBAC system",
    },
  ];

  const platformModules = [
    {
      icon: Database,
      title: "Candidate Database",
      description:
        "Centralized repository for all candidate profiles with advanced search, filtering, and tagging capabilities",
      href: "/dashboard/candidates",
      color: "#3b82f6",
    },
    {
      icon: Briefcase,
      title: "Job Management",
      description:
        "Create, publish, and manage job openings with custom requirements and automated candidate matching",
      href: "/dashboard/jobs",
      color: "#8b5cf6",
    },
    {
      icon: Calendar,
      title: "Interview Scheduling",
      description:
        "Seamless interview coordination with calendar integration, automated reminders, and video conferencing",
      href: "/dashboard/applications",
      color: "#ec4899",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description:
        "Built-in communication tools, role assignments, and feedback collection for hiring teams",
      href: "/dashboard/team",
      color: "#10b981",
    },
    {
      icon: MessageSquare,
      title: "Email Integration",
      description:
        "Two-way email sync, custom templates, and automated communication workflows for candidate engagement",
      href: "/dashboard/messages",
      color: "#f59e0b",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description:
        "Real-time insights on hiring metrics, pipeline health, and team performance with exportable reports",
      href: "/dashboard/analytics",
      color: "#06b6d4",
    },
  ];

  const workflowStages = [
    {
      graphic: ClientCreationGraphic,
      title: "Client Creation",
      description: "Set up client profiles with company details, contact information, and custom requirements",
      highlight: "Foundation for organized multi-client hiring",
      color: "#3b82f6",
    },
    {
      graphic: JobCreationGraphic,
      title: "Job Creation Under Client",
      description: "Define job roles, requirements, and workflows linked directly to specific clients",
      highlight: "Structured hiring with client-specific parameters",
      color: "#8b5cf6",
    },
    {
      graphic: CandidateSourcingGraphic,
      title: "Candidate Sourcing",
      description: "Import resumes via email, upload, or quick-import with AI-powered parsing",
      highlight: "Build talent pool automatically from multiple sources",
      color: "#ec4899",
    },
    {
      graphic: ApplicationReviewGraphic,
      title: "Application Review",
      description: "Screen and evaluate candidates against job criteria with collaborative feedback",
      highlight: "Streamlined shortlisting with team input",
      color: "#f59e0b",
    },
    {
      graphic: InterviewSchedulingGraphic,
      title: "Interview Scheduling",
      description: "Coordinate meetings with calendar sync, automated reminders, and video links",
      highlight: "Seamless scheduling across time zones",
      color: "#10b981",
    },
    {
      graphic: OnboardingGraphic,
      title: "Offer & Onboarding",
      description: "Send offers, track acceptance, and transition candidates to employee status",
      highlight: "Complete the hiring cycle efficiently",
      color: "#06b6d4",
    },
  ];

  const metrics = [
    {
      value: "85%",
      label: "Data Entry Reduction",
      description: "AI extracts candidate info from resumes automatically vs manual typing"
    },
    {
      value: "70%",
      label: "Faster Screening",
      description: "Automated validation detects invalid resumes instantly vs manual review"
    },
    {
      value: "60%",
      label: "Time Saved on Communication",
      description: "Email automation and templates vs writing individual messages"
    },
    {
      value: "3x",
      label: "Pipeline Visibility",
      description: "Real-time stage tracking vs spreadsheet-based manual updates"
    },
  ];

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center relative overflow-hidden bg-background">
      {/* Background Ripple Effect */}
      <div className="absolute inset-0 [--cell-border-color:hsl(var(--primary)/0.3)] [--cell-fill-color:hsl(var(--primary)/0.15)] [--cell-shadow-color:hsl(var(--primary)/0.4)]">
        <BackgroundRippleEffect rows={10} cols={30} cellSize={48} />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-6 py-16 md:px-8 lg:px-12">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/20 border border-accent/30 text-sm text-foreground/80 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Arista Applicant Tracking System</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
            Hire Better,
            <br />
            <span className="text-primary">Faster & Smarter</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Streamline your recruitment process with an intelligent platform
            designed for modern hiring teams
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="group text-base px-8">
              <Link to="/dashboard">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base px-8"
            >
              <Link to="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 max-w-6xl mx-auto border-t border-l">
          {features.map((feature) => (
            <FeatureCard
              className="border-r border-b"
              feature={feature}
              key={feature.title}
            />
          ))}
        </div>

        {/* Platform Modules Section */}
        <div className="mt-32 max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <div className="inline-block">
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-3 relative">
                Complete Recruitment Suite
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-px bg-primary/40"></span>
              </p>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Platform Modules
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto leading-relaxed font-light">
              End-to-end tools for managing your entire hiring workflow, from candidate sourcing to onboarding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformModules.map((module) => (
              <PlatformModuleCard
                key={module.title}
                module={module}
              />
            ))}
          </div>
        </div>

        {/* Workflow Preview Section */}
        <div className="mt-32 max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-px bg-primary/40"></div>
              <p className="text-xs font-medium text-primary tracking-wider uppercase">
                Your Hiring Journey
              </p>
              <div className="w-8 h-px bg-primary/40"></div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Recruitment Workflow
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Seamless candidate journey from initial contact to successful onboarding
            </p>
          </div>

          <WorkflowPreview stages={workflowStages} />
        </div>

        {/* Metrics Section */}
        <MetricsSection metrics={metrics} className="mt-32" />

        {/* Powered By Section */}
        <div className="mt-24 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Powered By
            </h2>
            <p className="text-sm text-muted-foreground">
              Built with industry-leading providers and cloud services
            </p>
          </div>

          <LogoCloud logos={logos} />
        </div>
      </div>
    </div>
  );
}

const logos = [
  {
    src: openaiLogo,
    alt: "OpenAI",
  },
  {
    src: zoomLogo,
    alt: "Zoom",
  },
  {
    src: resendLogo,
    alt: "Resend",
  },
  {
    src: herokuLogo,
    alt: "Heroku",
  },
  {
    src: cloudinaryLogo,
    alt: "Cloudinary",
  },
  {
    src: vercelLogo,
    alt: "Vercel",
  },
];
