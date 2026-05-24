import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, X, Tags } from 'lucide-react';
import { getProducts, getCategories } from '../firebase/services';
import { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence, useAnimation } from 'motion/react';
import { EditableText } from '../components/EditableText';
import { HeroBackgroundEditor } from '../components/HeroBackgroundEditor';
import { useContent } from '../firebase/ContentContext';
import { useBranding } from '../firebase/BrandingContext';
import SmartLogo from '../components/SmartLogo';

export default function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [showFilters, setShowFilters] = useState(false);
  const { content } = useContent();
  const { branding } = useBranding();
  const productsRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarControls = useAnimation();

  const handleFilterClick = () => {
    setShowFilters(!showFilters);
  };

  useEffect(() => {
    if (selectedCategory !== 'all' && !loading) {
      productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedCategory, loading]);

  useEffect(() => {
    if (searchParams.get('filter') === 'open') {
      setShowFilters(true);
      // Clean up the URL after opening
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('filter');
      setSearchParams(newParams, { replace: true });
    }
    
    if (searchParams.get('reset') === 'true') {
      setSelectedCategory('all');
      setSearchTerm('');
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('reset');
      newParams.delete('category');
      setSearchParams(newParams, { replace: true });
    }

    const categoryParam = searchParams.get('category') || 'all';
    if (categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams, setSearchParams, selectedCategory]);

  const handleCategoryChange = (category: string, subcategory?: string) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'all') {
      newParams.delete('category');
      newParams.delete('subcategory');
    } else {
      newParams.set('category', category);
      if (subcategory) {
        newParams.set('subcategory', subcategory);
      } else {
        newParams.delete('subcategory');
      }
    }
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, categoriesData] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching catalog data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoryParam = searchParams.get('category') || 'all';
    const subcategoryParam = searchParams.get('subcategory');
    
    // Find the category object that matches the categoryParam (either by name or slug)
    const categoryObj = categories.find(c => 
      !c.parentId && (
        c.name.toLowerCase() === categoryParam.toLowerCase() || 
        c.slug === categoryParam
      )
    );

    const matchesCategory = categoryParam === 'all' || 
                            product.category.toLowerCase() === categoryParam.toLowerCase() ||
                            (categoryObj && product.category.toLowerCase() === categoryObj.name.toLowerCase());
    
    const matchesSubcategory = !subcategoryParam || 
                               product.subcategory?.toLowerCase() === subcategoryParam.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-brand-black text-white py-16 relative overflow-hidden min-h-[300px] flex items-center">
        {content?.catalog?.backgroundImage && (
          <div className="absolute inset-0 z-0">
            <img 
              src={content.catalog.backgroundImage} 
              alt="" 
              className="w-full h-full object-cover opacity-40"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black via-brand-black/80 to-transparent" />
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase text-white">
            {selectedCategory === 'all' ? (
              <EditableText path="catalog.heroTitle" />
            ) : (
              categories.find(c => c.name.toLowerCase() === selectedCategory.toLowerCase() || c.slug === selectedCategory)?.name || selectedCategory
            )}
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            <EditableText path="catalog.heroSubtitle" />
          </p>
        </div>
        <HeroBackgroundEditor path="catalog.backgroundImage" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6 mb-12 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-orange transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleFilterClick}
            className="flex items-center space-x-3 px-6 py-3 bg-gray-50 rounded-xl font-bold text-gray-700 hover:bg-gray-100 transition-all md:w-auto w-full justify-center group"
          >
            <div className="flex-shrink-0">
              <SmartLogo type="isotype" className="h-6 w-auto" />
            </div>
            <span>Categorías</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-12">
          {/* Product Grid */}
          <div className="scroll-mt-32" ref={productsRef}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="animate-pulse bg-white h-96 rounded-xl" />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-bold text-gray-700">No se encontraron productos</h3>
                <p className="text-gray-500">Intenta ajustar tus filtros o términos de búsqueda.</p>
                <button 
                  onClick={handleResetFilters}
                  className="mt-6 text-brand-orange font-bold hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Modal/Drawer (Left side) */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-brand-black/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-full max-w-sm bg-white z-[110] p-8 md:p-10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black flex items-center space-x-3 uppercase tracking-tighter">
                  <div className="flex-shrink-0">
                    <SmartLogo type="isotype" className="h-8 w-auto" />
                  </div>
                  <span className="text-brand-black">Categorías</span>
                </h3>
                <button 
                  onClick={() => setShowFilters(false)} 
                  className="p-3 hover:bg-gray-100 rounded-full transition-colors text-brand-black"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto flex-grow -mx-4 px-4 custom-scrollbar">
                <div className="space-y-1.5">
                  <button
                    onClick={() => {handleCategoryChange('all'); setShowFilters(false);}}
                    className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                      selectedCategory === 'all' 
                        ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-[1.02]' 
                        : 'bg-gray-50 text-brand-black hover:bg-gray-100'
                    }`}
                  >
                    Ver Todo
                  </button>

                  <div className="h-4" /> {/* Spacer */}

                  {categories.filter(c => !c.parentId).map((cat) => (
                    <div key={cat.id} className="space-y-1.5">
                      <button
                        onClick={() => {handleCategoryChange(cat.name); setShowFilters(false);}}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                          (selectedCategory.toLowerCase() === cat.name.toLowerCase() || selectedCategory === cat.slug) && !searchParams.get('subcategory') 
                            ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 scale-[1.02]' 
                            : 'bg-gray-50 text-brand-black hover:bg-gray-100'
                        }`}
                      >
                        {cat.name}
                      </button>
                      
                      <div className="pl-4 space-y-1">
                        {categories.filter(sub => sub.parentId === cat.id).map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => {handleCategoryChange(cat.name, sub.name); setShowFilters(false);}}
                            className={`w-full text-left px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                              searchParams.get('subcategory') === sub.name 
                                ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20' 
                                : 'text-gray-500 hover:text-brand-black hover:bg-gray-50'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
