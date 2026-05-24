import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  increment
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./config";
import { Product, Category, BrandingSettings, GalleryImage, WebContent, FAQ, Location, Review, Order, Atributo } from "../types";

const PRODUCTS_COLLECTION = "products";
const CATEGORIES_COLLECTION = "categories";
const SETTINGS_COLLECTION = "settings";
const GALLERY_COLLECTION = "galeria";
const FAQS_COLLECTION = "faqs";
const LOCATIONS_COLLECTION = "locations";
const REVIEWS_COLLECTION = "reviews";
const ORDERS_COLLECTION = "orders";
const ALLOWED_ADMINS_COLLECTION = "allowed_admins";
const ATRIBUTOS_COLLECTION = "atributos";
const CONTENT_COLLECTION = "settings";
const CONTENT_DOC = "content";

export const productsRef = collection(db, PRODUCTS_COLLECTION);
export const categoriesRef = collection(db, CATEGORIES_COLLECTION);
export const galleryRef = collection(db, GALLERY_COLLECTION);
export const faqsRef = collection(db, FAQS_COLLECTION);
export const locationsRef = collection(db, LOCATIONS_COLLECTION);
export const reviewsRef = collection(db, REVIEWS_COLLECTION);
export const ordersRef = collection(db, ORDERS_COLLECTION);
export const allowedAdminsRef = collection(db, ALLOWED_ADMINS_COLLECTION);
export const atributosRef = collection(db, ATRIBUTOS_COLLECTION);

// Atributos
export const getAtributos = async () => {
  const q = query(atributosRef, orderBy("nombre", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    // Normalizar valores para manejar arrays de strings antiguos y asegurar que todos tengan ID
    const valores = (data.valores || []).map((v: any, index: number) => {
      if (typeof v === 'string') {
        return {
          id: `${doc.id}-v${index}`,
          nombre: v,
          tipoValor: 'texto'
        };
      }
      // Si ya es un objeto pero no tiene ID (pudo pasar en alguna versión intermedia)
      if (typeof v === 'object' && !v.id) {
        return { ...v, id: `${doc.id}-v${index}` };
      }
      return v;
    });
    return { id: doc.id, ...data, valores } as Atributo;
  });
};

export const addAtributo = (atributo: Omit<Atributo, 'id'>) => {
  return addDoc(atributosRef, atributo);
};

export const updateAtributo = (id: string, atributo: Partial<Atributo>) => {
  return updateDoc(doc(db, ATRIBUTOS_COLLECTION, id), atributo);
};

export const deleteAtributo = (id: string) => {
  return deleteDoc(doc(db, ATRIBUTOS_COLLECTION, id));
};

// Orders
export const getOrders = async () => {
  const q = query(ordersRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
};

export const addOrder = (order: Omit<Order, "id" | "createdAt">) => {
  return addDoc(ordersRef, {
    ...order,
    createdAt: serverTimestamp()
  });
};

export const updateOrder = (id: string, order: Partial<Order>) => {
  return updateDoc(doc(db, ORDERS_COLLECTION, id), order);
};

export const deleteOrder = (id: string) => {
  return deleteDoc(doc(db, ORDERS_COLLECTION, id));
};

// Allowed Admins
export const getAllowedAdmins = async () => {
  const snapshot = await getDocs(allowedAdminsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, email: doc.data().email }));
};

export const addAllowedAdmin = (email: string) => {
  const cleanEmail = email.toLowerCase().trim();
  return setDoc(doc(db, ALLOWED_ADMINS_COLLECTION, cleanEmail), { email: cleanEmail });
};

export const deleteAllowedAdmin = (email: string) => {
  return deleteDoc(doc(db, ALLOWED_ADMINS_COLLECTION, email));
};

export const isEmailAllowedAdmin = async (email: string): Promise<boolean> => {
  if (email === 'menaricardo333@gmail.com') return true; // Super admin
  const docRef = doc(db, ALLOWED_ADMINS_COLLECTION, email.toLowerCase().trim());
  const snapshot = await getDoc(docRef);
  return snapshot.exists();
};

// Branding Settings
export const getBranding = async (): Promise<BrandingSettings | null> => {
  const docRef = doc(db, SETTINGS_COLLECTION, "branding");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as BrandingSettings;
  }
  return null;
};

