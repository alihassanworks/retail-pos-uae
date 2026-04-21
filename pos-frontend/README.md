# POS Frontend (Next.js)

Frontend app for the UAE Retail POS and Inventory Management System.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Redux Toolkit + React Redux
- Tailwind CSS
- React Hook Form
- Chart.js (`react-chartjs-2`)
- Axios

## Pages

- `/login`
- `/dashboard`
- `/pos`
- `/products`
- `/orders`
- `/reports`

## Implemented Features

- API-based login flow
- Session persistence (localStorage)
- Protected private layout
- POS screen:
  - product search
  - SKU input
  - cart quantity updates
  - discount + VAT live calculation
  - cash/card/split payments
  - checkout request to backend
- Dashboard:
  - KPI cards
  - revenue trend chart
  - top products
  - recent transactions
- Reports:
  - date range filters
  - summary cards
  - transactions table
  - CSV export download

## Local Setup

1. Install dependencies:

```bash
npm install
```
`

2. Configure backend API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

4. Run dev server:

```bash
npm run dev
```

App runs on [http://localhost:3000].

## Quality Checks

```bash
npm run lint
```
