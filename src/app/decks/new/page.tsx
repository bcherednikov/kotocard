'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function NewDeckPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!profile) {
        throw new Error('Профиль не загружен');
      }

      const tags = tagsInput
        .split(/[,\s]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const insertData = {
        name,
        description: description || null,
        tags,
        owner_id: profile.id,
      };

      const { data, error: insertError } = await supabase
        .from('decks')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/decks/${data.id}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка создания набора');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Создать новый набор"
          back="/decks"
          description="Заполните информацию о наборе карточек"
        />

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Название набора *"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Английские слова для детей"
                required
                disabled={loading}
              />

              <Textarea
                label="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание набора (необязательно)"
                rows={4}
                disabled={loading}
              />

              <Input
                label="Теги"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="английский, начинающий, дети (через запятую)"
                helper="Введите теги через запятую или пробел"
                disabled={loading}
              />

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/decks')}
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  {loading ? 'Создаём...' : 'Создать набор'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
