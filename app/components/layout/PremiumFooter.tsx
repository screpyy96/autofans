import { Link } from 'react-router';
import { Badge } from '~/components/ui/Badge';

export type PremiumFooterNavItem = {
  name: string;
  href: string;
};

export interface PremiumFooterProps {
  navigation: PremiumFooterNavItem[];
}

export function PremiumFooter({ navigation }: PremiumFooterProps) {
  return (
    <footer 
      className="bg-glass backdrop-blur-xl border-t border-premium mt-16 relative"
      role="contentinfo"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-start gap-3 mb-4">
              <p className="text-gray-400 leading-relaxed">
                Platforma premium pentru mașini second-hand în România. Găsește mașina perfectă sau vinde-ți mașina rapid și sigur.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="success" className="bg-green-900/20 text-green-400 border-green-500/30">Verificat SSL</Badge>
              <Badge variant="primary" className="bg-accent-gold/20 text-accent-gold border-accent-gold/30">Suport 24/7</Badge>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Navigare</h3>
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Suport</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Ajutor
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Termeni și condiții
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Politica de confidențialitate
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-premium mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AutoFans. Toate drepturile rezervate.
          </p>
        </div>
      </div>
    </footer>
  );
}
