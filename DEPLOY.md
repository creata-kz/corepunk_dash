# Инструкции по деплою

## Деплой на GitHub

### 1. Создание репозитория на GitHub

1. Перейдите на [GitHub.com](https://github.com)
2. Нажмите "New repository"
3. Заполните:
   - **Repository name:** `corepunk-command-center`
   - **Description:** `Corepunk Command Center - AI-powered gaming dashboard`
   - **Visibility:** Public или Private (на ваш выбор)
4. НЕ инициализируйте с README, .gitignore или лицензией (они уже есть)
5. Нажмите "Create repository"

### 2. Подключение локального репозитория к GitHub

```bash
# Добавьте remote origin (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/corepunk-command-center.git

# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите код на GitHub
git push -u origin main
```

## Деплой на Netlify

### Вариант 1: Автоматический деплой через GitHub

1. **Подключение к GitHub:**
   - Перейдите на [Netlify.com](https://netlify.com)
   - Войдите в аккаунт
   - Нажмите "New site from Git"
   - Выберите "GitHub" и авторизуйтесь
   - Выберите репозиторий `corepunk-command-center`

2. **Настройка сборки:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `18`

3. **Переменные окружения:**
   - Перейдите в Site settings → Environment variables
   - Добавьте переменную:
     - **Key:** `GEMINI_API_KEY`
     - **Value:** ваш API ключ Google Gemini

4. **Деплой:**
   - Нажмите "Deploy site"
   - Netlify автоматически соберет и задеплоит ваш сайт

### Вариант 2: Ручной деплой

1. **Сборка проекта:**
   ```bash
   npm run build
   ```

2. **Загрузка на Netlify:**
   - Перейдите на [Netlify.com](https://netlify.com)
   - Перетащите папку `dist/` в область "Deploy manually"
   - Сайт будет доступен по сгенерированному URL

### Настройка домена (опционально)

1. В панели Netlify перейдите в "Domain settings"
2. Добавьте ваш кастомный домен
3. Настройте DNS записи согласно инструкциям Netlify

## Переменные окружения

### Для локальной разработки

Создайте файл `.env.local`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Для Netlify

В панели Netlify → Site settings → Environment variables:
- `GEMINI_API_KEY` = ваш API ключ

## Получение API ключа Google Gemini

1. Перейдите на [Google AI Studio](https://ai.google.dev/)
2. Войдите в Google аккаунт
3. Создайте новый проект
4. Получите API ключ
5. Добавьте его в переменные окружения

## Проверка деплоя

После деплоя проверьте:
- ✅ Сайт загружается без ошибок
- ✅ AI-чат работает (требует API ключ)
- ✅ Все компоненты отображаются корректно
- ✅ Графики и диаграммы работают

## Обновление сайта

При каждом push в main ветку GitHub, Netlify автоматически:
1. Клонирует репозиторий
2. Устанавливает зависимости
3. Собирает проект
4. Деплоит обновленную версию

## Troubleshooting

### Ошибки сборки
- Проверьте, что все зависимости установлены
- Убедитесь, что Node.js версии 18+
- Проверьте логи сборки в Netlify

### Проблемы с API
- Убедитесь, что API ключ правильно настроен
- Проверьте, что ключ активен в Google AI Studio
- Проверьте переменные окружения в Netlify

### Проблемы с роутингом
- Убедитесь, что в `netlify.toml` настроены redirects
- Проверьте, что SPA роутинг работает корректно
