import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, MapPin, User, Tags, Heart, ShoppingBag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../firebase/AuthContext';
import { useBranding } from '../firebase/BrandingContext';
import { motion, AnimatePresence } from 'motion/react';
import { useFavorites } from '../firebase/FavoritesContext';
import { useCart } from '../firebase/CartContext';
import SmartLogo from './SmartLogo';

const navLinks = [
  { name: 'INICIO', path: '/' },
  { name: 'NOSOTROS', path: '/about' },
  { name: 'CATÁLOGO', path: '/catalog' },
  { name: 'FAQ', path: '/faq' },
  { name: 'CONTACTO', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, login, logout, isAdmin } = useAuth();
  const { branding } = useBranding();
  const { favorites } = useFavorites();
  const { totalItems, setIsOpen: setIsCartOpen } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const isTransparent = isHome && !scrolled;

  const navClasses = isTransparent 
    ? 'bg-transparent border-transparent' 
    : 'bg-white border-b border-gray-100 shadow-sm';
    
  const textClasses = isTransparent ? 'text-white' : 'text-gray-600';
  const activeClasses = 'text-brand-orange';

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`${navClasses} fixed top-0 left-0 right-0 ${isOpen ? 'z-[1000]' : 'z-50'} transition-all duration-500 ease-in-out`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <SmartLogo isDarkBackground={isTransparent} className="w-[77px] h-[60px] object-contain" />
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              const isotype = isTransparent ? branding?.isotypeLight : branding?.isotypeDark;
              
              return (
                <Link
                  key={link.path}
                  to={link.path === '/catalog' ? '/catalog?reset=true' : link.path}
                  className={`text-sm font-bold transition-colors hover:text-brand-orange flex items-center space-x-2 uppercase relative ${
                    isActive ? activeClasses : textClasses
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {isActive && isotype && (
                      <motion.img
                        key="nav-isotype"
                        layoutId="nav-isotype-desktop"
                        src={isotype}
                        alt=""
                        className="w-5 h-5 object-contain"
                        initial={{ opacity: 0, scale: 0.5, x: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: -10 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 30,
                          opacity: { duration: 0.2 }
                        }}
                      />
                    )}
                  </AnimatePresence>
                  <motion.span layout>
                    {link.name}
                  </motion.span>
                </Link>
              );
            })}
            
            <Link
              to="/favorites"
              id="navbar-heart-desktop"
              className={`p-2 rounded-full transition-all hover:bg-brand-orange/10 hover:text-brand-orange relative group ${
                location.pathname === '/favorites' ? 'text-brand-orange bg-brand-orange/10' : textClasses
              }`}
              title="FAVORITOS"
            >
              <Heart
                size={20}
                fill={location.pathname === '/favorites' ? 'currentColor' : 'none'}
                className="transition-transform"
              />
              <AnimatePresence>
                {favorites.length > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  >
                    {favorites.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            
            <button
              onClick={() => setIsCartOpen(true)}
              className={`p-2 rounded-full transition-all hover:bg-brand-orange/10 hover:text-brand-orange relative group ${textClasses}`}
              title="BOLSA DE COMPRAS"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-orange text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
            
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-bold text-brand-orange bg-brand-orange/10 px-3 py-1 rounded uppercase"
              >
                Admin
              </Link>
            )}

            {user ? (
              <button
                onClick={logout}
                className={`flex items-center space-x-2 text-sm font-medium hover:text-brand-orange ${textClasses}`}
              >
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt="" 
                    className="w-8 h-8 rounded-full border border-gray-200" 
                    referrerPolicy="no-referrer"
                  />
                )}
                <span>Salir</span>
              </button>
            ) : (
              <button
                onClick={login}
                className={`flex items-center space-x-2 text-sm font-bold hover:text-brand-orange ${isTransparent ? 'text-white' : 'text-brand-black'}`}
              >
                <User size={18} />
                <span>Entrar</span>
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link 
              to="/favorites"
              id="navbar-heart-mobile"
              className={`p-2 rounded-full transition-all relative ${
                location.pathname === '/favorites' ? 'text-brand-orange bg-brand-orange/10' : textClasses
              }`}
            >
              <Heart size={24} fill={location.pathname === '/favorites' ? 'currentColor' : 'none'} />
              <AnimatePresence>
                {favorites.length > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                  >
                    {favorites.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            <button
              onClick={() => setIsCartOpen(true)}
              className={`p-2 rounded-full transition-all relative ${textClasses}`}
            >
              <ShoppingBag size={24} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-brand-orange text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
            <Link 
              to="/catalog?filter=open"
              className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl font-bold text-sm uppercase transition-all ${
                isTransparent ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-100 text-brand-black hover:bg-gray-200'
              }`}
            >
              <Tags size={18} />
              <span>Categorías</span>
            </Link>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`${textClasses} hover:text-brand-orange p-2 transition-colors`}
              aria-label="Menu"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? 'close' : 'open'}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {isOpen ? <X size={32} /> : <Menu size={32} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[1000] bg-white md:hidden flex flex-col"
          >
            {/* Mobile Menu Header */}
            <div className="flex justify-between items-center h-20 px-4 border-b border-gray-100">
              <SmartLogo isDarkBackground={false} className="w-[77px] h-[60px] object-contain" />
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:text-brand-orange p-2"
              >
                <X size={32} />
              </motion.button>
            </div>

            {/* Mobile Menu Links */}
            <div className="flex-grow overflow-y-auto py-8 px-6">
              <nav className="space-y-1">
                {navLinks.map((link, i) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link
                        to={link.path === '/catalog' ? '/catalog?reset=true' : link.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between py-4 text-3xl font-black tracking-tighter uppercase transition-colors ${
                          isActive ? 'text-brand-orange' : 'text-brand-black'
                        }`}
                      >
                        <motion.span layout>
                          {link.name}
                        </motion.span>
                        <AnimatePresence mode="popLayout">
                          {isActive && branding?.isotypeDark && (
                            <motion.img
                              key="mobile-isotype"
                              layoutId="nav-isotype-mobile"
                              src={branding.isotypeDark}
                              alt=""
                              className="w-8 h-8 object-contain"
                              initial={{ opacity: 0, scale: 0.5, x: 20 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.5, x: 20 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </AnimatePresence>
                      </Link>
                    </motion.div>
                  );
                })}
                
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: navLinks.length * 0.1 }}
                  >
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="block py-4 text-3xl font-black tracking-tighter uppercase text-brand-orange"
                    >
                      Panel Admin
                    </Link>
                  </motion.div>
                )}
              </nav>

              <div className="mt-12 pt-8 border-t border-gray-100">
                {user ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center space-x-4 mb-8"
                  >
                    {user.photoURL && (
                      <img 
                        src={user.photoURL} 
                        alt="" 
                        className="w-12 h-12 rounded-full border-2 border-brand-orange" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div>
                      <p className="font-bold text-brand-black">{user.displayName}</p>
                      <button onClick={() => { logout(); setIsOpen(false); }} className="text-sm text-gray-500 font-bold hover:text-brand-orange">Cerrar Sesión</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => { login(); setIsOpen(false); }}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <User size={20} />
                    <span>Iniciar Sesión</span>
                  </motion.button>
                )}
              </div>
            </div>

            {/* Mobile Menu Footer */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="p-6 bg-gray-50 border-t border-gray-100"
            >
              <Link
                to="/favorites"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center justify-center space-x-3 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 text-brand-black hover:text-brand-orange transition-all group"
              >
                <div className="bg-brand-orange/10 p-2 rounded-xl group-hover:bg-brand-orange group-hover:text-white transition-colors">
                  <Heart size={20} className="text-brand-orange group-hover:text-white transition-colors" />
                </div>
                <span className="font-bold uppercase tracking-tighter">Mis productos favoritos</span>
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
