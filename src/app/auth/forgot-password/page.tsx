import ForgotPasswordForm from '@/app/auth/forgot-password/_components/forgot-password-form';
import AuthShell from '@/app/auth/_components/auth-shell';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      description="We'll email you a secure reset link."
      footer={
        <Link href="/auth/sign-in" className="text-sm font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
