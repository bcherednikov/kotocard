'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RegisterSuccessPage() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    const registeredEmail = localStorage.getItem('registered_email');
    if (registeredEmail) {
      setEmail(registeredEmail);
      localStorage.removeItem('registered_email');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Регистрация успешна!
          </h1>
          <p className="text-xl text-gray-800 mb-8">
            Ваш аккаунт создан. Теперь войдите чтобы добавить детей и начать использовать приложение.
          </p>
        </div>

        {email && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-blue-900 text-center">
              <strong>Email:</strong> {email}
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/login"
            className="block w-full py-4 bg-blue-600 text-white text-center rounded-lg font-semibold text-lg hover:bg-blue-700 transition"
          >
            Войти в аккаунт
          </Link>
        </div>

        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <strong>✅ Что дальше?</strong>
          </p>
          <ul className="text-sm text-green-700 mt-2 space-y-1">
            <li>• Войдите с вашим email и паролем</li>
            <li>• Добавьте профили детей</li>
            <li>• Начните создавать наборы карточек</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
