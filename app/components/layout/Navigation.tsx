import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '~/lib/utils';

// Icons
const ChevronRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface NavigationProps {
  items: NavigationItem[];
  currentPath: string;
  isMobile?: boolean;
  className?: string;
  showBreadcrumbs?: boolean;
  breadcrumbs?: BreadcrumbItem[];
}

// Default navigation items
const defaultNavigationItems: NavigationItem[] = [
  {
    label: 'Acasă',
    href: '/',
    icon: <HomeIcon />,
  },
  {
    label: 'Căutare Avansată',
    href: '/search',
  },
  {
    label: 'Categorii',
    href: '/categories',
    children: [
      { label: 'Mașini de oraș', href: '/categories/city-cars' },
      { label: 'SUV', href: '/categories/suv' },
      { label: 'Sedan', href: '/categories/sedan' },
      { label: 'Hatchback', href: '/categories/hatchback' },
      { label: 'Coupe', href: '/categories/coupe' },
      { label: 'Cabriolet', href: '/categories/cabriolet' },
    ],
  },
  {
    label: 'Mărci Populare',
    href: '/brands',
    children: [
      { label: 'Volkswagen', href: '/brands/volkswagen' },
      { label: 'BMW', href: '/brands/bmw' },
      { label: 'Mercedes-Benz', href: '/brands/mercedes-benz' },
      { label: 'Audi', href: '/brands/audi' },
      { label: 'Skoda', href: '/brands/skoda' },
      { label: 'Ford', href: '/brands/ford' },
    ],
  },
  {
    label: 'Vinde',
    href: '/sell',
  },
  {
    label: 'Despre Noi',
    href: '/about',
  },
];

export function Navigation({ 
  items = defaultNavigationItems, 
  currentPath, 
  isMobile = false, 
  className,
  showBreadcrumbs = true,
  breadcrumbs = []
}: NavigationProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();

  // Close drawer when route changes
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [location.pathname]);

  // Generate breadcrumbs from current path if not provided
  const generatedBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : generateBreadcrumbs(currentPath);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const toggleExpanded = (href: string) => {
    setExpandedItems(prev => 
      prev.includes(href) 
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.href);
    const active = isActive(item.href);

    return (
      <div key={item.href} className={cn('', level > 0 && 'ml-4')}>
        <div className="flex items-center">
          <Link
            to={item.href}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              'hover:bg-gray-50 hover:text-primary-600',
              active 
                ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600' 
                : 'text-gray-700',
              level > 0 && 'text-xs pl-6'
            )}
          >
            {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
          </Link>
          
          {hasChildren && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleExpanded(item.href)}
              className="p-1 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <motion.div
                animate={{ rotate: isExpanded ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronRightIcon />
              </motion.div>
            </motion.button>
          )}
        </div>

        {/* Submenu */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children!.map(child => renderNavigationItem(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (isMobile) {
    return (
      <>
        {/* Mobile Navigation Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDrawer}
          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          {isDrawerOpen ? <CloseIcon /> : <MenuIcon />}
        </motion.button>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {isDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleDrawer}
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">Navigare</h2>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={toggleDrawer}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <CloseIcon />
                    </motion.button>
                  </div>

                  <nav className="space-y-2">
                    {items.map(item => renderNavigationItem(item))}
                  </nav>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop Navigation
  return (
    <div className={cn('', className)}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && generatedBreadcrumbs.length > 1 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            {generatedBreadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon />
                )}
                {crumb.href ? (
                  <Link
                    to={crumb.href}
                    className="ml-2 hover:text-primary-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="ml-2 text-gray-900 font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Main Navigation */}
      <nav className="space-y-2">
        {items.map(item => renderNavigationItem(item))}
      </nav>
    </div>
  );
}

// Helper function to generate breadcrumbs from path
function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Acasă', href: '/' }
  ];

  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Convert segment to readable label
    const label = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    });
  });

  return breadcrumbs;
}

// Breadcrumb component for standalone use
export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  if (items.length <= 1) return null;

  return (
    <nav className={cn('mb-4', className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-gray-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon />
            )}
            {item.href ? (
              <Link
                to={item.href}
                className="ml-2 hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="ml-2 text-gray-900 font-medium">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}