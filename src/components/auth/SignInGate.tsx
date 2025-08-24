import Auth from "@/components/Auth";
import { UsersIcon } from "@/components/icons/UsersIcon";

export function SignInGate() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow-sm mt-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="mb-6 rounded-full bg-blue-50 p-6 flex items-center justify-center">
          <UsersIcon width={32} height={32} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Sign in to access Practice Tests
        </h2>
        <p className="text-gray-600 mb-6">
          Our AI-powered practice tests are personalized to your skill level and
          help you improve gradually.
        </p>
        <div className="w-full max-w-sm">
          <Auth buttonStyle="practice" />
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Don&apos;t have an account? Sign up for free by clicking the button
          above.
        </p>
      </div>
    </div>
  );
}
