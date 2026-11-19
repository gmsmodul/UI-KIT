import React, { useMemo, useRef, useState } from 'react';
import {
  X,
  UploadCloud,
  CheckCircle2,
  FileUp,
  FolderOpen,
  LayoutGrid,
  Search,
  FileText,
  Presentation,
  Video,
  FlaskConical,
  BookOpen,
  Check,
  Minus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  getAvailableClassOptions,
  inferGradeForClassKey,
  normalizeClassKey,
  resolveSubjectForClassKey,
} from '../../utils/scheduleSubjects';
import { ClassMaterial, PageId, PastelThemeKey } from '../../types';
import { CustomSelect } from '../ui/CustomSelect';
import { useBottomSheetMotion } from '../../hooks/useBottomSheetMotion';
import { ACTION_BTN_PRIMARY, ACTION_BTN_SECONDARY } from '../../constants/buttonStyles';

type ResourceSourceMode = 'upload' | 'existing_media' | 'app_page';
type AppSourcePageFilter = 'all' | 'prep' | 'assignments' | 'livequiz' | 'exams' | 'reports';

interface ExistingMediaOption {
  key: string;
  title: string;
  originLabel: string;
  type: ClassMaterial['type'];
  fileFormat: ClassMaterial['fileFormat'];
  fileSize: string;
  classCode: string;
  subject: string;
  unitName: string;
  description: string;
  duration?: string;
  durationSeconds?: number;
  tags?: string[];
  theme?: PastelThemeKey;
  uploadedFileName?: string;
  uploadedFileDataUrl?: string;
}

interface AppPageResourceOption {
  key: string;
  refId: string;
  pageId: PageId;
  pageLabel: string;
  title: string;
  subtitle: string;
  classCode: string;
  subject: string;
  unitName: string;
  description: string;
  suggestedType: ClassMaterial['type'];
  tags: string[];
  theme?: PastelThemeKey;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferFormatAndTypeFromFileName(fileName: string): {
  fileFormat: ClassMaterial['fileFormat'];
  suggestedType?: ClassMaterial['type'];
} {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'mp4' || ext === 'webm' || ext === 'mov' || ext === 'mkv') {
    return { fileFormat: 'MP4', suggestedType: 'video' };
  }
  if (ext === 'ppt' || ext === 'pptx') {
    return { fileFormat: 'PPTX', suggestedType: 'slides' };
  }
  if (ext === 'doc' || ext === 'docx') {
    return { fileFormat: 'DOCX', suggestedType: 'document' };
  }
  if (ext === 'zip' || ext === 'rar') {
    return { fileFormat: 'ZIP', suggestedType: 'document' };
  }
  return { fileFormat: 'PDF', suggestedType: ext === 'pdf' ? 'document' : undefined };
}

function inferDefaultFormatForType(type: ClassMaterial['type']): ClassMaterial['fileFormat'] {
  if (type === 'video') return 'MP4';
  if (type === 'slides') return 'PPTX';
  return 'PDF';
}

function stripExtension(name: string): string {
  return name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
}

