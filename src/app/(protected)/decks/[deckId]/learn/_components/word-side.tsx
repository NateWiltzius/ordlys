type Props = {
  label: string;
  value: string;
  reading?: string | null;
};

export default function WordSide({ label, value, reading }: Props) {
  return (
    <div className="rounded-lg bg-default-100 px-4 py-5">
      <p className="text-xs font-medium uppercase tracking-wide text-default-500">{label}</p>
      <p className="mt-1 break-words text-xl font-semibold">{value}</p>
      {reading ? <p className="mt-1 break-words text-sm text-default-500">{reading}</p> : null}
    </div>
  );
}
