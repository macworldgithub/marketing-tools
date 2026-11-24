'use client';

import React, { useState } from 'react';
import { calculateGPA, CourseEntry, GradeLetter, CourseLevel } from '../engines/gpa';
import { Plus, Trash2, RotateCcw, Copy, Check } from 'lucide-react';

export const Tool: React.FC = () => {
  const [courses, setCourses] = useState<CourseEntry[]>([
    { id: '1', name: 'English Literature', grade: 'A', credits: 3, level: 'Regular' },
    { id: '2', name: 'Calculus I', grade: 'B+', credits: 4, level: 'Regular' },
    { id: '3', name: 'Chemistry', grade: 'B', credits: 3, level: 'Regular' },
    { id: '4', name: 'World History', grade: 'C', credits: 2, level: 'Regular' },
  ]);

  const [hasCumulative, setHasCumulative] = useState<boolean>(false);
  const [prevGpa, setPrevGpa] = useState<string>('3.40');
  const [prevCredits, setPrevCredits] = useState<string>('60');
  const [copied, setCopied] = useState<boolean>(false);

  const handleReset = () => {
    setCourses([
      { id: '1', name: 'English Literature', grade: 'A', credits: 3, level: 'Regular' },
      { id: '2', name: 'Calculus I', grade: 'B+', credits: 4, level: 'Regular' },
      { id: '3', name: 'Chemistry', grade: 'B', credits: 3, level: 'Regular' },
      { id: '4', name: 'World History', grade: 'C', credits: 2, level: 'Regular' },
    ]);
    setHasCumulative(false);
    setPrevGpa('3.40');
    setPrevCredits('60');
  };

  React.useEffect(() => {
    const handleGlobalRefresh = () => handleReset();
    window.addEventListener('tool:refresh', handleGlobalRefresh);
    return () => window.removeEventListener('tool:refresh', handleGlobalRefresh);
  }, []);

  let result: ReturnType<typeof calculateGPA>;
  try {
    result = calculateGPA(
      courses,
      hasCumulative ? { previousGpa: prevGpa, previousCredits: prevCredits } : undefined
    );
  } catch {
    result = {
      gpa: '0.00',
      rawGpa: 0,
      totalCredits: 0,
      totalQualityPoints: '0.00',
    };
  }

  const addCourse = () => {
    const newId = String(Date.now());
    setCourses([...courses, { id: newId, name: '', grade: 'A', credits: 3, level: 'Regular' }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((c) => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof CourseEntry, value: any) => {
    setCourses(courses.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const handleCopy = () => {
    const text = `Semester GPA: ${result.gpa} (${result.totalCredits} credits)${result.cumulativeGpa ? ` | Cumulative GPA: ${result.cumulativeGpa}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 sm:p-8 max-w-[720px] mx-auto shadow-sm">
      <div className="space-y-4 mb-6">
        <div className="hidden sm:grid grid-cols-12 gap-3 text-xs font-semibold uppercase text-slate-500 px-1">
          <div className="col-span-4">Course</div>
          <div className="col-span-3">Grade</div>
          <div className="col-span-2">Credits</div>
          <div className="col-span-2">Level</div>
          <div className="col-span-1"></div>
        </div>

        {courses.map((course, idx) => (
          <div key={course.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center bg-slate-50 dark:bg-slate-800/40 p-3 sm:p-0 rounded-lg sm:bg-transparent">
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder={`Course ${idx + 1}`}
                value={course.name}
                onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={course.grade}
                onChange={(e) => updateCourse(course.id, 'grade', e.target.value as GradeLetter)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
              >
                {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'P'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <input
                type="number"
                min="0"
                step="1"
                value={course.credits}
                onChange={(e) => updateCourse(course.id, 'credits', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <select
                value={course.level}
                onChange={(e) => updateCourse(course.id, 'level', e.target.value as CourseLevel)}
                className="w-full px-2 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white"
              >
                <option value="Regular">Regular</option>
                <option value="Honors">Honors (+0.5)</option>
                <option value="AP/IB/Dual">AP/IB (+1.0)</option>
              </select>
            </div>

            <div className="sm:col-span-1 flex justify-end">
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                disabled={courses.length <= 1}
                aria-label="Remove course"
                className="p-2 text-slate-400 hover:text-red-500 disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 pb-6 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={addCourse}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px]"
          title="Reset courses to default"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={() => setHasCumulative(!hasCumulative)}
          className="px-3.5 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 min-h-[44px]"
        >
          {hasCumulative ? 'Remove Cumulative' : '+ Include Prior Cumulative GPA'}
        </button>
      </div>

      {hasCumulative && (
        <div className="my-6 p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Previous Cumulative GPA
            </label>
            <input
              type="text"
              value={prevGpa}
              onChange={(e) => setPrevGpa(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Previous Total Credits
            </label>
            <input
              type="number"
              value={prevCredits}
              onChange={(e) => setPrevCredits(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Results Card */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-6 text-center space-y-2">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            Semester Grade Point Average
          </span>
          <div className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            {result.gpa}
          </div>
          <p className="text-xs text-slate-500">
            Total Credits: {result.totalCredits} | Quality Points: {result.totalQualityPoints}
          </p>

          {result.cumulativeGpa && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 uppercase tracking-wider">Overall Cumulative GPA</span>
              <p className="text-2xl font-bold text-accent-primary">{result.cumulativeGpa}</p>
              <span className="text-xs text-slate-400">Over {result.cumulativeTotalCredits} combined credits</span>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy GPA Summary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};