export const UploadMaterialModal: React.FC = () => {
  const {
    schedules,
    materialsList,
    lessonPlans,
    assignments,
    liveQuizzes,
    exams,
    reportsList,
    isUploadMaterialOpen,
    setIsUploadMaterialOpen,
    handleUploadMaterial,
  } = useApp();

  const classOptions = useMemo(
    () => [...getAvailableClassOptions(schedules.map((s) => s.classCode)), 'All Classes'],
    [schedules]
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [classCode, setClassCode] = useState('Class 302');
  const [grade, setGrade] = useState('Grade 12');
  const [type, setType] = useState<ClassMaterial['type']>('document');
  const [unitName, setUnitName] = useState('Unit 4: Advanced Differentiation');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('Calculus, Revision, Worksheet');
  const [theme, setTheme] = useState<PastelThemeKey>('periwinkle');

  // Resource source state
  const [sourceMode, setSourceMode] = useState<ResourceSourceMode>('upload');
  const [uploadedFileMeta, setUploadedFileMeta] = useState<{
    name: string;
    sizeLabel: string;
    fileFormat: ClassMaterial['fileFormat'];
    dataUrl?: string;
  } | null>(null);

  const [mediaSearch, setMediaSearch] = useState('');
  const [matchSelectedTypeOnly, setMatchSelectedTypeOnly] = useState(false);
  const [selectedExistingKey, setSelectedExistingKey] = useState<string | null>(null);

  const [appPageFilter, setAppPageFilter] = useState<AppSourcePageFilter>('all');
  const [appPageSearch, setAppPageSearch] = useState('');
  const [selectedAppPageKey, setSelectedAppPageKey] = useState<string | null>(null);

  // Build existing media catalog (Materials Library + Class Prep attachments)
  const existingMediaOptions = useMemo<ExistingMediaOption[]>(() => {
    const fromMaterials: ExistingMediaOption[] = materialsList.map((mat) => ({
      key: `mat:${mat.id}`,
      title: mat.title,
      originLabel: 'Materials Library',
      type: mat.type,
      fileFormat: mat.fileFormat,
      fileSize: mat.fileSize,
      classCode: normalizeClassKey(mat.classCode),
      subject: mat.subject,
      unitName: mat.unitName,
      description: mat.description,
      duration: mat.duration,
      durationSeconds: mat.durationSeconds,
      tags: mat.tags,
      theme: mat.theme,
      uploadedFileName: mat.uploadedFileName,
      uploadedFileDataUrl: mat.uploadedFileDataUrl,
    }));

    const fromLessonPlans: ExistingMediaOption[] = [];
    lessonPlans.forEach((plan) => {
      plan.materials.forEach((att, idx) => {
        const lowerType = att.type.toLowerCase();
        const inferredType: ClassMaterial['type'] =
          lowerType === 'video'
            ? 'video'
            : lowerType === 'img'
            ? 'slides'
            : 'document';
        const inferredFormat: ClassMaterial['fileFormat'] =
          lowerType === 'video'
            ? 'MP4'
            : lowerType === 'doc'
            ? 'DOCX'
            : 'PDF';

        fromLessonPlans.push({
          key: `lp:${plan.id}:${idx}`,
          title: att.name,
          originLabel: `Class Prep · ${plan.classCode}`,
          type: inferredType,
          fileFormat: inferredFormat,
          fileSize: att.size,
          classCode: normalizeClassKey(plan.classCode),
          subject: plan.subject.split('·')[0]?.trim() || 'General',
          unitName: plan.topic,
          description: `Lampiran materi dari rencana pembelajaran "${plan.topic}" (${plan.date}).`,
          tags: [plan.classCode, 'Class Prep', att.type],
          theme: plan.theme,
        });
      });
    });

    return [...fromMaterials, ...fromLessonPlans];
  }, [materialsList, lessonPlans]);

  // Build cross-page resources catalog (Class Prep, Assignments, Live Quiz, Exams, Reports)
  const appPageResources = useMemo<AppPageResourceOption[]>(() => {
    const items: AppPageResourceOption[] = [];

    lessonPlans.forEach((lp) => {
      items.push({
        key: `page-prep:${lp.id}`,
        refId: lp.id,
        pageId: 'prep',
        pageLabel: 'Class Prep',
        title: lp.topic,
        subtitle: `${lp.classCode} · ${lp.subject} · ${lp.materials.length} file`,
        classCode: normalizeClassKey(lp.classCode),
        subject: lp.subject.split('·')[0]?.trim() || 'General',
        unitName: lp.topic,
        description: `Modul Class Preparation (${lp.status} · ${lp.progress}%). Jadwal: ${lp.date}.`,
        suggestedType: 'document',
        tags: ['Class Prep', lp.classCode, lp.status],
        theme: lp.theme,
      });
    });

    assignments.forEach((asg) => {
      items.push({
        key: `page-asg:${asg.id}`,
        refId: asg.id,
        pageId: 'assignments',
        pageLabel: 'Assignments',
        title: asg.title,
        subtitle: `${asg.classCode} · ${asg.subject} · Due ${asg.dueDate}`,
        classCode: normalizeClassKey(asg.classCode),
        subject: asg.subject.split('·')[0]?.trim() || 'General',
        unitName: asg.title,
        description: `Tugas dari halaman Assignments (${asg.submitted}/${asg.total} terkumpul · Tenggat ${asg.dueDate}).`,
        suggestedType: 'document',
        tags: ['Assignment', asg.classCode, asg.status],
        theme: asg.theme,
      });
    });

    liveQuizzes.forEach((quiz) => {
      items.push({
        key: `page-quiz:${quiz.id}`,
        refId: quiz.id,
        pageId: 'livequiz',
        pageLabel: 'Live Quiz',
        title: quiz.title,
        subtitle: `${quiz.classCode} · ${quiz.subject} · ${quiz.questions.length} soal`,
        classCode: normalizeClassKey(quiz.classCode),
        subject: quiz.subject,
        unitName: `Live Quiz: ${quiz.title}`,
        description: quiz.description || `Paket soal interaktif Live Quiz (${quiz.questions.length} pertanyaan).`,
        suggestedType: 'slides',
        tags: ['Live Quiz', quiz.classCode, quiz.subject],
        theme: quiz.theme,
      });
    });

    exams.forEach((ex) => {
      items.push({
        key: `page-exam:${ex.id}`,
        refId: String(ex.id),
        pageId: 'exams',
        pageLabel: 'Exams',
        title: ex.title,
        subtitle: `${ex.classCode} · ${ex.grade} · ${ex.time}`,
        classCode: normalizeClassKey(ex.classCode),
        subject: resolveSubjectForClassKey(ex.classCode, schedules),
        unitName: `Persiapan Ujian: ${ex.title}`,
        description: `Materi & kisi-kisi ujian ${ex.title} (${ex.classCode} · ${ex.time} · ${ex.students} peserta).`,
        suggestedType: 'reading',
        tags: ['Exams', ex.classCode, ex.status],
        theme: ex.theme,
      });
    });

    reportsList.forEach((rep) => {
      items.push({
        key: `page-rep:${rep.id}`,
        refId: rep.id,
        pageId: 'reports',
        pageLabel: 'Reports',
        title: rep.title,
        subtitle: `${rep.classCode} · ${rep.category} · ${rep.format}`,
        classCode: normalizeClassKey(rep.classCode),
        subject: resolveSubjectForClassKey(rep.classCode, schedules),
        unitName: `${rep.category} · ${rep.generatedDate}`,
        description: rep.summary,
        suggestedType: 'reading',
        tags: ['Report', rep.category, rep.classCode],
        theme: rep.theme,
      });
    });

    return items;
  }, [lessonPlans, assignments, liveQuizzes, exams, reportsList, schedules]);

  const filteredExistingMedia = useMemo(() => {
    const q = mediaSearch.trim().toLowerCase();
    return existingMediaOptions.filter((item) => {
      if (matchSelectedTypeOnly && item.type !== type) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.originLabel.toLowerCase().includes(q) ||
        item.classCode.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q)
      );
    });
  }, [existingMediaOptions, mediaSearch, matchSelectedTypeOnly, type]);

  const filteredAppResources = useMemo(() => {
    const q = appPageSearch.trim().toLowerCase();
    return appPageResources.filter((item) => {
      if (appPageFilter !== 'all' && item.pageId !== appPageFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.pageLabel.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.classCode.toLowerCase().includes(q)
      );
    });
  }, [appPageResources, appPageFilter, appPageSearch]);

  const selectedExistingMedia = useMemo(
    () => existingMediaOptions.find((m) => m.key === selectedExistingKey) || null,
    [existingMediaOptions, selectedExistingKey]
  );

  const selectedAppPageResource = useMemo(
    () => appPageResources.find((p) => p.key === selectedAppPageKey) || null,
    [appPageResources, selectedAppPageKey]
  );

  const { setSheetElement, backdropRef, animateClose, sheetGestureProps } = useBottomSheetMotion({
    onClose: () => setIsUploadMaterialOpen(false),
  });

  if (!isUploadMaterialOpen) return null;

  const handleClassChange = (selectedClass: string) => {
    setClassCode(selectedClass);
    setGrade(inferGradeForClassKey(selectedClass));
    const matchedSchedule = schedules.find(
      (s) => normalizeClassKey(s.classCode) === selectedClass
    );
    if (matchedSchedule) {
      setSubject(matchedSchedule.subject);
      setTheme(matchedSchedule.theme);
    } else if (selectedClass === 'All Classes') {
      setSubject('All Subjects');
      setTheme('periwinkle');
    } else {
      setSubject(resolveSubjectForClassKey(selectedClass, schedules));
    }

    if (selectedClass === 'Class 302') {
      setUnitName('Unit 4: Advanced Differentiation');
    } else if (selectedClass === 'Class 303') {
      setUnitName('Unit 3: Electromagnetism');
    } else if (selectedClass === 'Class 304') {
      setUnitName('Unit 1: Color Dynamics');
    } else if (selectedClass === 'Class 305') {
      setUnitName('Unit 2: 20th Century Movements');
    } else {
      setUnitName('Unit Resources');
    }
  };

  const handleFileSelected = (file: File | undefined | null) => {
    if (!file) return;
    const { fileFormat, suggestedType } = inferFormatAndTypeFromFileName(file.name);
    const sizeLabel = formatBytes(file.size);

    if (suggestedType) {
      setType(suggestedType);
    }
    if (!title.trim()) {
      setTitle(stripExtension(file.name) || file.name);
    }

    if (file.size <= 3.5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFileMeta({
          name: file.name,
          sizeLabel,
          fileFormat,
          dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setUploadedFileMeta({
        name: file.name,
        sizeLabel,
        fileFormat,
      });
    }
  };

  const handlePickExistingMedia = (item: ExistingMediaOption) => {
    setSelectedExistingKey(item.key);
    setTitle(item.title);
    setType(item.type);
    setClassCode(item.classCode);
    setGrade(inferGradeForClassKey(item.classCode));
    setSubject(item.subject);
    setUnitName(item.unitName);
    setDescription(item.description);
    if (item.tags && item.tags.length > 0) {
      setTagsInput(item.tags.join(', '));
    }
    if (item.theme) {
      setTheme(item.theme);
    }
  };

  const handlePickAppPageResource = (item: AppPageResourceOption) => {
    setSelectedAppPageKey(item.key);
    setTitle(item.title);
    setType(item.suggestedType);
    setClassCode(item.classCode);
    setGrade(inferGradeForClassKey(item.classCode));
    setSubject(item.subject);
    setUnitName(item.unitName);
    setDescription(item.description);
    if (item.tags.length > 0) {
      setTagsInput(item.tags.join(', '));
    }
    if (item.theme) {
      setTheme(item.theme);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const isVid = type === 'video';
    const resolvedFormat: ClassMaterial['fileFormat'] =
      sourceMode === 'upload' && uploadedFileMeta
        ? uploadedFileMeta.fileFormat
        : sourceMode === 'existing_media' && selectedExistingMedia
        ? selectedExistingMedia.fileFormat
        : inferDefaultFormatForType(type);

    const resolvedSize: string =
      sourceMode === 'upload' && uploadedFileMeta
        ? uploadedFileMeta.sizeLabel
        : sourceMode === 'existing_media' && selectedExistingMedia
        ? selectedExistingMedia.fileSize
        : sourceMode === 'app_page' && selectedAppPageResource
        ? `Tautan ${selectedAppPageResource.pageLabel}`
        : isVid
        ? '24.0 MB'
        : '1.8 MB';

    const resolvedSourceLabel =
      sourceMode === 'upload' && uploadedFileMeta
        ? `File: ${uploadedFileMeta.name}`
        : sourceMode === 'existing_media' && selectedExistingMedia
        ? `Media: ${selectedExistingMedia.originLabel}`
        : sourceMode === 'app_page' && selectedAppPageResource
        ? `Halaman ${selectedAppPageResource.pageLabel}`
        : undefined;

    handleUploadMaterial({
      title: title.trim(),
      subject: subject.trim() || resolveSubjectForClassKey(classCode, schedules),
      classCode,
      grade,
      type,
      fileFormat: isVid && sourceMode !== 'upload' ? 'MP4' : resolvedFormat,
      fileSize: resolvedSize,
      duration: isVid
        ? selectedExistingMedia?.duration || '25:00'
        : undefined,
      durationSeconds: isVid
        ? selectedExistingMedia?.durationSeconds || 1500
        : undefined,
      watchedSeconds: 0,
      watchProgress: 0,
      isWatchedCompleted: false,
      author: 'Rasengan (Teacher)',
      description: description.trim(),
      tags,
      theme,
      unitName: unitName.trim() || 'Unit Resources',
      sourceType: sourceMode,
      sourceLabel: resolvedSourceLabel,
      sourcePage:
        sourceMode === 'app_page' && selectedAppPageResource
          ? selectedAppPageResource.pageId
          : undefined,
      sourceRefId:
        sourceMode === 'app_page' && selectedAppPageResource
          ? selectedAppPageResource.refId
          : sourceMode === 'existing_media' && selectedExistingMedia
          ? selectedExistingMedia.key
          : undefined,
      uploadedFileName:
        sourceMode === 'upload' && uploadedFileMeta
          ? uploadedFileMeta.name
          : selectedExistingMedia?.uploadedFileName,
      uploadedFileDataUrl:
        sourceMode === 'upload' && uploadedFileMeta
          ? uploadedFileMeta.dataUrl
          : selectedExistingMedia?.uploadedFileDataUrl,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setUploadedFileMeta(null);
    setSelectedExistingKey(null);
    setSelectedAppPageKey(null);
    setMediaSearch('');
    setAppPageSearch('');
  };

  const renderMediaTypeIcon = (itemType: ClassMaterial['type']) => {
    if (itemType === 'video') return <Video className="w-3.5 h-3.5 text-[#ee2e65]" />;
    if (itemType === 'slides') return <Presentation className="w-3.5 h-3.5 text-[#8C5811]" />;
    if (itemType === 'lab') return <FlaskConical className="w-3.5 h-3.5 text-[#146C43]" />;
    if (itemType === 'reading') return <BookOpen className="w-3.5 h-3.5 text-[#942922]" />;
    return <FileText className="w-3.5 h-3.5 text-[#3F3B99]" />;
  };

  return (
    <div
      ref={backdropRef}
      data-modal-sheet-backdrop="true"
      className="animate-ui-fade fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-5 no-print"
    >
      <div
        ref={setSheetElement}
        {...sheetGestureProps}
        className="bg-white rounded-t-[28px] sm:rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-black/[0.08] max-h-[90vh] overflow-y-auto space-y-4 animate-bottom-sheet"
      >
        <div
          data-sheet-handle="true"
          className="sm:hidden flex justify-center py-2 -mt-3 -mb-1 cursor-grab active:cursor-grabbing touch-none"
        >
          <div className="w-10 h-1 bg-black/15 rounded-full animate-sheet-handle" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-900">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Upload Class Material</h2>
              <p className="text-xs text-gray-500">Publish a new learning resource for your class.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={animateClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Resource Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Differential Calculus Problem Set & Solutions"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#ee2e65]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Class *
              </label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3 py-2 text-sm"
                value={classOptions.includes(classCode) ? classCode : 'Class 302'}
                onChange={handleClassChange}
                ariaLabel="Target Class"
                options={classOptions.map((cls) => ({
                  value: cls,
                  label: cls,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Mathematics"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#ee2e65]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Resource Type *
              </label>
              <CustomSelect
                className="w-full"
                triggerClassName="px-3 py-2 text-sm"
                value={type}
                onChange={(val) => setType(val as ClassMaterial['type'])}
                ariaLabel="Resource Type"
                options={[
                  { value: 'document', label: 'Document / PDF' },
                  { value: 'slides', label: 'Presentation Slides' },
                  { value: 'lab', label: 'Lab Manual' },
                  { value: 'video', label: 'Video Lecture' },
                  { value: 'reading', label: 'Reading Packet' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Unit / Chapter Name
              </label>
              <input
                type="text"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="e.g. Unit 4: Advanced Differentiation"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#ee2e65]"
              />
            </div>
          </div>

          {/* Resource Source Selector */}
          <div className="rounded-xl border border-black/[0.08] bg-[#FAFBFD] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-800">
                Sumber Resource
              </span>
              <span className="text-[11px] text-gray-500">
                Pilih cara melampirkan materi
              </span>
            </div>

            {/* 3 Source Mode Tabs */}
            <div className="grid grid-cols-3 gap-1.5 bg-black/[0.04] p-1 rounded-lg">
              {[
                { id: 'upload' as const, label: 'Upload File', icon: FileUp },
                { id: 'existing_media' as const, label: 'Media Ada', icon: FolderOpen },
                { id: 'app_page' as const, label: 'Halaman Lain', icon: LayoutGrid },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const active = sourceMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSourceMode(tab.id)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                      active
                        ? 'bg-white text-[#9D113C] shadow-xs'
                        : 'text-[#6E717A] hover:text-[#1C1D21]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mode 1: Upload File */}
            {sourceMode === 'upload' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.webm,.mov,.zip,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    handleFileSelected(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                {!uploadedFileMeta ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFileSelected(e.dataTransfer.files?.[0]);
                    }}
                    className="w-full rounded-xl border border-dashed border-black/[0.18] bg-white hover:bg-[#FEF1F5]/40 hover:border-[#ee2e65]/50 py-4 px-4 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#FEF1F5] text-[#ee2e65] flex items-center justify-center">
                      <FileUp className="w-4 h-4" />
                    </div>
                    <div className="text-[12.5px] font-semibold text-[#1C1D21]">
                      Pilih atau seret file dari perangkat
                    </div>
                    <div className="text-[11px] text-[#8A8D98]">
                      Mendukung PDF, PPTX, DOCX, MP4, ZIP, atau Gambar
                    </div>
                  </button>
                ) : (
                  <div className="rounded-xl border border-[#ee2e65]/30 bg-white p-3 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#FEF1F5] text-[#9D113C] flex items-center justify-center shrink-0 text-[10px] font-bold">
                        {uploadedFileMeta.fileFormat}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold text-[#1C1D21] truncate">
                          {uploadedFileMeta.name}
                        </div>
                        <div className="text-[11px] text-[#8A8D98] tabular-nums">
                          {uploadedFileMeta.sizeLabel} · Siap dipublikasikan
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-full border border-black/[0.1] text-[11px] font-semibold text-[#1C1D21] hover:bg-[#FAFBFD] cursor-pointer"
                      >
                        Ganti
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadedFileMeta(null)}
                        aria-label="Hapus file terpilih"
                        className="w-7 h-7 rounded-full hover:bg-[#FFECEB] text-[#8A8D98] hover:text-[#942922] flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Existing Media Picker */}
            {sourceMode === 'existing_media' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-3.5 h-3.5 text-[#8A8D98] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Cari media yang ada..."
                      className="w-full h-8 pl-8 pr-3 rounded-lg border border-black/[0.1] bg-white text-[12px] outline-none focus:border-[#ee2e65]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatchSelectedTypeOnly((prev) => !prev)}
                    className={`h-8 px-2.5 rounded-lg border text-[11.5px] font-semibold transition-colors cursor-pointer ${
                      matchSelectedTypeOnly
                        ? 'bg-[#FEF1F5] border-[#ee2e65]/40 text-[#9D113C]'
                        : 'bg-white border-black/[0.1] text-[#6E717A]'
                    }`}
                  >
                    {matchSelectedTypeOnly ? 'Sesuai Tipe' : 'Semua Tipe'}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
                  {filteredExistingMedia.length === 0 ? (
                    <div className="py-6 px-3 text-center text-[12px] text-[#8A8D98]">
                      Tidak ada media yang cocok.
                    </div>
                  ) : (
                    filteredExistingMedia.map((item) => {
                      const isSelected = selectedExistingKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handlePickExistingMedia(item)}
                          className={`w-full px-3 py-2.5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#FEF1F5]' : 'hover:bg-[#FAFBFD]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-[#FAFBFD] border border-black/[0.06] flex items-center justify-center shrink-0">
                              {renderMediaTypeIcon(item.type)}
                            </span>
                            <div className="min-w-0">
                              <div className="text-[12.5px] font-semibold text-[#1C1D21] truncate">
                                {item.title}
                              </div>
                              <div className="text-[11px] text-[#8A8D98] truncate tabular-nums">
                                {item.originLabel} · {item.classCode} · {item.fileSize}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#ee2e65] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Pick from Other Pages in the App */}
            {sourceMode === 'app_page' && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all' as const, label: 'Semua' },
                    { id: 'prep' as const, label: 'Class Prep' },
                    { id: 'assignments' as const, label: 'Assignments' },
                    { id: 'livequiz' as const, label: 'Live Quiz' },
                    { id: 'exams' as const, label: 'Exams' },
                    { id: 'reports' as const, label: 'Reports' },
                  ].map((pill) => {
                    const active = appPageFilter === pill.id;
                    return (
                      <button
                        key={pill.id}
                        type="button"
                        onClick={() => setAppPageFilter(pill.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#1C1D21] text-white'
                            : 'bg-white border border-black/[0.08] text-[#6E717A] hover:text-[#1C1D21]'
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#8A8D98] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={appPageSearch}
                    onChange={(e) => setAppPageSearch(e.target.value)}
                    placeholder="Cari modul, tugas, kuis, ujian, atau laporan..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg border border-black/[0.1] bg-white text-[12px] outline-none focus:border-[#ee2e65]"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-black/[0.08] bg-white divide-y divide-black/[0.06]">
                  {filteredAppResources.length === 0 ? (
                    <div className="py-6 px-3 text-center text-[12px] text-[#8A8D98]">
                      Tidak ada item yang ditemukan di halaman ini.
                    </div>
                  ) : (
                    filteredAppResources.map((item) => {
                      const isSelected = selectedAppPageKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handlePickAppPageResource(item)}
                          className={`w-full px-3 py-2.5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                            isSelected ? 'bg-[#FEF1F5]' : 'hover:bg-[#FAFBFD]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-[#F0EFFC] text-[#3F3B99] text-[10px] font-bold shrink-0">
                                {item.pageLabel}
                              </span>
                              <span className="text-[12.5px] font-semibold text-[#1C1D21] truncate">
                                {item.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8A8D98] truncate mt-0.5">
                              {item.subtitle}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-[#ee2e65] text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Summary / Instructions *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a clear description of what this material covers and instructions for students..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#ee2e65] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Revision, Quiz, Handout"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#ee2e65]"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={animateClose}
              className={`${ACTION_BTN_SECONDARY} flex-1 sm:flex-initial`}
            >
              <X className="w-4 h-4 sm:hidden shrink-0" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              className={`${ACTION_BTN_PRIMARY} flex-1 sm:flex-initial`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="sm:hidden">Publish</span>
              <span className="hidden sm:inline">Publish Material</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
