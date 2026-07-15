import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  const onSearch = vi.fn();
  const onSuggestionSelect = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders an accessible search input', () => {
    render(<SearchBar onSearch={onSearch} placeholder="Caută mașini..." />);

    const input = screen.getByRole('textbox', { name: 'Caută mașini...' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('submits the typed query', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('textbox'), 'BMW X5');
    await user.keyboard('{Enter}');

    expect(onSearch).toHaveBeenCalledWith('BMW X5');
  });

  it('shows matching suggestions after the debounce and lets the user select one', () => {
    vi.useFakeTimers();
    render(<SearchBar onSearch={onSearch} onSuggestionSelect={onSuggestionSelect} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'BMW' } });
    act(() => vi.advanceTimersByTime(SEARCH_DELAY));

    const suggestion = screen.getByText('BMW', { exact: true }).closest('[role="option"]');
    expect(suggestion).toBeInTheDocument();
    fireEvent.click(suggestion!);

    expect(onSuggestionSelect).toHaveBeenCalledWith(expect.objectContaining({ text: 'BMW' }));
    expect(onSearch).toHaveBeenCalledWith('BMW');
    expect(input).toHaveValue('BMW');
  });

  it('clears the input through its labelled control', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Audi');
    await user.click(screen.getByRole('button', { name: 'Șterge căutarea' }));

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
  });

  it('does not present fabricated popular searches before the visitor searches', () => {
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.focus(screen.getByRole('textbox'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

const SEARCH_DELAY = 450;
