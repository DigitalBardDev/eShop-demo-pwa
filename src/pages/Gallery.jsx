import toast from 'react-hot-toast';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

// --- SUB-COMPONENT: GALLERY ITEM CARD WITH HOVER SLIDESHOW ---
function ItemCard({ item, onClick }) {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const images = item.image_urls || [];
  const isSold = item.inventory_status === 'sold';
  
  const displayTitle = [item.brand, item.model].filter(Boolean).join(' ') || item.make_model || 'Unknown Item';

  useEffect(() => {
    let timer;
    if (isHovered && images.length > 1) {
      timer = setInterval(() => {
        setCurrentImageIdx((prev) => (prev + 1) % images.length);
      }, 1200);
    } else {
      setCurrentImageIdx(0);
    }
    return () => clearInterval(timer);
  }, [isHovered, images.length]);

  return (
    <div 
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item);
        }
      }}
      aria-label={`View details for ${displayTitle}, Price $${Number(item.price).toLocaleString()}`}
      className="bg-[#F4F1EB] border border-[#2C2A29]/20 shadow-md flex flex-col group cursor-pointer overflow-hidden focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] rounded-sm transition-all hover:shadow-lg hover:-translate-y-1" 
      onClick={() => onClick(item)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full aspect-[3/4] bg-[#E4D9C5] overflow-hidden relative border-b border-[#2C2A29]/10" aria-hidden="true">
        
        <div className={`absolute inset-0 w-full h-full transition-all duration-500 ${isSold ? 'opacity-50 grayscale' : ''}`}>
          {images.length > 0 ? (
            <img src={images[currentImageIdx]} alt={displayTitle} className={`w-full h-full object-cover transition-all duration-500 ${isSold ? '' : 'opacity-90 group-hover:opacity-100 group-hover:scale-105'}`} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#2C2A29]/40 bg-[#F4F1EB]">
              <span className="text-[10px] uppercase tracking-widest font-bold">Image Pending</span>
            </div>
          )}
          
          {images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-none">
              {images.map((_, idx) => (
                <span key={idx} className={`h-1 rounded-full transition-all duration-300 ${idx === currentImageIdx ? 'w-4 bg-[var(--color-luxury-sapphire)] shadow' : 'w-1.5 bg-black/20'}`} />
              ))}
            </div>
          )}
        </div>
        
        {isSold && (
          <div className="absolute inset-0 bg-black/10 flex flex-col justify-end pb-10 z-20 pointer-events-none">
            <div className="w-full bg-[#2C2A29] border-y-2 border-[#38707A] py-2 text-center shadow-xl backdrop-blur-sm">
              <span className="text-[#E4D9C5] uppercase tracking-[0.4em] text-xs font-bold font-sans drop-shadow-sm">Sold</span>
            </div>
          </div>
        )}
        
      </div>
      <div className="p-4 flex flex-col flex-1 justify-between">
        <h2 className={`text-base sm:text-lg font-serif tracking-wide truncate transition-colors ${isSold ? 'text-[#2C2A29]/50' : 'text-[#2C2A29] group-hover:text-[var(--color-luxury-sapphire)]'}`}>{displayTitle}</h2>
        <p className={`text-xs sm:text-sm font-light tracking-wider mt-1 ${isSold ? 'text-[#2C2A29]/50' : 'text-[#2C2A29]/80'}`}>${Number(item.price).toLocaleString()}</p>
      </div>
    </div>
  );
}



