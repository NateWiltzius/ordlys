import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Request a secure password reset link for your Ordlys account.',
};

export default function ForgotPasswordLayout({ children }: PropsWithChildren) {
  return children;
}
