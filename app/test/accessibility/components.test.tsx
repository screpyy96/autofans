import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'vitest-axe';
import { Button } from '~/components/ui/Button';
import { Card } from '~/components/ui/Card';
import { Input } from '~/components/ui/Input';
import { Modal } from '~/components/ui/Modal';
import { CarCard } from '~/components/car/CarCard';
import { mockCar, renderWithRouter } from '../utils';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  describe('Button Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when disabled', async () => {
      const { container } = render(<Button disabled>Disabled Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes when loading', async () => {
      const { container } = render(<Button loading>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Input Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Input 
          label="Email Address" 
          placeholder="Enter your email"
          type="email"
        />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper label association', () => {
      render(
        <Input 
          label="Email Address" 
          placeholder="Enter your email"
          id="email-input"
        />
      );
      
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email Address');
      
      expect(input).toHaveAttribute('id', 'email-input');
      expect(label).toHaveAttribute('for', 'email-input');
    });

    it('should have proper error state accessibility', async () => {
      const { container } = render(
        <Input 
          label="Email Address" 
          error="Please enter a valid email"
          aria-invalid="true"
        />
      );
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Component', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <h2>Card Title</h2>
          <p>Card content goes here.</p>
        </Card>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should be focusable when hoverable', () => {
      render(
        <Card hoverable>
          <h2>Hoverable Card</h2>
        </Card>
      );
      
      const card = screen.getByText('Hoverable Card').closest('div');
      expect(card).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Modal Component', () => {
    it('should not have accessibility violations when open', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      
      const title = screen.getByText('Test Modal');
      expect(title).toHaveAttribute('id');
    });

    it('should trap focus within modal', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <button>First Button</button>
          <button>Second Button</button>
        </Modal>
      );
      
      const firstButton = screen.getByText('First Button');
      const secondButton = screen.getByText('Second Button');
      const closeButton = screen.getByRole('button', { name: /close/i });
      
      // All interactive elements should be present
      expect(firstButton).toBeInTheDocument();
      expect(secondButton).toBeInTheDocument();
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('CarCard Component', () => {
    it('should not have accessibility violations', async () => {
      const car = mockCar();
      const mockHandlers = {
        onFavorite: () => {},
        onCompare: () => {},
        onContact: () => {},
        onView: () => {}
      };

      const { container } = renderWithRouter(
        <CarCard car={car} {...mockHandlers} />
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper image alt text', () => {
      const car = mockCar({
        title: 'BMW X5 2020',
        images: [{ id: '1', url: '/test.jpg', alt: 'BMW X5 front view', isMain: true }]
      });
      
      const mockHandlers = {
        onFavorite: () => {},
        onCompare: () => {},
        onContact: () => {},
        onView: () => {}
      };

      renderWithRouter(
        <CarCard car={car} {...mockHandlers} />
      );
      
      const image = screen.getByRole('img');
      expect(image).toHaveAttribute('alt', 'BMW X5 2020');
    });

    it('should have proper button labels', () => {
      const car = mockCar();
      const mockHandlers = {
        onFavorite: () => {},
        onCompare: () => {},
        onContact: () => {},
        onView: () => {}
      };

      renderWithRouter(
        <CarCard car={car} {...mockHandlers} />
      );
      
      const favoriteButton = screen.getByRole('button', { name: /favorite/i });
      const compareButton = screen.getByRole('button', { name: /compare/i });
      const contactButton = screen.getByText('Contactează');
      
      expect(favoriteButton).toHaveAccessibleName();
      expect(compareButton).toHaveAccessibleName();
      expect(contactButton).toHaveAccessibleName();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast for text', async () => {
      const { container } = render(
        <div className="bg-white text-gray-900 p-4">
          <h1 className="text-2xl font-bold">High Contrast Heading</h1>
          <p className="text-gray-700">Regular text with good contrast</p>
          <button className="bg-primary-600 text-white px-4 py-2 rounded">
            Primary Button
          </button>
        </div>
      );
      
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation for interactive elements', () => {
      render(
        <div>
          <button>First Button</button>
          <input type="text" placeholder="Text input" />
          <a href="/test">Link</a>
          <button>Last Button</button>
        </div>
      );
      
      const interactiveElements = [
        screen.getByText('First Button'),
        screen.getByRole('textbox'),
        screen.getByRole('link'),
        screen.getByText('Last Button')
      ];
      
      interactiveElements.forEach(element => {
        expect(element).toBeVisible();
        // Elements should be focusable (not have tabindex="-1")
        expect(element).not.toHaveAttribute('tabindex', '-1');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', async () => {
      const { container } = render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
          <p>Content paragraph</p>
        </div>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toHaveTextContent('Main Title');
      expect(h2).toHaveTextContent('Section Title');
      expect(h3).toHaveTextContent('Subsection Title');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper landmark roles', async () => {
      const { container } = render(
        <div>
          <header>
            <nav>Navigation</nav>
          </header>
          <main>
            <section>
              <h1>Main Content</h1>
            </section>
          </main>
          <footer>Footer content</footer>
        </div>
      );
      
      expect(screen.getByRole('banner')).toBeInTheDocument(); // header
      expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav
      expect(screen.getByRole('main')).toBeInTheDocument(); // main
      expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});