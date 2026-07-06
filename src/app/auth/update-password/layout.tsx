import type { Metadata } from 'next';
import type { PropsWithChildren } from 'react';

export const metadata: Metadata = {
  title: 'Choose new password',
  description: 'Choose a new password for your Ordlys account.',
};

export default function UpdatePasswordLayout({ children }: PropsWithChildren) {
  return children;
}
