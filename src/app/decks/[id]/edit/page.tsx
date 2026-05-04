'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';

export default function EditDeckPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = params.id as string;
  const { profile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile && deckId) loadDeck();
  }, [profile, deckId]);

  async function loadDeck() {
    try {
      const { data, error: fetchError } = await supabase
        .from('decks')
        .select('id, name, description, tags')
        .eq('id', deckId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) { setError('Набор не найден'); return; }

      setName(data.name ?? '');
      setDescription(data.description ?? '');
      setTagsInput(Array.isArray(data.tags) ? data.tags.join(', ') : '');
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить набор');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const tags = tagsInput.split(/[,\s]+/).map(t => t.trim()).filter(t => t.length > 0);

      const { error: updateError } = await supabase
        .from('decks')
        .update({ name: name.trim(), description: description.trim() || null, tags, updated_at: new Date().toISOString() })
        .eq('id', deckId);

      if (updateError) throw updateError;
      router.push(`/decks/${deckId}`);
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl text-gray-800">Загрузка...</p>
      </div>
    );
  }

  if (error && !name) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">&#10060;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Набор не найден</h1>
        <Link href="/decks" className="text-[#057A55] hover:underline font-medium">← Вернуться к наборам</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Редактировать набор"
          back={`/decks/${deckId}`}
          description="Измените название, описание или теги"
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
                disabled={saving}
              />

              <Textarea
                label="Описание"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание набора (необязательно)"
                rows={4}
                disabled={saving}
              />

              <Input
                label="Теги"
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="английский, начинающий, дети (через запятую)"
                helper="Введите теги через запятую или пробел"
                disabled={saving}
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
                  onClick={() => router.push(`/decks/${deckId}`)}
                  disabled={saving}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={saving}
                >
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
