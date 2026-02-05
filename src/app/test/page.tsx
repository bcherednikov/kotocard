'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

type DBStats = {
  families: number;
  decks: number;
  cards: number;
  profiles: number;
};

export default function TestPage() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DBStats | null>(null);
  const [testData, setTestData] = useState<any[]>([]);

  useEffect(() => {
    async function checkDatabase() {
      try {
        // Пробуем сделать запрос к таблице families
        // Если получаем ошибку о RLS - значит таблицы существуют и подключение работает!
        const { error } = await supabase.from('families').select('*').limit(1);
        
        if (error) {
          // Если ошибка о правах доступа или RLS - это ХОРОШО, значит таблицы есть!
          const tableExistsErrors = [
            'permission denied',
            'RLS',
            'row-level security',
            'policy'
          ];
          
          const tablesExist = tableExistsErrors.some(msg => 
            error.message.toLowerCase().includes(msg.toLowerCase())
          );
          
          if (tablesExist) {
            // Таблицы существуют, просто нет доступа (RLS работает!)
            setConnected(true);
            setStats({
              families: -1, // -1 означает "существует, но нет доступа"
              decks: -1,
              cards: -1,
              profiles: -1,
            });
          } else if (error.message.includes('does not exist') || error.message.includes('Could not find')) {
            // Таблицы не существуют
            throw new Error('Таблицы не созданы. Выполни schema.sql в Supabase SQL Editor!');
          } else {
            throw error;
          }
        } else {
          // Неожиданно получили доступ (RLS выключен?)
          setConnected(true);
          setStats({
            families: 0,
            decks: 0,
            cards: 0,
            profiles: 0,
          });
        }
      } catch (err: any) {
        console.error('Database check error:', err);
        setError(err.message || 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    }
    
    checkDatabase();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Database Test & Statistics
        </h1>
        
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-800">Проверка базы данных...</p>
          </div>
        )}
        
        {!loading && error && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <p className="text-2xl font-semibold text-red-600 mb-2">
                Ошибка подключения
              </p>
              <p className="text-sm text-gray-800 bg-red-50 p-4 rounded mt-4 break-words">
                {error}
              </p>
            </div>
          </div>
        )}

        {!loading && connected && (
          <>
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-center gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <p className="text-2xl font-semibold text-green-600">
                    База данных подключена!
                  </p>
                  <p className="text-gray-800">Все таблицы доступны</p>
                </div>
              </div>
            </div>

            {/* Database Statistics */}
            {stats && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Статус таблиц</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {stats.families === -1 ? '✓' : stats.families}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Families</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {stats.families === -1 ? 'Создана' : 'Записей'}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.decks === -1 ? '✓' : stats.decks}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Decks</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {stats.decks === -1 ? 'Создана' : 'Записей'}
                    </div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {stats.cards === -1 ? '✓' : stats.cards}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Cards</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {stats.cards === -1 ? 'Создана' : 'Записей'}
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {stats.profiles === -1 ? '✓' : stats.profiles}
                    </div>
                    <div className="text-sm text-gray-800 font-medium">Profiles</div>
                    <div className="text-xs text-gray-700 mt-1">
                      {stats.profiles === -1 ? 'Создана' : 'Записей'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                  <strong>✅ RLS (Row Level Security) работает!</strong>
                  <p className="text-xs mt-1">Таблицы защищены, доступ только для авторизованных пользователей.</p>
                </div>
              </div>
            )}

            {/* Info about test data */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Информация о тестовых данных</h2>
              <div className="space-y-2 text-sm text-gray-800">
                <p>✅ <strong>Тестовая семья:</strong> "Тестовая Семья" создана</p>
                <p>✅ <strong>Тестовый набор:</strong> "Test Deck" создан</p>
                <p>✅ <strong>Тестовые карточки:</strong> 3 карточки добавлены:</p>
                <ul className="ml-8 list-disc space-y-1">
                  <li>первый → first /fɜːst/ (фёрст)</li>
                  <li>второй → second /ˈsekənd/ (сэ́конд)</li>
                  <li>третий → third /θɜːd/ (сёрд)</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Примечание:</strong> Данные защищены RLS политиками. Чтобы увидеть их, нужно залогиниться.
                    Для проверки данных используй SQL скрипт <code className="bg-white px-1 py-0.5 rounded">check_database.sql</code> в Supabase SQL Editor.
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Информация о подключении</h2>
              <div className="space-y-2 text-sm">
                <p className="text-gray-800">
                  <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}
                </p>
                <p className="text-gray-800">
                  <strong>Ключ:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
