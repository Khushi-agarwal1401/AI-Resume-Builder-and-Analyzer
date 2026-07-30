import React from "react";
import { Plus } from "lucide-react";
import { Button } from "./Button";

interface SectionCardProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onAdd?: () => void;
  children: React.ReactNode;
}

export function SectionCard({ id, title, icon: Icon, onAdd, children }: SectionCardProps) {
  return (
    <div id={id} className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3 text-gray-900">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-600 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        {onAdd && (
          <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50">
            <Plus className="w-4 h-4" /> Add
          </Button>
        )}
      </div>
      <div className="p-5 space-y-4">
        {children}
      </div>
    </div>
  );
}
