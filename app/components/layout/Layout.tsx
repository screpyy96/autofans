import { MainLayout } from './MainLayout';
import type { User, NewsletterForm } from '~/types';

export interface LayoutProps {
  children: React.ReactNode;
  user?: User;
  notificationCount?: number;
  onSearch?: (query: string) => void;
  onNewsletterSubmit?: (data: NewsletterForm) => void;
  className?: string;
}

export function Layout({
  children,
  user,
  notificationCount,
  onSearch,
  onNewsletterSubmit,
  className
}: LayoutProps) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}