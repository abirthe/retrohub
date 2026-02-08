# RETROHUB - Game Keys & Top-ups E-commerce Platform

A modern, full-stack e-commerce platform for selling digital game keys, gift cards, top-ups, and subscriptions. Built with React, TypeScript, Supabase, and shadcn/ui components.

## 🚀 Features

### Customer Features
- **Product Browsing**: Browse products with search and category filters
- **Product Details**: Detailed product pages with quantity selection
- **Shopping Cart**: Add products to cart with quantity management
- **Checkout**: Secure checkout process
- **Order History**: View your purchase history and order status
- **User Authentication**: Sign up and sign in with email/password

### Admin Features
- **Admin Dashboard**: Comprehensive dashboard with revenue and order statistics
- **Order Management**: View and manage all orders
- **Inventory Overview**: Monitor product stock, pricing, and margins
- **Order Status Tracking**: Track orders through pending, validated, processing, completed, and failed states

### Technical Features
- **Real-time Data**: Powered by Supabase for real-time database updates
- **Responsive Design**: Mobile-first responsive design
- **Modern UI**: Beautiful dark theme with neon accents and glassmorphism effects
- **Type Safety**: Full TypeScript support
- **State Management**: React Context for cart state with localStorage persistence
- **Form Validation**: React Hook Form with Zod validation
- **Toast Notifications**: User-friendly notifications for actions

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom dark theme
- **Backend/Database**: Supabase (PostgreSQL)
- **State Management**: React Query (TanStack Query) + React Context
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## 📦 Project Structure

```
code-conduit-express/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ProductCard.tsx # Product card component
│   │   └── ShopHeader.tsx  # Navigation header
│   ├── contexts/          # React Context providers
│   │   └── CartContext.tsx # Shopping cart state management
│   ├── hooks/             # Custom React hooks
│   │   ├── useAuth.ts     # Authentication hook
│   │   └── useProducts.ts # Products data fetching
│   ├── integrations/      # Third-party integrations
│   │   └── supabase/      # Supabase client and types
│   ├── lib/               # Utility functions
│   │   └── shopApi.ts     # API functions for products/orders
│   ├── pages/             # Page components
│   │   ├── Index.tsx      # Home/Shop page
│   │   ├── ProductDetail.tsx # Product detail page
│   │   ├── Checkout.tsx   # Checkout page
│   │   ├── Orders.tsx     # User orders page
│   │   ├── AdminDashboard.tsx # Admin dashboard
│   │   ├── Auth.tsx       # Authentication page
│   │   └── NotFound.tsx   # 404 page
│   ├── App.tsx            # Main app component with routing
│   └── main.tsx           # Entry point
├── supabase/
│   └── migrations/        # Database migrations
└── public/               # Static assets
```

## 🗄️ Database Schema

### Tables
- **products**: Product catalog with categories, pricing, and stock
- **inventory_keys**: Digital key vault for serialized inventory
- **orders**: Customer orders with status tracking
- **profiles**: User profile information
- **user_roles**: Role-based access control (admin/user)
- **audit_logs**: System audit trail

### Enums
- `product_category`: giftcard, topup, subscription
- `delivery_type`: instant_code, api_h2h, automation
- `region_tag`: GLOBAL, US, EU, ASIA, LATAM
- `order_status`: pending, validated, processing, completed, failed
- `key_status`: available, sold, expired
- `app_role`: admin, user

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd code-conduit-express
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Run the migrations in `supabase/migrations/` to set up your database
   - Get your Supabase URL and anon key

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## 🎨 Design System

### Colors
- **Primary**: Cyan (#00D9FF) - Used for main actions and accents
- **Accent**: Orange (#FF8C00) - Used for secondary actions
- **Success**: Green - Used for completed states
- **Destructive**: Red - Used for errors and warnings
- **Background**: Dark blue-gray (#0F1419)
- **Card**: Slightly lighter dark (#1A1F2E)

### Typography
- **Display Font**: Orbitron (for headings and brand)
- **Body Font**: Inter (for body text)

### Components
All UI components are built with shadcn/ui, providing:
- Accessible components based on Radix UI
- Customizable styling with Tailwind CSS
- Dark theme optimized

## 🔐 Authentication & Authorization

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Role-based access control (RBAC)
  - Users can view and create their own orders
  - Admins can view all orders and manage products
- **Protected Routes**: Admin dashboard requires admin role

## 🛒 Shopping Cart

- **State Management**: React Context API
- **Persistence**: localStorage for cart persistence across sessions
- **Features**:
  - Add/remove items
  - Update quantities
  - Stock validation
  - Real-time price calculation

## 📦 Order Flow

1. **Add to Cart**: Customer adds products to cart
2. **Checkout**: Customer reviews cart and places order
3. **Order Creation**: Order created with "pending" status
4. **Processing**: Admin processes order (status: validated → processing)
5. **Fulfillment**: Order fulfilled and status updated to "completed"
6. **Delivery**: Customer receives product details in order history

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Vercel/Netlify
1. Connect your repository to Vercel/Netlify
2. Set environment variables in the deployment platform
3. Deploy automatically on push to main branch

### Environment Variables for Production
Make sure to set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)
- Large screens (1280px+)

## 🔧 Customization

### Adding New Products
Products can be added through the Supabase dashboard or via the admin interface (if implemented).

### Styling
- Modify `src/index.css` for global styles
- Update `tailwind.config.ts` for theme customization
- Component styles are in individual component files

### Adding Features
- New pages: Add to `src/pages/` and update routing in `App.tsx`
- New components: Add to `src/components/`
- API functions: Add to `src/lib/shopApi.ts`

## 🐛 Troubleshooting

### Common Issues

1. **Supabase connection errors**
   - Verify environment variables are set correctly
   - Check Supabase project is active
   - Ensure RLS policies are configured

2. **Build errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

3. **Cart not persisting**
   - Check browser localStorage is enabled
   - Verify CartContext is properly wrapped in App

## 📄 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. For contributions, please contact the project maintainers.

## 📞 Support

For issues or questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ using React, TypeScript, and Supabase
