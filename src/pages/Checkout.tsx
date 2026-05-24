import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Truck, 
  User, 
  MessageCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Info,
  Calendar,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { useCart } from '../firebase/CartContext';
import { useBranding } from '../firebase/BrandingContext';
import { addOrder } from '../firebase/services';

export default function Checkout() {
  const { items, totalPrice, totalItems, clearCart, setIsOpen } = useCart();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    address: '',
    city: '',
    zip: '',
    cardNumber: '',
    expDate: '',
    cvv: ''
  });

  if (items.length === 0 && !isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl max-w-md w-full space-y-6">
          <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <CreditCard size={48} className="text-gray-200" />
          </div>
          <h2 className="text-3xl font-black tracking-tighter">Tu bolsa está vacía</h2>
          <p className="text-gray-500">Agrega algunos productos antes de proceder al pago.</p>
          <button 
            onClick={() => navigate('/catalog')}
            className="btn-primary w-full"
          >
            Ver Catálogo
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    if (name === 'cardNumber') {
      const digits = value.replace(/\D/g, '').slice(0, 16);
      const masked = digits.match(/.{1,4}/g)?.join(' ') || digits;
      setFormData(prev => ({ ...prev, [name]: masked }));
      return;
    }

    if (name === 'expDate') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        setFormData(prev => ({ ...prev, [name]: `${digits.slice(0, 2)}/${digits.slice(2)}` }));
      } else {
        setFormData(prev => ({ ...prev, [name]: digits }));
      }
      return;
    }

    if (name === 'cvv') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      setFormData(prev => ({ ...prev, [name]: digits }));
      return;
    }

    if (name === 'zip' || name === 'whatsapp') {
      const digits = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: digits }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }
    
    if (!formData.whatsapp.trim()) newErrors.whatsapp = 'El WhatsApp es requerido';
    if (!formData.address.trim()) newErrors.address = 'La dirección es requerida';
    if (!formData.city.trim()) newErrors.city = 'La ciudad es requerida';
    if (!formData.zip.trim()) newErrors.zip = 'El CP es requerido';

    // Payment validation
    const cardDigits = formData.cardNumber.replace(/\s/g, '');
    if (cardDigits.length < 13) newErrors.cardNumber = 'Número de tarjeta incompleto';
    
    if (formData.expDate.length !== 5) {
      newErrors.expDate = 'Formato MM/AA requerido';
    } else {
      const [m, y] = formData.expDate.split('/').map(Number);
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      
      if (m < 1 || m > 12) newErrors.expDate = 'Mes inválido';
      else if (y < currentYear || (y === currentYear && m < currentMonth)) {
        newErrors.expDate = 'Tarjeta expirada';
      }
    }

    if (formData.cvv.length < 3) newErrors.cvv = 'CVV inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    try {
      // Create the order object
      const order = {
        customerName: formData.name,
        email: formData.email,
        whatsapp: formData.whatsapp,
        address: formData.address,
        city: formData.city,
        zip: formData.zip,
        items: items,
        totalPrice: totalPrice,
        status: 'pending' as const,
        paymentInfo: {
          cardNumber: `**** **** **** ${formData.cardNumber.slice(-4)}`,
          expDate: formData.expDate
        }
      };

      await addOrder(order);
      
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Error processing order:', error);
      setIsProcessing(false);
      alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price) + ' MXN';
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3rem] shadow-xl max-w-lg w-full text-center space-y-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-50" />
            <div className="relative bg-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto text-white">
              <CheckCircle2 size={48} strokeWidth={3} />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black tracking-tighter">¡Pago Exitoso!</h2>
            <p className="text-gray-500 text-lg">Tu pedido ha sido procesado correctamente.</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-3xl text-left space-y-2">
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">N° de confirmación</p>
            <p className="text-2xl font-mono font-black text-center text-brand-orange">VQ-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            <p className="text-xs text-gray-400 text-center">Te contactaremos por WhatsApp para coordinar la entrega.</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-5 bg-brand-black text-white rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-10 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-400 font-bold hover:text-brand-black transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>

        <h1 className="text-5xl font-black tracking-tighter mb-12">Finalizar Pedido</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Sections */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Customer Info */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl">
                  <User className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Información de Contacto</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tus datos personales</p>
                </div>
              </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Nombre Completo</label>
                  <input 
                    required
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Ej. Juan Pérez"
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                      errors.name ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                    }`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Email</label>
                  <input 
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="juan@ejemplo.com"
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                      errors.email ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                    }`}
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">WhatsApp / Teléfono</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      required
                      type="tel"
                      name="whatsapp"
                      autoComplete="tel"
                      inputMode="numeric"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                      placeholder="52 55..."
                      className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.whatsapp ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                  </div>
                  {errors.whatsapp && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.whatsapp}</p>}
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center space-x-4">
                <div className="bg-brand-orange/10 p-3 rounded-2xl">
                  <Truck className="text-brand-orange" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight">Dirección de Envío</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Donde enviaremos tu pedido</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Calle y Número</label>
                  <input 
                    required
                    type="text"
                    name="address"
                    autoComplete="shipping street-address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Calle, número, colonia..."
                    className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                      errors.address ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                    }`}
                  />
                  {errors.address && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Ciudad / Estado</label>
                    <input 
                      required
                      type="text"
                      name="city"
                      autoComplete="shipping address-level2"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Ciudad"
                      className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.city ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                    {errors.city && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Código Postal</label>
                    <input 
                      required
                      type="text"
                      name="zip"
                      autoComplete="shipping postal-code"
                      inputMode="numeric"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="00000"
                      className={`w-full p-4 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.zip ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                    {errors.zip && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.zip}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-brand-orange/10 p-3 rounded-2xl">
                    <CreditCard className="text-brand-orange" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Método de Pago</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Pago seguro con tarjeta</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 grayscale opacity-50">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" referrerPolicy="no-referrer" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="MasterCard" referrerPolicy="no-referrer" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Número de Tarjeta</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                    <input 
                      required
                      type="text"
                      name="cardNumber"
                      autoComplete="cc-number"
                      inputMode="numeric"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="0000 0000 0000 0000"
                      className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                        errors.cardNumber ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                      }`}
                    />
                  </div>
                  {errors.cardNumber && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.cardNumber}</p>}
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Expiración (MM/AA)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                      <input 
                        required
                        type="text"
                        name="expDate"
                        autoComplete="cc-exp"
                        inputMode="numeric"
                        value={formData.expDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                          errors.expDate ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                        }`}
                      />
                    </div>
                    {errors.expDate && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.expDate}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">CVV</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                      <input 
                        required
                        type="text"
                        name="cvv"
                        autoComplete="cc-csc"
                        inputMode="numeric"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full p-4 pl-12 bg-gray-50 rounded-2xl border-2 transition-all font-medium ${
                          errors.cvv ? 'border-red-200 focus:ring-red-100' : 'border-transparent focus:ring-brand-orange/20'
                        }`}
                      />
                    </div>
                    {errors.cvv && <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight pl-2">{errors.cvv}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Summary Section */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-6">
            <div className="bg-brand-black text-white p-8 rounded-[2.5rem] shadow-2xl space-y-8">
              <h3 className="text-2xl font-black tracking-tight text-white">Resumen de Compra</h3>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {items.map((item) => {
                  const itemKey = `${item.id}-${item.selectedVariant?.id || 'none'}`;
                  return (
                    <div key={itemKey} className="flex space-x-4 items-center">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl overflow-hidden flex-shrink-0">
                        <img src={item.selectedVariant?.imagen || item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-black text-white/40 uppercase tracking-wider">{item.quantity}x</p>
                        <h4 className="font-bold text-sm line-clamp-1 text-white">{item.name}</h4>
                        {item.selectedVariant && (
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-tight">
                            {item.selectedVariant.textoCombinacion}
                          </p>
                        )}
                        <p className="font-black text-brand-orange text-xs">{formatPrice((item.price || 0) * item.quantity)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between items-center text-white/60">
                   <span className="text-sm font-bold uppercase tracking-widest">Subtotal</span>
                   <span className="font-bold">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-brand-orange">
                   <span className="text-sm font-bold uppercase tracking-widest">Envío</span>
                   <span className="font-bold">GRATIS</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                   <span className="text-xl font-black tracking-tighter uppercase">Total</span>
                   <span className="text-3xl font-black tracking-tighter text-brand-orange">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center space-x-3 transition-all ${
                  isProcessing 
                  ? 'bg-gray-700 cursor-not-allowed' 
                  : 'bg-brand-orange hover:bg-brand-orange/90 shadow-xl shadow-brand-orange/20'
                }`}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                    />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={22} />
                    <span>Pagar Ahora</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center space-x-2 text-white/40">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest text-center">Transacción segura y encriptada</span>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-3xl flex items-start space-x-4">
              <Info className="text-blue-500 mt-1 flex-shrink-0" size={20} />
              <p className="text-xs text-blue-900 leading-relaxed font-medium">
                Al realizar tu pago, el sistema procesará tu pedido y nos pondremos en contacto contigo vía WhatsApp al número <span className="font-black">+{formData.whatsapp || (branding?.phones?.[0] || branding?.phone || '525569143901').replace(/\D/g, '')}</span> para confirmar el envío.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
