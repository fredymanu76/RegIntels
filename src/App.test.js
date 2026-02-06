import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  render(<App />);
  // App shows loading spinner on mount while checking auth
  const loadingText = screen.getByText(/loading/i);
  expect(loadingText).toBeInTheDocument();
});
