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

## Test Status Summary

The project has comprehensive test coverage using both Jest (unit tests) and Cypress (integration and E2E tests).

### Test Status by Feature

| Test Case | Priority | Type | Feature | Status | Notes |
|-----------|----------|------|---------|--------|-------|
| #1 | High | Unit | AdminAPI Authentication | PASS | Implemented login/logout with proper session handling |
| #2 | High | Unit | AdminAPI Message Management | PASS | Implemented message management API tests |
| #3 | High | Integration | Admin Authentication (Login) | PASS | Fixed implementation in Cypress tests |
| #4 | High | Integration | Admin Session Management | PASS | Session persistence verified in tests |
| #6 | High | System | Admin Dashboard Message Management | PASS | Contact message management works correctly |
| #14 | High | Unit | AuthMiddleware Request Validation | PASS | Tests verify auth validation for routes |
| #15 | High | Unit | CartAPI API Integration | PASS | API endpoints and cart functionality tested |
| #18 | High | Integration | Checkout Process Form Validation | PASS | Form validation in checkout flow tested |
| #19 | High | System | Checkout Process Payment Integration | PASS | Stripe integration tested (mock mode) |
| #23 | High | Integration | Contact Form Submission | PASS | Form validation and submission tested |
| #27 | High | Unit | ContactAPI Form Submission | PASS | API endpoints for contact form tested |
| #29 | High | Unit | DatabaseHelpers Query Construction | PASS | Database query functionality tested |
| #31 | High | Unit | EmailService Message Sending | PASS | Email templates and sending functionality tested |
| #33 | High | Unit | ErrorHandling API Error Responses | PASS | Error response formatting and security tested |
| #44 | High | Unit | OrderAPI Order Management | PARTIAL | Basic order creation/retrieval functionality tested |
| #46 | High | Unit | PaymentAPI Payment Processing | PASS | Stripe payment integration fully tested |
| #48 | High | System | Payment Processing Order Creation | PASS | Checkout and order creation flow tested |
| #56 | High | Unit | ProductAPI Data Retrieval | PASS | Product stock checking functionality tested |
| #63 | High | Security | Security Data Protection | PASS | Password hashing and data protection verified |
| #64 | High | Integration | Shopping Cart Add to Cart | PASS | Add to cart flow tested |
| #65 | High | Integration | Shopping Cart Management | PASS | Quantity updates and item removal tested |
| #66 | High | Integration | Shopping Cart Persistence | PASS | Persistence across page loads tested |
| #71 | High | Integration | Site Security Password Protection | PASS | Password protection verified |
| #72 | High | Unit | SiteProtection Password Verification | PASS | Password verification API tested |
| #87 | High | Unit | Middleware Request Validation | PASS | Request validation and sanitization tested |
| #89 | High | Unit | CheckoutSummary Order Review | PASS | Order calculation tested |
| #91 | High | Security | DataEncryption Sensitive Data Handling | PASS | PII and payment data security tested |

### Test Commands

- Run Jest unit tests: `npm test`
- Run Cypress integration tests: `npm run cypress:open`
- Run E2E tests: `npm run test:e2e`
- Run specific test category: `npm test -- -t "Admin"`
