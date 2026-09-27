import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartProvider } from '@/contexts/CartContext';
import NotFound from '@/pages/NotFound';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import CustomOrder from '@/pages/CustomOrder';
import Orders from '@/pages/Orders';
import Auth from '@/pages/Auth';
import Checkout from '@/pages/Checkout';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

function renderWithProviders(ui: React.ReactElement, initialEntries = ['/']) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
      </CartProvider>
    </QueryClientProvider>
  );
}

describe('Page Component Renders', () => {
  it('renders NotFound page with home button', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText(/404/i)).toBeInTheDocument();
    expect(screen.getByText(/Home Page/i)).toBeInTheDocument();
  });

  it('renders Privacy Policy page', () => {
    renderWithProviders(<Privacy />);
    expect(screen.getAllByText(/Privacy Policy/i)[0]).toBeInTheDocument();
  });

  it('renders Terms of Service page', () => {
    renderWithProviders(<Terms />);
    expect(screen.getAllByText(/Terms of Service/i)[0]).toBeInTheDocument();
  });

  it('renders CustomOrder page with form and platform chips', () => {
    renderWithProviders(<CustomOrder />);
    expect(screen.getByText(/Request Custom/i)).toBeInTheDocument();
    expect(screen.getByText(/Steam/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit Custom Request/i)).toBeInTheDocument();
    expect(screen.getByText(/Chat via Telegram/i)).toBeInTheDocument();
  });

  it('renders Customer Console (Orders) page', () => {
    renderWithProviders(<Orders />);
    expect(screen.getByText(/Track Order by ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Launch Support Bot/i)).toBeInTheDocument();
    expect(screen.getByText(/24\/7 Live Triage/i)).toBeInTheDocument();
  });

  it('renders Auth page with Google OAuth button and no email form', async () => {
    renderWithProviders(<Auth />);
    // Auth page shows a spinner while session resolves, then reveals content when no user is logged in
    await screen.findByText(/Welcome to/i);
    expect(screen.getByText(/Continue with Google/i)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/email/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/password/i)).not.toBeInTheDocument();
  });

  it('renders Checkout page with cart or empty state', () => {
    renderWithProviders(<Checkout />);
    expect(screen.getByText(/Your Cart/i)).toBeInTheDocument();
  });
});
