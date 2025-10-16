# Подключение Supabase к Dashboard

## ✅ Что уже сделано:

1. ✅ Создан `supabaseService.ts` с методами для получения данных
2. ✅ Добавлена зависимость `@supabase/supabase-js` в `package.json`
3. ✅ Настроен `vite.config.ts` для передачи env переменных
4. ✅ Создан `.env.example` с примером конфигурации
5. ✅ Исправлена ошибка в `geminiService.ts`
6. ✅ Создан пустой `index.css`

---

## 🚀 Быстрый старт

### 1. Установите зависимости

```bash
cd /Users/maru/Desktop/Work/MyProjects/CorePunk/Collectors/corepunk_dash
npm install
```

### 2. Создайте файл `.env.local`

```bash
cp .env.example .env.local
```

### 3. Заполните переменные окружения

Откройте `.env.local` и укажите реальные значения:

```env
# Google Gemini AI (опционально для AI чата)
GEMINI_API_KEY=your_actual_gemini_api_key

# Supabase (обязательно для реальных данных)
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

**Как получить ключи Supabase:**
1. Откройте ваш проект в [Supabase Dashboard](https://app.supabase.com)
2. Перейдите в **Settings → API**
3. Скопируйте:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public key** → `SUPABASE_ANON_KEY`

### 4. Запустите дашборд

```bash
npm run dev
```

Откройте [http://localhost:5173](http://localhost:5173)

---

## 📊 Методы Supabase Service

### Доступные методы:

```typescript
// Проверить подключение
supabaseService.isConnected(): boolean

// Получить метрики по дням
supabaseService.getDailyMetrics(days: number): Promise<DailyMetric[]>

// Получить snapshot метрики
supabaseService.getSnapshotMetrics(days: number): Promise<DailyMetric[]>

// Получить активности (релизы, события и т.д.)
supabaseService.getActivities(days: number): Promise<ProductionActivity[]>

// Получить комментарии
supabaseService.getComments(days: number): Promise<Comment[]>

// Получить статистику по платформам
supabaseService.getPlatformStats(): Promise<Record<string, any>>
```

---

## 🔌 Интеграция с компонентами

### Пример использования в App.tsx:

```typescript
import { supabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [allMetrics, setAllMetrics] = useState<DailyMetric[]>([]);
  const [allActivities, setAllActivities] = useState<ProductionActivity[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      if (supabaseService.isConnected()) {
        // Загружаем реальные данные из Supabase
        const [metrics, activities, comments] = await Promise.all([
          supabaseService.getSnapshotMetrics(90),
          supabaseService.getActivities(90),
          supabaseService.getComments(90)
        ]);

        setAllMetrics(metrics);
        setAllActivities(activities);
        setAllComments(comments);
      } else {
        // Используем mock данные
        const initialActivities = generateInitialActivities();
        const initialMetrics = generateMetrics(initialActivities, 90);
        const initialComments = generateComments(initialActivities);

        setAllActivities(initialActivities);
        setAllMetrics(initialMetrics);
        setAllComments(initialComments);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // ... rest of component
}
```

---

## 🗄️ Требуемая SQL функция

Для работы метода `getDailyMetrics()` нужно создать функцию в Supabase:

```sql
-- Создайте эту функцию в SQL Editor вашего Supabase проекта

CREATE OR REPLACE FUNCTION get_daily_metrics(
  start_date TIMESTAMPTZ,
  days_count INTEGER
)
RETURNS TABLE (
  date TEXT,
  dau BIGINT,
  revenue NUMERIC,
  retention NUMERIC,
  negative_comments BIGINT,
  likes BIGINT,
  shares BIGINT,
  reach BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(event_timestamp)::TEXT as date,
    COUNT(DISTINCT user_id) as dau,
    COALESCE(SUM(CASE WHEN event_type = 'purchase' THEN value ELSE 0 END), 0) as revenue,
    0::NUMERIC as retention, -- TODO: calculate retention
    COUNT(CASE WHEN event_type LIKE '%comment%'
               AND (properties->>'sentiment' = 'Negative'
                    OR properties->>'sentiment' = 'negative')
          THEN 1 END) as negative_comments,
    COUNT(CASE WHEN event_type LIKE '%like%' OR event_type LIKE '%favorite%' THEN 1 END) as likes,
    COUNT(CASE WHEN event_type LIKE '%share%' OR event_type LIKE '%repost%' OR event_type LIKE '%retweet%' THEN 1 END) as shares,
    COALESCE(SUM(CASE WHEN event_type LIKE '%view%' THEN value ELSE 0 END), 0) as reach
  FROM events
  WHERE event_timestamp >= start_date
    AND is_deleted = FALSE
  GROUP BY DATE(event_timestamp)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔍 Отладка

### Проверить подключение к Supabase:

Откройте DevTools → Console и выполните:

```javascript
import { supabaseService } from './services/supabaseService';

// Проверить подключение
console.log('Connected:', supabaseService.isConnected());

// Получить метрики
supabaseService.getSnapshotMetrics(7).then(data => {
  console.log('Metrics:', data);
});

// Получить статистику
supabaseService.getPlatformStats().then(stats => {
  console.log('Platform stats:', stats);
});
```

### Частые проблемы:

**1. Ошибка: "Invalid API key"**
- Проверьте, что `SUPABASE_ANON_KEY` скопирован правильно из Supabase Dashboard

**2. Ошибка: "Network request failed"**
- Проверьте `SUPABASE_URL` - должен начинаться с `https://`
- Убедитесь, что проект Supabase активен

**3. Пустые данные**
- Убедитесь, что коллекторы уже собрали данные в БД
- Проверьте RLS (Row Level Security) политики в Supabase

---

## 📝 Следующие шаги

1. ✅ Установить зависимости: `npm install`
2. ✅ Создать `.env.local` с реальными ключами
3. ⏳ Создать SQL функцию `get_daily_metrics` в Supabase
4. ⏳ Адаптировать `App.tsx` для использования `supabaseService`
5. ⏳ Протестировать подключение
6. ⏳ Запустить дашборд: `npm run dev`

---

## 🎯 Режимы работы

Dashboard поддерживает 2 режима:

### 1. Demo Mode (без Supabase)
Используется, если переменные `SUPABASE_URL` или `SUPABASE_ANON_KEY` не заданы.
Показывает mock данные из `mockDataService.ts`.

### 2. Production Mode (с Supabase)
Используется, если переменные заданы корректно.
Показывает реальные данные из базы Supabase.

---

**Готово!** Supabase сервис создан и настроен. Осталось только подключить его в компонентах.