export const updateBranding = (branding: Partial<BrandingSettings>) => {
  const docRef = doc(db, SETTINGS_COLLECTION, "branding");
  return setDoc(docRef, branding, { merge: true });
};

// Products
export const getProducts = async () => {
  const q = query(productsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = (product: Omit<Product, "id" | "createdAt">) => {
  return addDoc(productsRef, {
    ...product,
    createdAt: serverTimestamp()
  });
};

export const updateProduct = (id: string, product: Partial<Product>) => {
  return updateDoc(doc(db, PRODUCTS_COLLECTION, id), product);
};

export const deleteProduct = (id: string) => {
  return deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
};

// Categories
export const getCategories = async () => {
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = (category: Omit<Category, "id">) => {
  return addDoc(categoriesRef, category);
};

export const updateCategory = (id: string, category: Partial<Category>) => {
  return updateDoc(doc(db, CATEGORIES_COLLECTION, id), category);
};

export const deleteCategory = (id: string) => {
  return deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
};

// Gallery
export const addGalleryImage = (image: Omit<GalleryImage, "id" | "createdAt">) => {
  return addDoc(galleryRef, {
    ...image,
    createdAt: serverTimestamp()
  });
};

export const deleteGalleryImage = (id: string) => {
  return deleteDoc(doc(db, GALLERY_COLLECTION, id));
};

// Web Content
export const getContent = async (): Promise<WebContent | null> => {
  const docRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data() as WebContent;
  }
  return null;
};

export const updateContent = (content: Partial<WebContent>) => {
  const docRef = doc(db, CONTENT_COLLECTION, CONTENT_DOC);
  return setDoc(docRef, content, { merge: true });
};

// FAQs
export const getFAQs = async () => {
  const q = query(faqsRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FAQ));
};

export const addFAQ = (faq: Omit<FAQ, "id">) => {
  return addDoc(faqsRef, faq);
};

export const updateFAQ = (id: string, faq: Partial<FAQ>) => {
  return updateDoc(doc(db, FAQS_COLLECTION, id), faq);
};

export const deleteFAQ = (id: string) => {
  return deleteDoc(doc(db, FAQS_COLLECTION, id));
};

// Locations
export const getLocations = async () => {
  const q = query(locationsRef, orderBy("order", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
};

export const addLocation = (location: Omit<Location, "id">) => {
  return addDoc(locationsRef, location);
};

export const updateLocation = (id: string, location: Partial<Location>) => {
  return updateDoc(doc(db, LOCATIONS_COLLECTION, id), location);
};

export const deleteLocation = (id: string) => {
  return deleteDoc(doc(db, LOCATIONS_COLLECTION, id));
};

// Visit Counter
export const incrementVisits = async () => {
  const docRef = doc(db, "stats", "visits");
  await setDoc(docRef, { count: increment(1) }, { merge: true });
};

export const getVisits = async (): Promise<number> => {
  const docRef = doc(db, "stats", "visits");
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return snapshot.data().count || 0;
  }
  return 0;
};

// Reviews
export const getReviews = async () => {
  const q = query(reviewsRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const addReview = (review: Omit<Review, "id" | "createdAt">) => {
  return addDoc(reviewsRef, {
    ...review,
    createdAt: serverTimestamp()
  });
};

export const updateReview = (id: string, review: Partial<Review>) => {
  return updateDoc(doc(db, REVIEWS_COLLECTION, id), review);
};

export const deleteReview = (id: string) => {
  return deleteDoc(doc(db, REVIEWS_COLLECTION, id));
};

// Image Utilities
export const uploadAndOptimizeImage = async (file: File, path: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/optimize-image', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const optimizedBlob = await response.blob();
      const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${path}/${Date.now()}_${safeName}${safeName.includes('.') ? '' : '.webp'}`;
      const sRef = storageRef(storage, fileName);
      
      await uploadBytes(sRef, optimizedBlob, { contentType: 'image/webp' });
      return await getDownloadURL(sRef);
    } else {
      console.warn('Optimization server returned an error, falling back to direct upload');
    }
  } catch (error) {
    console.warn('Optimization request failed, falling back to direct upload', error);
  }

  // Fallback: Upload original file if optimization fails
  const safeName = (file.name || 'image').replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${path}/${Date.now()}_${safeName}`;
  const sRef = storageRef(storage, fileName);
  await uploadBytes(sRef, file);
  return await getDownloadURL(sRef);
};
