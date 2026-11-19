import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Check,
  Copy,
  Play,
  Plus,
  Save,
  Minus,
  Clock,
  Award,
} from 'lucide-react';
import type {
  LiveQuiz,
  LiveQuizQuestion,
  LiveQuizQuestionType,
  PastelThemeKey,
} from '../../types';
import { PASTEL_THEMES } from '../../constants/theme';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';
import { useApp } from '../../context/AppContext';

interface LiveQuizEditorProps {
  initialQuiz?: LiveQuiz | null;
  onSave: (quiz: LiveQuiz, startHostAfter?: boolean) => void;
  onCancel: () => void;
}

const createEmptyQuestion = (type: LiveQuizQuestionType): LiveQuizQuestion => {
  const id = 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  if (type === 'true_false') {
    return {
      id,
      type: 'true_false',
      prompt: '',
      options: ['Benar', 'Salah'],
      correctOptionIndex: 0,
      timeLimitSec: 20,
      points: 1000,
      explanation: '',
    };
  }
  if (type === 'short_answer') {
    return {
      id,
      type: 'short_answer',
      prompt: '',
      options: [],
      acceptedAnswers: [''],
      timeLimitSec: 30,
      points: 1000,
      explanation: '',
    };
  }
  return {
    id,
    type: 'multiple_choice',
    prompt: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0,
    timeLimitSec: 30,
    points: 1000,
    explanation: '',
  };
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const LiveQuizEditor: React.FC<LiveQuizEditorProps> = ({
  initialQuiz,
  onSave,
  onCancel,
}) => {
  const { triggerToast } = useApp();

  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [subject, setSubject] = useState(initialQuiz?.subject || 'Mathematics');
  const [classCode, setClassCode] = useState(initialQuiz?.classCode || 'Class 302');
  const [description, setDescription] = useState(initialQuiz?.description || '');
  const [theme, setTheme] = useState<PastelThemeKey>(initialQuiz?.theme || 'periwinkle');
  const [questions, setQuestions] = useState<LiveQuizQuestion[]>(() =>
    initialQuiz?.questions && initialQuiz.questions.length > 0
      ? initialQuiz.questions.map((q) => ({
          ...q,
          options: [...q.options],
          acceptedAnswers: q.acceptedAnswers ? [...q.acceptedAnswers] : undefined,
        }))
      : [createEmptyQuestion('multiple_choice')]
  );
  const [selectedIdx, setSelectedIdx] = useState(0);

  const activeQuestion = questions[selectedIdx] || questions[0];

  const updateQuestion = (idx: number, updater: (q: LiveQuizQuestion) => LiveQuizQuestion) => {
    setQuestions((prev) => prev.map((item, i) => (i === idx ? updater(item) : item)));
  };

  const handleAddQuestion = (type: LiveQuizQuestionType) => {
    const newQ = createEmptyQuestion(type);
    setQuestions((prev) => {
      const next = [...prev, newQ];
      setSelectedIdx(next.length - 1);
      return next;
    });
  };

  const handleDuplicateQuestion = (idx: number) => {
    const source = questions[idx];
    if (!source) return;
    const copy: LiveQuizQuestion = {
      ...source,
      id: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      options: [...source.options],
      acceptedAnswers: source.acceptedAnswers ? [...source.acceptedAnswers] : undefined,
    };
    setQuestions((prev) => {
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setSelectedIdx(idx + 1);
  };

  const handleDeleteQuestion = (idx: number) => {
    if (questions.length <= 1) {
      triggerToast('Minimal 1 Soal', 'Kuis harus memiliki setidaknya satu pertanyaan.', 'warning');
      return;
    }
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setSelectedIdx((curr) => Math.max(0, curr >= idx ? curr - 1 : curr));
  };

  const handleMoveQuestion = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= questions.length) return;
    setQuestions((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
    setSelectedIdx(target);
  };

  const handleSwitchType = (nextType: LiveQuizQuestionType) => {
    if (!activeQuestion || activeQuestion.type === nextType) return;
    updateQuestion(selectedIdx, (q) => {
      if (nextType === 'true_false') {
        return {
          ...q,
          type: 'true_false',
          options: ['Benar', 'Salah'],
          correctOptionIndex: 0,
        };
      }
      if (nextType === 'short_answer') {
        return {
          ...q,
          type: 'short_answer',
          options: [],
          acceptedAnswers: q.acceptedAnswers && q.acceptedAnswers.length > 0 ? q.acceptedAnswers : [''],
        };
      }
      return {
        ...q,
        type: 'multiple_choice',
        options:
          q.type === 'multiple_choice' && q.options.length >= 2
            ? q.options
            : ['', '', '', ''],
        correctOptionIndex: 0,
      };
    });
  };

  const validateAndSubmit = (startHostAfter = false) => {
    if (!title.trim()) {
      triggerToast('Judul Kosong', 'Isi judul kuis terlebih dahulu.', 'warning');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setSelectedIdx(i);
        triggerToast('Soal Belum Lengkap', `Pertanyaan #${i + 1} belum memiliki teks soal.`, 'warning');
        return;
      }
      if (q.type === 'multiple_choice') {
        const filledOpts = q.options.map((o) => o.trim());
        if (filledOpts.some((o) => !o)) {
          setSelectedIdx(i);
          triggerToast('Opsi Kosong', `Lengkapi semua opsi jawaban pada soal #${i + 1}.`, 'warning');
          return;
        }
      }
      if (q.type === 'short_answer') {
        const validAnswers = (q.acceptedAnswers || []).map((a) => a.trim()).filter(Boolean);
        if (validAnswers.length === 0) {
          setSelectedIdx(i);
          triggerToast('Kunci Jawaban Kosong', `Tambahkan minimal 1 kunci jawaban untuk soal #${i + 1}.`, 'warning');
          return;
        }
      }
    }

    const sanitizedQuestions: LiveQuizQuestion[] = questions.map((q) => ({
      ...q,
      prompt: q.prompt.trim(),
      options: q.type === 'short_answer' ? [] : q.options.map((o) => o.trim()),
      acceptedAnswers:
        q.type === 'short_answer'
          ? (q.acceptedAnswers || []).map((a) => a.trim()).filter(Boolean)
          : undefined,
      explanation: q.explanation?.trim() || undefined,
    }));

    const payload: LiveQuiz = {
      id: initialQuiz?.id || 'LQ-' + Date.now(),
      title: title.trim(),
      subject: subject.trim() || 'General',
      classCode: classCode.trim() || 'Class 302',
      description: description.trim() || 'Kuis interaktif LiveQuiz.',
      theme,
      createdAt:
        initialQuiz?.createdAt ||
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      questions: sanitizedQuestions,
    };

    onSave(payload, startHostAfter);
  };

  return (
    <div className="space-y-5">
      {/* Editor Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onCancel}
            className="w-9 h-9 rounded-full border border-black/[0.09] hover:bg-[#F4F5F8] flex items-center justify-center text-[#1C1D21] shrink-0 cursor-pointer transition-colors"
            title="Kembali ke Perpustakaan"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-[18px] font-semibold text-[#1C1D21] truncate">
              {initialQuiz ? 'Edit Kuis Custom' : 'Buat Kuis Baru'}
            </h2>
            <p className="text-[12px] text-[#6E717A] tabular-nums">
              {questions.length} Soal · Pilihan Ganda, Benar/Salah, Isian Singkat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => validateAndSubmit(false)}
            className={ACTION_BTN_SECONDARY}
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>Simpan Kuis</span>
          </button>
          <button
            type="button"
            onClick={() => validateAndSubmit(true)}
            className={ACTION_BTN_PRIMARY}
          >
            <Play className="w-4 h-4 shrink-0" />
            <span>Simpan &amp; Host Live</span>
          </button>
        </div>
      </div>

      {/* 2-Column Builder Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left 4 Cols: Metadata + Question Outline */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quiz Metadata */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-4 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8A8D98]">
              Informasi Kuis
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#4B4E57] mb-1">Judul Kuis</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kuis Aljabar Linear Bab 3"
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] text-[13px] outline-none focus:border-[#ee2e65]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12px] font-medium text-[#4B4E57] mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Mathematics"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] text-[13px] outline-none focus:border-[#ee2e65]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#4B4E57] mb-1">Kelas</label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  placeholder="Class 302"
                  className="w-full px-3 py-2 rounded-xl border border-black/[0.1] text-[13px] outline-none focus:border-[#ee2e65]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4B4E57] mb-1">Deskripsi Singkat</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ringkasan materi yang diujikan..."
                className="w-full px-3.5 py-2 rounded-xl border border-black/[0.1] text-[13px] outline-none focus:border-[#ee2e65]"
              />
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#4B4E57] mb-1.5">Tema Kartu</label>
              <div className="flex items-center gap-2">
                {(['periwinkle', 'peach', 'coral', 'mint'] as PastelThemeKey[]).map((key) => {
                  const t = PASTEL_THEMES[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTheme(key)}
                      className={`flex-1 py-1.5 rounded-lg text-[11.5px] font-semibold capitalize border transition-all cursor-pointer ${
                        theme === key
                          ? `${t.header} ${t.text} ${t.border}`
                          : 'bg-[#FAFBFD] text-[#6E717A] border-black/[0.06] hover:bg-gray-100'
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Question List */}
          <div className="bg-white rounded-2xl border border-black/[0.07] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8D98]">
                Daftar Pertanyaan ({questions.length})
              </span>
            </div>

            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isSelected = idx === selectedIdx;
                const typeLabel =
                  q.type === 'multiple_choice'
                    ? 'Pilihan Ganda'
                    : q.type === 'true_false'
                    ? 'Benar/Salah'
                    : 'Isian Singkat';
                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedIdx(idx)}
                    className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#FEF1F5] border-[#FBC2D4]'
                        : 'bg-[#FAFBFD] border-black/[0.05] hover:bg-[#F4F5F8]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6E717A] tabular-nums">
                        <span className={isSelected ? 'text-[#9D113C]' : 'text-[#1C1D21]'}>#{idx + 1}</span>
                        <span>·</span>
                        <span>{typeLabel}</span>
                        <span>·</span>
                        <span>{q.timeLimitSec}s</span>
                      </div>
                      <div className="text-[13px] font-medium text-[#1C1D21] truncate mt-0.5">
                        {q.prompt.trim() || 'Pertanyaan belum diisi...'}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, -1)}
                        disabled={idx === 0}
                        title="Naikkan"
                        className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-[#6E717A] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveQuestion(idx, 1)}
                        disabled={idx === questions.length - 1}
                        title="Turunkan"
                        className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-[#6E717A] disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateQuestion(idx)}
                        title="Duplikasi Soal"
                        className="w-6 h-6 rounded-md hover:bg-white flex items-center justify-center text-[#6E717A] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        title="Hapus Soal"
                        className="w-6 h-6 rounded-md hover:bg-[#FFECEB] flex items-center justify-center text-[#942922] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Buttons */}
            <div className="pt-2 border-t border-black/[0.06] grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_choice')}
                className="flex items-center justify-center gap-1 h-9 px-2.5 rounded-full bg-[#F0EFFC] hover:bg-[#D6D4FF] text-[#3F3B99] text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Pilihan</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('true_false')}
                className="flex items-center justify-center gap-1 h-9 px-2.5 rounded-full bg-[#E6F9F0] hover:bg-[#C4F0DC] text-[#146C43] text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>B / S</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('short_answer')}
                className="flex items-center justify-center gap-1 h-9 px-2.5 rounded-full bg-[#FFF5E6] hover:bg-[#FDE6C4] text-[#8C5811] text-[12px] font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>Isian</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 8 Cols: Active Question Canvas */}
        {activeQuestion && (
          <div className="lg:col-span-8 bg-white rounded-2xl border border-black/[0.07] p-5 sm:p-6 space-y-5">
            {/* Top Settings Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
              <div className="flex items-center gap-1 bg-[#F4F5F8] p-1 rounded-xl">
                {(
                  [
                    { id: 'multiple_choice', label: 'Pilihan Ganda' },
                    { id: 'true_false', label: 'Benar / Salah' },
                    { id: 'short_answer', label: 'Isian Singkat' },
                  ] as Array<{ id: LiveQuizQuestionType; label: string }>
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSwitchType(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      activeQuestion.type === t.id
                        ? 'bg-white text-[#1C1D21] shadow-xs'
                        : 'text-[#6E717A] hover:text-[#1C1D21]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <label className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#4B4E57] bg-[#FAFBFD] border border-black/[0.07] rounded-xl px-3 py-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#6E717A]" />
                  <select
                    value={activeQuestion.timeLimitSec}
                    onChange={(e) =>
                      updateQuestion(selectedIdx, (q) => ({
                        ...q,
                        timeLimitSec: Number(e.target.value),
                      }))
                    }
                    className="bg-transparent outline-none font-semibold text-[#1C1D21] tabular-nums cursor-pointer"
                  >
                    {[10, 15, 20, 30, 45, 60, 90, 120].map((sec) => (
                      <option key={sec} value={sec}>
                        {sec} detik
                      </option>
                    ))}
                  </select>
                </label>

                <label className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#4B4E57] bg-[#FAFBFD] border border-black/[0.07] rounded-xl px-3 py-1.5">
                  <Award className="w-3.5 h-3.5 text-[#ee2e65]" />
                  <select
                    value={activeQuestion.points}
                    onChange={(e) =>
                      updateQuestion(selectedIdx, (q) => ({
                        ...q,
                        points: Number(e.target.value),
                      }))
                    }
                    className="bg-transparent outline-none font-semibold text-[#1C1D21] tabular-nums cursor-pointer"
                  >
                    {[500, 1000, 1200, 1500, 2000].map((pts) => (
                      <option key={pts} value={pts}>
                        {pts} poin
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {/* Prompt Input */}
            <div>
              <label className="block text-[12px] font-semibold text-[#4B4E57] mb-1.5">
                Pertanyaan #{selectedIdx + 1}
              </label>
              <textarea
                rows={3}
                value={activeQuestion.prompt}
                onChange={(e) =>
                  updateQuestion(selectedIdx, (q) => ({ ...q, prompt: e.target.value }))
                }
                placeholder="Tuliskan pertanyaan di sini..."
                className="w-full px-4 py-3 rounded-2xl border border-black/[0.1] bg-[#FAFBFD] focus:bg-white text-[15px] font-medium text-[#1C1D21] outline-none focus:border-[#ee2e65] resize-none transition-colors"
              />
            </div>

            {/* Answer Type Body */}
            {activeQuestion.type === 'multiple_choice' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#4B4E57]">
                    Opsi Jawaban (Klik centang untuk menandai jawaban benar)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeQuestion.options.map((opt, oIdx) => {
                    const isCorrect = activeQuestion.correctOptionIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 ${
                          isCorrect
                            ? 'bg-[#E6F9F0] border-[#A3E4C6]'
                            : 'bg-[#FAFBFD] border-black/[0.08]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(selectedIdx, (q) => ({ ...q, correctOptionIndex: oIdx }))
                          }
                          title="Tandai sebagai jawaban benar"
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0 cursor-pointer transition-colors ${
                            isCorrect
                              ? 'bg-[#146C43] text-white'
                              : 'bg-white border border-black/[0.1] text-[#6E717A] hover:border-[#146C43]'
                          }`}
                        >
                          {isCorrect ? <Check className="w-4 h-4" /> : OPTION_LETTERS[oIdx]}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) =>
                            updateQuestion(selectedIdx, (q) => {
                              const nextOpts = [...q.options];
                              nextOpts[oIdx] = e.target.value;
                              return { ...q, options: nextOpts };
                            })
                          }
                          placeholder={`Opsi ${OPTION_LETTERS[oIdx]}...`}
                          className="w-full bg-transparent text-[13.5px] font-medium text-[#1C1D21] outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeQuestion.type === 'true_false' && (
              <div className="space-y-2.5">
                <span className="block text-[12px] font-semibold text-[#4B4E57]">
                  Pilih Kunci Jawaban Benar atau Salah
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {['Benar', 'Salah'].map((label, oIdx) => {
                    const isCorrect = activeQuestion.correctOptionIndex === oIdx;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          updateQuestion(selectedIdx, (q) => ({ ...q, correctOptionIndex: oIdx }))
                        }
                        className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isCorrect
                            ? 'bg-[#E6F9F0] border-[#146C43] text-[#146C43]'
                            : 'bg-[#FAFBFD] border-black/[0.08] text-[#4B4E57] hover:bg-[#F4F5F8]'
                        }`}
                      >
                        <span className="text-[15px] font-semibold">{label}</span>
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isCorrect ? 'bg-[#146C43] text-white' : 'bg-white border border-black/[0.1]'
                          }`}
                        >
                          {isCorrect && <Check className="w-3.5 h-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeQuestion.type === 'short_answer' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#4B4E57]">
                    Variasi Jawaban Benar (tidak peka huruf besar/kecil)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuestion(selectedIdx, (q) => ({
                        ...q,
                        acceptedAnswers: [...(q.acceptedAnswers || []), ''],
                      }))
                    }
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#ee2e65] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Alternatif</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(activeQuestion.acceptedAnswers || ['']).map((ans, aIdx) => (
                    <div key={aIdx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ans}
                        onChange={(e) =>
                          updateQuestion(selectedIdx, (q) => {
                            const list = [...(q.acceptedAnswers || [''])];
                            list[aIdx] = e.target.value;
                            return { ...q, acceptedAnswers: list };
                          })
                        }
                        placeholder={`Jawaban diterima #${aIdx + 1} (misal: 15 atau Newton)`}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-black/[0.1] bg-[#FAFBFD] focus:bg-white text-[13.5px] outline-none focus:border-[#ee2e65]"
                      />
                      {(activeQuestion.acceptedAnswers?.length || 0) > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            updateQuestion(selectedIdx, (q) => ({
                              ...q,
                              acceptedAnswers: (q.acceptedAnswers || []).filter((_, i) => i !== aIdx),
                            }))
                          }
                          className="w-9 h-9 rounded-xl border border-black/[0.08] hover:bg-[#FFECEB] text-[#942922] flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation Field */}
            <div className="pt-2 border-t border-black/[0.06]">
              <label className="block text-[12px] font-semibold text-[#4B4E57] mb-1.5">
                Pembahasan Singkat (Opsional)
              </label>
              <input
                type="text"
                value={activeQuestion.explanation || ''}
                onChange={(e) =>
                  updateQuestion(selectedIdx, (q) => ({ ...q, explanation: e.target.value }))
                }
                placeholder="Ditampilkan ke peserta setelah menjawab atau setelah ujian selesai..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/[0.09] text-[13px] outline-none focus:border-[#ee2e65]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
