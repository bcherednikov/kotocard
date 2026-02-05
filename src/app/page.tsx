export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-5xl font-bold mb-4 text-gray-900">
            Добро пожаловать в KotoCard
          </h1>
          <p className="text-xl text-gray-800 mb-8">
            Персональное семейное приложение для изучения английского языка через карточки
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/login" 
              className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              Войти
            </a>
            <a 
              href="/register" 
              className="inline-block px-8 py-4 border-2 border-blue-600 text-blue-600 text-lg font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Создать аккаунт
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">👨‍👩‍👧‍👦</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Для всей семьи</h3>
            <p className="text-gray-700">
              Родители создают наборы карточек, дети учатся и отслеживают прогресс
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Эффективное обучение</h3>
            <p className="text-gray-700">
              Карточки с транскрипциями, озвучкой и отслеживанием прогресса
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">Статистика</h3>
            <p className="text-gray-700">
              Следите за успехами детей, повторяйте сложные слова
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-800">
            <strong>✅ Phase 0 завершена!</strong> База данных создана, приложение готово к разработке функций.
          </p>
          <p className="text-sm text-green-700 mt-2">
            Следующий этап: Аутентификация и создание профилей
          </p>
        </div>
      </div>
    </div>
  );
}
