# HeadphoneWeb 🎧

An e-commerce platform for premium headphones built with Next.js.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- Stripe CLI (for payment processing)

### Database Setup

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# headphoneweb

psql
database = headphoneweb all privileges
user = myuser
password  = mypassword

psql command: psql -d headphoneweb -U myuser

Stripe web hook listener command local = stripe listen --forward-to localhost:3000/api/stripe/webhook

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd headphoneweb
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Start Stripe webhook listener (in a separate terminal):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Database**: PostgreSQL
- **Payment Processing**: Stripe
- **Styling**: Tailwind CSS
- **Font**: Geist (via next/font)

## 📚 Documentation

For more information about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Next.js Learning Guide](https://nextjs.org/learn)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Stripe Documentation](https://stripe.com/docs)

## 🚀 Deployment

Deploy easily with [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the platform from the creators of Next.js.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](your-issues-url).

## 📝 License

This project is licensed under the [MIT License](LICENSE).
