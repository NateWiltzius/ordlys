import { Card } from '@heroui/react';

type Props = {
  title: string;
  description: string;
};

export default function FeatureCard({ title, description }: Props) {
  return (
    <Card>
      <Card.Header>
        <Card.Title>{title}</Card.Title>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
    </Card>
  );
}
