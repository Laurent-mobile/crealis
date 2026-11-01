// ================================================
// CREALIS POS Z108 - Application de caisse
// Version: 22 Juin 2026
// ================================================

// Configuration
const API_URL = window.location.hostname.includes('localhost')
    ? 'http://192.168.11.106:5000/api'
    : `${window.location.origin}/api`;

// État global
let state = {
    token: null,
    merchant: null,
    cart: [],
    paymentMethod: 'cash',
    cashReceived: 0,
    allProducts: []
};

// Éléments DOM
const el = {};

// ================================================
// INITIALISATION
// ================================================
function init() {
    console.log('🚀 CREALIS POS - Initialisation');

    // Récupérer les éléments DOM
    el.loginScreen = document.getElementById('login-screen');
    el.cashierScreen = document.getElementById('cashier-screen');
    el.merchantCode = document.getElementById('merchant-code');
    el.posPin = document.getElementById('pos-pin');
    el.loginBtn = document.getElementById('login-btn');
    el.merchantName = document.getElementById('merchant-name');
    el.currentTime = document.getElementById('current-time');
    el.productsContainer = document.getElementById('products-container');
    el.cartItems = document.getElementById('cart-items');
    el.itemCount = document.getElementById('item-count');
    el.cartTotalAmount = document.getElementById('cart-total-amount');
    el.checkoutBtn = document.getElementById('checkout-btn');
    el.productSearch = document.getElementById('product-search');

    // Événements
    if (el.loginBtn) el.loginBtn.addEventListener('click', handleLogin);
    if (el.checkoutBtn) el.checkoutBtn.addEventListener('click', openPayment);
    if (el.productSearch) el.productSearch.addEventListener('input', filterProducts);

    // Horloge
    updateClock();
    setInterval(updateClock, 30000);

    // Créer le modal de paiement
    createPaymentModal();

    // Auto-login
    const savedToken = localStorage.getItem('pos_token');
    if (savedToken) state.token = savedToken;
}

function updateClock() {
    if (el.currentTime) {
        const now = new Date();
        el.currentTime.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
}

// ================================================
// LOGIN
// ================================================
async function handleLogin() {
    const code = el.merchantCode?.value?.trim() || '';
    const pin = el.posPin?.value?.trim() || '';

    if (!code || !pin) {
        alert('Veuillez entrer le code commerçant et le PIN');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/pos/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: code, pin: pin })
        });

        if (!response.ok) throw new Error('Identifiants invalides');

        const data = await response.json();
        state.token = data.token;
        state.merchant = data.merchant;
        localStorage.setItem('pos_token', data.token);

        if (el.merchantName) el.merchantName.textContent = data.merchant?.name || 'Commerçant';

        await loadProducts();

        el.loginScreen.classList.remove('active');
        el.cashierScreen.classList.add('active');

    } catch (error) {
        alert('Erreur: ' + error.message);
    }
}

// ================================================
// PRODUITS
// ================================================
async function loadProducts() {
    if (!state.token) return;

    try {
        const response = await fetch(`${API_URL}/pos/products`, {
            headers: { 'x-auth-token': state.token }
        });
        const products = await response.json();
        state.allProducts = products;
        displayProducts(products);
    } catch (error) {
        console.error('Erreur chargement produits:', error);
    }
}

function displayProducts(products) {
    if (!el.productsContainer) return;

    if (!products || products.length === 0) {
        el.productsContainer.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">Aucun produit disponible</div>';
        return;
    }

    let html = '';
    products.forEach(p => {
        const outOfStock = p.stock === 0;
        html += `
            <div class="product-card" style="border:1px solid #ddd; border-radius:10px; padding:12px; margin-bottom:8px; background:${outOfStock ? '#fee2e2' : 'white'};">
                <div style="font-weight:bold; font-size:15px; margin-bottom:5px;">${escapeHtml(p.name)}</div>
                <div style="font-size:20px; color:#2563eb; font-weight:bold; margin-bottom:5px;">${(p.price || 0).toLocaleString()} FCFA</div>
                <div style="font-size:11px; color:${outOfStock ? '#ef4444' : '#888'}; margin-bottom:8px;">
                    ${outOfStock ? '❌ Rupture de stock' : '📦 Stock: ' + p.stock + ' unités'}
                </div>
                <button onclick="addToCart('${p.id}','${escapeHtml(p.name).replace(/'/g, "\\'")}',${p.price},${p.stock})" 
                    ${outOfStock ? 'disabled' : ''}
                    style="width:100%; padding:10px; background:${outOfStock ? '#9ca3af' : '#10b981'}; color:white; border:none; border-radius:8px; font-weight:bold; cursor:${outOfStock ? 'not-allowed' : 'pointer'}; font-size:14px;">
                    ${outOfStock ? '❌ Indisponible' : '➕ Ajouter au panier'}
                </button>
            </div>`;
    });

    el.productsContainer.innerHTML = html;
}

