interface Props {
  title: string;
  count?: number;
}

export function SectionHeader({ title, count }: Props) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b mb-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {count !== undefined && (
        <span className="text-sm text-gray-500">({count})</span>
      )}
    </div>
  );
}
