type Props = {
  label: string;
  value: string | number;
  className?: string;
  valueClassName?: string;
};

export default function StatTile({ label, value, className = '', valueClassName = '' }: Props) {
  return (
    <div className={`rounded-lg border border-transparent bg-default-100 px-3 py-2 ${className}`}>
      <p className="text-sm text-default-500">{label}</p>
      <p className={`text-lg font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}
