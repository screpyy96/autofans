import { Link } from 'react-router';

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
      className="bg-glass backdrop-blur-xl border-t border-premium relative"
      role="contentinfo"
    >
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <p className="max-w-xl text-gray-400 leading-relaxed">
              Platforma AutoFans pentru cumpărarea și vânzarea de mașini. Compară ofertele, salvează ce contează și discută direct cu vânzătorul.
            </p>
            <p className="mt-4 text-sm font-medium text-accent-gold">Cumpără informat. Vinde clar.</p>
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
                <Link to="/blog" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Blog & Noutăți
                </Link>
              </li>
              <li>
                <Link to="/help" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Ajutor
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/termeni-si-conditii" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Termeni și condiții
                </Link>
              </li>
              <li>
                <Link to="/politica-de-confidentialitate" className="text-gray-400 hover:text-accent-gold transition-colors duration-300 hover:translate-x-1 inline-block">
                  Politica de confidențialitate
                </Link>
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
