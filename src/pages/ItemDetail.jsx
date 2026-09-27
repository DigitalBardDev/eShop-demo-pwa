import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

export default function ItemDetail({
  selectedItem, inventory, allQuestions, updateStatus, fetchAllQuestions,
  showSourcingModal, setShowSourcingModal, 
  showAboutModal, setShowAboutModal, 
  showTermsModal, setShowTermsModal, 
  showPrivacyModal, setShowPrivacyModal,
  SourcingModal, AboutModal, TermsModal, PrivacyModal
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('center center');
  const [qaName, setQaName] = useState('');
  const [qaText, setQaText] = useState('');
  const [submittingQa, setSubmittingQa] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const images = selectedItem?.image_urls || [];
  const isSold = selectedItem?.inventory_status === 'sold';
  const displayTitle = selectedItem ? ([selectedItem.brand, selectedItem.model].filter(Boolean).join(' ') || selectedItem.make_model || 'Unknown Item') : 'Item';
  const currentImage = images[activeImageIndex] || null;
  const itemQuestions = allQuestions.filter(q => q.item_id === selectedItem?.id && q.status === 'approved');

  const viewStartTime = useRef(null);

  useEffect(() => {
    setActiveImageIndex(0);
    setIsZoomed(false);
  }, [selectedItem?.id]);

  useEffect(() => {
    if (selectedItem) {
      viewStartTime.current = Date.now();
    }
    
    return () => {
      if (selectedItem && viewStartTime.current) {
        const durationSeconds = Math.round((Date.now() - viewStartTime.current) / 1000);
        supabase.from('metrics_log').insert([{
          item_id: selectedItem.id,
          event_type: 'view',
          duration_seconds: durationSeconds
        }]).then(); 
        viewStartTime.current = null;
      }
    };
  }, [selectedItem]);

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!qaText.trim() || !qaName.trim()) return;
    setSubmittingQa(true);

    const itemTitle = [selectedItem.brand, selectedItem.model].filter(Boolean).join(' ') || selectedItem.make_model;

    const payload = {
      item_id: selectedItem.id,
      item_title: itemTitle,
      sender_name: qaName.trim(),
      question: qaText.trim(),
      status: 'pending'
    };

    const { error } = await supabase.from('item_questions').insert([payload]);
    setSubmittingQa(false);

    if (error) {
      toast.error('Error sending question: ' + error.message);
    } else {
      setQaName('');
      setQaText('');
      toast.success("Your question has been submitted! It will appear on this page once the dealer reviews and answers it.");
      fetchAllQuestions();
    }
  };

  return (
<main className="min-h-screen bg-[#E4D9C5] text-[#2C2A29] flex flex-col md:flex-row overflow-x-hidden relative">
        {showSourcingModal && <SourcingModal onClose={() => setShowSourcingModal(false)} onSuccess={() => { setShowSourcingModal(false); toast.success("Message received."); }} />}
        {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
        {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
        {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}

        <section aria-label="Item Image Gallery" className={`w-full md:w-1/2 h-[50vh] sm:h-[60vh] md:h-screen bg-[#F4F1EB] border-r border-[#2C2A29]/10 relative flex flex-col ${isSold ? 'grayscale opacity-50' : ''}`}>
          
          <button 
            onClick={() => window.history.back()} 
            aria-label="Return to Showroom" 
            className="cursor-pointer absolute top-4 left-4 sm:top-6 sm:left-6 z-40 text-[#2C2A29] font-bold bg-white/80 px-4 py-3 text-[10px] sm:text-xs tracking-widest uppercase border border-[#2C2A29]/20 hover:bg-[#2C2A29] hover:text-[#E4D9C5] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors rounded-sm shadow-sm backdrop-blur-sm flex items-center gap-2"
          >
            <span>←</span> Back to Showroom
          </button>
          
          <div 
            role="img"
            aria-label={`Magnified view of ${displayTitle}`}
            className={`flex-1 overflow-hidden relative select-none focus:outline-none focus:ring-inset focus:ring-4 focus:ring-[var(--color-luxury-sapphire)] ${isZoomed && currentImage ? 'cursor-zoom-out' : currentImage ? 'cursor-zoom-in' : ''}`}
            tabIndex={0}
            onMouseMove={(e) => {
              if (!currentImage) return;
              const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
              const x = ((e.clientX - left) / width) * 100;
              const y = ((e.clientY - top) / height) * 100;
              setZoomOrigin(`${x}% ${y}%`);
            }}
            onClick={() => currentImage && setIsZoomed(!isZoomed)}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && currentImage) { e.preventDefault(); setIsZoomed(!isZoomed); } }}
          >
            {currentImage ? (
              <img src={currentImage} alt="" style={{ transformOrigin: zoomOrigin, transform: isZoomed ? 'scale(2.2)' : 'scale(1)', transition: 'transform 0.2s ease-out' }} className="w-full h-full object-cover pointer-events-none" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[#2C2A29]/40 border border-[#2C2A29]/10">
                <span className="text-xs uppercase tracking-widest font-bold">Image Coming Soon</span>
              </div>
            )}

            {images.length > 1 && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1); setIsZoomed(false); }}
                  className="cursor-pointer absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-[#2C2A29] text-[#2C2A29] hover:text-[var(--color-luxury-sapphire)] p-3 sm:p-4 rounded-sm border border-[#2C2A29]/20 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]"
                  aria-label="Previous image"
                >
                  ←
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % images.length); setIsZoomed(false); }}
                  className="cursor-pointer absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/90 hover:bg-[#2C2A29] text-[#2C2A29] hover:text-[var(--color-luxury-sapphire)] p-3 sm:p-4 rounded-sm border border-[#2C2A29]/20 shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)]"
                  aria-label="Next image"
                >
                  →
                </button>
              </>
            )}
            
            {currentImage && (
              <div className="absolute bottom-3 right-3 z-30 bg-white/80 border border-[#2C2A29]/20 px-2.5 py-1 rounded text-[10px] uppercase tracking-widest font-bold text-[#2C2A29] pointer-events-none shadow-sm backdrop-blur-sm" aria-hidden="true">
                {isZoomed ? '🔍 Click to Zoom Out' : '🔍 Click to Zoom In'}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <nav aria-label="Image Thumbnails" className="flex gap-2 p-3 sm:p-4 bg-[#F4F1EB] overflow-x-auto border-t border-[#2C2A29]/10 z-10">
              {images.map((url, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setActiveImageIndex(idx); setIsZoomed(false); }} 
                  aria-label={`View angle ${idx + 1}`}
                  aria-pressed={activeImageIndex === idx}
                  className={`w-14 h-14 flex-shrink-0 overflow-hidden border-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-all ${activeImageIndex === idx ? 'border-[var(--color-luxury-sapphire)] opacity-100 scale-95' : 'border-transparent opacity-60 hover:border-[var(--color-luxury-sapphire)] hover:opacity-100'}`}
                >
                  <img src={url} alt="" className="cursor-pointer w-full h-full object-cover" />
                </button>
              ))}
            </nav>
          )}
        </section>

        <section aria-label="Item Specifications and Checkout" className="w-full md:w-1/2 min-h-screen flex flex-col justify-start px-6 sm:px-12 md:px-20 py-10 sm:py-12 bg-[#E4D9C5] overflow-y-auto">
          <div className="my-auto">
            <span className={`text-[10px] tracking-[0.2em] uppercase mb-2 inline-block font-sans font-bold ${isSold ? 'text-red-600' : 'text-[#2C2A29]'}`}>
              {isSold ? '• Out of Stock' : '• Curated Collection'}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-3 sm:mb-4 leading-tight break-words text-[#2C2A29] font-bold">{displayTitle}</h2>
            <div className="mb-6 sm:mb-8">
              <p className="text-xl sm:text-2xl font-bold tracking-wider text-[var(--color-luxury-sapphire)]" aria-label={`Price: $${Number(selectedItem.price).toLocaleString()}`}>
                ${Number(selectedItem.price).toLocaleString()}
              </p>
              <span className="block text-[10px] tracking-widest uppercase text-[#2C2A29] mt-2 font-bold">
                + $12 Flat Rate Domestic Shipping
              </span>
            </div>
            <p className="text-[#2C2A29] leading-relaxed mb-8 sm:mb-10 font-medium text-sm sm:text-base whitespace-pre-line break-words">{selectedItem.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 mb-8 sm:mb-10 border-t-2 border-[var(--color-luxury-sapphire)] pt-6 pb-2 font-light text-xs sm:text-sm" aria-label="Technical Specifications">
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Brand</span><span className="text-[#2C2A29] font-medium">{selectedItem.brand || 'Inquire'}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Model</span><span className="text-[#2C2A29] font-medium">{selectedItem.model || 'Inquire'}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Collection</span><span className="text-[#2C2A29] font-medium">{selectedItem.gender || "Category A"}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Category</span><span className="text-[#2C2A29] font-medium">{selectedItem.movement || 'Type A'}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Attribute 1</span><span className="text-[#2C2A29] font-medium">{selectedItem.dial || 'Inquire'}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Size</span><span className="text-[#2C2A29] font-medium">{selectedItem.case_size || 'Inquire'}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Primary Material</span><span className="text-[#2C2A29] font-medium">{selectedItem.case_material || 'Inquire'}</span></div>
              <div><span className="block uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Secondary Material</span><span className="text-[#2C2A29] font-medium">{selectedItem.band_material || selectedItem.strap_type || 'Inquire'}</span></div>
            </div>

            <div className="mb-12 space-y-4 relative z-0">
              {isSold ? (
                <button disabled className="w-full py-4 sm:py-5 text-[10px] sm:text-xs tracking-[0.2em] font-bold uppercase rounded-sm bg-[#2C2A29]/10 text-[#2C2A29]/40 cursor-not-allowed border border-[#2C2A29]/20">
                  Private Collection Archive
                </button>
              ) : isProcessing ? (
                <button disabled className="w-full py-4 sm:py-5 text-[10px] sm:text-xs tracking-[0.2em] font-bold uppercase rounded-sm bg-[#2C2A29]/10 text-[#2C2A29]/40 cursor-not-allowed border border-[#2C2A29]/20">
                  Processing...
                </button>
              ) : (
                <PayPalScriptProvider options={{ 
                  "client-id": "test", 
                  currency: "USD",
                  components: "buttons",
                  intent: "capture"
                }}>
                  <PayPalButtons 
                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "checkout" }}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        purchase_units: [{
                          description: `${selectedItem.brand} ${selectedItem.model}`,
                          amount: {
                            currency_code: "USD",
                            value: Number(selectedItem.price).toFixed(2), 
                            
                            breakdown: {
                              item_total: {
                                currency_code: "USD",
                                 
                                value: Number(selectedItem.price).toFixed(2)
                              },
                              shipping: {
                                currency_code: "USD",
                                
                                value: "0"
                              }
                            }
                          }
                        }],
                        application_context: {
                          shipping_preference: "GET_FROM_FILE",
                        }
                      });
                    }}
                    onApprove={(data, actions) => {
                      setIsProcessing(true);
                      return actions.order.capture().then((details) => {
                        updateStatus(selectedItem.id, 'sold');
                        
                        supabase.from('metrics_log').insert([{
                          item_id: selectedItem.id,
                          event_type: 'checkout_success',
                          duration_seconds: 0
                        }]).then();

                        setIsProcessing(false);
                        toast.success(`Transaction completed by ${details.payer.name.given_name}. The dealer has been notified.`);
                      });
                    }}
                    onError={(err) => {
                      console.error("PayPal Checkout Error:", err);
                      toast.error("There was an issue processing your payment. Please try again.");
                    }}
                  />
                </PayPalScriptProvider>
              )}
            </div>
          </div>

          <section aria-labelledby="qa-heading" className="border-t-2 border-[#38707A] pt-10 mt-8">
            <h3 id="qa-heading" className="text-sm font-serif uppercase tracking-widest text-[#2C2A29] mb-6 font-bold">
              Collector Q&A ({itemQuestions.length})
            </h3>

            <div className="space-y-6 mb-10">
              {itemQuestions.length === 0 && <p className="text-xs text-[#2C2A29] font-medium italic">No public questions yet. Ask the dealer below!</p>}
              {itemQuestions.map(q => (
                <article key={q.id} className="bg-[#F4F1EB] border border-[#2C2A29]/20 p-4 rounded-sm space-y-3 shadow-sm">
                  <div className="flex justify-between items-start text-xs">
                    <span className="font-serif text-[#2C2A29] font-bold">{q.sender_name} asks:</span>
                    <span className="font-mono text-[10px] text-[#2C2A29] font-bold">{new Date(q.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-[#2C2A29] font-medium italic">"{q.question}"</p>
                  {q.answer && (
                    <div className="bg-[#E4D9C5] p-3 rounded-sm border-l-2 border-[var(--color-luxury-sapphire)] mt-2">
                      <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--color-luxury-sapphire)] block mb-1">Dealer Reply:</span>
                      <p className="text-xs text-[#2C2A29] font-medium">{q.answer}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {!isSold && (
              <form onSubmit={handleAskQuestion} aria-label="Ask a question form" className="bg-[#F4F1EB] p-5 rounded-sm border border-[#2C2A29]/20 space-y-4 shadow-sm">
                <div>
                  <h4 className="text-xs uppercase tracking-widest text-[#2C2A29] font-bold mb-1">Ask a Question About This Piece</h4>
                  <p className="text-[10px] text-[#2C2A29] font-medium">Questions appear publicly after dealer review to ensure accuracy.</p>
                </div>
                <div>
                  <label htmlFor="qa-name" className="sr-only">Your Name or Initials</label>
                  <input id="qa-name" required type="text" value={qaName} onChange={e => setQaName(e.target.value)} placeholder="Your Name or Initials" className="w-full p-3 bg-white border border-[#2C2A29]/30 text-[#2C2A29] text-xs font-medium focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] rounded-sm transition-colors" />
                </div>
                <div>
                  <label htmlFor="qa-text" className="sr-only">Your Question</label>
                  <textarea id="qa-text" required rows="3" value={qaText} onChange={e => setQaText(e.target.value)} placeholder="e.g., Does this item come with its original packaging?" className="w-full p-3 bg-white border border-[#2C2A29]/30 text-[#2C2A29] text-xs font-medium focus:outline-none focus:border-[var(--color-luxury-sapphire)] focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] rounded-sm leading-relaxed transition-colors" />
                </div>
                <button type="submit" disabled={submittingQa} className="cursor-pointer w-full bg-[#2C2A29] hover:bg-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] text-[#E4D9C5] uppercase tracking-widest text-[10px] py-4 font-bold transition-colors rounded-sm shadow-md">
                  {submittingQa ? 'Submitting...' : 'Submit for Dealer Review'}
                </button>
              </form>
            )}
          </section>

          <div className="mt-12 text-center pb-4">
            <div className="text-xs uppercase tracking-widest text-[#2C2A29]/60 flex flex-wrap justify-center gap-4 sm:gap-6 font-bold">
              <button onClick={() => setShowAboutModal(true)} className="cursor-pointer hover:text-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] rounded p-2 transition-colors">
                Our Story
              </button>
              <button onClick={() => setShowTermsModal(true)} className="cursor-pointer hover:text-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] rounded p-2 transition-colors">
                Terms of Sale
              </button>
              <button onClick={() => setShowPrivacyModal(true)} className="cursor-pointer hover:text-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] rounded p-2 transition-colors">
                Privacy Policy
              </button>
            </div>
          </div>

        </section>
      </main>
    );
}
