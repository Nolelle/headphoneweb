# HeadphoneWeb 🎧

An e-commerce platform for premium headphones built with Next.js 14.

## ✨ Features

* Product browsing and display
* Shopping cart functionality
* Secure checkout process via Stripe
* Admin dashboard for message management
* Contact form
* Unit and Integration testing

## 🛠 Tech Stack

* **Framework**: [Next.js 14](https://nextjs.org/)
* **Database**: PostgreSQL
* **Payment Processing**: [Stripe](https://stripe.com/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **UI Components**: Likely custom or using a library like Shadcn/ui (based on `components.json`)
* **Testing**: [Jest](https://jestjs.io/), [Cypress](https://www.cypress.io/)
* **Font**: [Geist](https://vercel.com/font) (via `next/font`)

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher recommended)
* PostgreSQL database server
* [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhook testing)
* `psql` command-line tool (or other PostgreSQL client)

### Installation & Setup

1. **Clone the repository:**

    ```bash
    git clone <your-repo-url> # Replace with the actual repository URL
    cd headphoneweb
    ```

2. **Install dependencies:**

    ```bash
    npm install
    # or yarn install or pnpm install or bun install
    ```

3. **Database Setup:**
    * Ensure your PostgreSQL server is running.
    * Create a database user and database:

        ```sql
        -- Example using psql:
        CREATE USER myuser WITH PASSWORD 'mypassword';
        CREATE DATABASE headphoneweb OWNER myuser;
        GRANT ALL PRIVILEGES ON DATABASE headphoneweb TO myuser;
        ```

        *(Adjust username, password, and database name as needed)*
    * Connect to the database: `psql -d headphoneweb -U myuser`
    * *(Add steps here if database migrations/schema setup is required, e.g., `npm run db:migrate`)*

4. **Environment Variables:**
    * Copy the example environment file:

        ```bash
        cp .env.local.example .env.local # Assuming .env.local.example exists, otherwise create .env.local
        cp .env.test.example .env.test   # Assuming .env.test.example exists, otherwise create .env.test
        ```

    * Fill in the required values in `.env.local` and `.env.test` (Database connection string, Stripe keys, etc.). Refer to `paymentinfo.txt` and `.env.local` / `.env.test` for potential variable names.
        * `DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/headphoneweb"` (Example)
        * `STRIPE_SECRET_KEY="sk_test_..."`
        * `STRIPE_PUBLIC_KEY="pk_test_..."`
        * `STRIPE_WEBHOOK_SECRET="whsec_..."`
        * *(Add other necessary variables)*

5. **Run the development server:**

    ```bash
    npm run dev
    # or yarn dev or pnpm dev or bun dev
    ```

    The application should be available at [http://localhost:3000](http://localhost:3000).

6. **Start Stripe Webhook Listener (Optional, for testing payments):**
    * In a separate terminal, run:

        ```bash
        stripe listen --forward-to localhost:3000/api/stripe/webhook
        ```

    * This requires the Stripe CLI to be installed and configured.

## 🧪 Testing

The project includes unit, integration, and potentially E2E tests.

* **Run all Jest unit tests:**

    ```bash
    npm test
    ```

* **Run specific Jest tests (e.g., tests tagged "Admin"):**

    ```bash
    npm test -- -t "Admin"
    ```

* **Open Cypress for integration/E2E tests:**

    ```bash
    npm run cypress:open
    ```

* **Run Cypress E2E tests headlessly (if configured):**

    ```bash
    npm run test:e2e
    ```

### Test Status Summary

(The existing test status table provides a good overview and can remain here)

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

## 📚 Learn More (Next.js)

To learn more about Next.js, take a look at the following resources:

* [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
* [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## ☁️ Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! *(Consider adding a link to the issues page if applicable)*

## 📝 License

*(Specify the license if available, e.g., This project is licensed under the MIT License. Link to LICENSE file if it exists.)*
