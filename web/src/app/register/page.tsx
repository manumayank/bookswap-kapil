'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

const BOARDS = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { verifiedEmail, register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    board: 'CBSE' as string,
  });
  const [error, setError] = useState('');

  // Redirect to login if no verified email
  if (!verifiedEmail && typeof window !== 'undefined') {
    router.replace('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name || form.name.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!form.phone || form.phone.length < 10) {
      setError('Phone must be at least 10 digits');
      return;
    }
    if (!form.city || form.city.length < 2) {
      setError('City is required');
      return;
    }

    try {
      await register({ ...form, email: verifiedEmail });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-green-600">
            BookSwap
          </Link>
          <p className="text-gray-600 mt-2">Complete your profile</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            Registering as <span className="font-medium">{verifiedEmail}</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Your name"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="10-digit phone number"
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                value={form.city}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Your city"
              />
            </div>

            <div>
              <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-1">
                School Board
              </label>
              <select
                id="board"
                name="board"
                value={form.board}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              >
                {BOARDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
