import UpdatePasswordForm from '@/app/auth/update-password/_components/update-password-form';
import SemanticCardTitle from '@/components/shared/semantic-card-title';
import { Card } from '@heroui/react';

export default function UpdatePasswordPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6">
      <Card className="w-full max-w-md overflow-hidden">
        <Card.Header className="space-y-1 border-b border-default-200 bg-default-50 px-6 py-5">
          <SemanticCardTitle level={1} className="text-2xl">
            Choose a new password
          </SemanticCardTitle>
          <Card.Description>Enter a secure password for your Ordlys account.</Card.Description>
        </Card.Header>
        <Card.Content className="px-6 py-6">
          <UpdatePasswordForm />
        </Card.Content>
      </Card>
    </div>
  );
}
