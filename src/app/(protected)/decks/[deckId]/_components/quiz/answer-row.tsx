type Props = {
  label: string;
  value: string;
};

export default function AnswerRow({ label, value }: Props) {
  return (
    <div className="rounded-lg bg-default-100 px-4 py-3">
      <p className="text-sm text-default-500">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
