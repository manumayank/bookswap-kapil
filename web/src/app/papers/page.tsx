'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Download, FilePlus, FileText, Paperclip, Upload } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { BOARD_OPTIONS, boardLabel } from '@/lib/labels';
import PageHeader from '@/components/ui/PageHeader';
import { Field, FieldError, fieldA11y, controlClass, invalidClass } from '@/components/forms/Field';
import FormAlert from '@/components/forms/FormAlert';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import SchoolSuggestions, { type SchoolOption } from '@/components/forms/SchoolSuggestions';

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);
const TYPES = [
  { label: 'Annual exam', value: 'ANNUAL_EXAM' },
  { label: 'Half-yearly', value: 'HALF_YEARLY' },
  { label: 'Unit test', value: 'UNIT_TEST' },
  { label: 'Pre-board', value: 'PRE_BOARD' },
  { label: 'Olympiad', value: 'OLYMPIAD' },
  { label: 'Quiz', value: 'QUIZ' },
] as const;

const typeLabel = (v: string) => TYPES.find((t) => t.value === v)?.label || v;

interface Paper {
  id: string;
  title: string;
  subject: string;
  board: string;
  class: number;
  year: number;
  type: string;
  schoolId?: string;
  school?: { name: string };
  fileUrl: string;
  downloadCount: number;
  uploadedBy: { name: string };
  createdAt: string;
}

const EMPTY_FILTERS = { board: '', class: '', subject: '', year: '', type: '', schoolId: '' };

type UploadErrorKey = 'file' | 'title' | 'subject' | 'board' | 'class' | 'type';

