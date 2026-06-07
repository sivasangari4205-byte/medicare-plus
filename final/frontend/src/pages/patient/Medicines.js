import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import { getTheme, cardStyle, inputStyle } from '../../utils/theme';
import { PageHeader, StatusBadge, EmptyState, PageLoader, Btn, Modal } from '../../components/common/UI';

// 100+ Medicines with real images
const MEDICINES = [
  // Pain Relief (1-12)
  { id: '1', name: 'Paracetamol 500mg', price: 25, category: 'Pain Relief', desc: 'For fever & mild pain', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '2', name: 'Dolo 650mg', price: 30, category: 'Pain Relief', desc: 'Fever & headache relief', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '3', name: 'Ibuprofen 400mg', price: 40, category: 'Pain Relief', desc: 'Anti-inflammatory pain relief', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '4', name: 'Aspirin 75mg', price: 20, category: 'Pain Relief', desc: 'Blood thinner & mild pain', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '5', name: 'Diclofenac 50mg', price: 38, category: 'Pain Relief', desc: 'Joint & muscle pain', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '6', name: 'Naproxen 250mg', price: 55, category: 'Pain Relief', desc: 'Long-lasting pain relief', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '7', name: 'Tramadol 50mg', price: 65, category: 'Pain Relief', desc: 'Moderate to severe pain', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '8', name: 'Mefenamic Acid 250mg', price: 45, category: 'Pain Relief', desc: 'Menstrual & muscle pain', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '9', name: 'Celecoxib 200mg', price: 70, category: 'Pain Relief', desc: 'Arthritis pain', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '10', name: 'Nimesulide 100mg', price: 35, category: 'Pain Relief', desc: 'Acute pain relief', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '11', name: 'Etoricoxib 60mg', price: 85, category: 'Pain Relief', desc: 'Chronic pain management', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '12', name: 'Piroxicam 20mg', price: 42, category: 'Pain Relief', desc: 'Anti-inflammatory', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: true },

  // Antibiotics (13-24)
  { id: '13', name: 'Amoxicillin 250mg', price: 85, category: 'Antibiotics', desc: 'Broad-spectrum antibiotic', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '14', name: 'Azithromycin 250mg', price: 110, category: 'Antibiotics', desc: 'Respiratory infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '15', name: 'Ciprofloxacin 500mg', price: 95, category: 'Antibiotics', desc: 'Urinary & bacterial infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '16', name: 'Doxycycline 100mg', price: 78, category: 'Antibiotics', desc: 'Broad-spectrum infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '17', name: 'Metronidazole 400mg', price: 42, category: 'Antibiotics', desc: 'Stomach & dental infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '18', name: 'Cefixime 200mg', price: 135, category: 'Antibiotics', desc: 'Third-gen cephalosporin', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '19', name: 'Levofloxacin 500mg', price: 98, category: 'Antibiotics', desc: 'Sinus & pneumonia', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '20', name: 'Clindamycin 300mg', price: 145, category: 'Antibiotics', desc: 'Skin & soft tissue infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '21', name: 'Erythromycin 250mg', price: 88, category: 'Antibiotics', desc: 'Respiratory infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '22', name: 'Cephalexin 250mg', price: 75, category: 'Antibiotics', desc: 'Skin & respiratory infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '23', name: 'Ofloxacin 200mg', price: 68, category: 'Antibiotics', desc: 'Eye & ear infections', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '24', name: 'Nitrofurantoin 100mg', price: 55, category: 'Antibiotics', desc: 'UTI treatment', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },

  // Supplements (25-36)
  { id: '25', name: 'Vitamin C 1000mg', price: 120, category: 'Supplements', desc: 'Immune system support', icon: '🍊', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '26', name: 'Vitamin D3 60K IU', price: 180, category: 'Supplements', desc: 'Bone health & immunity', icon: '☀️', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '27', name: 'Multivitamin Daily', price: 220, category: 'Supplements', desc: 'Complete daily nutrition', icon: '🌈', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '28', name: 'Vitamin B12 500mcg', price: 145, category: 'Supplements', desc: 'Nerve & energy support', icon: '⚡', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '29', name: 'Calcium + D3 500mg', price: 160, category: 'Supplements', desc: 'Bone strength', icon: '🦴', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '30', name: 'Omega-3 Fish Oil 1000mg', price: 280, category: 'Supplements', desc: 'Heart & brain health', icon: '🐟', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '31', name: 'Zinc 50mg', price: 90, category: 'Supplements', desc: 'Immunity & wound healing', icon: '🛡️', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '32', name: 'Iron 65mg + Folic Acid', price: 75, category: 'Supplements', desc: 'Anaemia & pregnancy support', icon: '🩸', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '33', name: 'Magnesium 250mg', price: 195, category: 'Supplements', desc: 'Muscle & sleep support', icon: '💤', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '34', name: 'Vitamin E 400IU', price: 210, category: 'Supplements', desc: 'Skin & antioxidant', icon: '🌟', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '35', name: 'CoQ10 100mg', price: 350, category: 'Supplements', desc: 'Heart health & energy', icon: '❤️', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '36', name: 'Probiotics 10B CFU', price: 280, category: 'Supplements', desc: 'Gut health support', icon: '🦠', image: 'https://images.unsplash.com/photo-1616671276441-2f2c3fc21e0f?w=300&h=200&fit=crop', requiresPrescription: false },

  // Stomach/Antacid (37-45)
  { id: '37', name: 'Omeprazole 20mg', price: 65, category: 'Stomach', desc: 'For acidity & GERD', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '38', name: 'Pantoprazole 40mg', price: 55, category: 'Stomach', desc: 'Gastric acid reducer', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '39', name: 'Ranitidine 150mg', price: 30, category: 'Stomach', desc: 'Heartburn & ulcer relief', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '40', name: 'Digene Gel', price: 28, category: 'Stomach', desc: 'Instant acidity relief', icon: '🔵', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '41', name: 'Domperidone 10mg', price: 35, category: 'Stomach', desc: 'Nausea & vomiting', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '42', name: 'Loperamide 2mg', price: 28, category: 'Stomach', desc: 'Anti-diarrhoeal', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '43', name: 'ORS Electrolyte Sachet', price: 15, category: 'Stomach', desc: 'Rehydration solution', icon: '💧', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '44', name: 'Esomeprazole 40mg', price: 85, category: 'Stomach', desc: 'Severe acid reflux', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '45', name: 'Dicyclomine 20mg', price: 32, category: 'Stomach', desc: 'Stomach cramps', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },

  // Allergy (46-48)
  { id: '46', name: 'Cetirizine 10mg', price: 35, category: 'Allergy', desc: 'Allergies & hay fever', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '47', name: 'Loratadine 10mg', price: 42, category: 'Allergy', desc: 'Non-drowsy allergy relief', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '48', name: 'Fexofenadine 120mg', price: 68, category: 'Allergy', desc: '24hr allergy control', icon: '💊', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=200&fit=crop', requiresPrescription: false },

  // Diabetes (49-51)
  { id: '49', name: 'Metformin 500mg', price: 45, category: 'Diabetes', desc: 'Blood sugar control', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '50', name: 'Metformin 1000mg', price: 75, category: 'Diabetes', desc: 'Type 2 diabetes management', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '51', name: 'Glipizide 5mg', price: 60, category: 'Diabetes', desc: 'Stimulates insulin release', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },

  // Cardiac (52-55)
  { id: '52', name: 'Atorvastatin 10mg', price: 95, category: 'Cardiac', desc: 'Cholesterol management', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '53', name: 'Amlodipine 5mg', price: 50, category: 'Cardiac', desc: 'Blood pressure control', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '54', name: 'Telmisartan 40mg', price: 85, category: 'Cardiac', desc: 'Hypertension management', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },
  { id: '55', name: 'Losartan 50mg', price: 72, category: 'Cardiac', desc: 'ARB for high BP', icon: '💊', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: true },

  // Skin (56)
  { id: '56', name: 'Clotrimazole Cream 1%', price: 55, category: 'Skin', desc: 'Antifungal cream', icon: '🧴', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },

  // Cough (57)
  { id: '57', name: 'Benadryl Cough Syrup', price: 85, category: 'Cough', desc: 'Dry & wet cough', icon: '🫧', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },

  // Sleep (58)
  { id: '58', name: 'Melatonin 5mg', price: 220, category: 'Sleep', desc: 'Natural sleep support', icon: '🌙', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },

  // Ayurveda (59-60)
  { id: '59', name: 'Ashwagandha 500mg', price: 180, category: 'Ayurveda', desc: 'Stress & anxiety relief', icon: '🌿', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false },
  { id: '60', name: 'Tulsi Drops', price: 120, category: 'Ayurveda', desc: 'Immunity booster', icon: '🌿', image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=300&h=200&fit=crop', requiresPrescription: false }
];

const categories = ['All', ...new Set(MEDICINES.map(m => m.category))];

// Load Razorpay script helper
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Medicines() {
  const { darkMode, user } = useAuth();
  const t = getTheme(darkMode);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shop');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showCheckout, setShowCheckout] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState(null);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'razorpay'

  useEffect(() => { 
    api.orders.my().then(r => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false)); 
  }, []);

  const filtered = MEDICINES.filter(m => (catFilter === 'All' || m.category === catFilter) && m.name.toLowerCase().includes(search.toLowerCase()));

  const addToCart = (med) => setCart(prev => { 
    const ex = prev.find(i => i.medicineId === med.id); 
    return ex ? prev.map(i => i.medicineId === med.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { medicineId: med.id, name: med.name, price: med.price, category: med.category, requiresPrescription: med.requiresPrescription || false, quantity: 1 }]; 
  });
  
  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.medicineId !== id));
  const updateQty = (id, qty) => { if (qty < 1) return removeFromCart(id); setCart(prev => prev.map(i => i.medicineId === id ? { ...i, quantity: qty } : i)); };
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const checkoutItems = buyNowItem ? [{ medicineId: buyNowItem.id, name: buyNowItem.name, price: buyNowItem.price, category: buyNowItem.category, requiresPrescription: buyNowItem.requiresPrescription || false, quantity: 1 }] : cart;
  const checkoutTotal = checkoutItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // Main function to place order (used by both COD and Razorpay)
  const placeOrder = async (paymentId = null) => {
    if (!address.trim()) { 
      alert('Please enter delivery address'); 
      setPlacing(false); 
      return false; 
    }
    
    try {
      const orderData = { 
        items: checkoutItems, 
        deliveryAddress: address, 
        deliveryNotes: notes,
        paymentMethod: paymentMethod,
        paymentId: paymentId,
        totalAmount: checkoutTotal
      };
      
      await api.orders.create(orderData);
      
      // Create notification
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      notifications.push({
        id: Date.now(),
        userId: user?.id,
        title: '💰 Order Placed Successfully',
        message: `Your order for ${checkoutItems.length} medicine(s) has been placed. Total: ₹${checkoutTotal}`,
        type: 'order_placed',
        read: false,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('notifications', JSON.stringify(notifications));
      window.dispatchEvent(new Event('newNotification'));
      
      setSuccess(`✅ Order placed successfully! Order ID: ${Date.now().toString().slice(-8)}`);
      setCart([]); 
      setBuyNowItem(null); 
      setShowCheckout(false); 
      setAddress(''); 
      setNotes('');
      
      const r = await api.orders.my(); 
      setOrders(r.data);
      setActiveTab('orders'); 
      setTimeout(() => setSuccess(''), 5000);
      return true;
    } catch (err) { 
      alert(err.response?.data?.error || 'Order failed'); 
      return false;
    }
  };

  // Razorpay Payment Handler
  const processRazorpayPayment = async () => {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load payment gateway. Please try again.');
      return false;
    }

    // Replace with your actual Razorpay key from environment variable
    const RAZORPAY_KEY =  'rzp_test_Syb9wiZKKnqQoW';
    
    const options = {
      key: RAZORPAY_KEY,
      amount: checkoutTotal * 100, // amount in paise
      currency: 'INR',
      name: 'MediCare+ Pharmacy',
      description: `Order for ${checkoutItems.length} medicines`,
      image: 'https://your-logo-url.com/logo.png',
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || '9999999999'
      },
      theme: { color: '#0ea5e9' },
      handler: async (response) => {
        // Payment successful
        await placeOrder(response.razorpay_payment_id);
        setPlacing(false);
      },
      modal: { 
        ondismiss: () => {
          setPlacing(false);
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      alert('Please enter delivery address');
      return;
    }
    
    setPlacing(true);
    
    if (paymentMethod === 'razorpay') {
      await processRazorpayPayment();
      // Note: placing will be set to false in the modal dismiss or handler
    } else {
      await placeOrder();
      setPlacing(false);
    }
  };

  const inp = inputStyle(t);
  if (loading) return <PageLoader darkMode={darkMode} />;

  return (
    <div style={{ background: t.bg, minHeight: '100vh', padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PageHeader title="💊 Medicine Delivery" subtitle={`${MEDICINES.length}+ medicines • Same-day delivery • Free shipping above ₹499`} darkMode={darkMode} />

        {success && <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', color: '#059669', borderRadius: 12, padding: '14px 20px', marginBottom: 20, fontWeight: 600 }}>{success}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('shop')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === 'shop' ? 'linear-gradient(135deg,#0d9488,#059669)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: activeTab === 'shop' ? 'white' : t.textSub }}>
            🛒 Shop Medicines ({MEDICINES.length})
          </button>
          <button onClick={() => setActiveTab('cart')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === 'cart' ? 'linear-gradient(135deg,#0d9488,#059669)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: activeTab === 'cart' ? 'white' : t.textSub }}>
            🛒 Cart ({cartCount})
          </button>
          <button onClick={() => setActiveTab('orders')} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: activeTab === 'orders' ? 'linear-gradient(135deg,#0d9488,#059669)' : (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'), color: activeTab === 'orders' ? 'white' : t.textSub }}>
            📦 My Orders ({orders.length})
          </button>
        </div>

        {/* SHOP SECTION */}
        {activeTab === 'shop' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search medicines by name..." style={{ flex: '1 1 220px', padding: '11px 16px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none' }} />
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ padding: '11px 16px', borderRadius: 10, border: `1px solid ${t.cardBorder}`, background: t.card, color: t.text, fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ color: t.textSub, fontSize: 12, marginBottom: 16 }}>Showing {filtered.length} of {MEDICINES.length} medicines</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
              {filtered.map(m => {
                const inCart = cart.find(i => i.medicineId === m.id);
                return (
                  <div key={m.id} style={{ ...cardStyle(t), padding: 0, overflow: 'hidden', transition: 'transform 0.2s' }}>
                    <img src={m.image} alt={m.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                    <div style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ fontSize: '1.8rem' }}>{m.icon}</div>
                        {m.requiresPrescription && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase' }}>Rx Required</span>}
                      </div>
                      <div style={{ fontWeight: 700, color: t.text, fontSize: 14, marginBottom: 4 }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: '#0891b2', marginBottom: 4 }}>{m.category}</div>
                      <div style={{ fontSize: 11, color: t.textSub, marginBottom: 10, lineHeight: 1.4 }}>{m.desc}</div>
                      <div style={{ fontWeight: 800, color: '#10b981', fontSize: 18, marginBottom: 12 }}>₹{m.price}</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setBuyNowItem(m); setShowCheckout(true); }} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          ⚡ Buy Now
                        </button>
                        {inCart ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <button onClick={() => updateQty(m.id, inCart.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}>−</button>
                            <span style={{ fontWeight: 700, color: t.text, minWidth: 20, textAlign: 'center', fontSize: 13 }}>{inCart.quantity}</span>
                            <button onClick={() => updateQty(m.id, inCart.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(8,145,178,0.1)', color: '#0891b2', cursor: 'pointer', fontWeight: 800 }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(m)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            🛒 Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* CART SECTION */}
        {activeTab === 'cart' && (
          <div style={{ ...cardStyle(t), padding: 28 }}>
            {cart.length === 0 ? <EmptyState icon="🛒" title="Cart is empty" desc="Add medicines from the shop" darkMode={darkMode} action={<button onClick={() => setActiveTab('shop')} style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Browse Medicines</button>} />
            : (
              <>
                {cart.map(item => (
                  <div key={item.medicineId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${t.cardBorder}` }}>
                    <div>
                      <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQty(item.medicineId, item.quantity - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontWeight: 800 }}>−</button>
                      <span style={{ fontWeight: 700, color: t.text, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQty(item.medicineId, item.quantity + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(8,145,178,0.1)', color: '#0891b2', cursor: 'pointer', fontWeight: 800 }}>+</button>
                      <button onClick={() => removeFromCart(item.medicineId)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '16px 0', borderTop: `2px solid ${t.cardBorder}` }}>
                  <span style={{ fontWeight: 800, color: t.text, fontSize: 18 }}>Total: <span style={{ color: '#10b981' }}>₹{total}</span></span>
                  <button onClick={() => { setBuyNowItem(null); setShowCheckout(true); }} style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#0d9488,#059669)', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 }}>Proceed to Checkout →</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ORDERS SECTION */}
        {activeTab === 'orders' && (
          orders.length === 0 ? <div style={{ ...cardStyle(t) }}><EmptyState icon="📦" title="No orders yet" desc="Place your first medicine order" darkMode={darkMode} action={<button onClick={() => setActiveTab('shop')} style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)', color: 'white', padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600 }}>Shop Now</button>} /></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map(o => (
                <div key={o._id} style={{ ...cardStyle(t), padding: 22 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: t.text, fontSize: 15 }}>Order #{o._id?.slice(-8).toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: t.textSub, marginTop: 3 }}>{new Date(o.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>
                    <StatusBadge status={o.status} darkMode={darkMode} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    {o.items?.map((item, i) => <div key={i} style={{ fontSize: 13, color: t.textSub, marginBottom: 3 }}>• {item.name} × {item.quantity} — ₹{item.price * item.quantity}</div>)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${t.cardBorder}`, paddingTop: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>Total: ₹{o.totalAmount}</span>
                    <span style={{ fontSize: 12, color: t.textSub }}>📍 {o.deliveryAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Checkout Modal with Payment Options - FIXED BUTTON TEXT */}
      <Modal isOpen={showCheckout} onClose={() => { setShowCheckout(false); setBuyNowItem(null); }} title={buyNowItem ? '⚡ Quick Buy' : '🛒 Checkout'} darkMode={darkMode} maxWidth={500}>
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: t.text, marginBottom: 12 }}>Order Summary</h4>
          {checkoutItems.map(item => (
            <div key={item.medicineId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: t.textSub, marginBottom: 6 }}>
              <span>{item.name} × {item.quantity}</span>
              <span style={{ color: t.text, fontWeight: 600 }}>₹{item.price * item.quantity}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${t.cardBorder}`, marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: t.text }}>
            <span>Total</span>
            <span style={{ color: '#10b981' }}>₹{checkoutTotal}</span>
          </div>
        </div>
        
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase' }}>Delivery Address *</label>
          <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full delivery address with pin code..." style={{ ...inp, minHeight: 80, resize: 'none', marginBottom: 0 }} required />
        </div>
        
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 7, textTransform: 'uppercase' }}>Delivery Notes (Optional)</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Call before delivery, Landmark near..." style={{ ...inp, marginBottom: 0 }} />
        </div>

        {/* Payment Method Selection */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: t.textSub, marginBottom: 10, textTransform: 'uppercase' }}>Payment Method</label>
          <div style={{ display: 'flex', gap: 15 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ cursor: 'pointer' }} />
              <span style={{ color: t.text }}>💵 Cash on Delivery</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="payment" value="razorpay" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} style={{ cursor: 'pointer' }} />
              <span style={{ color: t.text }}>💳 Card/UPI (Razorpay)</span>
            </label>
          </div>
        </div>

        <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
          💳 {paymentMethod === 'cod' ? 'Pay when you receive the order' : 'Secure payment via card, UPI, netbanking'}
        </div>
        
        {/* FIXED BUTTON - Now shows correct text based on payment method */}
        <button 
          disabled={placing} 
          onClick={handlePlaceOrder} 
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: paymentMethod === 'razorpay' ? 'linear-gradient(135deg,#3b82f6,#8b5cf6)' : 'linear-gradient(135deg,#0d9488,#059669)', 
            color: 'white', 
            border: 'none', 
            borderRadius: 10, 
            fontSize: 15, 
            fontWeight: 700, 
            cursor: placing ? 'not-allowed' : 'pointer', 
            opacity: placing ? 0.7 : 1 
          }}
        >
          {placing 
            ? (paymentMethod === 'razorpay' ? '⏳ Opening Payment...' : '⏳ Placing Order...')
            : (paymentMethod === 'razorpay' 
              ? `💳 Pay with Razorpay ₹${checkoutTotal}` 
              : `💰 Place Order (COD) ₹${checkoutTotal}`)
          }
        </button>
      </Modal>
    </div>
  );
}