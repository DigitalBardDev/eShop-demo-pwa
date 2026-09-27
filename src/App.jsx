import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { dummyInventory, dummyReviews, dummyInquiries, dummyQuestions, dummyMetrics } from './dummyData';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Gallery from './pages/Gallery';
import ItemDetail from './pages/ItemDetail';

// --- SUB-COMPONENT: GENERAL SOURCING MODAL ---

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-[var(--color-luxury-charcoal)] border border-zinc-700 max-w-2xl w-full p-6 sm:p-8 rounded relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} aria-label="Close modal" className="cursor-pointer absolute top-4 right-4 text-zinc-400 hover:text-[var(--color-luxury-sapphire)] text-xl p-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors">✕</button>
        {title && <h3 className="text-lg font-serif text-white mb-6 uppercase tracking-widest border-b border-zinc-700 pb-4">{title}</h3>}
        {children}
      </div>
    </div>
  );
}

function SourcingModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const payload = {
      item_id: 'general',
      item_title: 'General / Sourcing Request',
      sender_name: name,
      sender_email: email,
      message: message,
      status: 'active'
    };
    const { error } = await supabase.from('inquiries').insert([payload]);
    setSending(false);
    if (error) toast.error('Error sending message: ' + error.message);
    else onSuccess();
  };

  return (
    <Modal title="General Inquiry" onClose={onClose}>
        <p className="text-xs text-[var(--color-luxury-steel)] mb-6">Ask a general question or request a specific item.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="source-name" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Your Name</label>
            <input id="source-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] transition-colors" />
          </div>
          <div>
            <label htmlFor="source-email" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Email Address</label>
            <input id="source-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] transition-colors" />
          </div>
          <div>
            <label htmlFor="source-message" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Message / Item Request</label>
            <textarea id="source-message" required rows="4" value={message} onChange={e => setMessage(e.target.value)} placeholder="I'm looking for a Item XYZ in original condition..." className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] leading-relaxed transition-colors" />
          </div>
          <button type="submit" disabled={sending} className="cursor-pointer w-full bg-[var(--color-luxury-sapphire)] hover:opacity-90 focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] focus:outline-none text-white font-bold tracking-widest uppercase py-3 text-xs transition-colors mt-2">
            {sending ? 'Transmitting...' : 'Send Message to Dealer'}
          </button>
        </form>
      </Modal>
  );
}

// --- SUB-COMPONENT: LOCAL REPAIR MODAL ---
function RepairModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [itemInfo, setItemInfo] = useState('');
  const [serviceType, setServiceType] = useState('General Feedback');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    const payload = {
      item_id: 'review_submission',
      item_title: `Review Submission: ${serviceType} - ${itemInfo}`,
      sender_name: name,
      sender_email: contact,
      message: message,
      status: 'active'
    };
    const { error } = await supabase.from('inquiries').insert([payload]);
    setSending(false);
    if (error) toast.error('Error sending request: ' + error.message);
    else onSuccess();
  };

  return (
    <Modal title="Submit a Review" onClose={onClose}>
      <p className="text-xs text-[var(--color-luxury-steel)] mb-4">Leave a review of your experience.</p>
        
        <div className="bg-black/50 border border-[var(--color-luxury-sapphire)]/30 p-4 rounded mb-6">
          <span className="block text-[10px] uppercase tracking-widest text-[var(--color-luxury-sapphire)] font-bold mb-2">Drop-off Locations</span>
          <p className="text-xs text-zinc-300 leading-relaxed">
            After submitting your request, please securely drop your item off at one of our partnered booths:<br/>
            • <strong>Location 1</strong> (City, State)<br/>
            • <strong>Location 2</strong> (City, State)<br/>
            • <strong>Location 3</strong> (City, State)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="repair-name" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Your Name</label>
              <input id="repair-name" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] transition-colors" />
            </div>
            <div>
              <label htmlFor="repair-contact" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Email or Phone</label>
              <input id="repair-contact" required type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone or Email" className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] transition-colors" />
            </div>
          </div>
          
          <div>
            <label htmlFor="repair-item" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Item Make, Model & Brand</label>
            <input id="repair-item" required type="text" value={itemInfo} onChange={e => setItemInfo(e.target.value)} placeholder="e.g., Item ABC" className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] transition-colors" />
          </div>
          
          <div>
            <label htmlFor="repair-service" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Service Needed</label>
            <select id="repair-service" value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] cursor-pointer transition-colors">
              <option value="General Feedback">General Feedback</option>
              <option value="Specific Product Review">Specific Product Review</option>
              <option value="Both Cleaning & Repair">Both Cleaning & Repair</option>
            </select>
          </div>

          <div>
            <label htmlFor="repair-notes" className="block text-[10px] uppercase tracking-widest text-zinc-400 mb-1">Describe the Issue / Notes</label>
            <textarea id="repair-notes" required rows="3" value={message} onChange={e => setMessage(e.target.value)} placeholder="Please describe what needs to be fixed..." className="w-full p-3 bg-black border border-zinc-700 text-white text-sm focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] leading-relaxed transition-colors" />
          </div>
          
          <button type="submit" disabled={sending} className="cursor-pointer w-full bg-[var(--color-luxury-sapphire)] hover:opacity-90 focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] focus:outline-none text-white font-bold tracking-widest uppercase py-3 text-xs transition-colors mt-2">
            {sending ? 'Transmitting...' : 'Submit Review Submission'}
          </button>
        </form>
      </Modal>
  );
}

