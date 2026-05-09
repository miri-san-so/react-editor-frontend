import { render, screen } from '@testing-library/react';
import App from './App';

test('renders editor without crashing', () => {
  render(<App />);
  const editorElement = screen.getByText(/Properties/i);
  expect(editorElement).toBeInTheDocument();
});
