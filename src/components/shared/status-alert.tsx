import { Alert } from '@heroui/react';
import { ReactNode } from 'react';

type Props = {
  status: 'danger' | 'default' | 'success' | 'warning';
  children: ReactNode;
  title?: string;
  className?: string;
};

export default function StatusAlert({ status, children, title, className }: Props) {
  return (
    <Alert status={status} role={status === 'danger' ? 'alert' : 'status'} className={className}>
      <Alert.Indicator />
      <Alert.Content>
        {title ? <Alert.Title>{title}</Alert.Title> : null}
        <Alert.Description>{children}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
