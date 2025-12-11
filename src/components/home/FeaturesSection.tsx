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
    <section id="features" className="w-full py-16 md:py-24 bg-white">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Features
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl">
            Everything you need to accelerate your learning
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Shield className="w-7 h-7 text-blue-600" />}
            iconBg="bg-blue-50"
            title="Practice Tests"
            description="Realistic practice tests with detailed explanations to help you prepare"
            linkHref="/practice"
            linkText="Try it now →"
            linkColor="text-blue-600 hover:text-blue-800"
            showLink={!user}
          />
          <FeatureCard
            icon={<BookOpen className="w-7 h-7 text-purple-600" />}
            iconBg="bg-purple-50"
            title="Flashcards"
            description="Create and study with interactive flashcards for effective memorization"
            linkHref="/flashcards"
            linkText="Try it now →"
            linkColor="text-purple-600 hover:text-purple-800"
            showLink={!user}
          />
          <FeatureCard
            icon={<Bell className="w-7 h-7 text-green-600" />}
            iconBg="bg-green-50"
            title="Quizzes"
            description="Quick quizzes to test your knowledge and identify areas for improvement"
            linkHref="/quizzes"
            linkText="Try it now →"
            linkColor="text-green-600 hover:text-green-800"
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
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBg} mb-4`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600 text-center">{description}</p>
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
