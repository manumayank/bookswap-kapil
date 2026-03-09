'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Users, BookOpen, ClipboardList, ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.isAdmin) {
      router.replace('/login');
    }
  }, [isAuthenticated, user, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await api.get('/admin/stats');
      return data.data;
    },
    enabled: !!user?.isAdmin,
  });

  const statCards = [
    {
      label: 'Total Users',
      value: stats?.totalUsers ?? '-',
      icon: Users,
      color: 'text-[var(--primary)]',
      bg: 'bg-[var(--primary)]/10',
    },
    {
      label: 'Active Listings',
      value: stats?.activeListings ?? '-',
      icon: BookOpen,
      color: 'text-[var(--secondary)]',
      bg: 'bg-[var(--secondary)]/10',
    },
    {
      label: 'Pending Listings',
      value: stats?.pendingListings ?? '-',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Open Requests',
      value: stats?.openRequests ?? '-',
      icon: ClipboardList,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Deals',
      value: stats?.deals ?? '-',
      icon: ShoppingBag,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Completed Deals',
      value: stats?.completedDeals ?? '-',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-600/10',
    },
  ];

  if (!user?.isAdmin) return null;

  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Dashboard</h1>
        <p className="text-[var(--muted)]">Overview of your BookSwap platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card-premium p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-[var(--radius-md)] ${stat.bg} flex items-center justify-center`}>
                  <Icon size={22} className={stat.color} />
                </div>
                <div>
                  <div className="text-2xl font-black">
                    {isLoading ? (
                      <span className="inline-block w-8 h-6 bg-[var(--muted-extra-light)] rounded animate-pulse" />
                    ) : (
                      stat.value
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/admin/listings" className="card-premium p-8 group cursor-pointer">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-amber-500/10 flex items-center justify-center">
              <Clock size={20} className="text-amber-500" />
            </div>
            <h2 className="text-lg font-extrabold group-hover:text-[var(--primary)] transition-colors">
              Moderation Queue
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)] ml-14">
            Review and approve pending listings before they go live.
            {stats?.pendingListings > 0 && (
              <span className="ml-2 badge badge-primary">{stats.pendingListings} pending</span>
            )}
          </p>
        </Link>

        <Link href="/admin/users" className="card-premium p-8 group cursor-pointer">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 flex items-center justify-center">
              <Users size={20} className="text-[var(--primary)]" />
            </div>
            <h2 className="text-lg font-extrabold group-hover:text-[var(--primary)] transition-colors">
              Manage Users
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)] ml-14">
            View registered users, their activity, and manage accounts.
          </p>
        </Link>
      </div>
    </div>
  );
}
