import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders the current primary visual treatment', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: 'Click me' })).toHaveClass('bg-gold-gradient');
  });

  it.each([
    ['primary', 'bg-gold-gradient'],
    ['secondary', 'bg-secondary-800/50'],
    ['outline', 'border-accent-gold/30'],
    ['ghost', 'hover:bg-accent-gold/10'],
    ['danger', 'bg-red-600'],
  ] as const)('renders the %s variant', (variant, expectedClass) => {
    render(<Button variant={variant}>Button</Button>);

    expect(screen.getByRole('button')).toHaveClass(expectedClass);
  });

  it.each([
    ['sm', ['px-3', 'py-1.5', 'text-sm']],
    ['md', ['px-4', 'py-2', 'text-base']],
    ['lg', ['px-6', 'py-3', 'text-lg']],
  ] as const)('renders the %s size', (size, classes) => {
    render(<Button size={size}>Button</Button>);

    expect(screen.getByRole('button')).toHaveClass(...classes);
  });

  it('handles click events', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables itself accessibly while loading', () => {
    render(<Button loading loadingText="Se salvează">Salvează</Button>);

    const button = screen.getByRole('button', { name: /Se salvează/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button.querySelector('.border-t-transparent')).toBeInTheDocument();
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button disabled onClick={onClick}>Disabled</Button>);

    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
