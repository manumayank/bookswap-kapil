'use client';

import { useQuery } from '@tanstack/react-query';

export default function Admin${page^}Page() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-${page}'],
    queryFn: async () => ({ data: [] }),
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">${page^}</h1>
      <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
        TODO: Implement ${page} management
      </div>
    </div>
  );
}
