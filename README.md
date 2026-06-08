# TyreCRM — Backend

REST API для CRM-системи шинного магазину.

**Стек:** Node.js, Express 5, TypeScript, Prisma 6, PostgreSQL

---

## Вимоги

- [Node.js](https://nodejs.org/) v18+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## Запуск локально

### 1. Клонувати репозиторій

```bash
git clone <repo-url>
cd TyreCRMBack
```

### 2. Встановити залежності

```bash
npm install
```

### 3. Створити файл `.env`

```bash
cp .env.example .env
```

> За замовчуванням налаштування відповідають `docker-compose.yml`. Змінювати не потрібно якщо використовуєш локальний Docker.

### 4. Запустити базу даних

```bash
docker compose up -d
```

Перевірити що контейнер працює:

```bash
docker ps
```

### 5. Застосувати міграції

```bash
npm run prisma:migrate
```

При першому запуску Prisma запитає назву міграції — введи `init`.

### 6. Запустити сервер

```bash
npm run dev
```

Сервер буде доступний на [http://localhost:3001](http://localhost:3001)

---

## Змінні середовища

| Змінна | Опис | Приклад |
|---|---|---|
| `DATABASE_URL` | Рядок підключення до PostgreSQL | `postgresql://user:pass@localhost:5432/tyre_crm` |
| `PORT` | Порт сервера (необов'язково, за замовчуванням 3001) | `3001` |

---

## Скрипти

| Команда | Опис |
|---|---|
| `npm run dev` | Запуск у режимі розробки з hot-reload |
| `npm run build` | Компіляція TypeScript |
| `npm run start` | Запуск зібраного проекту |
| `npm run prisma:migrate` | Застосувати міграції |
| `npm run prisma:generate` | Перегенерувати Prisma Client |
| `npm run prisma:seed` | Заповнити БД тестовими даними |

---

## Зупинити базу даних

```bash
docker compose down
```

Зупинити та видалити дані:

```bash
docker compose down -v
```
