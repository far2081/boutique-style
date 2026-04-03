/**
 * NoorStyle AI | Premium Luxury Pakistani Couture
 * 3D Avatar Engine & Virtual Try-On Studio (v4.0 Final)
 * Designed and Developed by Farhana Aamir
 */

// ── STATE MANAGEMENT ────────────────────────────────────────────────────────
let cart = [];
let glamRewardUnlocked = false;

// 3D Engine State managed by engine.js

// ── NAVIGATION & SCROLL ────────────────────────────────────────────────────
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
    // Navbar Elevation
    if (navbar) {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }

    // Scroll Top Button Visibility
    if (scrollTopBtn) {
        if (window.scrollY > 800) scrollTopBtn.classList.add('visible');
        else scrollTopBtn.classList.remove('visible');
    }
});

// ── REVEAL ANIMATIONS ──────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.05, rootMargin: "0px 0px -50px 0px" });

function initReveals() {
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

// ── CART FUNCTIONALITY ────────────────────────────────────────────────────
let cartDrawer, cartItemsContainer, cartCountElements;

function initCartElements() {
    cartDrawer = document.getElementById('cart-drawer');
    cartItemsContainer = document.getElementById('cart-items');
    cartCountElements = document.querySelectorAll('.cart-count');
}

function toggleCart() {
    if (!cartDrawer) cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
        console.log("Cart Toggled: ", cartDrawer.classList.contains('open'));
    }
}

