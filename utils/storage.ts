
import { Order, GalleryImage } from '../types';

const ORDERS_KEY = 'sweettrack_orders';
const GALLERY_KEY = 'sweettrack_gallery';

export const getOrders = (): Order[] => {
  const data = localStorage.getItem(ORDERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  orders.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const updateOrderStatus = (orderId: string, status: Order['status']) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === orderId);
  if (index !== -1) {
    orders[index].status = status;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
};

export const deleteOrder = (orderId: string) => {
  const orders = getOrders();
  const filtered = orders.filter(o => o.id !== orderId);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(filtered));
};

// Gallery Methods
export const getGalleryImages = (): GalleryImage[] => {
  const data = localStorage.getItem(GALLERY_KEY);
  return data ? JSON.parse(data) : [];
};

export const addGalleryImage = (image: GalleryImage) => {
  const images = getGalleryImages();
  images.unshift(image); // Add to beginning
  localStorage.setItem(GALLERY_KEY, JSON.stringify(images));
};

export const deleteGalleryImage = (id: string) => {
  const images = getGalleryImages();
  const filtered = images.filter(img => img.id !== id);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(filtered));
};
