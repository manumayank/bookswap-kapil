'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;
const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);
const TYPES = [
  { label: 'Annual Exam', value: 'ANNUAL_EXAM' },
  { label: 'Half Yearly', value: 'HALF_YEARLY' },
  { label: 'Unit Test', value: 'UNIT_TEST' },
  { label: 'Pre-Board', value: 'PRE_BOARD' },
  { label: 'Olympiad', value: 'OLYMPIAD' },
  { label: 'Quiz', value: 'QUIZ' },
] as const;

interface School {
  id: string;
  name: string;
  city: string;
  board: string;
}

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

export default function PapersPage() {
  const { isAuthenticated, hydrate } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    board: '',
    class: '',
    subject: '',
    year: '',
    type: '',
    schoolId: '',
  });

  // School search for filters
  const [schoolSearch, setSchoolSearch] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
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
  const [uploadSchools, setUploadSchools] = useState<School[]>([]);
  const [showUploadSchoolDropdown, setShowUploadSchoolDropdown] = useState(false);
  const [selectedUploadSchoolName, setSelectedUploadSchoolName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    hydrate();
    fetchPapers();
  }, [hydrate]);

  const fetchPapers = async () => {
    setIsLoading(true);
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
    } catch (err) {
      console.error('Failed to fetch papers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers();
  }, [filters]);

  // Search schools for filter
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

  // Search schools for upload
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !isAuthenticated) {
      setUploadStatus({ type: 'error', message: 'Please select a file and login first' });
      return;
    }

    if (!uploadForm.title.trim()) {
      setUploadStatus({ type: 'error', message: 'Title is required' });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

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
      setUploadStatus({ type: 'success', message: 'Paper uploaded successfully!' });
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
        message: err.response?.data?.error || 'Upload failed. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (paper: Paper) => {
    try {
      await api.post(`/papers/${paper.id}/download`);
      window.open(paper.fileUrl, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{ background: 'var(--card)', borderBottom: '1px solid var(--card-border)' }}>
        <div className="container" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link href="/" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>←</span>
              </Link>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Question Papers</h1>
                <p style={{ color: 'var(--muted)', margin: '0.25rem 0 0 0', fontSize: '0.875rem' }}>
                  Previous year papers - Free to upload & download
                </p>
              </div>
            </div>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setActiveTab('browse')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'browse' ? 'var(--primary)' : 'var(--muted-extra-light)',
                  color: activeTab === 'browse' ? 'white' : 'var(--foreground)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Browse Papers
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: activeTab === 'upload' ? 'var(--primary)' : 'var(--muted-extra-light)',
                  color: activeTab === 'upload' ? 'white' : 'var(--foreground)',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Upload Paper
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '2rem 1.5rem' }}>
        {activeTab === 'browse' ? (
          <div>
            {/* Filters */}
            <div className="card-premium" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Board</label>
                  <select
                    value={filters.board}
                    onChange={(e) => setFilters({ ...filters, board: e.target.value })}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <option value="">All Boards</option>
                    {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Class</label>
                  <select
                    value={filters.class}
                    onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <option value="">All Classes</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(c => (
                      <option key={c} value={c}>Class {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Subject</label>
                  <input
                    type="text"
                    value={filters.subject}
                    onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                    placeholder="e.g. Maths"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Year</label>
                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <option value="">All Years</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    <option value="">All Types</option>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                {/* School Filter */}
                <div style={{ position: 'relative' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>School</label>
                  <input
                    type="text"
                    value={schoolSearch}
                    onChange={(e) => {
                      setSchoolSearch(e.target.value);
                      setSelectedSchoolName('');
                      setFilters({ ...filters, schoolId: '' });
                      setShowSchoolDropdown(true);
                    }}
                    onFocus={() => schoolSearch.length >= 2 && setShowSchoolDropdown(true)}
                    placeholder="Search school..."
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  />
                  {showSchoolDropdown && schools.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      marginTop: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}>
                      {schools.map((school) => (
                        <button
                          key={school.id}
                          type="button"
                          onClick={() => {
                            setFilters({ ...filters, schoolId: school.id });
                            setSelectedSchoolName(school.name);
                            setSchoolSearch(school.name);
                            setShowSchoolDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '12px 16px',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{school.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{school.city} • {school.board}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Papers List */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem' }}>
                <p>Loading papers...</p>
              </div>
            ) : papers.length === 0 ? (
              <div className="card-premium" style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
                <h3>No papers found</h3>
                <p style={{ color: 'var(--muted)' }}>Be the first to upload a question paper!</p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem' }}
                >
                  Upload Paper
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {papers.map((paper) => (
                  <div key={paper.id} className="card-premium" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem' }}>{paper.title}</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span style={{ padding: '4px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {paper.board}
                          </span>
                          <span style={{ padding: '4px 12px', background: 'var(--muted-extra-light)', borderRadius: '9999px', fontSize: '0.75rem' }}>
                            Class {paper.class}
                          </span>
                          <span style={{ padding: '4px 12px', background: 'var(--muted-extra-light)', borderRadius: '9999px', fontSize: '0.75rem' }}>
                            {paper.subject}
                          </span>
                          <span style={{ padding: '4px 12px', background: 'var(--muted-extra-light)', borderRadius: '9999px', fontSize: '0.75rem' }}>
                            {paper.year}
                          </span>
                          <span style={{ padding: '4px 12px', background: 'var(--secondary-glow)', color: 'var(--secondary)', borderRadius: '9999px', fontSize: '0.75rem' }}>
                            {TYPES.find(t => t.value === paper.type)?.label || paper.type}
                          </span>
                          {paper.school && (
                            <span style={{ padding: '4px 12px', background: 'var(--primary-glow)', color: 'var(--primary)', borderRadius: '9999px', fontSize: '0.75rem' }}>
                              {paper.school.name}
                            </span>
                          )}
                        </div>
                        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>
                          Uploaded by {paper.uploadedBy.name} • {paper.downloadCount} downloads
                        </p>
                      </div>
                      <button
                        onClick={() => handleDownload(paper)}
                        className="btn btn-primary"
                        style={{ height: '44px', padding: '0 24px', whiteSpace: 'nowrap' }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Upload Form */
          <div className="card-premium" style={{ maxWidth: '640px', margin: '0 auto', padding: '2rem' }}>
            {!isAuthenticated ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Please login to upload papers</p>
                <Link href="/login" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Go to Login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleUpload}>
                <h2 style={{ margin: '0 0 1.5rem 0' }}>Upload Question Paper</h2>
                
                {uploadStatus && (
                  <div
                    style={{
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1.5rem',
                      background: uploadStatus.type === 'success' ? 'var(--secondary-glow)' : 'var(--accent-glow)',
                      color: uploadStatus.type === 'success' ? 'var(--secondary)' : 'var(--accent)',
                      fontWeight: 600,
                    }}
                  >
                    {uploadStatus.message}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* File Upload */}
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Paper File (PDF/Image) *
                    </label>
                    <label
                      style={{
                        display: 'block',
                        padding: '2rem',
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        marginTop: '0.5rem',
                      }}
                    >
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        required
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📎</div>
                      <p style={{ margin: 0, fontWeight: 600 }}>
                        {selectedFile ? selectedFile.name : 'Click to select file'}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>
                        PDF, JPG, PNG up to 10MB
                      </p>
                    </label>
                  </div>

                  {/* Title - Required */}
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Paper Title * <span style={{ color: 'var(--accent)' }}>(Required)</span>
                    </label>
                    <input
                      type="text"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                      placeholder="e.g. DPS Gurgaon Class 10 Maths Annual Exam 2024"
                      required
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: '0.25rem 0 0 0' }}>
                      Include school name, class, subject, and exam type for better searchability
                    </p>
                  </div>

                  {/* Subject */}
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>Subject *</label>
                    <input
                      type="text"
                      value={uploadForm.subject}
                      onChange={(e) => setUploadForm({ ...uploadForm, subject: e.target.value })}
                      placeholder="e.g. Mathematics"
                      required
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                  </div>

                  {/* Board & Class */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>Board *</label>
                      <select
                        value={uploadForm.board}
                        onChange={(e) => setUploadForm({ ...uploadForm, board: e.target.value })}
                        required
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        <option value="">Select</option>
                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>Class *</label>
                      <select
                        value={uploadForm.class}
                        onChange={(e) => setUploadForm({ ...uploadForm, class: e.target.value })}
                        required
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(c => (
                          <option key={c} value={c}>Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* School - Optional */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      School <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={uploadSchoolSearch}
                      onChange={(e) => {
                        setUploadSchoolSearch(e.target.value);
                        setSelectedUploadSchoolName('');
                        setUploadForm({ ...uploadForm, schoolId: '' });
                        setShowUploadSchoolDropdown(true);
                      }}
                      onFocus={() => uploadSchoolSearch.length >= 2 && setShowUploadSchoolDropdown(true)}
                      placeholder="Search for your school..."
                      style={{ width: '100%', marginTop: '0.5rem' }}
                    />
                    {showUploadSchoolDropdown && uploadSchools.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        marginTop: '4px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}>
                        {uploadSchools.map((school) => (
                          <button
                            key={school.id}
                            type="button"
                            onClick={() => {
                              setUploadForm({ ...uploadForm, schoolId: school.id });
                              setSelectedUploadSchoolName(school.name);
                              setUploadSchoolSearch(school.name);
                              setShowUploadSchoolDropdown(false);
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '12px 16px',
                              background: 'transparent',
                              border: 'none',
                              borderBottom: '1px solid var(--border)',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontWeight: 600 }}>{school.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{school.city} • {school.board}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Year & Type */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>Year *</label>
                      <select
                        value={uploadForm.year}
                        onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}
                        required
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase' }}>Exam Type *</label>
                      <select
                        value={uploadForm.type}
                        onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                        required
                        style={{ width: '100%', marginTop: '0.5rem' }}
                      >
                        <option value="">Select</option>
                        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      marginTop: '1rem',
                      opacity: isUploading || !selectedFile ? 0.6 : 1,
                    }}
                  >
                    {isUploading ? 'Uploading...' : 'Upload Paper'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
