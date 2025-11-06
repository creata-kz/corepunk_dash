# 🌐 Apify Social Media Integration

Интеграция с Apify для автоматического сбора данных из социальных сетей: Twitter, Instagram и TikTok.

## 📋 Содержание

- [Настройка](#настройка)
- [Использование](#использование)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Настройка

### 1. Получите API ключ Apify

1. Зарегистрируйтесь на [Apify.com](https://apify.com/)
2. Перейдите в [Settings → Integrations](https://console.apify.com/account/integrations)
3. Скопируйте ваш **API Token**

### 2. Добавьте API ключ в `.env`

Создайте файл `.env` в корне проекта (если его нет) и добавьте:

```env
APIFY_API_KEY=your_apify_api_token_here
```

### 3. Проверьте настройку

Запустите dashboard и проверьте консоль:
```bash
npm run dev
```

Вы должны увидеть:
```
✅ Apify service initialized
```

---

## 🚀 Использование

### Автоматический сбор данных

Запустите скрипт для сбора данных со всех платформ:

```bash
# Сбор данных с дефолтными настройками (keyword: "Corepunk", max: 50)
npm run collect-data

# Указать свой ключевик
npm run collect-data -- --keyword "YourGameName"

# Указать максимальное количество постов на платформу
npm run collect-data -- --max 100

# Комбинация параметров
npm run collect-data -- --keyword "Corepunk" --max 200
```

### Программное использование

Импортируйте сервис в своем коде:

```typescript
import { apifyService } from './services/apifyService';

// Сбор данных с Twitter
const twitterPosts = await apifyService.collectTwitterPosts('Corepunk', 100);

// Сбор данных с Instagram
const instagramPosts = await apifyService.collectInstagramPosts('Corepunk', 100);

// Сбор данных с TikTok
const tiktokPosts = await apifyService.collectTikTokPosts('Corepunk', 100);

// Сбор со всех платформ сразу (параллельно)
const allPosts = await apifyService.collectAllPlatforms('Corepunk', 50);
```

---

## 📚 API Reference

### `apifyService.collectTwitterPosts(keyword, maxPosts)`

Собирает посты из Twitter по ключевому слову.

**Параметры:**
- `keyword` (string) - Ключевое слово для поиска
- `maxPosts` (number) - Максимальное количество постов (default: 100)

**Возвращает:** `Promise<Comment[]>`

**Пример:**
```typescript
const tweets = await apifyService.collectTwitterPosts('Corepunk', 50);
console.log(`Collected ${tweets.length} tweets`);
```

---

### `apifyService.collectInstagramPosts(hashtag, maxPosts)`

Собирает посты из Instagram по хэштегу.

**Параметры:**
- `hashtag` (string) - Хэштег для поиска (без символа #)
- `maxPosts` (number) - Максимальное количество постов (default: 100)

**Возвращает:** `Promise<Comment[]>`

**Пример:**
```typescript
const posts = await apifyService.collectInstagramPosts('corepunk', 50);
```

---

### `apifyService.collectTikTokPosts(keyword, maxPosts)`

Собирает видео из TikTok по ключевому слову.

**Параметры:**
- `keyword` (string) - Ключевое слово для поиска
- `maxPosts` (number) - Максимальное количество видео (default: 100)

**Возвращает:** `Promise<Comment[]>`

**Пример:**
```typescript
const videos = await apifyService.collectTikTokPosts('Corepunk', 50);
```

---

### `apifyService.collectAllPlatforms(keyword, maxPerPlatform)`

Собирает данные со всех платформ параллельно.

**Параметры:**
- `keyword` (string) - Ключевое слово для поиска
- `maxPerPlatform` (number) - Максимум постов на платформу (default: 50)

**Возвращает:** `Promise<Comment[]>`

**Пример:**
```typescript
const allData = await apifyService.collectAllPlatforms('Corepunk', 30);
// allData = [...twitterPosts, ...instagramPosts, ...tiktokPosts]
```

---

### `apifyService.isConnected()`

Проверяет, настроен ли Apify API ключ.

**Возвращает:** `boolean`

**Пример:**
```typescript
if (apifyService.isConnected()) {
  console.log('Apify is ready!');
} else {
  console.log('Please add APIFY_API_KEY to .env');
}
```

---

## 🔍 Формат данных

Все методы возвращают массив объектов типа `Comment`:

```typescript
interface Comment {
  id: number;
  activityId: number;
  text: string;          // Текст поста
  author: string;        // Автор (username)
  sentiment: Sentiment;  // AI-анализ: "Positive" | "Negative" | "Neutral"
  userType: "Viewer";
  source: string;        // "Twitter" | "Instagram" | "Tiktok"
  timestamp: string;     // ISO дата создания
  metadata: {
    score: number;       // Likes/upvotes
    likes: number;
    views?: number;      // Количество просмотров (если доступно)
    url: string;         // Ссылка на пост
    is_post: true;
    post_id: string;     // ID поста на платформе
  };
}
```

---

## 🐛 Troubleshooting

### "Apify API key not configured"

**Проблема:** API ключ не найден в `.env`

**Решение:**
1. Проверьте, что файл `.env` существует в корне проекта
2. Убедитесь, что переменная называется `APIFY_API_KEY`
3. Перезапустите dev сервер после изменения `.env`

---

### "Failed to start actor"

**Проблема:** Не удалось запустить Apify actor

**Возможные причины:**
1. Неверный API ключ
2. Недостаточно credits на аккаунте Apify
3. Actor ID изменился (обновите в `apifyService.ts`)

**Решение:**
- Проверьте баланс на [Apify Dashboard](https://console.apify.com/)
- Проверьте корректность API ключа
- Проверьте актуальные Actor IDs в документации Apify

---

### "Run timed out"

**Проблема:** Сбор данных занимает слишком много времени

**Решение:**
- Уменьшите `maxPosts` параметр
- Увеличьте `maxWaitTime` в методе `waitForRun()` (по умолчанию 5 минут)

---

### Нет данных по sentiment

**Проблема:** Все посты имеют sentiment "Neutral"

**Решение:**
- Убедитесь, что `GEMINI_API_KEY` настроен в `.env`
- Без Gemini AI используется keyword-based fallback анализ
- Проверьте консоль на ошибки AI анализа

---

## 💡 Best Practices

### Оптимизация расходов

1. **Начните с малого:** Используйте `maxPosts: 10-20` для тестов
2. **Кэшируйте результаты:** Сохраняйте в Supabase, не собирайте заново
3. **Используйте расписание:** Запускайте сбор 1-2 раза в день, не каждый час

### Качество данных

1. **AI Sentiment:** Всегда используйте Gemini для точного анализа настроений
2. **Фильтрация:** Фильтруйте спам и нерелевантные посты перед сохранением
3. **Дедупликация:** Проверяйте `post_id` чтобы избежать дубликатов

---

## 📊 Использованные Apify Actors

- **Twitter:** `apidojo/tweet-scraper`
- **Instagram:** `apify/instagram-hashtag-scraper`
- **TikTok:** `clockworks/tiktok-scraper`

**Note:** Actor IDs могут измениться. Проверяйте актуальные на [Apify Store](https://apify.com/store).

---

## 🔗 Полезные ссылки

- [Apify Documentation](https://docs.apify.com/)
- [Apify API Reference](https://docs.apify.com/api/v2)
- [Apify Pricing](https://apify.com/pricing)
- [Twitter Scraper Actor](https://apify.com/apidojo/tweet-scraper)
- [Instagram Scraper Actor](https://apify.com/apify/instagram-hashtag-scraper)
- [TikTok Scraper Actor](https://apify.com/clockworks/tiktok-scraper)

---

## 🤝 Support

Если возникли проблемы:
1. Проверьте [Troubleshooting](#troubleshooting)
2. Посмотрите логи в консоли браузера и терминале
3. Проверьте [Apify Status Page](https://status.apify.com/)
