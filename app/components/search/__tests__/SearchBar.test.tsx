import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';
import { beforeEach } from 'node:test';

describe('SearchBar', () => {
  const mockProps = {
    onSearch: vi.fn(),
    onSuggestionSelect: vi.fn(),
    suggestions: ['BMW X5', 'Audi A4', 'Mercedes C-Class'],
    isLoading: false,
    placeholder: 'Caută mașini...'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder text', () => {
    render(<SearchBar {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Caută mașini...')).toBeInTheDocument();
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BMW');
    
    expect(input).toHaveValue('BMW');
  });

  it('calls onSearch with debounced input', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BMW');
    
    // Wait for debounce
    await waitFor(() => {
      expect(mockProps.onSearch).toHaveBeenCalledWith('BMW');
    }, { timeout: 1000 });
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BM');
    
    await waitFor(() => {
      expect(screen.getByText('BMW X5')).toBeInTheDocument();
    });
  });

  it('handles suggestion selection', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BM');
    
    await waitFor(() => {
      expect(screen.getByText('BMW X5')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('BMW X5'));
    
    expect(mockProps.onSuggestionSelect).toHaveBeenCalledWith('BMW X5');
    expect(input).toHaveValue('BMW X5');
  });

  it('handles keyboard navigation in suggestions', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'A');
    
    await waitFor(() => {
      expect(screen.getByText('Audi A4')).toBeInTheDocument();
    });
    
    // Navigate down
    await user.keyboard('{ArrowDown}');
    expect(screen.getByText('Audi A4')).toHaveClass('bg-primary-50');
    
    // Select with Enter
    await user.keyboard('{Enter}');
    expect(mockProps.onSuggestionSelect).toHaveBeenCalledWith('Audi A4');
  });

  it('shows loading state', () => {
    render(<SearchBar {...mockProps} isLoading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BMW');
    
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);
    
    expect(input).toHaveValue('');
    expect(mockProps.onSearch).toHaveBeenCalledWith('');
  });

  it('handles form submission', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BMW X5');
    await user.keyboard('{Enter}');
    
    expect(mockProps.onSearch).toHaveBeenCalledWith('BMW X5');
  });

  it('closes suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <SearchBar {...mockProps} />
        <div data-testid="outside">Outside</div>
      </div>
    );
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'BMW');
    
    await waitFor(() => {
      expect(screen.getByText('BMW X5')).toBeInTheDocument();
    });
    
    await user.click(screen.getByTestId('outside'));
    
    await waitFor(() => {
      expect(screen.queryByText('BMW X5')).not.toBeInTheDocument();
    });
  });

  it('filters suggestions based on input', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'Audi');
    
    await waitFor(() => {
      expect(screen.getByText('Audi A4')).toBeInTheDocument();
      expect(screen.queryByText('BMW X5')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when no suggestions match', async () => {
    const user = userEvent.setup();
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'xyz');
    
    await waitFor(() => {
      expect(screen.getByText('Nu s-au găsit rezultate')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-label');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    
    // Check for proper ARIA relationships when suggestions are shown
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'BMW' } });
    
    waitFor(() => {
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-owns');
    });
  });

  it('supports voice search when available', () => {
    // Mock speech recognition
    const mockSpeechRecognition = vi.fn();
    (global as any).webkitSpeechRecognition = mockSpeechRecognition;
    
    render(<SearchBar {...mockProps} enableVoiceSearch={true} />);
    
    expect(screen.getByRole('button', { name: /voice search/i })).toBeInTheDocument();
  });

  it('handles recent searches', async () => {
    const user = userEvent.setup();
    const recentSearches = ['BMW X5', 'Audi A4'];
    
    render(<SearchBar {...mockProps} recentSearches={recentSearches} />);
    
    const input = screen.getByRole('textbox');
    await user.click(input);
    
    await waitFor(() => {
      expect(screen.getByText('Căutări recente')).toBeInTheDocument();
      expect(screen.getByText('BMW X5')).toBeInTheDocument();
      expect(screen.getByText('Audi A4')).toBeInTheDocument();
    });
  });
});