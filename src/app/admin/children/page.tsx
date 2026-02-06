'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

type Child = {
  id: string;
  display_name: string;
  created_at: string;
  email: string;
  last_sign_in_at: string | null;
};

export default function ChildrenPage() {
  const { profile } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadChildren();
    }
  }, [profile]);

  async function loadChildren() {
    if (!profile) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Сессия не найдена');

      const response = await fetch('/api/get-children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyId: profile.family_id,
          parentToken: session.access_token
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка загрузки');
      }

      setChildren(result.children || []);
    } catch (err) {
      console.error('Ошибка загрузки детей:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(childId: string, childName: string) {
    if (!confirm(`Удалить профиль "${childName}"? Это действие нельзя отменить!`)) {
      return;
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', childId);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.admin.deleteUser(childId);

      loadChildren();
    } catch (err: any) {
      alert(err.message || 'Ошибка удаления');
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Дети
            </h1>
            <p className="text-gray-700 mt-1">
              Управляйте профилями ваших детей
            </p>
          </div>
          <Link
            href="/admin/children/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            + Добавить ребёнка
          </Link>
        </div>

        {children.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">👶</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Пока нет детей
            </h2>
            <p className="text-gray-700 mb-6">
              Добавьте профили для ваших детей
            </p>
            <Link
              href="/admin/children/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Добавить первого ребёнка
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-4xl">👤</div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          {child.display_name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {child.email || 'Email не найден'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Создан:</span>{' '}
                        {new Date(child.created_at).toLocaleDateString('ru-RU')}
                      </div>
                      {child.last_sign_in_at && (
                        <div>
                          <span className="font-medium">Последний вход:</span>{' '}
                          {new Date(child.last_sign_in_at).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/children/${child.id}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                      Изменить
                    </Link>
                    <button
                      onClick={() => handleDelete(child.id, child.display_name)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
