'use client';

import React, { useState } from 'react';
import { FaqsData, FaqItem } from '../lib/content/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { SitePicker } from './SitePicker';

interface FaqEditorProps {
  faqs: FaqsData;
  availableSites: string[];
  currentSlug: string;
  onFaqsChange: (updated: FaqsData) => void;
  onFocusItem: (id: string) => void;
  onCopyToSites: (item: FaqItem, targetSites: string[]) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

interface SortableFaqItemProps {
  item: FaqItem;
  index: number;
  initialIds: Set<string>;
  onUpdate: (updated: FaqItem) => void;
  onDelete: () => void;
  onFocus: () => void;
  onCopyClick: () => void;
}

const SortableFaqItem: React.FC<SortableFaqItemProps> = ({
  item,
  index,
  initialIds,
  onUpdate,
  onDelete,
  onFocus,
  onCopyClick,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id || `faq-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isPublished = initialIds.has(item.id);
  const [renamedWarning, setRenamedWarning] = useState<boolean>(false);

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQ = e.target.value;
    // Auto suggest ID only if new item or empty
    const shouldSuggest = !isPublished && (!item.id || item.id.startsWith('new-faq'));
    const newId = shouldSuggest ? slugify(newQ) || item.id : item.id;
    onUpdate({ ...item, question: newQ, id: newId });
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newId = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (isPublished && newId !== item.id) {
      setRenamedWarning(true);
    }
    onUpdate({ ...item, id: newId });
  };

  const hasHtml = /<[a-z/][\s\S]*?>/i.test(item.answer);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onFocus={onFocus}
      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xs space-y-2 transition-all focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Drag handle */}
        <div className="flex items-center gap-1.5 flex-1">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-400">#{index + 1}</span>
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">id:</span>
            <input
              type="text"
              value={item.id}
              onChange={handleIdChange}
              placeholder="kebab-case-id"
              className="text-xs font-mono px-2 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded w-48 focus:outline-none"
            />
          </div>
        </div>

        {/* Item actions */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={onCopyClick}
            title="Copy this FAQ to other sites"
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Delete this FAQ"
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Warning on rename of published ID */}
      {renamedWarning && (
        <div className="text-[11px] bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 p-1.5 rounded flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>Renaming a published ID breaks existing #anchor links. Proceed with care.</span>
        </div>
      )}

      {/* Question */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] text-slate-500">
          <label>Question</label>
          <span className={item.question.length > 160 ? 'text-red-600 font-bold' : ''}>
            {item.question.length} / 160
          </span>
        </div>
        <input
          type="text"
          value={item.question}
          onChange={handleQuestionChange}
          placeholder="e.g. How does this calculator work?"
          className={`w-full text-xs font-medium px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-md focus:outline-none focus:ring-1 ${
            item.question.length > 160 || !item.question.trim()
              ? 'border-red-400 focus:ring-red-400'
              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
          }`}
        />
      </div>

      {/* Answer */}
      <div className="space-y-1">
        <div className="flex justify-between items-center text-[11px] text-slate-500">
          <label>Answer (Markdown subset: h2-h3, p, lists, bold, links, code)</label>
          <span className={item.answer.length > 2000 ? 'text-red-600 font-bold' : ''}>
            {item.answer.length} / 2000
          </span>
        </div>
        <textarea
          rows={3}
          value={item.answer}
          onChange={(e) => onUpdate({ ...item, answer: e.target.value })}
          placeholder="Markdown answer..."
          className={`w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border rounded-md font-sans focus:outline-none focus:ring-1 resize-y ${
            item.answer.length > 2000 || !item.answer.trim() || hasHtml
              ? 'border-red-400 focus:ring-red-400'
              : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500'
          }`}
        />
        {hasHtml && (
          <div className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>Raw HTML tags are forbidden. Use standard Markdown instead.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const FaqEditor: React.FC<FaqEditorProps> = ({
  faqs,
  availableSites,
  currentSlug,
  onFaqsChange,
  onFocusItem,
  onCopyToSites,
}) => {
  const [initialIds] = useState<Set<string>>(() => new Set(faqs.items.map((i) => i.id)));
  const [copyingItem, setCopyingItem] = useState<FaqItem | null>(null);
  const [selectedCopySites, setSelectedCopySites] = useState<string[]>([]);
  const [isSitePickerOpen, setIsSitePickerOpen] = useState<boolean>(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = faqs.items.findIndex((i) => i.id === active.id);
      const newIndex = faqs.items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onFaqsChange({
          ...faqs,
          items: arrayMove(faqs.items, oldIndex, newIndex),
        });
      }
    }
  };

  const handleAddItem = () => {
    const newItem: FaqItem = {
      id: `faq-${Date.now().toString().slice(-4)}`,
      question: '',
      answer: '',
    };
    onFaqsChange({
      ...faqs,
      items: [...faqs.items, newItem],
    });
    onFocusItem(newItem.id);
  };

  const handleUpdateItem = (index: number, updated: FaqItem) => {
    const next = [...faqs.items];
    next[index] = updated;
    onFaqsChange({ ...faqs, items: next });
  };

  const handleDeleteItem = (index: number) => {
    const next = faqs.items.filter((_, i) => i !== index);
    onFaqsChange({ ...faqs, items: next });
  };

  const startCopy = (item: FaqItem) => {
    setCopyingItem(item);
    // Exclude current slug
    setSelectedCopySites(availableSites.filter((s) => s !== currentSlug));
    setIsSitePickerOpen(true);
  };

  const finishCopy = (targets: string[]) => {
    if (copyingItem && targets.length > 0) {
      onCopyToSites(copyingItem, targets);
    }
    setIsSitePickerOpen(false);
    setCopyingItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Header and Add button */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
          <p className="text-xs text-slate-500">
            {faqs.items.length} item{faqs.items.length !== 1 ? 's' : ''} (ordered by display position)
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          disabled={faqs.items.length >= 40}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add FAQ</span>
        </button>
      </div>

      {/* Dnd Context List */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={faqs.items.map((i, idx) => i.id || `faq-${idx}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5">
            {faqs.items.map((item, index) => (
              <SortableFaqItem
                key={item.id || `faq-${index}`}
                item={item}
                index={index}
                initialIds={initialIds}
                onUpdate={(up) => handleUpdateItem(index, up)}
                onDelete={() => handleDeleteItem(index)}
                onFocus={() => onFocusItem(item.id)}
                onCopyClick={() => startCopy(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Copy to other sites picker */}
      <SitePicker
        isOpen={isSitePickerOpen}
        title={`Copy FAQ "${copyingItem?.question.slice(0, 30) || 'Item'}..." to sites`}
        availableSites={availableSites.filter((s) => s !== currentSlug)}
        selectedSites={selectedCopySites}
        onChange={setSelectedCopySites}
        onClose={() => finishCopy(selectedCopySites)}
      />
    </div>
  );
};

