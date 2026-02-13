'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'];
const CONDITIONS = [
  { value: 'UNUSED', label: 'Unused' },
  { value: 'ALMOST_NEW', label: 'Almost New' },
  { value: 'WATER_MARKS', label: 'Minor Water Marks' },
  { value: 'UNDERLINED', label: 'Underlined' },
];
const EXCHANGE_OPTIONS = [
  { value: 'PICKUP', label: 'Self Pickup' },
  { value: 'SCHOOL', label: 'At School' },
  { value: 'PORTER', label: 'Via Porter/Courier' },
];

interface BookItem {
  subject: string;
  title: string;
  publisher: string;
}

export default function NewListingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [form, setForm] = useState({
    listingType: 'SET',
    board: user?.board || 'CBSE',
    class: '',
    city: user?.city || '',
    condition: 'ALMOST_NEW',
    yearOfPurchase: '',
  });
  const [exchangePrefs, setExchangePrefs] = useState<string[]>(['PICKUP']);
  const [items, setItems] = useState<BookItem[]>([{ subject: '', title: '', publisher: '' }]);
  const [error, setError] = useState('');

  const createListing = useMutation({
    mutationFn: async (data: any) => {
      const { data: res } = await api.post('/listings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myListings'] });
      router.push('/dashboard');
    },
  });

  const toggleExchangePref = (value: string) => {
    setExchangePrefs((prev) =>
      prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]
    );
  };

  const updateItem = (index: number, field: keyof BookItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { subject: '', title: '', publisher: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.class || parseInt(form.class) < 1 || parseInt(form.class) > 12) {
      setError('Please enter a valid class (1-12)');
      return;
    }
    if (!form.city) {
      setError('City is required');
      return;
    }
    if (exchangePrefs.length === 0) {
      setError('Select at least one exchange preference');
      return;
    }
    if (items.some((item) => !item.subject.trim())) {
      setError('All books must have a subject');
      return;
    }

    try {
      await createListing.mutateAsync({
        listingType: form.listingType,
        board: form.board,
        class: parseInt(form.class),
        city: form.city,
        condition: form.condition,
        yearOfPurchase: form.yearOfPurchase ? parseInt(form.yearOfPurchase) : undefined,
        exchangePreference: exchangePrefs,
        items: items.map((item) => ({
          subject: item.subject,
          title: item.title || undefined,
          publisher: item.publisher || undefined,
        })),
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create listing');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">List Your Books</h1>
      <p className="text-gray-600 mb-8">Fill in the details to list books for exchange.</p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Listing Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type</label>
          <div className="flex gap-3">
            {['SET', 'INDIVIDUAL'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, listingType: type })}
                className={`flex-1 py-3 rounded-lg border-2 font-medium text-sm transition-colors ${
                  form.listingType === type
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {type === 'SET' ? 'Full Book Set' : 'Individual Books'}
              </button>
            ))}
          </div>
        </div>

        {/* Board & Class */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Board</label>
            <select
              value={form.board}
              onChange={(e) => setForm({ ...form, board: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            >
              {BOARDS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <input
              type="number"
              min={1}
              max={12}
              value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="1-12"
            />
          </div>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Your city"
          />
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Book Condition</label>
          <div className="grid grid-cols-2 gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm({ ...form, condition: c.value })}
                className={`py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                  form.condition === c.value
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Year of Purchase */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year of Purchase <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="number"
            value={form.yearOfPurchase}
            onChange={(e) => setForm({ ...form, yearOfPurchase: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="e.g. 2024"
          />
        </div>

        {/* Exchange Preference */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Preference</label>
          <div className="flex flex-wrap gap-2">
            {EXCHANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleExchangePref(opt.value)}
                className={`py-2 px-4 rounded-full border text-sm font-medium transition-colors ${
                  exchangePrefs.includes(opt.value)
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Book Items */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Books</label>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-700">Book {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={item.subject}
                    onChange={(e) => updateItem(index, 'subject', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                    placeholder="Subject (e.g. Mathematics) *"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Book title (optional)"
                    />
                    <input
                      type="text"
                      value={item.publisher}
                      onChange={(e) => updateItem(index, 'publisher', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                      placeholder="Publisher (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 text-green-600 text-sm font-medium hover:text-green-700"
          >
            + Add another book
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={createListing.isPending}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createListing.isPending ? 'Creating...' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
