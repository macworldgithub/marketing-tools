'use client';

import React, { useState, useId } from 'react';
import { calculateBMI, BMICategory, BMICalculationResult } from '../engines/bmi';
import { Copy, Check, RotateCcw, Info, AlertTriangle } from 'lucide-react';

interface ToolProps {
  isPreview?: boolean;
}

export const Tool: React.FC<ToolProps> = () => {
  const [unit, setUnit] = useState<'metric' | 'imperial'>('metric');

  // Metric fields
  const [weightKg, setWeightKg] = useState<string>('70');
  const [heightCm, setHeightCm] = useState<string>('175');

  // Imperial fields
  const [weightLb, setWeightLb] = useState<string>('154');
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightInRemainder, setHeightInRemainder] = useState<string>('9');

  // Age (optional)
  const [age, setAge] = useState<string>('28');

  // Copied state
  const [copied, setCopied] = useState<boolean>(false);

  // Field IDs for accessibility
  const weightId = useId();
  const heightId = useId();
  const heightFtId = useId();
  const heightInId = useId();
  const ageId = useId();

  // Perform calculation safely
  let result: BMICalculationResult | null = null;
  let validationError: string | null = null;

  try {
    if (unit === 'metric') {
      if (weightKg && heightCm) {
        result = calculateBMI({
          unit: 'metric',
          weightKg,
          heightCm,
          age: age || undefined,
        });
      }
    } else {
      if (weightLb && (heightFt || heightInRemainder)) {
        result = calculateBMI({
          unit: 'imperial',
          weightLb,
          heightFt,
          heightInRemainder,
          age: age || undefined,
        });
      }
    }
  } catch (err: any) {
    validationError = err.message || 'Please enter valid positive numbers.';
  }

  const handleReset = () => {
    if (unit === 'metric') {
      setWeightKg('');
      setHeightCm('');
    } else {
      setWeightLb('');
      setHeightFt('');
      setHeightInRemainder('');
    }
    setAge('');
    setCopied(false);
  };

  const handleCopy = () => {
    if (!result) return;
    const text = `BMI: ${result.bmi} (${result.category})\nHealthy Weight Range: ${result.healthyWeightMin} - ${result.healthyWeightMax} ${result.healthyWeightUnit}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadgeClass = (category: BMICategory) => {
    switch (category) {
      case 'Normal':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'Underweight':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Overweight':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      default:
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800';
    }
  };

  // Calculate percentage pointer on the gauge (BMI scale 15 to 40)
  const getGaugePercentage = (bmiVal: number) => {
    const minScale = 15;
    const maxScale = 40;
    const clamped = Math.max(minScale, Math.min(maxScale, bmiVal));
    return ((clamped - minScale) / (maxScale - minScale)) * 100;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      {/* Unit Switcher */}
      <div className="flex items-center justify-center mb-8">
        <div className="inline-flex p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setUnit('metric')}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
              unit === 'metric'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Metric (kg, cm)
          </button>
          <button
            type="button"
            onClick={() => setUnit('imperial')}
            className={`px-5 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
              unit === 'imperial'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Imperial (lb, ft/in)
          </button>
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-6">
        {unit === 'metric' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={weightId}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Weight (kg)
              </label>
              <div className="relative">
                <input
                  id={weightId}
                  type="text"
                  inputMode="decimal"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="e.g. 70"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor={heightId}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Height (cm)
              </label>
              <div className="relative">
                <input
                  id={heightId}
                  type="text"
                  inputMode="decimal"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="e.g. 175"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  cm
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor={weightId}
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Weight (pounds)
              </label>
              <div className="relative">
                <input
                  id={weightId}
                  type="text"
                  inputMode="decimal"
                  value={weightLb}
                  onChange={(e) => setWeightLb(e.target.value)}
                  placeholder="e.g. 154"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                  lb
                </span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Height
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    id={heightFtId}
                    type="text"
                    inputMode="numeric"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    placeholder="5"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                    ft
                  </span>
                </div>
                <div className="relative">
                  <input
                    id={heightInId}
                    type="text"
                    inputMode="decimal"
                    value={heightInRemainder}
                    onChange={(e) => setHeightInRemainder(e.target.value)}
                    placeholder="9"
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                    in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optional Age Input */}
        <div>
          <label
            htmlFor={ageId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Age (years, optional)
          </label>
          <div className="relative max-w-xs">
            <input
              id={ageId}
              type="text"
              inputMode="numeric"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Adult categories apply to age 20 and older.
          </p>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-md min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          {result && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary min-h-[44px]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Results</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results Display */}
      {result && !validationError && (
        <div
          aria-live="polite"
          className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6"
        >
          {/* Key Figures */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-lg p-6 text-center space-y-3">
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Calculated Body Mass Index
            </span>
            <div className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              {result.bmi}
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getCategoryBadgeClass(
                  result.category
                )}`}
              >
                {result.category}
              </span>
            </div>
          </div>

          {/* Visual BMI Gauge */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Underweight (&lt;18.5)</span>
              <span>Normal (18.5-24.9)</span>
              <span>Overweight (25-29.9)</span>
              <span>Obese (&ge;30)</span>
            </div>
            <div className="relative h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div className="w-[14%] bg-amber-400" title="Underweight" />
              <div className="w-[26%] bg-emerald-500" title="Normal" />
              <div className="w-[20%] bg-orange-400" title="Overweight" />
              <div className="w-[40%] bg-red-500" title="Obese" />
            </div>
            <div className="relative h-4">
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
                style={{ left: `${getGaugePercentage(result.rawBmi)}%` }}
              >
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-slate-900 dark:border-b-white" />
                <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                  {result.bmi}
                </span>
              </div>
            </div>
          </div>

          {/* Healthy Weight Range */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Info className="w-4 h-4 text-accent-primary shrink-0" />
              <span>Healthy Weight for Your Height:</span>
            </div>
            <div className="font-bold text-slate-900 dark:text-white text-base">
              {result.healthyWeightMin} – {result.healthyWeightMax} {result.healthyWeightUnit}
            </div>
          </div>

          {/* Age < 20 Notice */}
          {result.isUnder20 && (
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg text-blue-900 dark:text-blue-200 text-xs leading-relaxed flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Pediatric Note:</strong> For individuals under 20 years of age, standard adult BMI categories do not apply. Healthcare professionals assess growth and weight using sex-specific BMI-for-age percentiles.
              </span>
            </div>
          )}

          {/* Assumptions & Medical Disclaimer */}
          <div className="space-y-1.5 text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
            <p>
              Calculated using standard WHO adult cutoff criteria (underweight &lt;18.5, normal 18.5–24.9, overweight 25–29.9, obese &ge;30).
            </p>
            <p className="italic">
              Informational disclaimer: This tool provides educational estimates and does not substitute for qualified clinical advice or diagnosis.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