function filterProducts() {
    const term = (el.productSearch?.value || '').toLowerCase().trim();
    if (!term) {
        displayProducts(state.allProducts);
        return;
    }
    const filtered = state.allProducts.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.barcode && p.barcode.includes(term))
    );
    displayProducts(filtered);
}

// ================================================
// PANIER
// ================================================
function addToCart(id, name, price, stock) {
    const existing = state.cart.find(i => i.id === id);

    if (existing) {
        if (existing.quantity >= stock) {
            alert('Stock insuffisant. Maximum: ' + stock);
            return;
        }
        existing.quantity++;
    } else {
        state.cart.push({ id, name, price, quantity: 1, stock });
    }

    updateCartDisplay();
}

function changeQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        state.cart = state.cart.filter(i => i.id !== id);
    }
    if (item.quantity > item.stock) {
        item.quantity = item.stock;
        alert('Stock maximum: ' + item.stock);
    }

    updateCartDisplay();
}

function removeFromCart(id) {
    state.cart = state.cart.filter(i => i.id !== id);
    updateCartDisplay();
}

function updateCartDisplay() {
    if (!el.cartItems) return;

    if (state.cart.length === 0) {
        el.cartItems.innerHTML = '<div style="text-align:center;color:#999;padding:20px;">🛒 Panier vide</div>';
        el.itemCount.textContent = '0';
        el.cartTotalAmount.textContent = '0 FCFA';
        return;
    }

    let html = '';
    let total = 0;
    let count = 0;

    state.cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        count += item.quantity;

        html += `
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px; background:#f0fdf4; border-radius:8px; margin-bottom:6px; font-size:13px;">
                <div style="flex:2;">
                    <div style="font-weight:bold;">${escapeHtml(item.name)}</div>
                    <div style="color:#666; font-size:11px;">${item.price.toLocaleString()} F × ${item.quantity}</div>
                </div>
                <div style="display:flex; align-items:center; gap:4px;">
                    <button onclick="changeQty('${item.id}',-1)" style="width:24px; height:24px; background:#ef4444; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">-</button>
                    <span style="min-width:20px; text-align:center; font-weight:bold;">${item.quantity}</span>
                    <button onclick="changeQty('${item.id}',1)" style="width:24px; height:24px; background:#10b981; color:white; border:none; border-radius:12px; font-weight:bold; cursor:pointer;">+</button>
                </div>
                <div style="min-width:60px; text-align:right; font-weight:bold; margin:0 5px;">${itemTotal.toLocaleString()} F</div>
                <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; font-size:16px; cursor:pointer;">🗑</button>
            </div>`;
    });

    el.cartItems.innerHTML = html;
    el.itemCount.textContent = count;
    el.cartTotalAmount.textContent = total.toLocaleString() + ' FCFA';
    updateCustomerDisplay();
}

function getCartTotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// ========== ÉCRAN CLIENT LCD ==========
function updateCustomerDisplay() {
    if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) return;

    try {
        const { ZcsDevice } = Capacitor.Plugins;
        if (!ZcsDevice) return;

        const total = getCartTotal();
        const count = state.cart.reduce((s, i) => s + i.quantity, 0);
        const now = new Date();

        // === EN-TÊTE FIXE ===
        let text = `===ENTETE=== ${state.merchant?.name || 'CREALIS'}\n`;
        text += `===TOTAL=== ${total.toLocaleString()} FCFA\n`;
        text += `===NB=== ${count} article(s)\n`;

        // === ARTICLES (limités à 6 visibles) ===
        const maxItems = 6;
        const items = state.cart.slice(0, maxItems);

        if (state.cart.length > maxItems) {
            text += `... et ${state.cart.length - maxItems} autre(s)\n`;
        }

        items.forEach(item => {
            const itemTotal = (item.price * item.quantity).toLocaleString();
            text += `${item.name.substring(0, 18)}|${item.quantity}|${itemTotal}\n`;
        });

        // === PIED DE PAGE FIXE ===
        text += `===HEURE=== ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

        ZcsDevice.showOnLcd({ text: text }).catch(() => { });
    } catch (e) { }
}

function clearCustomerDisplay() {
    if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) return;
    try {
        const { ZcsDevice } = Capacitor.Plugins;
        if (ZcsDevice) {
            ZcsDevice.showOnLcd({
                text: `===ENTETE=== ${state.merchant?.name || 'CREALIS'}\n===TOTAL=== 0 FCFA\n===NB=== 0 article\n===HEURE=== ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
            }).catch(() => { });
        }
    } catch (e) { }
}

