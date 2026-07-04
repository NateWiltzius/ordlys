type Props = {
  label: string;
  value: number;
};

export default function SummaryStat({ label, value }: Props) {
  return (
    <div className="rounded-lg bg-default-100 px-3 py-2">
      <p className="text-sm text-default-500">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
