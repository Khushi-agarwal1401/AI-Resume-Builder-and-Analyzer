"use client";

import { FilePlus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";

import { ItemCard } from "@/components/ui/ItemCard";
import type { CustomSectionItem } from "@/types/resume";
import { generateId } from "@/lib/utils";

interface Props {
  data: CustomSectionItem[];
  title: string;
  onChange: (data: CustomSectionItem[]) => void;
  onChangeTitle: (title: string) => void;
  /** Removes the whole custom section (K-04). Called by the builder page. */
  onDeleteSection?: () => void;
}

export function CustomSectionEditor({ data, title, onChange, onChangeTitle, onDeleteSection }: Props) {
  function add() {
    onChange([
      {
        id: generateId(),
        title: "",
        subtitle: "",
        date: "",
        description: "",
      },
      ...data,
    ]);
  }

  function remove(id: string) {
    onChange(data.filter((e) => e.id !== id));
  }

  function update(id: string, field: keyof CustomSectionItem, value: string) {
    onChange(data.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function move(idx: number, direction: -1 | 1) {
    const newData = [...data];
    const temp = newData[idx];
    newData[idx] = newData[idx + direction];
    newData[idx + direction] = temp;
    onChange(newData);
  }

  return (
    <div className="mb-6 bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/60 dark:to-gray-900">
        <div className="flex items-center gap-3 text-gray-900 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 shadow-sm">
            <FilePlus className="w-5 h-5" />
          </div>
          <input
            aria-label="Custom section name"
            className="font-bold text-lg bg-transparent border-none outline-none focus:ring-2 focus:ring-primary-500 rounded px-1 -ml-1 w-full max-w-[250px]"
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Custom Section Name"
          />
        </div>
        <div className="flex items-center gap-1">
          {onDeleteSection && (
            <button
              onClick={onDeleteSection}
              aria-label={`Delete ${title || "custom"} section`}
              title="Delete this section"
              className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 h-9 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={add}
            className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-4 h-9 rounded-xl transition-colors"
          >
            <FilePlus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
      <div className="p-5">
        {data.length === 0 && (
          <p className="text-sm text-gray-500 italic text-center py-4">No custom items added yet.</p>
        )}
        <div className="flex flex-col gap-3">
          {data.map((item, idx) => (
            <ItemCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle ? `${item.subtitle} | ${item.date}` : ""}
              isFirst={idx === 0}
              isLast={idx === data.length - 1}
              onMoveUp={() => move(idx, -1)}
              onMoveDown={() => move(idx, 1)}
              onDelete={() => remove(item.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Title" value={item.title} onChange={(e) => update(item.id, "title", e.target.value)} />
                <Input label="Subtitle" value={item.subtitle} onChange={(e) => update(item.id, "subtitle", e.target.value)} />
                <Input label="Date" value={item.date} onChange={(e) => update(item.id, "date", e.target.value)} />
              </div>
              <div className="mt-4">
                <label htmlFor={`custom-desc-${item.id}`} className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  id={`custom-desc-${item.id}`}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 min-h-[80px] transition-all"
                  value={item.description}
                  onChange={(e) => update(item.id, "description", e.target.value)}
                  placeholder="Describe this item..."
                />
              </div>
            </ItemCard>
          ))}
        </div>
      </div>
    </div>
  );
}
