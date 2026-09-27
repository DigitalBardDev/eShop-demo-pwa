import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard({
  inventory, setInventory,
  session, 
  inquiries, setInquiries, fetchInquiries,
  allQuestions, setAllQuestions, fetchAllQuestions,
  metrics, fetchMetrics,
  testimonials, setTestimonials,
  openGallery
}) {
  const navigate = useNavigate();

  const [adminTab, setAdminTab] = useState('inventory'); 
  const [inboxSubTab, setInboxSubTab] = useState('sourcing'); 
  const [qaSubTab, setQaSubTab] = useState('pending_qa');
  const [adminAnswers, setAdminAnswers] = useState({});
  const [newTestimonial, setNewTestimonial] = useState({ author: '', text: '', rating: 5, item_reference: '' });
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [currentImageUrls, setCurrentImageUrls] = useState([]); 
  const [imageFiles, setImageFiles] = useState([]); 
  const [formData, setFormData] = useState({
    stock_num: '', brand: '', model: '', movement: 'Type A', gender: "Category A", 
    price: '', dial: '', case_size: '', case_material: '', band_material: '', 
    condition: '', description: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const startEditing = (item) => {
    setEditingId(item.id);
    setFormData({
      stock_num: item.stock_num || '',
      brand: item.brand || '',
      model: item.model || '',
      movement: item.movement || 'Type A', 
      gender: item.gender || "Category A", 
      price: item.price || '',
      dial: item.dial || '',
      case_size: item.case_size || '', 
      case_material: item.case_material || '',
      band_material: item.band_material || item.strap_type || '', 
      condition: item.condition || '',
      description: item.description || ''
    });
    setCurrentImageUrls(item.image_urls || []); 
    setImageFiles([]);
    document.getElementById('vault-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setFormData({ 
      stock_num: '', brand: '', model: '', movement: 'Type A', gender: "Category A", 
      price: '', dial: '', case_size: '', case_material: '', band_material: '', 
      condition: '', description: '' 
    });
    setCurrentImageUrls([]);
    setImageFiles([]);
    if (document.getElementById('image-upload')) document.getElementById('image-upload').value = '';
  };

  const removeExistingPhoto = (indexToRemove) => {
    setCurrentImageUrls(currentImageUrls.filter((_, idx) => idx !== indexToRemove));
  };

  const movePhoto = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= currentImageUrls.length) return;
    const updated = [...currentImageUrls];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);
    setCurrentImageUrls(updated);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    let newlyUploadedUrls = [];

    if (imageFiles && imageFiles.length > 0) {
      try {
        const uploadPromises = imageFiles.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('item-images').upload(fileName, file);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage.from('item-images').getPublicUrl(fileName);
          return publicUrlData.publicUrl;
        });
        newlyUploadedUrls = await Promise.all(uploadPromises);
      } catch (error) {
        toast.error('Error uploading new photographs: ' + error.message);
        setIsProcessing(false);
        return;
      }
    }

    let finalImageUrls = [...currentImageUrls, ...newlyUploadedUrls];

    const itemPayload = {
      make_model: `${formData.brand} ${formData.model}`.trim(),
      stock_num: formData.stock_num,
      brand: formData.brand,
      model: formData.model,
      movement: formData.movement,
      gender: formData.gender, 
      price: parseFloat(formData.price) || 0,
      dial: formData.dial,
      case_size: formData.case_size, 
      case_material: formData.case_material,
      band_material: formData.band_material,
      condition: formData.condition,
      description: formData.description || 'No description provided.', 
      image_urls: finalImageUrls
    };
    
    if (editingId) {
      const { error } = await supabase.from('items').update(itemPayload).eq('id', editingId);
      setIsProcessing(false);
      if (!error) {
        setInventory(inventory.map(w => w.id === editingId ? { ...w, ...itemPayload } : w));
        cancelEditing();
        toast.success("Listing and photo order successfully updated!");
      } else {
        toast.error('Error updating database: ' + error.message);
      }
    } else {
      itemPayload.inventory_status = 'available';
      const { data, error } = await supabase.from('items').insert([itemPayload]).select();
      setIsProcessing(false);
      if (!error && data) {
        setInventory([data[0], ...inventory]);
        cancelEditing();
        toast.success("New item published!");
      } else {
        toast.error('Error saving to database: ' + error.message);
      }
    }
  };

  const updateStatus = async (id, newStatus) => {
    const { error } = await supabase.from('items').update({ inventory_status: newStatus }).eq('id', id);
    if (!error) setInventory(inventory.map(item => item.id === id ? { ...item, inventory_status: newStatus } : item));
  };

  const approveQuestion = async (id) => {
    const answerText = adminAnswers[id] || '';
    if (!answerText.trim()) {
      toast.error("Please type a dealer response before approving and publishing!");
      return;
    }

    const payload = { status: 'approved', answer: answerText.trim() };
    const { error } = await supabase.from('item_questions').update(payload).eq('id', id);
    if (!error) {
      setAllQuestions(allQuestions.map(q => q.id === id ? { ...q, ...payload } : q));
      toast.success("Question & Answer published live to the item page!");
    }
  };

  const revertToPending = async (q) => {
    const { error } = await supabase.from('item_questions').update({ status: 'pending' }).eq('id', q.id);
    if (!error) {
      setAllQuestions(allQuestions.map(item => item.id === q.id ? { ...item, status: 'pending' } : item));
      setAdminAnswers({ ...adminAnswers, [q.id]: q.answer || '' });
      toast.success("Moved back to Pending Q&A! You can now edit your reply.");
    }
  };

  const archiveQuestion = async (id) => {
    const { error } = await supabase.from('item_questions').update({ status: 'archived' }).eq('id', id);
    if (!error) {
      setAllQuestions(allQuestions.map(q => q.id === id ? { ...q, status: 'archived' } : q));
    }
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("Permanently remove this question?")) return;
    const { error } = await supabase.from('item_questions').delete().eq('id', id);
    if (!error) setAllQuestions(allQuestions.filter(q => q.id !== id));
  };

  const toggleInquiryStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'resolved' ? 'active' : 'resolved';
    const { error } = await supabase.from('inquiries').update({ status: nextStatus }).eq('id', id);
    if (!error) setInquiries(inquiries.map(i => i.id === id ? { ...i, status: nextStatus } : i));
  };

  const deleteInquiry = async (id) => {
    if (!window.confirm("Permanently delete this lead?")) return;
    const { error } = await supabase.from('inquiries').delete().eq('id', id);
    if (!error) setInquiries(inquiries.filter(i => i.id !== id));
  };

  const getMetricsSummary = () => {
    const summary = {};
    inventory.forEach(w => {
      summary[w.id] = { views: 0, totalTime: 0, checkoutClicks: 0, leads: 0 };
    });
    
    metrics.forEach(m => {
      if (!summary[m.item_id]) return;
      if (m.event_type === 'view') {
        summary[m.item_id].views += 1;
        summary[m.item_id].totalTime += (m.duration_seconds || 0);
      }
      if (m.event_type === 'checkout_click') summary[m.item_id].checkoutClicks += 1;
    });

    inquiries.forEach(i => {
      if (summary[i.item_id]) summary[i.item_id].leads += 1;
    });
    return summary;
  };

  const metricsData = getMetricsSummary();
  const wordCount = formData.description.trim() ? formData.description.trim().split(/\s+/).length : 0;

  const activeSourcing = inquiries.filter(i => i.status !== 'resolved' && i.item_id !== 'review_submission');
  const activeRepairs = inquiries.filter(i => i.status !== 'resolved' && i.item_id === 'review_submission');
  const resolvedLeads = inquiries.filter(i => i.status === 'resolved');

  const pendingQuestions = allQuestions.filter(q => q.status === 'pending');
  const approvedQuestions = allQuestions.filter(q => q.status === 'approved');
  const archivedQuestions = allQuestions.filter(q => q.status === 'archived');

  return (
      <div className="min-h-screen bg-[#111111] text-zinc-100 flex flex-col items-center p-4 sm:p-8 pb-24 overflow-x-hidden">
        
        <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-zinc-700 pb-6 mt-4 gap-6">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-wide">Dealer Vault</h1>
          <div className="flex gap-4 w-full sm:w-auto">
            <button 
              onClick={() => supabase.auth.signOut()} 
              className="flex-1 sm:flex-initial text-base sm:text-lg font-bold text-zinc-400 hover:text-red-400 transition-colors px-4 py-3"
            >
              Sign Out
            </button>
            <button 
              onClick={openGallery} 
              className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-6 py-3 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]"
            >
              Exit to Storefront
            </button>
          </div>
        </div>

        <nav aria-label="Admin Navigation" className="w-full max-w-6xl flex gap-2 sm:gap-4 mb-10 border-b border-zinc-800 overflow-x-auto pb-1">
          <button onClick={() => setAdminTab('inventory')} className={`px-6 py-4 text-lg sm:text-xl font-bold whitespace-nowrap rounded-t border-b-4 focus:outline-none focus:bg-zinc-800 transition-colors ${adminTab === 'inventory' ? 'border-[var(--color-luxury-sapphire)] text-[var(--color-luxury-sapphire)] bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-[var(--color-luxury-sapphire)]'}`}>
            1. Inventory ({inventory.length})
          </button>
          
          <button onClick={() => { setAdminTab('inbox'); fetchInquiries(); }} className={`px-6 py-4 text-lg sm:text-xl font-bold flex items-center gap-3 whitespace-nowrap rounded-t border-b-4 focus:outline-none focus:bg-zinc-800 transition-colors ${adminTab === 'inbox' ? 'border-[var(--color-luxury-sapphire)] text-[var(--color-luxury-sapphire)] bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-[var(--color-luxury-sapphire)]'}`}>
            2. Inbox & Leads {(activeSourcing.length + activeRepairs.length > 0) && (<span className="bg-red-600 text-white text-base px-3 py-1 rounded-full font-bold">{activeSourcing.length + activeRepairs.length} New</span>)}
          </button>
          
          <button onClick={() => { setAdminTab('qa_reviews'); fetchAllQuestions(); }} className={`px-6 py-4 text-lg sm:text-xl font-bold flex items-center gap-3 whitespace-nowrap rounded-t border-b-4 focus:outline-none focus:bg-zinc-800 transition-colors ${adminTab === 'qa_reviews' ? 'border-[var(--color-luxury-sapphire)] text-[var(--color-luxury-sapphire)] bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-[var(--color-luxury-sapphire)]'}`}>
            3. Q&A / Reviews {pendingQuestions.length > 0 && (<span className="bg-red-600 text-white text-base px-3 py-1 rounded-full font-bold">{pendingQuestions.length} New</span>)}
          </button>
          
          <button onClick={() => { setAdminTab('metrics'); fetchMetrics(); fetchInquiries(); }} className={`px-6 py-4 text-lg sm:text-xl font-bold whitespace-nowrap rounded-t border-b-4 focus:outline-none focus:bg-zinc-800 transition-colors ${adminTab === 'metrics' ? 'border-[var(--color-luxury-sapphire)] text-[var(--color-luxury-sapphire)] bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-[var(--color-luxury-sapphire)]'}`}>
            4. Metrics Dashboard
          </button>
        </nav>

        {/* TAB 1: INVENTORY */}
        {adminTab === 'inventory' && (
<>
<div className="w-full max-w-6xl mb-12">

<div className="bg-blue-900/30 border border-blue-500/50 p-6 rounded-xl mb-8 text-blue-200">
  <h3 className="text-xl font-bold mb-2 text-white">📦 Inventory Management Tool</h3>
  <p className="text-base leading-relaxed">
    This tool allows you to easily add, edit, or remove products from your storefront. You can instantly update prices, statuses (Available, Reserved, Sold), upload images, and write compelling descriptions. All changes go live immediately to your buyers.
  </p>
</div>

              <div className="space-y-6">
                {inventory.map(item => {
                  const displayTitle = [item.brand, item.model].filter(Boolean).join(' ') || item.make_model || 'Unknown';
                  return (
                    <div key={item.id} className={`p-6 sm:p-8 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 shadow-xl transition-colors ${editingId === item.id ? 'bg-zinc-800 border-[var(--color-luxury-sapphire)] ring-2 ring-[var(--color-luxury-sapphire)]' : 'bg-zinc-900 border-zinc-700'}`}>
                      <div className="flex items-center space-x-6 min-w-0 w-full sm:w-auto flex-1">
                        {item.image_urls?.length > 0 ? (
                          <img src={item.image_urls[0]} alt="" className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded shadow-md" aria-hidden="true" />
                        ) : (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black rounded shadow-md border-2 border-zinc-700 flex items-center justify-center text-xs text-zinc-500 uppercase tracking-widest text-center font-bold" aria-hidden="true">No<br/>Photo</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xl sm:text-3xl truncate text-white mb-2">{displayTitle}</p>
                          <div className="flex flex-wrap gap-4 items-center mb-2">
                            <p className="font-mono text-lg sm:text-2xl text-[var(--color-luxury-sapphire)] font-bold">${Number(item.price).toLocaleString()}</p>
                            {item.stock_num && <span className="bg-black border border-zinc-600 px-3 py-1 rounded text-sm text-zinc-300 font-mono font-bold">Stock #: {item.stock_num}</span>}
                          </div>
                          <span className="text-base sm:text-lg text-zinc-400 block truncate font-medium">
                            {item.gender || "Category A"} | {item.case_size || 'Size N/A'} | {item.movement}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto flex-wrap sm:flex-nowrap border-t sm:border-t-0 pt-6 sm:pt-0 border-zinc-700">
                        <select value={item.inventory_status} onChange={(e) => updateStatus(item.id, e.target.value)} className="bg-black border-2 border-zinc-600 text-base sm:text-lg font-bold text-white p-4 rounded cursor-pointer focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors flex-1 sm:flex-initial">
                          <option value="available">🟢 Available</option>
                          <option value="sold">⚪ Sold (Archive)</option>
                          <option value="paused">🟡 Paused (Hidden)</option>
                        </select>
                        <button onClick={() => startEditing(item)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]">
                          Edit Item
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="vault-form" className="w-full max-w-6xl bg-zinc-900 p-8 sm:p-12 rounded-xl border-2 border-zinc-700 shadow-2xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-zinc-700 pb-6 gap-6">
                <h2 className="text-3xl font-bold text-white truncate pr-4">
                  {editingId ? `Editing Listing: ${[formData.brand, formData.model].filter(Boolean).join(' ') || 'Item'}` : 'Create New Listing'}
                </h2>
                {editingId && (
                  <button type="button" onClick={cancelEditing} className="w-full sm:w-auto text-center text-base sm:text-lg font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 px-6 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
                    Cancel Edit ✕
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveItem}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                  <div className="lg:col-span-3 pb-6 border-b border-zinc-800">
                    <label htmlFor="admin-stock" className="block text-lg font-bold text-[var(--color-luxury-sapphire)] mb-3">Internal Stock # (Hidden from Public)</label>
                    <input id="admin-stock" type="text" value={formData.stock_num} onChange={e => setFormData({...formData, stock_num: e.target.value})} placeholder="e.g. INV-1042" className="w-full lg:w-1/3 p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-brand" className="block text-lg font-bold text-zinc-200 mb-3">Brand</label>
                    <input id="admin-brand" required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="e.g. BrandName" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-model" className="block text-lg font-bold text-zinc-200 mb-3">Model</label>
                    <input id="admin-model" required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} placeholder="e.g. ModelName" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-price" className="block text-lg font-bold text-zinc-200 mb-3">Listing Price (USD)</label>
                    <input id="admin-price" required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-gender" className="block text-lg font-bold text-zinc-200 mb-3">Gender Category</label>
                    <select id="admin-gender" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] cursor-pointer transition-colors">
                      <option value="Category A">Category A Item</option>
                      <option value="Category B">Category B Item</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-movement" className="block text-lg font-bold text-zinc-200 mb-3">Category Type</label>
                    <select id="admin-movement" value={formData.movement} onChange={e => setFormData({...formData, movement: e.target.value})} className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] cursor-pointer transition-colors">
                      <option value="Type A">Type A</option>
                      <option value="Type B">Type B</option>
                      <option value="Type C">Type C</option>
                      <option value="Type D">Type D</option>
                      <option value="Type E">Type E</option>
                      <option value="Type F">Type F</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-dial" className="block text-lg font-bold text-zinc-200 mb-3">Attribute 1</label>
                    <input id="admin-dial" type="text" value={formData.dial} onChange={e => setFormData({...formData, dial: e.target.value})} placeholder="e.g. Value 1" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-case-size" className="block text-lg font-bold text-zinc-200 mb-3">Size / Dimensions</label>
                    <input id="admin-case-size" type="text" value={formData.case_size} onChange={e => setFormData({...formData, case_size: e.target.value})} placeholder="e.g. Medium" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-case-mat" className="block text-lg font-bold text-zinc-200 mb-3">Primary Material</label>
                    <input id="admin-case-mat" type="text" value={formData.case_material} onChange={e => setFormData({...formData, case_material: e.target.value})} placeholder="e.g. Steel" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>
                  <div>
                    <label htmlFor="admin-band" className="block text-lg font-bold text-zinc-200 mb-3">Secondary Material</label>
                    <input id="admin-band" type="text" value={formData.band_material} onChange={e => setFormData({...formData, band_material: e.target.value})} placeholder="e.g. Leather" className="w-full p-4 rounded bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] transition-colors" />
                  </div>

                  {/* --- PHOTO MANAGEMENT BOARD --- */}
                  <fieldset className="lg:col-span-3 bg-[#1a1a1a] p-8 rounded-xl border-2 border-zinc-700 space-y-8">
                    <legend className="sr-only">Photo Management</legend>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-700 pb-4 gap-4">
                      <span className="block text-2xl font-bold text-zinc-200">
                        Active Photographs ({currentImageUrls.length})
                      </span>
                      <span className="text-base font-bold text-[var(--color-luxury-sapphire)] bg-black px-4 py-2 border border-zinc-700 rounded">Image #1 is Primary Hero</span>
                    </div>

                    {currentImageUrls.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {currentImageUrls.map((url, idx) => (
                          <div key={idx} className="bg-black border-2 border-zinc-600 rounded-lg overflow-hidden flex flex-col group relative shadow-lg">
                            <div className="w-full aspect-square relative overflow-hidden bg-zinc-900">
                              <img src={url} alt={`Listing photo ${idx + 1}`} className="w-full h-full object-cover" />
                              <span className="absolute top-2 left-2 bg-black/90 text-white text-base px-3 py-1 rounded font-bold border border-zinc-500 shadow-lg">
                                {idx === 0 ? '#1 Hero' : `#${idx + 1}`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-zinc-800 border-t border-zinc-600 p-2">
                              <button type="button" onClick={() => movePhoto(idx, -1)} disabled={idx === 0} aria-label="Move photo left" className={`p-4 text-2xl text-zinc-200 hover:bg-zinc-600 hover:text-[var(--color-luxury-sapphire)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors ${idx === 0 ? 'opacity-30 cursor-not-allowed' : 'font-bold'}`}>←</button>
                              <button type="button" onClick={() => removeExistingPhoto(idx)} aria-label="Delete photo" className="p-4 text-2xl text-red-400 hover:bg-red-900 hover:text-white rounded font-bold focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors">✕</button>
                              <button type="button" onClick={() => movePhoto(idx, 1)} disabled={idx === currentImageUrls.length - 1} aria-label="Move photo right" className={`p-4 text-2xl text-zinc-200 hover:bg-zinc-600 hover:text-[var(--color-luxury-sapphire)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors ${idx === currentImageUrls.length - 1 ? 'opacity-30 cursor-not-allowed' : 'font-bold'}`}>→</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-lg text-zinc-400 italic">No photographs attached yet. Upload files below.</p>
                    )}

                    <div className="pt-6 border-t border-zinc-700">
                      <label htmlFor="image-upload" className="block text-xl font-bold text-zinc-200 mb-4">
                        {currentImageUrls.length > 0 ? "➕ Append Additional Photographs" : "Upload Photographs (Select Multiple)"}
                      </label>
                      <input 
                        id="image-upload" 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        onChange={e => setImageFiles(Array.from(e.target.files))} 
                        className="w-full p-4 bg-black border-2 border-zinc-600 rounded-md text-zinc-300 text-lg cursor-pointer file:mr-6 file:py-3 file:px-6 file:rounded file:border-2 file:border-zinc-600 file:text-base file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:text-[var(--color-luxury-sapphire)] hover:file:border-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors" 
                      />
                      {imageFiles.length > 0 && <p className="text-lg text-emerald-400 font-bold mt-4">✓ {imageFiles.length} new file(s) queued to save.</p>}
                    </div>
                  </fieldset>

                  <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-3">
                      <label htmlFor="admin-desc" className="block text-lg font-bold text-zinc-200">Description Narrative</label>
                      <span className="text-base text-zinc-400 font-mono font-bold bg-black px-4 py-2 border border-zinc-700 rounded">{wordCount} words</span>
                    </div>
                    <textarea id="admin-desc" rows="6" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Enter full description here..." className="w-full p-6 rounded-md bg-black border-2 border-zinc-600 text-white text-xl focus:outline-none focus:border-[var(--color-luxury-sapphire)] leading-relaxed transition-colors" />
                  </div>
                </div>
                
                <button type="submit" disabled={isProcessing} className={`w-full text-center text-xl sm:text-2xl font-bold px-6 py-6 rounded border-2 border-transparent transition-colors focus:outline-none focus:ring-4 focus:ring-[var(--color-luxury-sapphire)] shadow-xl mt-4 ${isProcessing ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-[var(--color-luxury-sapphire)] text-white hover:bg-zinc-800 hover:border-zinc-600'}`}>
                  {isProcessing ? 'Processing Information...' : editingId ? 'Save Updates to Listing' : 'Publish New Item'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* TAB 2: INBOX & LEADS (MESSAGES) */}
        {adminTab === 'inbox' && (
<div className="w-full max-w-6xl">

<div className="bg-blue-900/30 border border-blue-500/50 p-6 rounded-xl mb-8 text-blue-200">
  <h3 className="text-xl font-bold mb-2 text-white">📥 Inbox & Leads Tool</h3>
  <p className="text-base leading-relaxed">
    Manage your incoming inquiries in one centralized hub. Here, you'll see all customer requests for item sourcing, repairs, and general questions. You can track the status of each lead from "Active" to "Resolved" to ensure you never miss a sale.
  </p>
</div>

            <div className="flex flex-wrap gap-4 mb-10 bg-[#1a1a1a] p-4 rounded-xl border-2 border-zinc-700" role="group" aria-label="Inbox Filters">
              <button onClick={() => setInboxSubTab('sourcing')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${inboxSubTab === 'sourcing' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                📩 Sourcing ({activeSourcing.length})
              </button>
              <button onClick={() => setInboxSubTab('repairs')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${inboxSubTab === 'repairs' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                🔧 Repairs ({activeRepairs.length})
              </button>
              <button onClick={() => setInboxSubTab('archived')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${inboxSubTab === 'archived' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                📦 Archive ({resolvedLeads.length})
              </button>
            </div>

            {/* SOURCING REQUESTS */}
            {inboxSubTab === 'sourcing' && (
              <div className="space-y-8">
                {activeSourcing.length === 0 && <p className="text-zinc-400 text-lg p-16 bg-zinc-900 rounded-xl text-center border-2 border-zinc-800 font-bold">Inbox Zero! No active sourcing requests.</p>}
                {activeSourcing.map(lead => (
                  <div key={lead.id} className="bg-zinc-900 p-6 sm:p-10 rounded-xl border-2 flex flex-col gap-6 shadow-xl border-zinc-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-700 pb-6 gap-4">
                      <div>
                        <span className="text-base sm:text-lg font-bold block mb-2 text-[var(--color-luxury-sapphire)]">{lead.item_title}</span>
                        <h4 className="text-2xl sm:text-3xl font-bold text-white mb-1">{lead.sender_name} <span className="text-lg sm:text-xl font-normal text-zinc-400 block sm:inline mt-1 sm:mt-0">({lead.sender_email})</span></h4>
                      </div>
                      <span className="text-base font-mono font-bold text-zinc-400 bg-black px-4 py-2 rounded border border-zinc-800">{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-black p-6 sm:p-8 rounded-lg border border-zinc-700 shadow-inner">
                      <p className="text-xl text-zinc-200 whitespace-pre-wrap leading-relaxed">{lead.message}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 mt-4 pt-6 border-t border-zinc-800">
                      <button onClick={() => deleteInquiry(lead.id)} className="w-full sm:w-auto text-left sm:text-center text-base sm:text-lg font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 px-6 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Delete Request</button>
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button onClick={() => toggleInquiryStatus(lead.id, lead.status)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]">Mark Resolved ✓</button>
                        <a href={`mailto:${lead.sender_email}?subject=RE: ${lead.item_title} - Luxe Demo Store`} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-[var(--color-luxury-sapphire)] text-white hover:bg-zinc-800 px-8 py-4 rounded border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] shadow-lg">Reply via Email ↗</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* REPAIR & SERVICE REQUESTS */}
            {inboxSubTab === 'repairs' && (
              <div className="space-y-8">
                {activeRepairs.length === 0 && <p className="text-zinc-400 text-lg p-16 bg-zinc-900 rounded-xl text-center border-2 border-zinc-800 font-bold">Inbox Zero! No active repair requests.</p>}
                {activeRepairs.map(lead => (
                  <div key={lead.id} className="bg-zinc-900 p-6 sm:p-10 rounded-xl border-2 flex flex-col gap-6 shadow-xl border-zinc-700">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-700 pb-6 gap-4">
                      <div>
                        <span className="text-base sm:text-lg font-bold block mb-2 text-[#38707A]">{lead.item_title}</span>
                        <h4 className="text-2xl sm:text-3xl font-bold text-white mb-1">{lead.sender_name} <span className="text-lg sm:text-xl font-normal text-zinc-400 block sm:inline mt-1 sm:mt-0">({lead.sender_email})</span></h4>
                      </div>
                      <span className="text-base font-mono font-bold text-zinc-400 bg-black px-4 py-2 rounded border border-zinc-800">{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-black p-6 sm:p-8 rounded-lg border border-zinc-700 shadow-inner">
                      <p className="text-xl text-zinc-200 whitespace-pre-wrap leading-relaxed">{lead.message}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 mt-4 pt-6 border-t border-zinc-800">
                      <button onClick={() => deleteInquiry(lead.id)} className="w-full sm:w-auto text-left sm:text-center text-base sm:text-lg font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 px-6 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Delete Request</button>
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button onClick={() => toggleInquiryStatus(lead.id, lead.status)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[#38707A] hover:text-[#38707A] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#38707A]">Mark Resolved ✓</button>
                        <a href={`mailto:${lead.sender_email}?subject=RE: ${lead.item_title} - Luxe Demo Store`} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-[#38707A] text-white hover:bg-zinc-800 px-8 py-4 rounded border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[#38707A] shadow-lg">Reply via Email ↗</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ARCHIVED MESSAGES */}
            {inboxSubTab === 'archived' && (
              <div className="space-y-8">
                {resolvedLeads.length === 0 && <p className="text-zinc-400 text-lg p-16 bg-zinc-900 rounded-xl text-center border-2 border-zinc-800 font-bold">No resolved messages in archive.</p>}
                {resolvedLeads.map(lead => (
                  <div key={lead.id} className="p-6 sm:p-10 bg-black border-2 border-zinc-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="space-y-3 flex-1">
                      <span className="text-base font-bold text-zinc-500 block uppercase tracking-widest">{lead.item_title} — Resolved</span>
                      <p className="text-xl text-zinc-300 leading-relaxed"><strong className="text-zinc-400 block sm:inline">{lead.sender_name} ({lead.sender_email}):</strong> "{lead.message}"</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full md:w-auto">
                      <button onClick={() => toggleInquiryStatus(lead.id, lead.status)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]">Reopen Message</button>
                      <button onClick={() => deleteInquiry(lead.id)} className="flex-1 sm:flex-initial text-center sm:text-left text-base sm:text-lg font-bold text-red-500 hover:text-red-300 hover:bg-red-900/20 px-8 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Delete Forever</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Q&A & REVIEWS */}
        {adminTab === 'qa_reviews' && (
<div className="w-full max-w-6xl">

<div className="bg-blue-900/30 border border-blue-500/50 p-6 rounded-xl mb-8 text-blue-200">
  <h3 className="text-xl font-bold mb-2 text-white">⭐ Q&A and Reviews Manager</h3>
  <p className="text-base leading-relaxed">
    Build trust with your audience. This tool lets you review and approve questions submitted by users before they appear on the product page. You can also publish and manage customer testimonials to showcase your store's reputation.
  </p>
</div>

            <div className="flex flex-wrap gap-4 mb-10 bg-[#1a1a1a] p-4 rounded-xl border-2 border-zinc-700" role="group" aria-label="Q&A Filters">
              <button onClick={() => setQaSubTab('pending_qa')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${qaSubTab === 'pending_qa' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                🔴 Pending ({pendingQuestions.length})
              </button>
              <button onClick={() => setQaSubTab('published_qa')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${qaSubTab === 'published_qa' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                ⚪ Published ({approvedQuestions.length})
              </button>
              <button onClick={() => setQaSubTab('archived_qa')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${qaSubTab === 'archived_qa' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                📦 Archived ({archivedQuestions.length})
              </button>
              <button onClick={() => setQaSubTab('testimonials')} className={`flex-1 sm:flex-initial px-6 py-4 rounded-lg text-base sm:text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] flex justify-center items-center gap-3 border-2 ${qaSubTab === 'testimonials' ? 'bg-[var(--color-luxury-sapphire)] text-white border-[var(--color-luxury-sapphire)] shadow-lg' : 'bg-black text-zinc-300 border-zinc-600 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)]'}`}>
                ⭐ Reviews ({testimonials.length})
              </button>
            </div>

            {/* PENDING Q&A */}
            {qaSubTab === 'pending_qa' && (
              <div className="space-y-8">
                {pendingQuestions.length === 0 && <p className="text-zinc-400 text-lg p-16 bg-zinc-900 rounded-xl text-center border-2 border-zinc-800 font-bold">Inbox Zero! No pending questions.</p>}
                {pendingQuestions.map(q => (
                  <div key={q.id} className="bg-zinc-900 p-6 sm:p-10 rounded-xl border-2 border-[var(--color-luxury-sapphire)]/50 flex flex-col gap-8 shadow-xl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-zinc-700 pb-6 gap-4">
                      <div>
                        <span className="text-base sm:text-lg font-bold block mb-2 text-[var(--color-luxury-sapphire)]">Regarding: {q.item_title}</span>
                        <h4 className="text-2xl sm:text-3xl font-bold text-white">From: {q.sender_name}</h4>
                      </div>
                      <span className="text-base font-mono font-bold text-zinc-400 bg-black px-4 py-2 rounded border border-zinc-800">{new Date(q.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="bg-black p-6 sm:p-8 rounded-lg border border-zinc-700 shadow-inner">
                      <p className="text-xl text-zinc-200 italic leading-relaxed">"{q.question}"</p>
                    </div>
                    <div>
                      <label htmlFor={`reply-${q.id}`} className="block text-lg font-bold text-zinc-200 mb-4">Dealer's Official Reply</label>
                      <textarea id={`reply-${q.id}`} rows="4" value={adminAnswers[q.id] || ''} onChange={e => setAdminAnswers({...adminAnswers, [q.id]: e.target.value})} placeholder="Type your full answer here..." className="w-full p-6 rounded-md bg-black border-2 border-zinc-600 text-white text-xl focus:outline-none focus:border-[var(--color-luxury-sapphire)] leading-relaxed transition-colors shadow-inner" />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6 mt-2 pt-6 border-t border-zinc-800">
                       <button onClick={() => deleteQuestion(q.id)} className="w-full sm:w-auto text-left sm:text-center text-base sm:text-lg font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 px-6 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Delete Forever</button>
                      <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <button onClick={() => archiveQuestion(q.id)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]">Dismiss to Archive</button>
                        <button onClick={() => approveQuestion(q.id)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-[var(--color-luxury-sapphire)] text-white hover:bg-zinc-800 px-8 py-4 rounded border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] shadow-lg">Approve & Publish Live ↗</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* PUBLISHED Q&A */}
            {qaSubTab === 'published_qa' && (
              <div className="space-y-6">
                {approvedQuestions.length === 0 && <p className="text-zinc-400 text-lg p-16 bg-zinc-900 rounded-xl text-center border-2 border-zinc-800 font-bold">No Q&As currently published.</p>}
                {approvedQuestions.map(q => (
                  <div key={q.id} className="p-6 sm:p-10 bg-zinc-900 border-2 border-zinc-700 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-xl">
                    <div className="space-y-4 max-w-4xl flex-1">
                      <span className="text-base sm:text-lg font-bold block text-[var(--color-luxury-sapphire)]">{q.item_title}</span>
                      <div className="bg-black p-6 rounded border border-zinc-800">
                        <p className="text-lg text-zinc-200 mb-4"><strong className="text-zinc-500 block mb-1">Question ({q.sender_name}):</strong> "{q.question}"</p>
                        <p className="text-xl text-white border-t border-zinc-800 pt-4 mt-4"><strong className="text-[var(--color-luxury-sapphire)] block mb-1">Your Reply:</strong> "{q.answer}"</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full lg:w-auto">
                      <button onClick={() => revertToPending(q)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]">Unpublish & Edit</button>
                      <button onClick={() => archiveQuestion(q.id)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-400 hover:border-zinc-400 hover:text-white px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400">Archive</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ARCHIVED Q&A */}
            {qaSubTab === 'archived_qa' && (
              <div className="space-y-6">
                {archivedQuestions.length === 0 && <p className="text-zinc-400 text-lg p-16 bg-zinc-900 rounded-xl text-center border-2 border-zinc-800 font-bold">No archived Q&A.</p>}
                {archivedQuestions.map(q => (
                  <div key={q.id} className="p-6 sm:p-10 bg-black border-2 border-zinc-800 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 opacity-80 hover:opacity-100 transition-opacity">
                    <div className="space-y-3 max-w-4xl flex-1">
                      <span className="text-base font-bold text-zinc-500 block uppercase tracking-widest">{q.item_title} — Archived</span>
                      <p className="text-xl text-zinc-300 leading-relaxed"><strong className="text-zinc-500 block sm:inline">Q ({q.sender_name}):</strong> "{q.question}"</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full md:w-auto">
                      <button onClick={() => revertToPending(q)} className="flex-1 sm:flex-initial text-center text-base sm:text-lg font-bold bg-black border-2 border-zinc-600 text-zinc-200 hover:border-[var(--color-luxury-sapphire)] hover:text-[var(--color-luxury-sapphire)] px-8 py-4 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]">Restore to Pending</button>
                      <button onClick={() => deleteQuestion(q.id)} className="flex-1 sm:flex-initial text-center sm:text-left text-base sm:text-lg font-bold text-red-500 hover:text-red-300 hover:bg-red-900/20 px-8 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">Delete Forever</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TESTIMONIAL MANAGER */}
            {qaSubTab === 'testimonials' && (
              <div className="space-y-12">
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newTestimonial.author || !newTestimonial.text) return;
                    setIsProcessing(true);
                    
                    const payload = {
                      author_name: newTestimonial.author,
                      review_text: newTestimonial.text,
                      rating: parseInt(newTestimonial.rating),
                      item_reference: newTestimonial.item_reference,
                      status: 'approved'
                    };

                    const { data, error } = await supabase.from('store_reviews').insert([payload]).select();
                    setIsProcessing(false);
                    
                    if (!error && data) {
                      setTestimonials([data[0], ...testimonials]);
                      setNewTestimonial({ author: '', text: '', rating: 5, item_reference: '' });
                    } else {
                      toast.error("Error saving review: " + error?.message);
                    }
                  }} 
                  className="bg-zinc-900 p-8 sm:p-12 rounded-xl border-2 border-zinc-700 shadow-2xl"
                >
                  <h3 className="text-2xl font-bold text-white mb-8 border-b border-zinc-800 pb-4">Add New Client Quote / Review</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="md:col-span-1">
                      <label className="block text-base sm:text-lg font-bold text-zinc-300 mb-2">Client Name</label>
                      <input required type="text" value={newTestimonial.author} onChange={e => setNewTestimonial({...newTestimonial, author: e.target.value})} placeholder="e.g., David T." className="w-full p-4 bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] rounded-md transition-colors" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-base sm:text-lg font-bold text-zinc-300 mb-2">Item Reference</label>
                      <input type="text" value={newTestimonial.item_reference} onChange={e => setNewTestimonial({...newTestimonial, item_reference: e.target.value})} placeholder="e.g., Item Reference 123" className="w-full p-4 bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] rounded-md transition-colors" />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-base sm:text-lg font-bold text-zinc-300 mb-2">Rating</label>
                      <select value={newTestimonial.rating} onChange={e => setNewTestimonial({...newTestimonial, rating: e.target.value})} className="w-full p-4 bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] rounded-md cursor-pointer transition-colors">
                        <option value="5">⭐⭐⭐⭐⭐ (5)</option>
                        <option value="4">⭐⭐⭐⭐ (4)</option>
                        <option value="3">⭐⭐⭐ (3)</option>
                        <option value="2">⭐⭐ (2)</option>
                        <option value="1">⭐ (1)</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-base sm:text-lg font-bold text-zinc-300 mb-2">Review Text</label>
                      <input required type="text" value={newTestimonial.text} onChange={e => setNewTestimonial({...newTestimonial, text: e.target.value})} placeholder="Paste the glowing review here..." className="w-full p-4 bg-black border-2 border-zinc-600 text-white text-lg focus:outline-none focus:border-[var(--color-luxury-sapphire)] rounded-md transition-colors" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 border-t border-zinc-800">
                    <button type="submit" disabled={isProcessing} className={`w-full sm:w-auto text-center text-lg sm:text-xl font-bold px-10 py-5 rounded border-2 border-transparent transition-colors focus:outline-none focus:ring-4 focus:ring-[var(--color-luxury-sapphire)] shadow-xl ${isProcessing ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' : 'bg-[var(--color-luxury-sapphire)] text-white hover:bg-zinc-800 hover:border-zinc-600'}`}>
                      {isProcessing ? 'Saving...' : 'Publish to Storefront'}
                    </button>
                  </div>
                </form>

                <div className="space-y-6">
                  {testimonials.map(t => (
                    <div key={t.id} className="p-6 sm:p-8 bg-black border-2 border-zinc-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-md hover:border-zinc-600 transition-colors">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          <span className="text-xl text-[var(--color-luxury-sapphire)] font-bold">{t.author_name}</span>
                          {t.item_reference && <span className="text-sm text-zinc-400 font-mono font-bold bg-zinc-900 px-3 py-1 rounded">Regarding: {t.item_reference}</span>}
                          <span className="text-lg text-yellow-500 tracking-widest bg-zinc-900 px-3 py-1 rounded">{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</span>
                        </div>
                        <p className="text-xl text-zinc-200 italic leading-relaxed">"{t.review_text}"</p>
                      </div>
                      <button 
                        onClick={async () => {
                          if(!window.confirm("Delete this review?")) return;
                          const { error } = await supabase.from('store_reviews').delete().eq('id', t.id);
                          if (!error) setTestimonials(testimonials.filter(item => item.id !== t.id));
                        }} 
                        className="w-full sm:w-auto text-center sm:text-left text-base sm:text-lg font-bold text-red-500 hover:text-red-300 hover:bg-red-900/20 px-6 py-4 rounded border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors shrink-0"
                      >
                        Delete Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: METRICS DASHBOARD */}
        {adminTab === 'metrics' && (
<div className="w-full max-w-6xl">

<div className="bg-blue-900/30 border border-blue-500/50 p-6 rounded-xl mb-8 text-blue-200">
  <h3 className="text-xl font-bold mb-2 text-white">📊 Performance Metrics</h3>
  <p className="text-base leading-relaxed">
    Understand what your customers want. This dashboard tracks anonymous user behavior, showing you exactly how many views each item gets, how long people spend looking at them, and how many times they click checkout. Use this data to optimize your pricing and inventory!
  </p>
</div>

            <h2 className="text-3xl font-bold text-white mb-8 border-b border-zinc-700 pb-6">Listing Performance & Market Sentiment</h2>
            
            <div className="overflow-x-auto rounded-xl border-2 border-zinc-700 shadow-2xl">
              <table className="w-full text-left bg-zinc-900 whitespace-nowrap">
                <thead>
                  <tr className="bg-black text-base uppercase tracking-wider text-zinc-400 border-b-2 border-zinc-700">
                    <th className="p-6 font-bold">Item Ref.</th>
                    <th className="p-6 font-bold text-right">Views</th>
                    <th className="p-6 font-bold text-right">Avg Time</th>
                    <th className="p-6 font-bold text-right text-[var(--color-luxury-sapphire)] border-l border-zinc-800">Checkouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {inventory.map(item => {
                    const stats = metricsData[item.id] || { views: 0, totalTime: 0, checkoutClicks: 0, leads: 0 };
                    const avgTime = stats.views > 0 ? Math.round(stats.totalTime / stats.views) : 0;
                    const displayTitle = [item.brand, item.model].filter(Boolean).join(' ') || item.make_model || 'Unknown';
                    
                    return (
                      <tr key={item.id} className="hover:bg-zinc-800 transition-colors">
                        <td className="p-6">
                          <span className="block text-lg font-bold text-white truncate max-w-[300px]">{displayTitle}</span>
                        </td>
                        <td className="p-6 text-right font-mono text-xl text-zinc-200">{stats.views}</td>
                        <td className="p-6 text-right font-mono text-xl text-zinc-200">{avgTime}s</td>
                        <td className="p-6 text-right font-mono text-xl text-[var(--color-luxury-sapphire)] font-bold border-l border-zinc-800">{stats.checkoutClicks}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-10 bg-black border-2 border-zinc-800 p-8 rounded-xl text-base text-zinc-400 leading-relaxed max-w-4xl shadow-md">
              <strong className="text-white text-lg block mb-3">Privacy & Compliance Note</strong>
              Because this storefront restricts sales to domestic US borders, GDPR cookie banners are not legally required. This dashboard utilizes a proprietary, cookie-free telemetry engine that records anonymous interaction events without tracking IP addresses or personal identities. 
            </div>
          </div>
        )}
      </div>
    );
  }

  
