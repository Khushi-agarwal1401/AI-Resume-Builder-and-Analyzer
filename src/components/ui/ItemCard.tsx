import React, { useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  title: string;
  subtitle: string;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

export function ItemCard({
  title,
  subtitle,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
  children,
}: ItemCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md">
      {/* Header */}
      <div 
        className={cn(
          "flex items-center gap-3 p-4 cursor-pointer select-none transition-colors group",
          isOpen ? "bg-gray-50 border-b border-gray-200" : "bg-white hover:bg-gray-50"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-1 shrink-0 text-gray-400">
          <button 
            disabled={isFirst} 
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }} 
            className="hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button 
            disabled={isLast} 
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }} 
            className="hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 truncate text-sm">
            {title || "(Not specified)"}
          </h4>
          <p className="text-xs text-gray-500 truncate">
            {subtitle || " "}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isOpen && (
        <div className="p-5 bg-white animate-slide-up">
          {children}
        </div>
      )}
    </div>
  );
}
