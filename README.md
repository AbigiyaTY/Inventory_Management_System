# Inventory Management System

> A full-stack inventory management application built with MongoDB, Node.js, Express, and Vanilla JavaScript. It features a REST API for CRUD operations, a dynamic text-search index, a graphical sales dashboard, and a clean user interface to manage Products and their associated Suppliers.

![image](https://images.unsplash.com/photo-1553413077-190dd305871c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

## Built With

- **Major languages:** HTML, CSS, JavaScript (Client & Server), JSON.
- **Frameworks:** Node.js, Express.js.
- **Technologies used:** MongoDB Atlas, MongoDB Node.js Driver, Chart.js (for dashboard graphs).
- **Architecture:** Client-Server architecture where the client consumes a RESTful API.

## Getting Started

To get a local copy up and running follow these simple example steps.

1. Open terminal or cmd on your local machine and navigate to your desired directory.
2. **Run**    `git clone https://github.com/AbigiyaTY/Inventory_Management_System.git`
3. **Run**    `cd Inventory_Management_System`
4. **Run**    `code .`

### Prerequisites
* VS Code editor
* Web browser (Chrome, Firefox, Opera etc.)
* Node.js installed on your machine
* A free MongoDB Atlas account

### Install & Setup

1. **Install dependencies:**
   Navigate to the server folder and install the required npm packages:

   ```sh
   cd server

   npm install
   ```

2. **Database Setup:**
   
   Go to MongoDB Atlas, create a free cluster, database user, and allow your IP address.

   Create a `.env` file in the `server` folder.
   
   Add your connection string (see `.env.example` for the format). It should look like this:

   ```sh
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority

   DB_NAME=inventory_db

   PORT=3000
   ```

3. **Seed the Database:**
   This script will automatically create the two collections, insert seed data, and set up the text index:

   ```sh
   npm run seed
   ```


4. **Start the Backend Server:**
   ```sh
   npm run dev
   ```


5. **Start the Frontend Client:**
   Open a **new terminal window**, navigate to the `client` folder, and serve it locally:

   ```sh
   cd client

   npx serve . -l 5500

   Open `http://localhost:5500` in your browser.
   ```

---

## 🎓 Project Specification Details 

### 1. MongoDB Architecture
- **Exactly Two Collections:** `products` (Collection A) and `suppliers` (Collection B).
- **Relationship:** `products.supplier_id` links to `suppliers.supplier_id`.
- **Text Index:** Created on the `products` collection (`name` and `description` fields). 
- **Documents:** Seeded with 10 products and 6 suppliers.

### 2. REST API (Node.js + Express)
The API exposes the following endpoints:
- `GET /products` - Get all documents from Collection A.
- `GET /products/:id` - Get one product by ID.
- `GET /suppliers/:id` - Get one supplier by ID (Collection B).
- `GET /products/search?query=...` - Search products using the MongoDB text index.
- `POST /products` - Add a new product.
- `PUT /products/:id` - Edit an existing product.
- `DELETE /products/:id` - Delete a product.
- *Extra:* `GET /products/stats` (Dashboard aggregations), `POST /products/:id/sale` (Record a sale).
- *Status Codes:* Returns appropriate codes (200, 201, 400, 404, 409) with JSON error handling.

### 3. Client Application (HTML/CSS/JS)
- **Home Screen:** Loads all products from Collection a by default. Supports text search via the API. Includes a "New Product" button.
- **Details Screen:** Displays the selected product's information, including its image and related Supplier information (Collection B).
- **Actions:** Edit, Delete, and New operations work through the API and automatically navigate back to Home while refreshing the data.
- **Dashboard:** A graphical view using Chart.js showing total inventory value, revenue, and graphs of sales by category and top products.

---

## Author

👤 **Abigiya Tadesse**

* GitHub: [AbigiyaTY](https://github.com/AbigiyaTY)
* LinkedIn: [AbigiyaTY](https://www.linkedin.com/in/AbigiyaTY)


## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](../../issues/).

## Show your support

Give a ⭐️ if you like this project!

## 📝 License

This project is [MIT](./MIT.md) licensed.