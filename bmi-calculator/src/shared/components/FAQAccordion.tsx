// GENERATED from _template — do not edit here
'use client';

import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { FAQItem } from '../content/types';
import { MarkdownContent } from './MarkdownContent';

interface FAQAccordionProps {
  items: FAQItem[];
  highlightId?: string;
  answersHtml?: Record<string, string>;
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({
  items,
  highlightId,
  answersHtml = {},
}) => {
  return (
    <Accordion.Root type="multiple" className="w-full space-y-3">
      {items.map((item) => {
        const isHighlighted = highlightId === item.id;
        const html = answersHtml[item.id] || `<p>${item.answer}</p>`;

        return (
          <Accordion.Item
            key={item.id}
            value={item.id}
            id={item.id}
            className={`border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900 transition-all ${
              isHighlighted ? 'ring-2 ring-accent-primary ring-offset-2' : ''
            }`}
          >
            <Accordion.Header className="flex">
              <Accordion.Trigger className="group flex flex-1 items-center justify-between px-5 py-4 text-left font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]">
                <span className="text-base sm:text-lg pr-4">{item.question}</span>
                <ChevronDown className="w-5 h-5 shrink-0 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-5 pb-5 pt-1 text-slate-600 dark:text-slate-300 text-sm sm:text-base border-t border-slate-100 dark:border-slate-800/60 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <MarkdownContent html={html} />
            </Accordion.Content>
          </Accordion.Item>
        );
      })}
    </Accordion.Root>
  );
};

