import UpdatePasswordForm from '@/app/auth/update-password/_components/update-password-form';
import AuthShell from '@/app/auth/_components/auth-shell';

export default function UpdatePasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="Enter a secure password for your Ordlys account."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
