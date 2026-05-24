import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './config';
import { getContent, updateContent } from './services';
import { WebContent } from '../types';
import { useAuth } from './AuthContext';

interface ContentContextType {
  content: WebContent | null;
  draftContent: WebContent | null;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  updateDraft: (path: string, value: any) => void;
  saveChanges: () => Promise<void>;
  cancelChanges: () => void;
  loading: boolean;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

const DEFAULT_CONTENT: WebContent = {
  hero: {
    badge: "Colecciones Exclusivas para tu Hogar",
    title: "ESTILO Y ELEGANCIA EN CADA RINCÓN",
    subtitle: "Descubre piezas únicas diseñadas para transformar tu espacio. Encuentra lo mejor en decoración, mobiliario y accesorios personales.",
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80",
    video: {
      enabled: false,
      url: "",
      muted: true,
      startTime: 0,
      endTime: 0
    }
  },
  featured: {
    title: "ÚLTIMAS NOVEDADES"
  },
  features: {
    quality: { 
      title: "Calidad Premium", 
      desc: "Cada producto es seleccionado bajo los más altos estándares de diseño y durabilidad.",
      image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80"
    },
    delivery: { 
      title: "Envío Seguro", 
      desc: "Gestionamos tus pedidos con el mayor cuidado para que lleguen perfectos a tu hogar.",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80"
    },
    support: { 
      title: "Atención Exclusiva", 
      desc: "Asesoría personalizada para ayudarte a encontrar la pieza perfecta para tu estilo.",
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&q=80"
    }
  },
  cta: {
    title: "¿BUSCAS ALGO DIFERENTE?",
    desc: "Si tienes una idea específica para tu espacio, contáctanos. Te ayudamos a materializar tu visión con nuestra red de diseñadores.",
    image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80",
    button: "Contactar Ahora"
  },
  mercadopago: {
    title: "¡Encuéntranos en Mercado Libre!",
    desc: "Visita nuestra tienda oficial y descubre todas nuestras ofertas y facilidades de pago.",
    button: "VISITAR TIENDA"
  },
  about: {
    heroTitle: "PASIÓN POR EL DISEÑO",
    heroSubtitle: "En Verity nos dedicamos a curar las mejores soluciones en decoración y productos personales para quienes buscan orden y calma en su habitad.",
    historyTitle: "NUESTRA HISTORIA",
    historyText1: "Con años de experiencia en el mercado, hemos consolidado una reputación basada en la confianza y la estética. Entendemos que cada espacio es único.",
    historyText2: "Nuestra presencia en México nos permite atender de manera eficiente a clientes que buscan transformar su entorno con piezas que hablan de su personalidad.",
    statsExperience: "10+",
    statsExperienceLabel: "Años de trayectoria",
    statsEquipments: "5k+",
    statsEquipmentsLabel: "Clientes felices",
    missionTitle: "MISIÓN",
    missionText: "Proveer productos de la más alta calidad y diseño, superando las expectativas de nuestros clientes a través de un servicio excepcional y piezas que inspiran.",
    visionTitle: "VISIÓN",
    visionText: "Ser la marca líder y referente en diseño de interiores y productos personales en México, reconocida por nuestra integridad y compromiso con el estilo de vida de nuestros clientes.",
    image: "https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80",
    backgroundImage: ""
  },
  contact: {
    heroTitle: "CONTACTO",
    heroSubtitle: "Estamos listos para asesorarte. Contáctanos por cualquiera de nuestros canales o visítanos.",
    cardsTitle1: "Llámanos",
    cardsDesc1: "Atención personalizada",
    cardsTitle2: "WhatsApp",
    cardsDesc2: "Respuesta rápida",
    cardsTitle3: "Email",
    cardsDesc3: "Consultas y pedidos",
    locationsTitle: "NUESTRAS UBICACIONES",
    location1Title: "Showroom Principal",
    location1Address: "Calle General Pedro María Anaya 41, Barrio de San Lorenzo, Zumpango de Ocampo, Estado de México, Mexico C.P. 55604",
    location1Hours: "Lun - Sáb: 9:00 AM - 6:00 PM",
    location2Title: "Punto de Venta",
    location2Address: "Carretera Federal México-Pachuca km 7 con sentido a CDMX, Zapotlán de Juárez, Hidalgo C.P. 42190",
    location2Hours: "Lun - Sáb: 9:00 AM - 6:00 PM",
    formTitle: "ENVÍANOS UN MENSAJE",
    backgroundImage: ""
  },
  faq: {
    heroTitle: "PREGUNTAS FRECUENTES",
    heroSubtitle: "Resolvemos tus dudas más comunes sobre nuestras piezas y procesos de entrega.",
    ctaTitle: "¿TIENES OTRA PREGUNTA?",
    ctaSubtitle: "Estamos aquí para ayudarte. Contáctanos directamente por WhatsApp para una respuesta inmediata.",
    backgroundImage: ""
  },
  catalog: {
    heroTitle: "NUESTRAS COLECCIONES",
    heroSubtitle: "Explora nuestra selección de piezas exclusivas para tu hogar y bienestar personal.",
    backgroundImage: ""
  },
  footer: {
    description: "Expertos en curaduría de productos para el hogar y uso personal. Ofrecemos soluciones estéticas para tu vida diaria."
  },
  legal: {
    privacyPolicy: "En Verity, nos tomamos muy en serio la privacidad de sus datos...",
    termsAndConditions: "Al acceder y utilizar este sitio web, usted acepta los siguientes términos..."
  }
};

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<WebContent | null>(null);
  const [draftContent, setDraftContent] = useState<WebContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "content"), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as WebContent;
        // Merge with default content to ensure all new fields exist
        const mergedContent: WebContent = {
          ...DEFAULT_CONTENT,
          ...data,
          hero: { ...DEFAULT_CONTENT.hero, ...(data.hero || {}) },
          featured: { ...DEFAULT_CONTENT.featured, ...(data.featured || {}) },
          features: { ...DEFAULT_CONTENT.features, ...(data.features || {}) },
          cta: { ...DEFAULT_CONTENT.cta, ...(data.cta || {}) },
          mercadopago: { ...DEFAULT_CONTENT.mercadopago, ...(data.mercadopago || {}) },
          about: { ...DEFAULT_CONTENT.about, ...(data.about || {}) },
          contact: { ...DEFAULT_CONTENT.contact, ...(data.contact || {}) },
          faq: { ...DEFAULT_CONTENT.faq, ...(data.faq || {}) },
          footer: { ...DEFAULT_CONTENT.footer, ...(data.footer || {}) },
          legal: { ...DEFAULT_CONTENT.legal, ...(data.legal || {}) },
        };
        setContent(mergedContent);
        if (!isEditing) setDraftContent(mergedContent);
      } else {
        setContent(DEFAULT_CONTENT);
        if (!isEditing) setDraftContent(DEFAULT_CONTENT);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [isEditing]);

  const updateDraft = (path: string, value: any) => {
    setDraftContent(prev => {
      if (!prev) return null;
      
      // Deep clone to avoid mutation issues
      const newDraft = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = newDraft;
      
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Create missing intermediate objects if they don't exist
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      current[keys[keys.length - 1]] = value;
      return newDraft;
    });
  };

  const saveChanges = async () => {
    if (!draftContent || !isAdmin) return;
    try {
      await updateContent(draftContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving content:", error);
      throw error;
    }
  };

  const cancelChanges = () => {
    setDraftContent(content);
    setIsEditing(false);
  };

  return (
    <ContentContext.Provider value={{ 
      content, 
      draftContent, 
      isEditing, 
      setIsEditing, 
      updateDraft, 
      saveChanges, 
      cancelChanges,
      loading 
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