// --- SUB-COMPONENT: ABOUT US MODAL ---
function AboutModal({ onClose }) {
  return (
    <Modal title="Our Story" onClose={onClose}>
        <div className="space-y-4 text-sm font-light text-zinc-300 leading-relaxed">
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.</p>
          <p>Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam.</p>
          <p>Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat.</p>
        </div>
      </Modal>
  );
}

// --- SUB-COMPONENT: TERMS OF SALE MODAL ---
function TermsModal({ onClose }) {
  return (
    <Modal title="Terms of Sale & Policies" onClose={onClose}>
        <div className="space-y-4 text-sm font-light text-zinc-300 leading-relaxed">
          <p><strong>Strictly As-Is:</strong> All items sold by Generic Eshop Template are sold strictly "As-Is". Due to the historical nature and age of these curated items, we do not offer guarantees or warranties regarding specific functionality.</p>
          <p><strong>Shipping:</strong> All items are shipped domestically within the United States via flat-rate secure shipping.</p>
          <p><strong>Returns & Refunds:</strong> Refunds or returns are exclusively limited to items that sustain verifiable damage during the shipping process. If your item arrives damaged, please contact us immediately upon delivery with photographic evidence of the packaging and the item so we can process a claim.</p>
        </div>
      </Modal>
  );
}

// --- SUB-COMPONENT: PRIVACY POLICY MODAL ---
function PrivacyModal({ onClose }) {
  return (
    <Modal title="Privacy Policy" onClose={onClose}>
        <div className="space-y-4 text-sm font-light text-zinc-300 leading-relaxed">
          <p>We respect your privacy and are committed to protecting it. We strictly do not sell, rent, or lease your personal data to any third parties.</p>
          <p><strong>Payment Processing:</strong> All financial transactions and secure checkouts are handled seamlessly and safely by PayPal. We do not store or process your credit card information on our servers.</p>
          <p><strong>Communication Data:</strong> When you submit sourcing inquiries or ask questions via our contact forms, your contact information is stored securely and used exclusively for direct dealer communication.</p>
          <p><strong>Analytics:</strong> We collect anonymous, cookie-free usage metrics (such as page views and interaction times) to improve our curation and optimize the storefront experience. This data cannot be traced back to personal identities.</p>
        </div>
      </Modal>
  );
}


