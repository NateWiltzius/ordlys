import { SignUpForm } from '@/components/auth/sign-up-form';

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <SignUpForm />
      </div>
    </main>
  );
}