export default function Gallery({
  inventory, testimonials, isLoading, viewDetails, openAdmin,
  showSourcingModal, setShowSourcingModal, 
  showRepairModal, setShowRepairModal, 
  showAboutModal, setShowAboutModal, 
  showTermsModal, setShowTermsModal, 
  showPrivacyModal, setShowPrivacyModal,
  SourcingModal, RepairModal, AboutModal, TermsModal, PrivacyModal
}) {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const carouselRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftPos = useRef(0);

  const checkScroll = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [testimonials]);

  const filterByTarget = (item) => categoryFilter === 'All' || item.gender === categoryFilter;
  const filteredItems = inventory
    .filter(w => w.inventory_status?.toLowerCase() === 'available' || w.inventory_status?.toLowerCase() === 'sold')
    .filter(filterByTarget)
    .sort((a, b) => {
      const brandA = (a.brand || '').toLowerCase();
      const brandB = (b.brand || '').toLowerCase();
      return brandA.localeCompare(brandB);
    });

  return (
<div className="min-h-screen bg-[#E4D9C5] text-[#2C2A29] pb-20 overflow-x-hidden relative">
        {showSourcingModal && <SourcingModal onClose={() => setShowSourcingModal(false)} onSuccess={() => { setShowSourcingModal(false); toast.success("Message received."); }} />}
        {showRepairModal && <RepairModal onClose={() => setShowRepairModal(false)} onSuccess={() => { setShowRepairModal(false); toast.success("Review Submission Received. The dealer will reach out soon."); }} />}
        {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
        {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
        {showPrivacyModal && <PrivacyModal onClose={() => setShowPrivacyModal(false)} />}

        <header className="w-full pt-12 pb-10 px-6 text-center flex flex-col items-center justify-center">
  
          <div className="flex flex-col items-center justify-center mb-6 select-none cursor-default">
            
            <div className="flex flex-row items-center justify-center">
              
              
              
              <div className="flex flex-col items-center z-20">
                <h1 
                  className="text-6xl sm:text-7xl md:text-8xl text-[var(--color-luxury-sapphire)] leading-none mb-1 whitespace-nowrap"
                  style={{ fontFamily: "'Yellowtail', cursive" }}
                >
                  &nbsp;Luxe Demo Store&nbsp;&nbsp;
                </h1>
                <h2 className="text-xl sm:text-2xl font-black text-[#2C2A29] uppercase tracking-[0.25em] sm:tracking-[0.35em] whitespace-nowrap mt-2">
                  Curated Items
                </h2>
              </div>

              
            </div>
          </div>

          <div className="w-24 h-[2px] bg-[var(--color-luxury-sapphire)] my-4 opacity-50 mx-auto" aria-hidden="true"></div>
          
          <p className="font-medium text-[#2C2A29] max-w-4xl mx-auto mt-2 text-sm sm:text-base leading-relaxed px-4 text-balance text-center">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
        </header>

        <main>
          <div className="hidden md:flex w-full max-w-[90rem] mx-auto px-4 sm:px-6 mt-12 sm:mt-16 border-b-2 border-[var(--color-luxury-sapphire)] pb-3 gap-8 lg:gap-16 items-end">
            <h3 className="w-40 lg:w-48 flex-shrink-0 text-[10px] uppercase tracking-[0.3em] text-[#2C2A29] font-bold m-0">Collections</h3>
            <h2 className="flex-1 text-xs uppercase tracking-[0.3em] text-[#2C2A29] font-bold m-0">
              The Collection {categoryFilter !== 'All' && `— ${categoryFilter}`}
            </h2>
          </div>

          <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 mt-6 md:mt-8 flex flex-col md:flex-row gap-8 lg:gap-16">
            
            <aside className="w-full md:w-40 lg:w-48 flex-shrink-0">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden w-full mb-6 border border-[#2C2A29]/20 bg-[#F4F1EB] px-4 py-3 text-xs tracking-widest uppercase font-bold flex justify-between items-center text-[#2C2A29] hover:text-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors shadow-sm rounded-sm"
              >
                <span>{categoryFilter === 'All' ? 'Filter Collection' : `Viewing: ${categoryFilter}`}</span>
                <span>{isSidebarOpen ? '−' : '+'}</span>
              </button>

              <div className={`${isSidebarOpen ? 'block' : 'hidden'} md:block sticky top-8`}>
                <div>
                  <h3 className="md:hidden text-[10px] uppercase tracking-[0.3em] text-[#2C2A29] mb-4 font-bold border-b-2 border-[var(--color-luxury-sapphire)] pb-2">Collections</h3>
                  <ul className="space-y-1">
                    {['All', "Category A", "Category B"].map(cat => (
                      <li key={cat}>
                        <button 
                          onClick={() => { setCategoryFilter(cat); setIsSidebarOpen(false); }}
                          className={`cursor-pointer text-xs tracking-wide transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-luxury-sapphire)] rounded py-1 px-2 w-full text-left -ml-2 font-bold ${categoryFilter === cat ? 'text-[var(--color-luxury-sapphire)] bg-[#2C2A29]/10' : 'text-[#2C2A29] hover:text-[var(--color-luxury-sapphire)] hover:bg-[#2C2A29]/5'}`}
                        >
                          {cat === 'All' ? 'All Items' : cat === "Category A" ? "Category A Items" : "Category B Items"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <section aria-label="Available Inventory">
                <h2 className="md:hidden text-xs uppercase tracking-[0.3em] text-[#2C2A29] mb-8 border-b-2 border-[var(--color-luxury-sapphire)] pb-3 font-bold">
                  The Collection {categoryFilter !== 'All' && `— ${categoryFilter}`}
                </h2>
                {isLoading && <p className="text-center text-zinc-500 font-mono tracking-widest my-20 uppercase text-xs sm:text-sm" aria-live="polite">Retrieving Vault Database...</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12">
                  {filteredItems.map((item) => (
                    <ItemCard key={item.id} item={ item } onClick={viewDetails} />
                  ))}
                </div>
                
                {!isLoading && filteredItems.length === 0 && (
                  <p className="text-xs sm:text-sm text-[var(--color-luxury-steel)] tracking-widest uppercase my-12">No pieces available in this collection.</p>
                )}
              </section>
            </div>
          </div>

          <section aria-labelledby="testimonials-heading" className="w-full max-w-[90rem] mx-auto mt-24 sm:mt-32 border-t-2 border-[#38707A] pt-16 overflow-hidden relative">
            <h2 id="testimonials-heading" className="text-xs uppercase tracking-[0.3em] text-[#2C2A29] mb-4 sm:mb-10 text-center font-bold px-4">
              Collector Experiences
            </h2>
            
            <p className="sm:hidden text-center text-[10px] uppercase tracking-widest text-[#2C2A29]/50 mb-8 px-4 animate-pulse" aria-hidden="true">
              ← Swipe to explore →
            </p>
            
            {testimonials.filter(t => t.status?.toLowerCase() === 'approved').length === 0 ? (
              <p className="text-center text-xs text-[#2C2A29]/70 uppercase tracking-widest px-4 font-medium">Client reviews populating soon.</p>
            ) : (
              <div className="relative group px-6 sm:px-16 md:px-24 max-w-[90rem] mx-auto">
                {canScrollLeft && (
                  <button 
                    onClick={() => { carouselRef.current.scrollBy({ left: -424, behavior: 'smooth' }); setTimeout(checkScroll, 350); }} 
                    className="cursor-pointer absolute left-1 sm:left-4 top-[45%] -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-[#2C2A29] text-[#E4D9C5] hover:bg-[#38707A] shadow-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#38707A] hidden sm:flex"
                    aria-label="Scroll left"
                  >
                    ←
                  </button>
                )}

                <div 
                  ref={carouselRef}
                  onScroll={checkScroll}
                  onMouseDown={(e) => {
                    isDragging.current = true;
                    startX.current = e.pageX - carouselRef.current.offsetLeft;
                    scrollLeftPos.current = carouselRef.current.scrollLeft;
                    carouselRef.current.style.cursor = 'grabbing';
                    carouselRef.current.style.scrollBehavior = 'auto'; 
                    carouselRef.current.style.scrollSnapType = 'none';
                  }}
                  onMouseLeave={() => {
                    isDragging.current = false;
                    if (carouselRef.current) {
                      carouselRef.current.style.cursor = 'grab';
                      carouselRef.current.style.scrollBehavior = 'smooth';
                      carouselRef.current.style.scrollSnapType = 'x mandatory';
                    }
                  }}
                  onMouseUp={() => {
                    isDragging.current = false;
                    if (carouselRef.current) {
                      carouselRef.current.style.cursor = 'grab';
                      carouselRef.current.style.scrollBehavior = 'smooth';
                      carouselRef.current.style.scrollSnapType = 'x mandatory';
                    }
                  }}
                  onMouseMove={(e) => {
                    if (!isDragging.current) return;
                    e.preventDefault();
                    const x = e.pageX - carouselRef.current.offsetLeft;
                    const walk = (x - startX.current) * 2; 
                    carouselRef.current.scrollLeft = scrollLeftPos.current - walk;
                  }}
                  className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory scroll-smooth cursor-grab select-none" 
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {testimonials.filter(t => t.status?.toLowerCase() === 'approved').map(t => (
                    <div key={t.id} className="w-[80vw] sm:w-[400px] flex-shrink-0 snap-start bg-[#F4F1EB] p-8 rounded-sm border border-[#2C2A29]/20 flex flex-col justify-between hover:border-[var(--color-luxury-sapphire)] transition-colors pointer-events-none shadow-sm">
                      <p className="text-sm font-light text-[#2C2A29]/80 italic mb-8 leading-relaxed">"{t.review_text}"</p>
                      <div className="flex flex-col gap-1">
                        {t.item_reference && (
                          <span className="text-[10px] text-[#2C2A29]/50 uppercase tracking-widest mb-1 block font-bold">
                            Regarding: {t.item_reference}
                          </span>
                        )}
                        <span className="text-sm text-[var(--color-luxury-sapphire)] tracking-[0.1em] mb-1">
                          {'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                        </span>
                        <span className="text-[10px] font-bold text-[#2C2A29] uppercase tracking-[0.2em]">— {t.author_name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {canScrollRight && (
                  <button 
                    onClick={() => { carouselRef.current.scrollBy({ left: 424, behavior: 'smooth' }); setTimeout(checkScroll, 350); }} 
                    className="cursor-pointer absolute right-1 sm:right-4 top-[45%] -translate-y-1/2 z-20 w-12 h-12 items-center justify-center rounded-full bg-[#2C2A29] text-[#E4D9C5] hover:bg-[#38707A] shadow-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#38707A] hidden sm:flex"
                    aria-label="Scroll right"
                  >
                    →
                  </button>
                )}
              </div>
            )}
          </section>

          {/* SOURCING & LOCAL REPAIR CTAs */}
          <section className="w-full max-w-5xl mx-auto mt-28 sm:mt-36 border-t-2 border-[var(--color-luxury-sapphire)] pt-16 px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
              
              <div className="text-center md:border-r-2 md:border-[var(--color-luxury-sapphire)]/50 md:pr-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-serif text-[#2C2A29] mb-2">Product Inquiry</h3>
                  <p className="text-xs sm:text-sm text-[#2C2A29] mb-6 font-medium">
                    Contact us for custom requests or to inquire about unlisted inventory.
                  </p>
                </div>
                <button 
                  onClick={() => setShowSourcingModal(true)} 
                  className="bg-[#2C2A29] hover:bg-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] text-[#E4D9C5] uppercase tracking-widest text-[10px] px-8 py-4 font-bold transition-colors rounded-sm shadow-md w-full sm:w-auto mx-auto cursor-pointer"
                >
                  Submit Sourcing Request
                </button>
              </div>

              <div className="text-center md:pl-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-serif text-[#2C2A29] mb-2">Leave a Review</h3>
                  <p className="text-xs sm:text-sm text-[#2C2A29] mb-6 font-medium">
                    Share your experience with our products and services. We value your feedback!
                  </p>
                </div>
                <button 
                  onClick={() => setShowRepairModal(true)} 
                  className="bg-[#2C2A29] hover:bg-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] text-[#E4D9C5] uppercase tracking-widest text-[10px] px-8 py-4 font-bold transition-colors rounded-sm shadow-md w-full sm:w-auto mx-auto cursor-pointer"
                >
                  Request Local Service
                </button>
              </div>

            </div>
          </section>
        </main>

        <footer className="w-full text-center mt-20 pb-8 space-y-4">
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
          <button onClick={openAdmin} className="cursor-pointer text-[10px] tracking-widest uppercase text-[#2C2A29]/40 hover:text-[var(--color-luxury-sapphire)] focus:outline-none focus:ring-2 focus:ring-[var(--color-luxury-sapphire)] transition-colors mt-4 rounded p-1">
            Database Controller
          </button>
        </footer>
      </div>
    );
}
