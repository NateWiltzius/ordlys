import { Card } from '@heroui/react';

type Props = {
  title: string;
  description: string;
};

export default function FeatureCard({ title, description }: Props) {
  return (
    <Card>
      <Card.Header>
        <h2 className="card__title">{title}</h2>
        <Card.Description>{description}</Card.Description>
      </Card.Header>
    </Card>
  );
}
