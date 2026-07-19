type Props = {
  label: string;
  value: string;
};

export default function AnswerRow({ label, value }: Props) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-4">
      <p className="text-sm text-default-500">{label}</p>
      <p className="break-words font-medium">{value}</p>
    </div>
  );
}
