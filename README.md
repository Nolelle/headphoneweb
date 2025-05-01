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

## 📖 Project Overview

HeadphoneWeb is a full-stack e-commerce web application designed for selling premium headphones. Built with Next.js 14 and TypeScript, it offers a modern user experience with features like product browsing, a persistent shopping cart, secure payments via Stripe, and an administrative interface for managing contact messages. It utilizes a PostgreSQL database for data storage and is styled with Tailwind CSS. The project also includes a comprehensive testing suite using Jest and Cypress.

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
    * **Important:** Run any necessary database schema setup scripts. Check the `db/scripts/` directory or `package.json` for commands like `npm run db:migrate` or `npm run db:schema:load`. *(Self-note: This needs specific command clarification)*

4. **Environment Variables:**
    * Create `.env.local` for development and `.env.test` for testing. You might find example files (`.env.local.example`, `.env.test.example`) to copy, otherwise create them manually.

        ```bash
        # If example exists:
        cp .env.local.example .env.local
        cp .env.test.example .env.test
        # Otherwise, create empty files:
        touch .env.local
        touch .env.test
        ```

    * Populate `.env.local` and `.env.test` with the necessary environment variables. These files are **not** committed to Git.
      **Required Variables (based on current understanding):**
        * `DATABASE_URL`: Connection string for your PostgreSQL database (e.g., `"postgresql://user:password@host:port/database"`)
        * `STRIPE_SECRET_KEY`: Your Stripe secret key (e.g., `"sk_test_..."`)
        * `STRIPE_PUBLIC_KEY`: Your Stripe publishable key (e.g., `"pk_test_..."`)
        * `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook signing secret (e.g., `"whsec_..."`, obtained when running `stripe listen` or from Stripe dashboard).
        * *(Verify if other variables like session secrets, email API keys, etc., are needed by searching the codebase for `process.env.*`)*

5. **Run the development server:**

    ```bash
    npm run dev
    # or yarn dev or pnpm dev or bun dev
    ```

    The application should be available at [http://localhost:3000](http://localhost:3000).

6. **Start Stripe Webhook Listener (Optional, for testing payments locally):**
    * In a separate terminal, run:

        ```bash
        stripe listen --forward-to localhost:3000/api/stripe/webhook
        ```

    * Copy the webhook signing secret (`whsec_...`) provided by the command into your `.env.local` file as `STRIPE_WEBHOOK_SECRET`.
    * This requires the Stripe CLI to be installed and configured.

## 📂 Project Structure

Here's an overview of the key directories in this project:

* `app/`: Contains the core application code using the Next.js App Router.
  * `api/`: API route handlers for backend logic (cart, checkout, admin, etc.).
  * `components/`: UI components specific to certain routes or features.
    * `layouts/`: Layout components wrapping different parts of the application.
    * `ui/`: General-purpose UI components (like buttons, inputs, etc. - often from Shadcn/ui).
  * `(pages)/`: Route definitions for different pages (e.g., `cart/`, `checkout/`, `admin/`).
* `components/`: *Note: This root `components/` directory likely contains globally shared components.*
* `db/`: Database-related files, including setup scripts (`scripts/`) and helper functions (`helpers/`).
* `lib/`: Utility functions, helper modules, and configurations (e.g., Stripe client, email service).
* `public/`: Static assets like images, fonts, etc., directly served by the web server.
* `hooks/`: Custom React hooks used throughout the application.
* `__tests__/`: Jest unit and integration tests.
* `cypress/`: Cypress end-to-end tests.
* `.env.local`: Local environment variables (DATABASE_URL, Stripe keys, etc.). **Not committed to Git.**
* `.env.test`: Environment variables for the testing environment. **Not committed to Git.**
* `next.config.ts`: Configuration file for Next.js.
* `tailwind.config.ts`: Configuration file for Tailwind CSS.
* `tsconfig.json`: Configuration file for TypeScript.
* `package.json`: Project dependencies and scripts.
* `README.md`: This file!

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

**Deployment Steps (Vercel Example):**

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Sign up or log in to [Vercel](https://vercel.com/).
3. Import your Git repository.
4. **Configure Environment Variables:** Vercel will likely detect it's a Next.js project. You **must** add the required environment variables (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET`, and any others identified) in the Vercel project settings. Use your **production** Stripe keys here.
5. **Build Command & Output Directory:** Vercel usually auto-detects these for Next.js (`npm run build` or similar, output `.next`).
6. Deploy!
7. **Stripe Webhook (Production):** You need to create a production webhook endpoint in your Stripe Dashboard pointing to `https://<your-deployed-url>/api/stripe/webhook` and use the corresponding production webhook secret in your Vercel environment variables.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details on deploying to other platforms.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! *(Consider adding a link to the issues page if applicable)*

## 📝 License

*(Specify the license if available, e.g., This project is licensed under the MIT License. Link to LICENSE file if it exists.)*