// ================================================
// PAIEMENT
// ================================================
function createPaymentModal() {
    const html = `
        <div id="payment-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:999; align-items:center; justify-content:center;">
            <div style="background:white; border-radius:15px; width:85%; max-width:380px; overflow:hidden; max-height:90vh; overflow-y:auto;">
                <div style="background:#10b981; color:white; padding:15px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-weight:bold; font-size:16px;">💳 Paiement</span>
                    <button onclick="closePayment()" style="background:none; border:none; color:white; font-size:24px; cursor:pointer;">&times;</button>
                </div>
                <div style="padding:20px;">
                    <div style="text-align:center; margin-bottom:20px;">
                        <div style="font-size:14px; color:#666;">TOTAL À PAYER</div>
                        <div id="modal-total" style="font-size:32px; font-weight:bold; color:#10b981;">0 FCFA</div>
                    </div>
                    
                    <div style="margin-bottom:15px;">
                        <label style="font-weight:bold; display:block; margin-bottom:5px;">Mode de paiement</label>
                        <select id="payment-method" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:8px; font-size:14px;" onchange="toggleCashSection()">
                            <option value="cash">💵 Espèces</option>
                            <option value="card">💳 Carte bancaire</option>
                            <option value="mobile">📱 Mobile Money</option>
                        </select>
                    </div>
                    
                    <div id="cash-section">
                        <label style="font-weight:bold; display:block; margin-bottom:5px;">Montant reçu (FCFA)</label>
                        <input type="number" id="cash-amount" placeholder="0" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:8px; font-size:16px;" oninput="updateChange()">
                        <div id="change-display" style="margin-top:8px; font-size:14px; min-height:20px;"></div>
                    </div>
                    
                    <button onclick="confirmPayment()" style="width:100%; padding:15px; margin-top:15px; background:#10b981; color:white; border:none; border-radius:10px; font-weight:bold; font-size:16px; cursor:pointer;">
                        💰 CONFIRMER LE PAIEMENT
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function openPayment() {
    if (state.cart.length === 0) {
        alert('Panier vide');
        return;
    }

    const total = getCartTotal();
    document.getElementById('modal-total').textContent = total.toLocaleString() + ' FCFA';
    document.getElementById('cash-amount').value = '';
    document.getElementById('change-display').innerHTML = '';
    document.getElementById('payment-method').value = 'cash';
    document.getElementById('cash-section').style.display = 'block';
    document.getElementById('payment-modal').style.display = 'flex';
}

function closePayment() {
    document.getElementById('payment-modal').style.display = 'none';
}

function toggleCashSection() {
    const method = document.getElementById('payment-method').value;
    document.getElementById('cash-section').style.display = method === 'cash' ? 'block' : 'none';
}

function updateChange() {
    const total = getCartTotal();
    const received = parseFloat(document.getElementById('cash-amount')?.value) || 0;
    const change = received - total;

    if (received > 0) {
        document.getElementById('change-display').innerHTML = change >= 0
            ? `<span style="color:#10b981;">✅ Monnaie à rendre: <strong>${change.toLocaleString()} FCFA</strong></span>`
            : `<span style="color:#ef4444;">❌ Il manque: <strong>${Math.abs(change).toLocaleString()} FCFA</strong></span>`;
    } else {
        document.getElementById('change-display').innerHTML = '';
    }
}

async function confirmPayment() {
    const total = getCartTotal();
    const method = document.getElementById('payment-method')?.value || 'cash';
    const cashReceived = parseFloat(document.getElementById('cash-amount')?.value) || 0;

    if (method === 'cash' && cashReceived < total) {
        alert('Montant insuffisant');
        return;
    }

    // Sauvegarde du panier pour le reçu
    const cartSnapshot = [...state.cart];
    const change = cashReceived - total;
    let success = false;

    // Appel API
    if (state.token && state.merchant?.id) {
        try {
            const response = await fetch(`${API_URL}/transactions/purchase`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': state.token
                },
                body: JSON.stringify({
                    amount: total,
                    merchantId: state.merchant.id,
                    paymentMethod: method,
                    items: cartSnapshot.map(i => ({
                        productId: i.id,
                        quantity: i.quantity,
                        price: i.price
                    }))
                })
            });

            const result = await response.json();
            console.log('Réponse API:', result);

            if (response.ok && result.success !== false) {
                success = true;
            } else {
                alert('Erreur: ' + (result.message || 'Transaction échouée'));
            }
        } catch (e) {
            console.error('Erreur API:', e);
            alert('Erreur de connexion. Paiement en mode hors-ligne.');
            success = true;
        }
    } else {
        success = true;
    }

    if (success) {
        // Mettre à jour les stocks localement
        cartSnapshot.forEach(item => {
            const product = state.allProducts.find(p => p.id === item.id);
            if (product) {
                product.stock -= item.quantity;
                if (product.stock < 0) product.stock = 0;
            }
        });

        // Afficher reçu
        showReceipt(cartSnapshot, total, method, cashReceived, change);

        // Imprimer ticket
        await printTicket(cartSnapshot, total, method, cashReceived, change);

        // Vider le panier
        state.cart = [];
        updateCartDisplay();

        // Rafraîchir les produits
        displayProducts(state.allProducts);

        // Recharger depuis le serveur
        if (state.token) loadProducts();

        closePayment();
    }
}

// ================================================
// REÇU
// ================================================
function showReceipt(cart, total, method, cashReceived, change) {
    let receipt = '✅ PAIEMENT RÉUSSI\n\n';
    receipt += '--------------------------------\n';
    cart.forEach(item => {
        receipt += `${item.name} ×${item.quantity} = ${(item.price * item.quantity).toLocaleString()} F\n`;
    });
    receipt += '--------------------------------\n';
    receipt += `TOTAL: ${total.toLocaleString()} FCFA\n`;
    if (method === 'cash') {
        receipt += `Reçu: ${cashReceived.toLocaleString()} FCFA\n`;
        receipt += `Monnaie: ${change.toLocaleString()} FCFA\n`;
    } else {
        receipt += `Paiement: ${method}\n`;
    }
    receipt += '--------------------------------\n';
    receipt += 'Merci de votre visite !';

    alert(receipt);
}

// ================================================
// IMPRESSION
// ================================================
async function printTicket(cart, total, method, cashReceived, change) {
    // Fonction pour formater les nombres SANS espace insécable
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }

    let lines = [];

    lines.push("CREALIS MARKET");
    lines.push("================================");

    const merchantName = (state.merchant?.name || 'POS').toUpperCase();
    lines.push(merchantName);
    lines.push(new Date().toLocaleString('fr-FR'));
    lines.push("================================");

    cart.forEach(item => {
        lines.push(item.name.substring(0, 28));
        const priceStr = formatNumber(item.price);
        const totalStr = formatNumber(item.price * item.quantity);
        lines.push(item.quantity + "x" + priceStr + "=" + totalStr + "F");
    });

    lines.push("================================");
    lines.push("TOTAL: " + formatNumber(total) + " FCFA");

    if (method === 'cash') {
        lines.push("Especes: " + formatNumber(cashReceived));
        lines.push("Monnaie: " + formatNumber(change));
    } else if (method === 'card') {
        lines.push("Paiement: Carte bancaire");
    } else {
        lines.push("Paiement: " + method);
    }

    lines.push("================================");
    lines.push("Merci de votre visite !");
    lines.push(" ");

    const receipt = lines.join("\n");

    if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
        try {
            const { Z108Printer } = Capacitor.Plugins;
            if (Z108Printer) {
                await Z108Printer.init();
                await Z108Printer.printReceipt({ receipt: receipt });
            }
        } catch (e) {
            console.error('Erreur impression:', e.message);
        }
    }
}
// ================================================
// HELPERS
// ================================================
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === "'") return '&#39;';
        if (m === '"') return '&quot;';
        return m;
    });
}

// ================================================
// EXPORT GLOBAL
// ================================================
window.addToCart = addToCart;
window.changeQty = changeQty;
window.removeFromCart = removeFromCart;
window.openPayment = openPayment;
window.closePayment = closePayment;
window.confirmPayment = confirmPayment;
window.updateChange = updateChange;
window.toggleCashSection = toggleCashSection;

// ================================================
// DÉMARRAGE
// ================================================
document.addEventListener('DOMContentLoaded', init);
init();