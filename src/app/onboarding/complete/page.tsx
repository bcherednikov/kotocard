'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [parentEmail, setParentEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('onboarding_complete_email');
    if (email) {
      setParentEmail(email);
      localStorage.removeItem('onboarding_complete_email');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Отлично! Дети созданы!
          </h1>
          <p className="text-xl text-gray-800 mb-8">
            Все профили успешно созданы. Теперь войдите в свой аккаунт родителя.
          </p>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
          <p className="text-green-900 text-center font-medium">
            ✅ Onboarding завершён!
          </p>
          {parentEmail && (
            <p className="text-sm text-green-800 text-center mt-2">
              Войдите с email: <strong>{parentEmail}</strong>
            </p>
          )}
        </div>

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-4 bg-blue-600 text-white text-center rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          >
            Войти в аккаунт
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Что дальше?</strong>
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• Войдите как родитель → перейдёте на панель управления</li>
            <li>• Войдите как ребёнок → перейдёте на страницу обучения</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