export default function PapersPage() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // School search for filters
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [selectedSchoolName, setSelectedSchoolName] = useState('');

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    subject: '',
    board: '',
    class: '',
    year: new Date().getFullYear().toString(),
    type: '',
    schoolId: '',
  });
  const [uploadSchoolSearch, setUploadSchoolSearch] = useState('');
  const [uploadSchools, setUploadSchools] = useState<SchoolOption[]>([]);
  const [showUploadSchoolDropdown, setShowUploadSchoolDropdown] = useState(false);
  const [selectedUploadSchoolName, setSelectedUploadSchoolName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<UploadErrorKey, string>>>({});

  useEffect(() => {
    hydrate();
    fetchPapers();
  }, [hydrate]);

  const fetchPapers = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (filters.board) params.append('board', filters.board);
      if (filters.class) params.append('class', filters.class);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.year) params.append('year', filters.year);
      if (filters.type) params.append('type', filters.type);
      if (filters.schoolId) params.append('schoolId', filters.schoolId);

      const { data } = await api.get(`/papers?${params.toString()}`);
      setPapers(data.data?.papers || []);
    } catch (err: any) {
      setPapers([]);
      setFetchError(err?.response?.data?.error || "We couldn't load papers. Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [filters]);

  const searchSchools = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSchools([]);
      return;
    }
    try {
      const { data } = await api.get(`/schools?name=${encodeURIComponent(query)}&limit=10`);
      setSchools(data.data?.schools || []);
    } catch (err) {
      console.error('Failed to search schools:', err);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (schoolSearch && !selectedSchoolName) {
        searchSchools(schoolSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [schoolSearch, selectedSchoolName, searchSchools]);

  const searchUploadSchools = useCallback(async (query: string) => {
    if (query.length < 2) {
      setUploadSchools([]);
      return;
    }
    try {
      const { data } = await api.get(`/schools?name=${encodeURIComponent(query)}&limit=10`);
      setUploadSchools(data.data?.schools || []);
    } catch (err) {
      console.error('Failed to search schools:', err);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (uploadSchoolSearch && !selectedUploadSchoolName) {
        searchUploadSchools(uploadSchoolSearch);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [uploadSchoolSearch, selectedUploadSchoolName, searchUploadSchools]);

  const setUpload = (key: keyof typeof uploadForm, value: string) => {
    setUploadForm((prev) => ({ ...prev, [key]: value }));
    if (key in uploadErrors) setUploadErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStatus(null);

    const errs: Partial<Record<UploadErrorKey, string>> = {};
    if (!selectedFile) errs.file = 'Choose the paper file (PDF, JPG or PNG).';
    if (!uploadForm.title.trim()) errs.title = 'Add a title so parents can find it.';
    if (!uploadForm.subject.trim()) errs.subject = 'Add the subject.';
    if (!uploadForm.board) errs.board = 'Choose the board.';
    if (!uploadForm.class) errs.class = 'Choose the class.';
    if (!uploadForm.type) errs.type = 'Choose the exam type.';
    setUploadErrors(errs);
    const first = Object.keys(errs)[0];
    if (first) {
      document.getElementById(`paper-${first}`)?.focus();
      return;
    }
    if (!selectedFile || !isAuthenticated) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadForm.title);
    formData.append('subject', uploadForm.subject);
    formData.append('board', uploadForm.board);
    formData.append('class', uploadForm.class);
    formData.append('year', uploadForm.year);
    formData.append('type', uploadForm.type);
    if (uploadForm.schoolId) {
      formData.append('schoolId', uploadForm.schoolId);
    }

    try {
      await api.post('/papers', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadStatus({ type: 'success', message: 'Paper uploaded. Thanks for sharing it with other parents.' });
      setUploadForm({
        title: '',
        subject: '',
        board: '',
        class: '',
        year: new Date().getFullYear().toString(),
        type: '',
        schoolId: '',
      });
      setUploadSchoolSearch('');
      setSelectedUploadSchoolName('');
      setSelectedFile(null);
      setActiveTab('browse');
      fetchPapers();
    } catch (err: any) {
      setUploadStatus({
        type: 'error',
        message: err.response?.data?.error || "We couldn't upload the paper. Check the file is under 10 MB and try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (paper: Paper) => {
    setDownloadError('');
    try {
      await api.post(`/papers/${paper.id}/download`);
      window.open(paper.fileUrl, '_blank');
    } catch (err: any) {
      setDownloadError(err?.response?.data?.error || "We couldn't start the download. Try again.");
    }
  };

  const hasFilters = Object.values(filters).some(Boolean);
  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSchoolSearch('');
    setSelectedSchoolName('');
  };

  const tabClass = (on: boolean) =>
    `inline-flex min-h-[40px] items-center gap-2 rounded-sm px-4 text-sm font-bold transition-colors ${
      on ? 'bg-sun text-ink' : 'text-muted hover:bg-muted-extra-light hover:text-foreground'
    }`;

  return (
    <div className="container py-10 md:py-14">
      <PageHeader
        back={{ href: '/', label: 'Home' }}
        title="Exam papers"
        description="Past papers from schools and boards, free to download. Share yours to help other parents prepare."
        actions={
          <div role="tablist" aria-label="Exam papers" className="inline-flex gap-1 rounded-md border-2 border-edge bg-card p-1">
            <button
              type="button"
              role="tab"
              id="tab-browse"
              aria-controls="panel-browse"
              aria-selected={activeTab === 'browse'}
              onClick={() => setActiveTab('browse')}
              className={tabClass(activeTab === 'browse')}
            >
              <FileText size={16} strokeWidth={2.5} aria-hidden />
              Browse
            </button>
            <button
              type="button"
              role="tab"
              id="tab-upload"
              aria-controls="panel-upload"
              aria-selected={activeTab === 'upload'}
              onClick={() => {
                setUploadStatus((s) => (s?.type === 'success' ? null : s));
                setActiveTab('upload');
              }}
              className={tabClass(activeTab === 'upload')}
            >
              <Upload size={16} strokeWidth={2.5} aria-hidden />
              Upload a paper
            </button>
          </div>
        }
      />

      {activeTab === 'browse' ? (
        <div id="panel-browse" role="tabpanel" aria-labelledby="tab-browse" className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          {/* Filters */}
          <form
            onSubmit={(e) => e.preventDefault()}
            aria-label="Filter papers"
            className="card-flat flex flex-col gap-4 p-5 lg:sticky lg:top-28"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Filter</h2>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="btn btn-ghost btn-sm -mr-2">
                  Clear all
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
              <Field id="filter-board" label="Board">
                <select
                  id="filter-board"
                  value={filters.board}
                  onChange={(e) => setFilters({ ...filters, board: e.target.value })}
                  className={controlClass}
                >
                  <option value="">All boards</option>
                  {BOARD_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {boardLabel(b)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="filter-class" label="Class">
                <select
                  id="filter-class"
                  value={filters.class}
                  onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                  className={controlClass}
                >
                  <option value="">All classes</option>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="filter-subject" label="Subject">
                <input
                  id="filter-subject"
                  type="text"
                  value={filters.subject}
                  onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                  placeholder="Maths"
                  className={controlClass}
                />
              </Field>
              <Field id="filter-year" label="Year">
                <select
                  id="filter-year"
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className={controlClass}
                >
                  <option value="">All years</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="filter-type" label="Exam type" className="col-span-2 lg:col-span-1">
                <select
                  id="filter-type"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className={controlClass}
                >
                  <option value="">All types</option>
                  {TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="filter-school" label="School" className="col-span-2 lg:col-span-1">
                <div className="relative">
                  <input
                    id="filter-school"
                    type="text"
                    role="combobox"
                    aria-expanded={showSchoolDropdown && schools.length > 0}
                    aria-controls="filter-school-suggestions"
                    aria-autocomplete="list"
                    autoComplete="off"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSelectedSchoolName('');
                      setFilters({ ...filters, schoolId: '' });
                      setShowSchoolDropdown(true);
                    }}
                    onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowSchoolDropdown(false)}
                    placeholder="Search by name"
                    className={controlClass}
                  />
                  <SchoolSuggestions
                    listId="filter-school-suggestions"
                    open={showSchoolDropdown}
                    schools={schools}
                    onSelect={(school) => {
                      setFilters({ ...filters, schoolId: school.id });
                      setSelectedSchoolName(school.name);
                      setSchoolSearch(school.name);
                      setShowSchoolDropdown(false);
                    }}
                  />
                </div>
              </Field>
            </div>
          </form>

          {/* Results */}
          <section aria-label="Papers" aria-busy={isLoading} className="min-w-0">
            {uploadStatus?.type === 'success' && (
              <FormAlert tone="success" className="mb-4">
                {uploadStatus.message}
              </FormAlert>
            )}
            {downloadError && <FormAlert className="mb-4">{downloadError}</FormAlert>}

            {isLoading ? (
              <ul className="card-flat divide-y-2 divide-card-border overflow-hidden" aria-label="Loading papers">
                {[0, 1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-4 p-5">
                    <div className="skeleton h-12 w-12 shrink-0" />
                    <div className="flex-1">
                      <div className="skeleton mb-3 h-5 w-2/3" />
                      <div className="skeleton h-4 w-1/2" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : fetchError ? (
              <ErrorState size="lg" title="Papers didn’t load" message={fetchError} onRetry={fetchPapers} />
            ) : papers.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={hasFilters ? 'No papers match these filters' : 'No papers shared yet'}
                actions={
                  <>
                    <button type="button" onClick={() => setActiveTab('upload')} className="btn btn-primary">
                      <Upload size={18} strokeWidth={2.5} aria-hidden />
                      Upload a paper
                    </button>
                    {hasFilters && (
                      <button type="button" onClick={clearFilters} className="btn btn-outline">
                        Clear filters
                      </button>
                    )}
                  </>
                }
              >
                <p>
                  {hasFilters
                    ? 'Try fewer filters, or share a paper from your child’s school.'
                    : 'Have past exam papers at home? Upload one so other parents can use it to prepare.'}
                </p>
              </EmptyState>
            ) : (
              <>
                <p className="mb-3 text-sm text-muted" aria-live="polite">
                  {papers.length} {papers.length === 1 ? 'paper' : 'papers'}
                </p>
                <ul className="card-flat divide-y-2 divide-card-border overflow-hidden">
                  {papers.map((paper) => (
                    <li key={paper.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                      <div
                        className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-md border-2 border-edge bg-muted-extra-light text-primary sm:flex"
                        aria-hidden
                      >
                        <FileText size={22} strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold leading-snug">{paper.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className="badge badge-primary">Class {paper.class}</span>
                          <span className="badge badge-primary">{boardLabel(paper.board)}</span>
                          <span className="badge badge-muted">{paper.subject}</span>
                          <span className="badge badge-muted">{paper.year}</span>
                          <span className="badge badge-secondary">{typeLabel(paper.type)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
                          {paper.school && <span>{paper.school.name}</span>}
                          <span>Shared by {paper.uploadedBy.name}</span>
                          <span>
                            {paper.downloadCount.toLocaleString('en-IN')} {paper.downloadCount === 1 ? 'download' : 'downloads'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownload(paper)}
                        className="btn btn-outline btn-sm shrink-0 self-start"
                        aria-label={`Download ${paper.title}`}
                      >
                        <Download size={16} strokeWidth={2.5} aria-hidden />
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      ) : (
        <div id="panel-upload" role="tabpanel" aria-labelledby="tab-upload" className="max-w-2xl animate-fade-in">
          {!isAuthenticated ? (
            <EmptyState
              icon={FilePlus}
              title="Log in to share a paper"
              actions={
                <Link href="/login" className="btn btn-primary">
                  Log in
                </Link>
              }
            >
              <p>Anyone can download papers. To upload one, log in with your email.</p>
            </EmptyState>
          ) : (
            <form onSubmit={handleUpload} noValidate className="card-flat flex flex-col gap-5 p-5 sm:p-8">
              <div>
                <h2 className="text-2xl md:text-3xl">Upload a paper</h2>
                <p className="mt-2 text-muted">A clear scan or photo works. Hide any student names before uploading.</p>
              </div>

              {uploadStatus?.type === 'error' && <FormAlert>{uploadStatus.message}</FormAlert>}

              {/* File */}
              <div>
                <p className="mb-2 text-sm font-semibold" id="paper-file-label">
                  Paper file
                </p>
                <div className="relative">
                  <input
                    id="paper-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      setSelectedFile(e.target.files?.[0] || null);
                      setUploadErrors((p) => ({ ...p, file: undefined }));
                    }}
                    className="peer sr-only"
                    aria-labelledby="paper-file-label paper-file-status"
                    aria-describedby={uploadErrors.file ? 'paper-file-error' : undefined}
                  />
                  <label
                    htmlFor="paper-file"
                    className={`flex cursor-pointer items-center gap-4 rounded-md border-2 p-5 transition-colors hover:border-solid hover:bg-muted-extra-light peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary ${
                      selectedFile ? 'border-solid border-edge bg-muted-extra-light' : 'border-dashed'
                    } ${uploadErrors.file ? 'border-danger' : 'border-edge'}`}
                  >
                    <span
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-edge ${
                        selectedFile ? 'bg-secondary text-ink' : 'bg-sun text-ink'
                      }`}
                      aria-hidden
                    >
                      <Paperclip size={20} strokeWidth={2.25} />
                    </span>
                    <span className="min-w-0">
                      <span id="paper-file-status" className="block truncate font-bold">
                        {selectedFile ? selectedFile.name : 'Choose a file'}
                      </span>
                      <span className="block text-[13px] text-muted">
                        {selectedFile ? 'Tap to choose a different file' : 'PDF, JPG or PNG, up to 10 MB'}
                      </span>
                    </span>
                  </label>
                </div>
                <FieldError id="paper-file-error" message={uploadErrors.file} />
              </div>

              <Field
                id="paper-title"
                label="Title"
                error={uploadErrors.title}
                hint="Include the school, class, subject and exam so parents can find it."
              >
                <input
                  {...fieldA11y('paper-title', { error: uploadErrors.title, hint: true })}
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUpload('title', e.target.value)}
                  placeholder="Class 10 Maths annual exam 2025"
                  className={`${controlClass} ${uploadErrors.title ? invalidClass : ''}`}
                />
              </Field>

              <Field id="paper-subject" label="Subject" error={uploadErrors.subject}>
                <input
                  {...fieldA11y('paper-subject', { error: uploadErrors.subject })}
                  type="text"
                  value={uploadForm.subject}
                  onChange={(e) => setUpload('subject', e.target.value)}
                  placeholder="Mathematics"
                  className={`${controlClass} ${uploadErrors.subject ? invalidClass : ''}`}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="paper-board" label="Board" error={uploadErrors.board}>
                  <select
                    {...fieldA11y('paper-board', { error: uploadErrors.board })}
                    value={uploadForm.board}
                    onChange={(e) => setUpload('board', e.target.value)}
                    className={`${controlClass} ${uploadErrors.board ? invalidClass : ''}`}
                  >
                    <option value="">Choose board</option>
                    {BOARD_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {boardLabel(b)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="paper-class" label="Class" error={uploadErrors.class}>
                  <select
                    {...fieldA11y('paper-class', { error: uploadErrors.class })}
                    value={uploadForm.class}
                    onChange={(e) => setUpload('class', e.target.value)}
                    className={`${controlClass} ${uploadErrors.class ? invalidClass : ''}`}
                  >
                    <option value="">Choose class</option>
                    {CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="paper-year" label="Year">
                  <select
                    id="paper-year"
                    value={uploadForm.year}
                    onChange={(e) => setUpload('year', e.target.value)}
                    className={controlClass}
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="paper-type" label="Exam type" error={uploadErrors.type}>
                  <select
                    {...fieldA11y('paper-type', { error: uploadErrors.type })}
                    value={uploadForm.type}
                    onChange={(e) => setUpload('type', e.target.value)}
                    className={`${controlClass} ${uploadErrors.type ? invalidClass : ''}`}
                  >
                    <option value="">Choose type</option>
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field id="paper-school" label="School" optional>
                <div className="relative">
                  <input
                    id="paper-school"
                    type="text"
                    role="combobox"
                    aria-expanded={showUploadSchoolDropdown && uploadSchools.length > 0}
                    aria-controls="paper-school-suggestions"
                    aria-autocomplete="list"
                    autoComplete="off"
                    value={uploadSchoolSearch}
                    onChange={(e) => {
                      setUploadSchoolSearch(e.target.value);
                      setSelectedUploadSchoolName('');
                      setUploadForm({ ...uploadForm, schoolId: '' });
                      setShowUploadSchoolDropdown(true);
                    }}
                    onFocus={() => uploadSchoolSearch.length >= 2 && setShowUploadSchoolDropdown(true)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowUploadSchoolDropdown(false)}
                    placeholder="Search by school name"
                    className={controlClass}
                  />
                  <SchoolSuggestions
                    listId="paper-school-suggestions"
                    open={showUploadSchoolDropdown}
                    schools={uploadSchools}
                    onSelect={(school) => {
                      setUploadForm({ ...uploadForm, schoolId: school.id });
                      setSelectedUploadSchoolName(school.name);
                      setUploadSchoolSearch(school.name);
                      setShowUploadSchoolDropdown(false);
                    }}
                  />
                </div>
              </Field>

              <button type="submit" disabled={isUploading} className="btn btn-primary btn-lg mt-2 w-full sm:w-auto sm:self-start">
                <Upload size={18} strokeWidth={2.5} aria-hidden />
                {isUploading ? 'Uploading…' : 'Upload paper'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