function addToCart(name, price) {
    if (!name || isNaN(price)) {
        console.error("Add to Cart Error: Invalid data", { name, price });
        return;
    }
    cart.push({ name, price });
    updateCartUI();
    // Auto-open cart with a delay for luxury feel
    setTimeout(() => { 
        if (cartDrawer && !cartDrawer.classList.contains('open')) {
            toggleCart();
        } 
    }, 600);
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

function updateCartUI() {
    cartCountElements.forEach(el => el.innerText = cart.length);
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; margin-top: 50px; opacity: 0.5;">Your luxurious selection is empty.</p>';
        const productsTotal = document.getElementById('invoice-products-total');
        const grandTotal = document.getElementById('invoice-grand-total');
        if (productsTotal) productsTotal.innerText = 'PKR 0';
        if (grandTotal) grandTotal.innerText = 'PKR 0';
        const beautyRows = document.getElementById('beauty-service-rows');
        const savingsInd = document.getElementById('savings-indicator');
        if (beautyRows) beautyRows.style.display = 'none';
        if (savingsInd) savingsInd.style.display = 'none';
        return;
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h4 class="serif">${item.name}</h4>
                <p>PKR ${item.price.toLocaleString()}</p>
            </div>
            <i data-lucide="trash-2" style="cursor: pointer; margin-left: auto; font-size: 14px; opacity: 0.5;" onclick="removeFromCart(${index})"></i>
        </div>
    `).join('');
    
    // Calculations
    const productsTotal = cart.reduce((sum, item) => sum + item.price, 0);
    const hasReward = cart.length >= 2;
    let shipping = productsTotal > 50000 ? 0 : 500;
    let beautyServiceFee = 0;

    if (hasReward) {
        beautyServiceFee = 5000; // Unlocked salon partner price
        const beautyRows = document.getElementById('beauty-service-rows');
        const savingsInd = document.getElementById('savings-indicator');
        if (beautyRows) beautyRows.style.display = 'block';
        if (savingsInd) savingsInd.style.display = 'flex';
        if (!glamRewardUnlocked) glamRewardUnlocked = true;
    } else {
        const beautyRows = document.getElementById('beauty-service-rows');
        const savingsInd = document.getElementById('savings-indicator');
        if (beautyRows) beautyRows.style.display = 'none';
        if (savingsInd) savingsInd.style.display = 'none';
    }

    const total = productsTotal + beautyServiceFee + shipping;
    const invProd = document.getElementById('invoice-products-total');
    const invShip = document.getElementById('invoice-shipping');
    const invGrand = document.getElementById('invoice-grand-total');
    if (invProd) invProd.innerText = `PKR ${productsTotal.toLocaleString()}`;
    if (invShip) invShip.innerText = shipping === 0 ? 'FREE' : `PKR ${shipping.toLocaleString()}`;
    if (invGrand) invGrand.innerText = `PKR ${total.toLocaleString()}`;
    
    if (window.lucide) lucide.createIcons();
}

// ── FOOTER & HEADER INFO LOGIC ──────────────────────────────────────────────
const notices = {
    'privacy': { title: 'Privacy Policy', text: 'Our commitment to your privacy is as bespoke as our heritage. We use advanced encryption to protect your measurements and stylistic preferences. Your data never leaves our high-fashion vault.' },
    'terms': { title: 'Terms & Conditions', text: 'Luxury redefined under your own terms. Our services are subject to mutual respect and the highest standards of Pakistani couture. Bespoke orders involve an artisanal contract.' },
    'refund': { title: 'Refund Policy', text: 'All pieces are custom-crafted by masters. Refunds are handled with the grace of our artisanal heritage on a case-by-case basis, strictly within 7 days of delivery.' },
    'size': { title: 'Size Guide', text: 'Our AI Stylist handles all measurements via 3D silhouette analysis. For standard reference, our Medium follows a 38-inch bust profile with hand-tailored precision across all coordinates.' },
    'shipping': { title: 'Shipping Policy', text: 'Worldwide delivery from Lahore to your doorstep. Free shipping on orders over PKR 50,000 via UPS Luxury Express. All items are insured and trackable via our AI portal.' },
    'contact': { title: 'Contact Support', text: 'Connect with our masters at support@noorstyleai.com or visit our flagship studio in Gulberg III, Lahore. WhatsApp: +92 300 1234567.' },
    'tracking': { title: 'Order Tracking', text: 'Enter your bespoke order ID (e.g. #NS-XXXXX) in our AI system to see its journey from the loom, through the embellishment phase, to your doorstep.' },
    'faq': { title: 'FAQ', text: 'Common questions about our 3D engine, virtual try-ons, and handcrafted zari work are handled by our 24/7 AI stylistic advisor in the chat bubble below.' },
    'store': { title: 'Store Locator', text: 'Visit the House of NoorStyle at our flagship: 142-P, Gulberg III, Lahore, or our boutique branch at Ocean Mall, Karachi. Open 11 AM - 10 PM.' },
    'wholesale': { title: 'Wholesale Inquiry', text: 'Partner with the future of Pakistani luxury. For global boutique inquiries and wholesale catalogs, please email our creative director.' },
    'legal': { title: 'Legal Notice', text: 'NoorStyle AI is a registered trademark. All digital assets, 3D rigs, and photography are protected by international intellectual property laws.' },
    'cookies': { title: 'Cookie Policy', text: 'We use artisan digital cookies to remember your style profile, skin tone preferences, and improve your AI-powered journey through our couture collections.' },
    'search': { title: 'Search Engine', text: 'Our intelligent search is being refined by our AI artisans. For now, please explore our curated collections via the sidebar filters below.' },
    'user': { title: 'Account Portal', text: 'Welcome back to your curated luxury profile. Sign in to view your 3D wardrobe, saved AI measurements, and order history.' }
};

function showNotice(key) {
    const notice = notices[key] || { title: 'Notice', text: 'This feature is arriving in our next bridal drop. For now, explore our virtual try-on studio!' };
    const modal = document.getElementById('info-notice-modal');
    const title = document.getElementById('info-notice-title');
    const body = document.getElementById('info-notice-body');
    
    if (title) title.innerText = notice.title;
    if (body) body.innerText = notice.text;
    if (modal) modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeNotice() {
    const modal = document.getElementById('info-notice-modal');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ── SHOP FILTERING ────────────────────────────────────────────────────────
const filterCheckboxes = document.querySelectorAll('.filter-group input[type="checkbox"]');
const priceRange = document.getElementById('price-range');
const priceMaxText = document.getElementById('price-max');
const productCards = document.querySelectorAll('.product-card');

function filterProducts() {
    const activeFilters = {};
    let hasFilters = false;

    filterCheckboxes.forEach(cb => {
        if (cb.checked) {
            const filterType = cb.dataset.filter;
            if (!activeFilters[filterType]) activeFilters[filterType] = [];
            activeFilters[filterType].push(cb.value);
            hasFilters = true;
        }
    });

    const maxPrice = priceRange ? parseInt(priceRange.value) : 100000;
    if (priceMaxText) priceMaxText.innerText = maxPrice.toLocaleString();

    // Visual filtering removed per user request: No hiding, no dimming, no scaling.
    productCards.forEach(card => {
        card.style.display = "flex";
        card.style.opacity = "1";
        card.style.filter = "none";
        card.style.transform = "none";
        card.classList.remove('matching-highlight');
    });

    // We only use the filter logic to update the AI Stylist synchronously
    // This part is handled by the change event listener below
}



// ── SYNC LOGIC: THE SOURCE OF TRUTH ────────────────────────────────────────
/**
 * Synchronizes the entire UI (Hero, 3D Canvas, Modals) with a selected product.
 * @param {HTMLElement} productEl - The product card element to sync with.
 */
function syncGlobalProduct(productEl) {
    if (!productEl) return;
    
    const h3El = productEl.querySelector('h3');
    const name = h3El ? h3El.innerText : "Luxury Piece";
    const imgElement = productEl.querySelector('img');
    const color = productEl.getAttribute('data-color') || (productEl.dataset ? productEl.dataset.color : null) || 'gold';
    if (!imgElement) return;
    const imgSrc = imgElement.src;
    
    // 1. Update Hero / AI Stylist Image
    const previewImg = document.getElementById('stylist-main-img');
    const previewName = document.getElementById('stylist-product-name');
    const previewPrice = document.getElementById('stylist-product-price');
    if (previewImg) previewImg.src = imgSrc;
    if (previewName) previewName.innerText = name;
    if (previewPrice) {
        const pPrice = productEl.querySelector('.product-price');
        if (pPrice) previewPrice.innerText = pPrice.innerText;
    }
    
    // 2. Update Virtual Try-On Modal (My Profile & AI Advisor)
    document.querySelectorAll('.tryon-selected-img').forEach(el => el.src = imgSrc);
    document.querySelectorAll('.tryon-selected-name').forEach(el => el.innerText = name);
    
    // 3. Update Modal Data Cache
    const productModal = document.getElementById('product-modal');
    if (productModal) {
        productModal.setAttribute('data-color', color);
    }
    
    // 4. Update VTO Order Button Data
    const tryOnBtn = document.getElementById('tryon-order-btn');
    const pPriceEl = productEl.querySelector('.product-price');
    const pPriceTxt = pPriceEl ? pPriceEl.innerText : "PKR 0";
    const pPriceVal = parseInt(pPriceTxt.replace(/PKR\s?|,/g, ''));
    if (tryOnBtn) {
        tryOnBtn.dataset.name = name;
        tryOnBtn.dataset.price = pPriceVal;
    }

    if (window.onOutfitColorChange) {
        window.onOutfitColorChange(color);
    }
    
    console.log("Global Sync: " + name + " (" + color + ")");
}




// ── MODAL & TRIGGER BINDING ───────────────────────────────────────────────

// Handlers consolidated into global listener below

// ── CHECKOUT ENGINE ────────────────────────────────────────────────────────
function openCheckout() {
    if (cart.length === 0) {
        alert("Your wardrobe is empty. Please select a masterpiece first.");
        return;
    }
    
    const checkoutBtn = document.getElementById('checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutItemsList = document.getElementById('checkout-items-list');
    const checkoutGrandTotal = document.getElementById('checkout-grand-total');
    const cartDrawer = document.getElementById('cart-drawer');

    // Luxury loading feel before opening modal
    const originalText = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Syncing Wardrobe...';
    checkoutBtn.style.pointerEvents = 'none';

    setTimeout(() => {
        // Populate Checkout Summary with mini previews
        if (checkoutItemsList) {
            checkoutItemsList.innerHTML = cart.map(item => `
                <div class="checkout-item-mini" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div style="width: 45px; height: 60px; background: rgba(212,175,55,0.05); border: 1px solid rgba(212,175,55,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; color: var(--gold); font-weight: bold;">
                        ${item.name.charAt(0)}
                    </div>
                    <div style="flex: 1;">
                        <h5 class="serif" style="font-size: 13px; margin: 0; color: white;">${item.name}</h5>
                        <p style="font-size: 11px; opacity: 0.6; margin: 3px 0 0;">Premium Couture</p>
                    </div>
                    <div style="font-weight: 600; font-size: 12px; color: var(--gold);">
                        PKR ${item.price.toLocaleString()}
                    </div>
                </div>
            `).join('');
        }
        
        const productsTotal = cart.reduce((sum, item) => sum + item.price, 0);
        const shipping = productsTotal > 50000 ? 0 : 500;
        const hasReward = cart.length >= 2;
        const total = productsTotal + (hasReward ? 5000 : 0) + shipping;
        
        if (checkoutGrandTotal) checkoutGrandTotal.innerText = `PKR ${total.toLocaleString()}`;
        
        if (checkoutModal) checkoutModal.classList.add('active');
        if (cartDrawer) cartDrawer.classList.remove('open');
        document.body.style.overflow = 'hidden';

        // Reset button
        checkoutBtn.innerHTML = originalText;
        checkoutBtn.style.pointerEvents = 'auto';
    }, 800);
}

function closeCheckoutModal() {
    const checkoutModal = document.getElementById('checkout-modal');
    if (checkoutModal) checkoutModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

window.closeSuccess = function() {
    const successOverlay = document.getElementById('success-overlay');
    if (successOverlay) successOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
};

// ── GLOBAL CLICK HANDLER (Single Listener for Stability) ────────────────────
document.addEventListener('click', (e) => {
    // 1. Cart Toggles (Consolidated to prevent double-toggle interference)
    if (e.target.closest('#cart-trigger-top') || e.target.closest('#close-cart') || e.target.closest('.close-cart')) {
        toggleCart();
        return; // Prevent multiple handlers for same event
    }

    // 2. Add to Cart
    const addBtn = e.target.closest('.add-to-cart');
    if (addBtn) {
        addToCart(addBtn.dataset.name, parseInt(addBtn.dataset.price));
    }

    // 3. Quick View
    const qView = e.target.closest('.quick-view');
    if (qView) {
        const card = qView.closest('.product-card');
        const modal = document.getElementById('product-modal');
        if (card && modal) {
            syncGlobalProduct(card); // SYNC: Ensure the 3D Engine and Modal get the correctly associated data
            
            const name = card.querySelector('h3').innerText;
            const priceTxt = card.querySelector('.product-price').innerText;
            const priceVal = parseInt(priceTxt.replace(/PKR\s?|,/g, ''));
            
            document.getElementById('modal-product-name').innerText = name;
            document.getElementById('modal-product-price').innerText = priceTxt;
            document.getElementById('product-detail-img').src = card.querySelector('img').src;
            
            const mAddBtn = document.getElementById('modal-add-to-cart-btn');
            if (mAddBtn) {
                mAddBtn.dataset.name = name;
                mAddBtn.dataset.price = priceVal;
            }
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // 4. Close Product Modal
    if (e.target.closest('.close-modal')) {
        const pModal = document.getElementById('product-modal');
        if (pModal) pModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 5. Try-On Modal Sync & Open
    const tryOn = e.target.closest('.tryon-trigger');
    if (tryOn) {
        e.preventDefault();
        const modal = document.getElementById('tryon-modal');
        if (modal) {
            // Priority 1: Check if product-modal is open and use its current data
            const productModal = document.getElementById('product-modal');
            let targetName = "Emerald Summer Gala";
            let targetImg = "assets/pret.png";
            let targetColor = "emerald";

            if (productModal && window.getComputedStyle(productModal).display !== 'none') {
                const modalNameEl = document.getElementById('modal-product-name');
                const modalImgEl = document.getElementById('product-detail-img');
                targetName = modalNameEl ? modalNameEl.innerText : targetName;
                targetImg = modalImgEl ? modalImgEl.src : targetImg;
                const pColor = productModal.getAttribute('data-color');
                if (pColor) targetColor = pColor;
            } else {
                // Priority 2: Use data from clicked card
                const contextCard = tryOn.closest('.product-card');
                if (contextCard) {
                    const cardH3 = contextCard.querySelector('h3');
                    const cardImg = contextCard.querySelector('img');
                    targetName = cardH3 ? cardH3.innerText : targetName;
                    targetImg = cardImg ? cardImg.src : targetImg;
                    targetColor = contextCard.getAttribute('data-color') || targetColor;
                } else {
                    // Priority 3: Use last global sync (if any)
                    const heroNameEl = document.getElementById('stylist-product-name');
                    if (heroNameEl && heroNameEl.innerText !== "Product Name") {
                        targetName = heroNameEl.innerText;
                        const mainImgEl = document.getElementById('stylist-main-img');
                        targetImg = mainImgEl ? mainImgEl.src : targetImg;
                    }
                }
            }
            
            // Apply to all VTO Sidebar Instances (My Profile / AI Advisor)
            document.querySelectorAll('.tryon-selected-name').forEach(el => el.innerText = targetName);
            document.querySelectorAll('.tryon-selected-img').forEach(el => el.src = targetImg);
            
            // Sync the VTO Order Button as well
            const tryOnBtn = document.getElementById('tryon-order-btn');
            if (tryOnBtn) {
                tryOnBtn.dataset.name = targetName;
                const cardForPrice = tryOn.closest('.product-card');
                if (cardForPrice) {
                    const pPriceEl = cardForPrice.querySelector('.product-price');
                    const pPriceVal = parseInt((pPriceEl ? pPriceEl.innerText : "45,000").replace(/PKR\s?|,/g, ''));
                    tryOnBtn.dataset.price = pPriceVal;
                }
            }

            // Sync with 3D Engine
            if (window.onOutfitColorChange) {
                window.onOutfitColorChange(targetColor);
            }
            
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';
            
            // Ensure 3D Engine catches up
            setTimeout(() => {
                const resizeFunc = window.onEngineResize || (typeof onEngineResize === 'function' ? onEngineResize : null);
                if (resizeFunc) resizeFunc();
                
                if (window.onComplexionChange) {
                    const activeToneCircle = document.querySelector('.complexion-circle.active');
                    const activeTone = (activeToneCircle && activeToneCircle.dataset) ? activeToneCircle.dataset.tone : 'fair';
                    window.onComplexionChange(activeTone);
                }
            }, 500);
        }
    }

    // Modal Close
    if (e.target.closest('#close-tryon')) {
        const tModal = document.getElementById('tryon-modal');
        if (tModal) {
            tModal.classList.remove('active');
            tModal.style.display = 'none'; // Fail-safe
            
            // Stop webcam if running
            if (window.liveStream) {
                window.liveStream.getTracks().forEach(t => t.stop());
                window.liveStream = null;
            }
            const webcamVideo = document.getElementById('webcam-video');
            if (webcamVideo) {
                webcamVideo.srcObject = null;
                webcamVideo.style.display = 'none';
            }
            // Reset to avatar mode for next time
            const avatarModeBtn = document.getElementById('mode-avatar');
            if (avatarModeBtn && !avatarModeBtn.classList.contains('active')) {
                avatarModeBtn.click();
            }
        }
        document.body.style.overflow = 'auto';
    }

    // 5b. VTO Tab Switching
    const vtoTab = e.target.closest('.tryon-tab');
    if (vtoTab) {
        const targetTab = vtoTab.dataset.tab;
        document.querySelectorAll('.tryon-tab').forEach(t => t.classList.remove('active'));
        vtoTab.classList.add('active');
        
        const profilePanel = document.getElementById('tryon-profile-panel');
        const advisorPanel = document.getElementById('tryon-advisor-panel');
        
        if (targetTab === 'profile') {
            if (profilePanel) profilePanel.style.display = 'block';
            if (advisorPanel) advisorPanel.style.display = 'none';
        } else {
            if (profilePanel) profilePanel.style.display = 'none';
            if (advisorPanel) advisorPanel.style.display = 'block';
        }
    }

    // 6. Checkout
    if (e.target.closest('#checkout-btn')) {
        openCheckout();
    }
    if (e.target.closest('.close-checkout')) {
        closeCheckoutModal();
    }

    // 7. Information Notice (Footer/Megamenu)
    const iLink = e.target.closest('.footer-info-link, .megamenu-info');
    if (iLink) {
        e.preventDefault();
        showNotice(iLink.dataset.footer || iLink.dataset.info);
    }
    if (e.target.closest('.close-info-notice')) {
        closeNotice();
    }

    // 8. Header Tools
    if (e.target.closest('i[data-lucide="search"]') || e.target.matches('svg.lucide-search')) {
        showNotice('search');
    }
    if (e.target.closest('i[data-lucide="user"]') || e.target.matches('svg.lucide-user')) {
        showNotice('user');
    }

    // 9. Megamenu Links (Scroll & UI Sync)
    const mFilter = e.target.closest('.megamenu-filter');
    if (mFilter) {
        e.preventDefault();
        const fType = mFilter.dataset.filter;
        const fVal = mFilter.dataset.value;
        
        const cb = document.querySelector(`.shop-sidebar input[data-filter="${fType}"][value="${fVal}"]`);
        if (cb) {
            cb.checked = true; // Just add/ensure it's checked
            cb.dispatchEvent(new Event('change')); // Trigger synchronization
        }
        
        const shop = document.getElementById('shop');
        if (shop) window.scrollTo({ top: shop.offsetTop - 80, behavior: 'smooth' });
        return;
    }

    // 10. Universal Scroll Links
    if (e.target.matches('a[href^="#"]') && !e.target.closest('.megamenu-filter') && !e.target.closest('.tryon-trigger')) {
        const href = e.target.getAttribute('href');
        if (href !== "#") {
            const targetEl = document.getElementById(href.slice(1));
            if (targetEl) {
                e.preventDefault();
                window.scrollTo({ top: targetEl.offsetTop - 80, behavior: 'smooth' });
            }
        }
    }

    // 11. Chatbot Toggle
    if (e.target.closest('#chatbot-toggle')) {
        const win = document.getElementById('chat-window');
        const mainIcon = document.getElementById('chat-icon-main');
        const closeIcon = document.getElementById('chat-close-icon');
        const isOpen = win && win.style.display === 'flex';
        
        if (win) win.style.display = isOpen ? 'none' : 'flex';
        if (mainIcon) mainIcon.style.display = isOpen ? 'block' : 'none';
        if (closeIcon) closeIcon.style.display = isOpen ? 'none' : 'block';
    }

    // 11b. Try-On Mode Toggles
    if (e.target.closest('.mode-btn')) {
        const modeBtn = e.target.closest('.mode-btn');
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        modeBtn.classList.add('active');
        
        const canvasContainer = document.getElementById('canvas-container');
        const webcamVideo = document.getElementById('webcam-video');
        
        if (modeBtn.id === 'mode-live') {
            // Live Mirror Focus
            if (canvasContainer) {
                canvasContainer.style.opacity = '0.7';
                canvasContainer.style.filter = 'drop-shadow(0 0 10px rgba(0,0,0,0.5))'; // Remove grayscale for more realism
            }
            if (webcamVideo) {
                webcamVideo.style.display = 'block';
                navigator.mediaDevices.getUserMedia({ video: true })
                    .then(stream => {
                        window.liveStream = stream;
                        webcamVideo.srcObject = stream;
                        // Show capture controls
                        const capBtn = document.getElementById('capture-group');
                        const faceGuide = document.getElementById('face-guide');
                        if (capBtn) capBtn.style.display = 'flex';
                        if (faceGuide) faceGuide.style.display = 'block';
                    })
                    .catch(err => {
                        console.error('Camera error:', err);
                        alert('Unable to access camera. Please allow permissions or check device settings.');
                        document.getElementById('mode-avatar')?.click();
                    });
            }
        } else {
            // Hide capture controls
            const capBtn = document.getElementById('capture-group');
            const faceGuide = document.getElementById('face-guide');
            if (capBtn) capBtn.style.display = 'none';
            if (faceGuide) faceGuide.style.display = 'none';

            // Standard Avatar Forceful 3D Activation
            if (canvasContainer) {
                canvasContainer.style.opacity = '1';
                canvasContainer.style.visibility = 'visible';
                canvasContainer.style.filter = 'none';
            }
            if (webcamVideo) {
                webcamVideo.style.display = 'none';
                if (window.liveStream) {
                    window.liveStream.getTracks().forEach(t => t.stop());
                    window.liveStream = null;
                    webcamVideo.srcObject = null;
                }
            }
            if (window.onEngineResize) window.onEngineResize();
        }
    }

    // 12. Product Card Direct Sync
    const productCard = e.target.closest('.product-card');
    if (productCard && !e.target.closest('button')) {
        syncGlobalProduct(productCard);
        // Removed auto-scroll to AI section per user request to maintain layout stability
    }

    // 13. Advisor Trend Card Sync
    const trendCard = e.target.closest('.trend-card');
    if (trendCard) {
        const dressKey = trendCard.dataset.dress; 
        const parts = dressKey.split('-');
        const color = parts[1] || 'ruby';
        
        // Visual highlight
        document.querySelectorAll('.trend-card').forEach(t => t.classList.remove('active'));
        trendCard.classList.add('active');

        // Apply Color to Engine
        if (window.onOutfitColorChange) {
            window.onOutfitColorChange(color);
        }

        // Apply Description to Fitting Info
        const fittingInfo = document.getElementById('virtual-fitting-info');
        if (fittingInfo) fittingInfo.innerText = trendCard.dataset.desc || "Optimal fit analyzed.";
    }

    // 15. Complexion Picker
    const complexion = e.target.closest('.complexion-circle');
    if (complexion) {
        document.querySelectorAll('.complexion-circle').forEach(c => c.classList.remove('active'));
        complexion.classList.add('active');
        const tone = complexion.dataset.tone;
        if (window.onComplexionChange) window.onComplexionChange(tone);
    }

    // 16. Apply Profile Button
    const applyBtn = e.target.closest('#apply-profile-btn');
    if (applyBtn) {
        const h = parseFloat(document.getElementById('height-val')?.value || 170);
        const w = parseFloat(document.getElementById('weight-val')?.value || 65);
        if (typeof updateBody === 'function') {
            updateBody(h, w);
            applyBtn.innerText = "Applied!";
            setTimeout(() => {
                applyBtn.innerText = "Save Profile & Select";
                const advisorTab = document.querySelector('.tryon-tab[data-tab="advisor"]');
                if (advisorTab) advisorTab.click();
            }, 1000);
        }
        if (typeof onEngineResize === 'function') onEngineResize();
    }

    // 17. Mood Selection
    const moodItem = e.target.closest('.mood-item');
    if (moodItem) {
        document.querySelectorAll('.mood-item').forEach(m => m.classList.remove('active'));
        moodItem.classList.add('active');
    }

    // 18. Body Shape
    const shapeBtn = e.target.closest('.shape-btn');
    if (shapeBtn) {
        document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
        shapeBtn.classList.add('active');
        const shape = shapeBtn.innerText.toLowerCase();
        if (typeof updateBody === 'function') {
            const h = parseFloat(document.getElementById('height-val')?.value || 170);
            const w = shape === 'slim' ? 55 : (shape === 'athletic' ? 75 : 90);
            updateBody(h, w);
        }
    }
    // 19. Admin Dashboard
    if (e.target.closest('#admin-btn')) {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }
    if (e.target.closest('#admin-close-panel')) {
        const panel = document.getElementById('admin-panel');
        if (panel) {
            panel.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    // Capture & Apply Face Logic
    if (e.target.closest('#capture-face-btn')) {
        const video = document.getElementById('webcam-video');
        if (!video || video.style.display === 'none') return;

        // 1. Capture to Canvas
        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        
        // Match the mirror effect
        ctx.translate(captureCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        
        // 2. Apply to 3D Model
        if (window.applyFaceTexture) {
            window.applyFaceTexture(captureCanvas);
            
            // Visual feedback
            const btn = e.target.closest('#capture-face-btn');
            const originalColor = btn.style.color;
            btn.style.color = '#4cd964'; // Success green
            setTimeout(() => btn.style.color = originalColor, 1000);
        }

        // 3. Save to User Device (Request: "jo pic le jaey wo save ho")
      if (e.target.closest('#capture-face-btn')) {
        const video = document.getElementById('webcam-video');
        if (!video || video.style.display === 'none') return;

        const captureCanvas = document.createElement('canvas');
        captureCanvas.width = video.videoWidth;
        captureCanvas.height = video.videoHeight;
        const ctx = captureCanvas.getContext('2d');
        
        ctx.translate(captureCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
        
        if (window.applyFaceTexture) {
            window.applyFaceTexture(captureCanvas);
            
            const btn = e.target.closest('#capture-face-btn');
            const originalColor = btn.style.color;
            btn.style.color = '#4cd964'; 
            setTimeout(() => btn.style.color = originalColor, 1000);
            console.log("🛡️ Privacy Active: Face applied to model, download blocked.");
        } // 1. window.applyFaceTexture ki bracket
    } // 2. capture-face-btn ki bracket
}); // 3. Global Click Listener ki closing bracket (YE SABSE ZAROORI HAI)


// ── INITIALIZATION ────────────────────────────────────────────────────────


// ── INITIALIZATION ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    initCartElements();
    initReveals();
    updateCartUI();
    filterProducts();
    // init3DEngine is now handled by libaas_ai/engine.js


    // Mobile Menu Activation
    const mobBtn = document.querySelector('.mobile-menu-btn');
    const nLinks = document.querySelector('.nav-links');
    if (mobBtn && nLinks) {
        mobBtn.addEventListener('click', () => {
            nLinks.classList.toggle('active-mobile');
            nLinks.style.display = nLinks.classList.contains('active-mobile') ? 'flex' : 'none';
        });
    }

    // Filter Trigger
    const pRange = document.getElementById('price-range');
    if (pRange) pRange.addEventListener('input', filterProducts);
    document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', filterProducts);
    });

    const clrBtn = document.getElementById('clear-filters');
    if (clrBtn) {
        clrBtn.addEventListener('click', () => {
            document.querySelectorAll('.filter-group input[type="checkbox"]').forEach(c => c.checked = false);
            const r = document.getElementById('price-range');
            if (r) {
                r.value = 100000;
                if (priceMaxText) priceMaxText.innerText = '100,000';
            }
            filterProducts();
        });
    }

    // Payment Logic
    document.querySelectorAll('input[name="payment"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const b = document.getElementById('bank-details');
            if (b) b.style.display = e.target.value === 'bank' ? 'block' : 'none';
            document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('active'));
            e.target.closest('.payment-option').classList.add('active');
        });
    });

    // TASK: AI Stylist Sync (Advanced Multi-Criteria Selection)
    document.querySelectorAll('.shop-sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checkedCbs = Array.from(document.querySelectorAll('.shop-sidebar input[type="checkbox"]:checked'));
            
            if (checkedCbs.length > 0) {
                let bestMatch = null;
                let maxScore = 0;

                productCards.forEach(card => {
                    let score = 0;
                    checkedCbs.forEach(cb => {
                        const type = cb.dataset.filter;
                        const val = cb.value;
                        if (card.getAttribute(`data-${type}`) === val) {
                            // Weight Color and Occasion more heavily to prevent mismatched suggestions
                            score += (type === 'color' || type === 'occasion') ? 3 : 1;
                        }
                    });
                    
                    if (score > maxScore) {
                        maxScore = score;
                        bestMatch = card;
                    }
                });

                if (bestMatch && maxScore > 0) {
                    syncGlobalProduct(bestMatch);
                }
            } else {
                // Return to original 'Permanent' state (Woman in Green) when selection is cleared
                const previewImg = document.getElementById('stylist-main-img');
                const pName = document.getElementById('stylist-product-name');
                const pPrice = document.getElementById('stylist-product-price');
                if (previewImg) previewImg.src = "assets/pret.png";
                if (pName) pName.innerText = "Emerald Summer Gala";
                if (pPrice) pPrice.innerText = "PKR 45,000";
            }
        });
    });






    // AI Chatbot Messaging
    const chatBtn = document.getElementById('chat-btn-send');
    const chatInput = document.getElementById('chat-input');
    const chatMsgs = document.getElementById('chat-messages');
    if (chatBtn && chatInput && chatMsgs) {
        const appendMsg = (text, isAI = false) => {
            const div = document.createElement('div');
            div.className = isAI ? 'message ai' : 'message user';
            div.style.cssText = isAI 
                ? 'background: #111; color: white; padding: 15px; border-radius: 15px 15px 15px 0; max-width: 85%; align-self: flex-start; box-shadow: 0 5px 15px rgba(0,0,0,0.2); font-size: 14px; line-height: 1.5;'
                : 'background: var(--gold); color: white; padding: 12px 15px; border-radius: 15px 15px 0 15px; max-width: 85%; align-self: flex-end; box-shadow: 0 5px 15px rgba(0,0,0,0.1); font-size: 14px;';
            div.innerText = text;
            chatMsgs.appendChild(div);
            chatMsgs.scrollTop = chatMsgs.scrollHeight;
        };

        const handleSend = () => {
            const val = chatInput.value.trim();
            if (!val) return;
            appendMsg(val, false);
            chatInput.value = '';
            setTimeout(() => {
                appendMsg("That sounds exquisite! Our AI is curating the perfect collection for your request. Would you like to explore our latest Emerald or Gold ensembles?", true);
                if (window.lucide) lucide.createIcons();
            }, 1000);
        };

        chatBtn.addEventListener('click', handleSend);
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    }

    // Forms Handlers
    const cForm = document.getElementById('checkout-form');
    if (cForm) {
        cForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const b = document.querySelector('.place-order-btn');
            const t = b.innerText;
            b.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Finalizing...';
            setTimeout(() => {
                closeCheckoutModal();
                const s = document.getElementById('success-overlay');
                if (s) s.style.display = 'flex';
                cart = [];
                updateCartUI();
                b.innerText = t;
            }, 1500);
        });
    }

    const nForm = document.getElementById('newsletter-form');
    if (nForm) {
        nForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const b = nForm.querySelector('button');
            const t = b.innerText;
            b.innerText = 'Subscribing...';
            setTimeout(() => {
                nForm.querySelector('input').value = '';
                b.innerText = 'Done!';
                setTimeout(() => b.innerText = t, 3000);
            }, 1000);
        });
    }

    // Admin Form
    const adminForm = document.getElementById('admin-add-product-form');
    if (adminForm) {
        adminForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const b = adminForm.querySelector('button');
            b.innerText = 'Updating Catalog...';
            setTimeout(() => {
                b.innerText = 'Global Catalog Updated';
                setTimeout(() => {
                    b.innerText = 'Update Global Catalog';
                    const closeBtn = document.getElementById('admin-close-panel');
                    if (closeBtn) closeBtn.click();
                }, 2000);
            }, 1500);
        });
    }

    console.log("%cDesigned & Developed by Farhana Aamir", "color: #D4AF37; font-weight: bold; font-size: 16px;");
});

