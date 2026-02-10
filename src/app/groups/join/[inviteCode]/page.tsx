'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinGroupPage() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { profile, user } = useAuth();
  const router = useRouter();

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ group_id: string; group_name: string } | null>(null);

  async function handleJoin() {
    if (!profile) return;
    setError('');
    setJoining(true);

    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode, userId: profile.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.group_id) {
          // Уже в группе — просто перенаправить
          router.push(`/groups/${data.group_id}`);
          return;
        }
        throw new Error(data.error);
      }

      setSuccess({ group_id: data.group_id, group_name: data.group_name });
    } catch (err: any) {
      setError(err.message || 'Ошибка вступления');
    } finally {
      setJoining(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Приглашение в группу</h1>
          <p className="text-gray-700 mb-6">Войдите или зарегистрируйтесь, чтобы вступить в группу</p>
          <div className="flex gap-3">
            <Link href="/login" className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-center">
              Войти
            </Link>
            <Link href="/register" className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-center">
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Вы в группе!</h1>
          <p className="text-gray-700 mb-6">
            Вы вступили в группу <strong>{success.group_name}</strong>
          </p>
          <Link
            href={`/groups/${success.group_id}`}
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
          >
            Перейти к группе
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="text-6xl mb-4">👥</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Приглашение в группу</h1>
        <p className="text-gray-700 mb-6">
          Вы приглашены в группу. Нажмите кнопку, чтобы вступить.
        </p>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handleJoin}
          disabled={joining}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50"
        >
          {joining ? 'Вступаем...' : 'Вступить в группу'}
        </button>

        <div className="mt-4">
          <Link href="/groups" className="text-gray-500 hover:text-gray-700 text-sm">
            Назад к моим группам
          </Link>
        </div>
      </div>
    </div>
  );
}
