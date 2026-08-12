# Liquor Store Web POS

## 🚀 Live Demo

**[Open the Liquor Store POS](https://maloinneatinghouse.netlify.app/)**

A full-stack web-based Point-of-Sale (POS) and inventory management system designed to support the day-to-day operations of a liquor retail business.

The system provides a centralized platform for managing products, inventory, customers, sales, payments, reports, and stock adjustments while supporting barcode-based product lookup and thermal receipt printing.

## Features

### Point of Sale

* Barcode scanning and product lookup
* Product search
* Shopping cart management
* Quantity management
* Real-time cart totals
* Checkout processing
* Cash payments
* Card payments
* Split payments
* Change calculation
* Thermal receipt printing

### Product Management

* Add products
* Update products
* Delete products
* Product categories
* Product pricing
* Barcode management
* Product images
* Cloudinary image storage

### Inventory Management

* Stock quantity tracking
* Stock adjustments
* Inventory updates
* Product availability monitoring
* Stock management interface

### Customer Management

* Add customers
* Update customer information
* Customer records
* Customer management interface

### Reports

* Sales reporting
* Business performance information
* Report viewing interface

### Settings

* POS configuration
* System settings management

## Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript (ES Modules)

### Backend

* Node.js
* Express.js
* REST API

### Database

* PostgreSQL

### Cloud Services

* Cloudinary for product image storage
* Render for backend deployment
* Neon PostgreSQL database

### Development Tools

* Git
* GitHub
* Visual Studio Code

## System Architecture

```text
┌───────────────────────────────┐
│           POS Frontend        │
│        HTML / CSS / JS        │
└───────────────┬───────────────┘
                │
                │ REST API
                ▼
┌───────────────────────────────┐
│       Node.js / Express       │
│                               │
│ Routes → Controllers →        │
│ Services → Middleware         │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│          PostgreSQL           │
│      Product & Sales Data     │
└───────────────────────────────┘

                │
                ▼
┌───────────────────────────────┐
│          Cloudinary            │
│       Product Images           │
└───────────────────────────────┘
```

## Project Structure

```text
liquor-store-pos/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utilis/
│   │
│   ├── uploads/
│   ├── database.js
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── logoimage/
│   ├── stockmanagement/
│   ├── checkout.html
│   ├── customers.html
│   ├── index.html
│   ├── inventory.html
│   ├── products.html
│   ├── reports.html
│   ├── settings.html
│   └── stockmanagement.html
│
└── README.md
```
## Screenshots

### Point of Sale

The main POS interface allows products to be added to the current sale, quantities to be managed, and the total sale amount to be calculated.

![Point of Sale](screenshots/mainpage.png)

### Product Management

The product interface displays product images, categories, barcodes, prices, stock levels, and cart functionality.

![Product Management](screenshots/product.png)

### Inventory Management

The inventory interface allows products and stock levels to be monitored while providing product search functionality.

![Inventory Management](screenshots/inventory.png)

### Sales Reports

The reporting interface provides sales performance information, transaction history, payment breakdowns, and sales statistics.

![Sales Reports](screenshots/report.png)

### Checkout & Payment

The checkout interface supports customer selection, order summaries, multiple payment methods, cash received, and automatic change calculation.

![Checkout and Payment](screenshots/checkout.png)

### Thermal Receipt

Completed transactions can be printed as a compact thermal receipt containing transaction details, purchased items, payment information, and change.

![Thermal Receipt](screenshots/receipt.png)

## Key Workflow

A typical POS transaction follows this flow:

```text
Barcode Scan / Product Search
            ↓
       Product Lookup
            ↓
        Add to Cart
            ↓
       Review Order
            ↓
         Checkout
            ↓
   Cash / Card / Split
            ↓
     Complete Transaction
            ↓
     Update Inventory
            ↓
      Print Receipt
```

## Backend Architecture

The backend follows a modular structure to separate application responsibilities.

### Routes

Define the API endpoints used by the frontend.

### Controllers

Handle incoming requests and coordinate application logic.

### Services

Contain reusable business logic and operations.

### Middleware

Handles request processing and other cross-cutting functionality.

### Configuration

Contains application configuration and external service setup.

## Environment Variables

Sensitive configuration values are stored using environment variables rather than being committed directly to the repository.

Create a `.env` file in the backend directory and configure the required values for your local environment.

Example:

```env
DATABASE_URL=your_database_connection_string
CLOUDINARY_URL=your_cloudinary_connection_string
PORT=your_port
```

Never commit real passwords, API keys, database credentials, or other secrets to GitHub.

## Running the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/Esther8082/liquor-store-pos.git
```

### 2. Navigate to the backend

```bash
cd liquor-store-pos/backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create a `.env` file and add the required configuration values.

### 5. Start the backend

```bash
node server.js
```

Or, if a development script is configured:

```bash
npm run dev
```

### 6. Open the frontend

Open the frontend through your local development server and access the POS interface.

## Deployment

The application is structured as a separate frontend and backend.

```text
Frontend
   ↓
Web Hosting

Backend
   ↓
Node.js / Express
   ↓
PostgreSQL
```

The backend is deployed using Render and the database uses PostgreSQL.

## Security

The project uses environment variables for sensitive configuration.

The following should never be committed to the repository:

* Database passwords
* API keys
* Cloudinary secrets
* Authentication secrets
* `.env` files

## Future Improvements

Potential future improvements include:

* Role-based user authentication
* User access permissions
* Improved dashboard analytics
* Automated backups
* Advanced sales reporting
* Low-stock notifications
* More detailed audit logs
* Performance optimization and caching
* Improved mobile/tablet support

## Author

Esther Akindele

GitHub: [Esther8082](https://github.com/Esther8082)

## Project Status

Active Development

The system is currently functional and continues to be improved with additional features, performance optimizations, and usability enhancements.
