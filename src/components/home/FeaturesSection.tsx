"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Shield, BookOpen, Bell } from "lucide-react";

/**
 * Features section with authentication-aware links
 */
export function FeaturesSection() {
  const { user } = useAuth();

  return (
    <section id="features" className="w-full py-16 md:py-24 bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Everything you need to accelerate your learning
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Shield className="w-7 h-7 text-primary" />}
            iconBg="bg-muted"
            title="Practice Tests"
            description="Realistic practice tests with detailed explanations to help you prepare"
            linkHref="/practice"
            linkText="Try it now →"
            linkColor="text-primary hover:opacity-90"
            showLink={!user}
          />
          <FeatureCard
            icon={<BookOpen className="w-7 h-7 text-primary" />}
            iconBg="bg-muted"
            title="Flashcards"
            description="Create and study with interactive flashcards for effective memorization"
            linkHref="/flashcards"
            linkText="Try it now →"
            linkColor="text-primary hover:opacity-90"
            showLink={!user}
          />
          <FeatureCard
            icon={<Bell className="w-7 h-7 text-primary" />}
            iconBg="bg-muted"
            title="Quizzes"
            description="Quick quizzes to test your knowledge and identify areas for improvement"
            linkHref="/quizzes"
            linkText="Try it now →"
            linkColor="text-primary hover:opacity-90"
            showLink={!user}
          />
        </div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
  linkColor: string;
  showLink: boolean;
}

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  linkHref,
  linkText,
  linkColor,
  showLink,
}: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center p-6 bg-card text-card-foreground rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBg} mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-center">{description}</p>
      {showLink && (
        <Link
          href={linkHref}
          className={`mt-4 ${linkColor} text-sm font-medium`}
        >
          {linkText}
        </Link>
      )}
    </div>
  );
}