// --- MAIN APPLICATION ---
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const view = location.pathname.startsWith('/admin') ? 'admin' 
             : location.pathname.startsWith('/item/') ? 'detail' 
             : 'gallery';

  useEffect(() => {
  }, [location.pathname, view]);

  const openAdmin = () => {
    navigate('/admin');
    window.scrollTo(0, 0);
  };

  const openGallery = () => {
    navigate('/');
    window.scrollTo(0, 0);
  };
  
  const [selectedItem, setSelectedItem] = useState(null);

  const [showSourcingModal, setShowSourcingModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false); 
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  
  const [inquiries, setInquiries] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (view === 'detail' && inventory.length > 0) {
      const itemId = location.pathname.split('/item/')[1];
      const item = inventory.find(i => String(i.id) === String(itemId));
      if (item && (!selectedItem || selectedItem.id !== item.id)) {
        setSelectedItem(item);
      }
    }
  }, [view, location.pathname, inventory, selectedItem]);

  const [session, setSession] = useState({ user: { email: 'admin@demo.com' } });

  useEffect(() => {
    if (view === 'detail' && selectedItem) {
      const modelName = [selectedItem.brand, selectedItem.model].filter(Boolean).join(' ') || selectedItem.make_model || 'Item';
      document.title = `${modelName} | Luxe Demo Store`;
      
      const setMeta = (property, content) => {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
          element = document.createElement('meta');
          element.setAttribute('property', property);
          document.head.appendChild(element);
        }
        element.setAttribute('content', content || '');
      };

      const priceText = selectedItem.price ? `$${Number(selectedItem.price).toLocaleString()}` : 'Price upon request';
      setMeta('og:title', `${modelName} - ${priceText}`);
      setMeta('og:image', selectedItem.image_urls?.[0] || ''); 
      
      const descText = selectedItem.description 
        ? String(selectedItem.description).substring(0, 150) + '...' 
        : 'curated curated item available at Luxe Demo Store.';
      setMeta('og:description', descText);
    } else {
      document.title = 'Luxe Demo Store | Curated Items';
    }
  }, [view, selectedItem]);

  const fetchItems = async () => {
    setIsLoading(true);
    setInventory(dummyInventory);
    setIsLoading(false);
  };

  const fetchInquiries = async () => {
    setInquiries(dummyInquiries);
  };

  const fetchAllQuestions = async () => {
    setAllQuestions(dummyQuestions);
  };

  const fetchTestimonials = async () => {
    setTestimonials(dummyReviews);
  };

  useEffect(() => {
    fetchItems();
    fetchTestimonials();
  }, []);

  const fetchMetrics = async () => {
    setMetrics(dummyMetrics);
  };

  useEffect(() => {
    if (view === 'admin') {
      fetchAllQuestions();
      fetchInquiries();
      fetchMetrics();
    }
  }, [view]);

  const viewDetails = (item) => {
    navigate(`/item/${item.id}`);
    setSelectedItem(item);
    window.scrollTo(0, 0); 
  };

  const updateStatus = async (id, newStatus) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, inventory_status: newStatus } : item));
  };

  if (view === 'admin') {
    return (
      <AdminDashboard 
        inventory={inventory} setInventory={setInventory}
        session={session} 
        inquiries={inquiries} setInquiries={setInquiries} fetchInquiries={fetchInquiries}
        allQuestions={allQuestions} setAllQuestions={setAllQuestions} fetchAllQuestions={fetchAllQuestions}
        metrics={metrics} fetchMetrics={fetchMetrics}
        testimonials={testimonials} setTestimonials={setTestimonials}
        openGallery={openGallery}
      />
    );
  }

  if (view === 'gallery') {
    return (
      <Gallery
        inventory={inventory} testimonials={testimonials} isLoading={isLoading}
        viewDetails={viewDetails} openAdmin={openAdmin}
        showSourcingModal={showSourcingModal} setShowSourcingModal={setShowSourcingModal}
        showRepairModal={showRepairModal} setShowRepairModal={setShowRepairModal}
        showAboutModal={showAboutModal} setShowAboutModal={setShowAboutModal}
        showTermsModal={showTermsModal} setShowTermsModal={setShowTermsModal}
        showPrivacyModal={showPrivacyModal} setShowPrivacyModal={setShowPrivacyModal}
        SourcingModal={SourcingModal} RepairModal={RepairModal} 
        AboutModal={AboutModal} TermsModal={TermsModal} PrivacyModal={PrivacyModal}
      />
    );
  }

  if (view === 'detail' && selectedItem) {
    return (
      <ItemDetail
        selectedItem={selectedItem} inventory={inventory} allQuestions={allQuestions}
        updateStatus={updateStatus}
        fetchAllQuestions={fetchAllQuestions}
        showSourcingModal={showSourcingModal} setShowSourcingModal={setShowSourcingModal}
        showAboutModal={showAboutModal} setShowAboutModal={setShowAboutModal}
        showTermsModal={showTermsModal} setShowTermsModal={setShowTermsModal}
        showPrivacyModal={showPrivacyModal} setShowPrivacyModal={setShowPrivacyModal}
        SourcingModal={SourcingModal} AboutModal={AboutModal} 
        TermsModal={TermsModal} PrivacyModal={PrivacyModal}
      />
    );
  }

  return null;
}
