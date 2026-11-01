// Configuration
const API_URL = window.location.hostname.includes('localhost')
    ? 'http://192.168.11.106:5000/api'
    : `${window.location.origin}/api`;

// État global
let state = {
    token: null,
    merchant: null,
    deviceId: null,
    currentCustomer: null,
    isLoggedIn: false,
    currentCustomerId: null,
    cart: [],
    paymentMethod: 'cash',
    cashReceived: 0,
    allProducts: [],
    guestCustomer: {  // ← Ajoutez cette ligne
        id: 'guest',
        name: 'Client Visiteur',
        phoneNumber: '00000000',
        loyaltyPoints: 0
    }
};

// DOM Elements
const elements = {
    loginScreen: document.getElementById('login-screen'),
    cashierScreen: document.getElementById('cashier-screen'),
    merchantCode: document.getElementById('merchant-code'),
    posPin: document.getElementById('pos-pin'),
    loginBtn: document.getElementById('login-btn'),
    merchantName: document.getElementById('merchant-name'),
    merchantLocation: document.getElementById('merchant-location'),
    currentTime: document.getElementById('current-time'),
    scanNfcBtn: document.getElementById('scan-nfc-btn'),
    scanQrBtn: document.getElementById('scan-qr-btn'),
    manualEntryBtn: document.getElementById('manual-entry-btn'),
    customerInfoBar: document.getElementById('customer-info-bar'),
    customerName: document.getElementById('customer-name'),
    customerPoints: document.getElementById('customer-points'),
    clearCustomer: document.getElementById('clear-customer'),
    productsContainer: document.getElementById('products-container'),
    cartItems: document.getElementById('cart-items'),
    itemCount: document.getElementById('item-count'),
    cartTotalAmount: document.getElementById('cart-total-amount'),
    searchProductBtn: document.getElementById('search-product-btn'),
    checkoutBtn: document.getElementById('checkout-btn'),
    numericPad: document.getElementById('numeric-pad'),
    padInput: document.getElementById('pad-input'),
    padConfirm: document.getElementById('pad-confirm'),
    closePad: document.getElementById('close-pad'),
    qrModal: document.getElementById('qr-modal'),
    nfcModal: document.getElementById('nfc-modal'),
    toastContainer: document.getElementById('toast-container')
};

// Initialisation
function init() {
    attachEventListeners();
    startTimeUpdate();
    checkAutoLogin();
    createGuestCustomer();
    createPaymentModal();
    createTicketModal();
}

// Créer un client invité
function createGuestCustomer() {
    // Déjà défini dans state, cette fonction peut être vide ou supprimée
    if (!state.guestCustomer) {
        state.guestCustomer = {
            id: 'guest',
            name: 'Client Visiteur',
            phoneNumber: '00000000',
            loyaltyPoints: 0
        };
    }
}

// Créer le modal de paiement
function createPaymentModal() {
    const modalHTML = `
        <div id="payment-modal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header" style="background: #10b981;">
                    <span>💳 Paiement</span>
                    <button class="modal-close" onclick="closePaymentModal()">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 24px; font-weight: bold; color: #10b981;" id="payment-total">0 FCFA</div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Mode de paiement</label>
                        <div style="display: flex; gap: 10px;">
                            <button class="payment-method-btn" data-method="cash" style="flex: 1; padding: 12px; background: #f59e0b; color: white; border: none; border-radius: 10px; cursor: pointer;">💵 Espèces</button>
                            <button class="payment-method-btn" data-method="card" style="flex: 1; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 10px; cursor: pointer;">💳 Carte</button>
                            <button class="payment-method-btn" data-method="mobile" style="flex: 1; padding: 12px; background: #8b5cf6; color: white; border: none; border-radius: 10px; cursor: pointer;">📱 Mobile</button>
                        </div>
                    </div>
                    <div id="cash-payment-section" style="display: none;">
                        <label style="display: block; margin-bottom: 10px; font-weight: bold;">Montant reçu (FCFA)</label>
                        <input type="number" id="cash-amount" class="form-input" placeholder="0" style="width: 100%; padding: 12px; margin-bottom: 10px;">
                        <div id="change-amount" style="font-size: 14px; color: #666;"></div>
                    </div>
                    <button id="confirm-payment-btn" class="pos-btn primary" style="margin-top: 20px;">💰 CONFIRMER LE PAIEMENT</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    elements.paymentModal = document.getElementById('payment-modal');

    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', () => selectPaymentMethod(btn.dataset.method));
    });
    document.getElementById('confirm-payment-btn')?.addEventListener('click', confirmPayment);
}

// Créer le modal du ticket
function createTicketModal() {
    const modalHTML = `
        <div id="ticket-modal" class="modal" style="display: none;">
            <div class="modal-content" style="max-width: 350px;">
                <div class="modal-header" style="background: #1e293b;">
                    <span>🧾 Ticket de caisse</span>
                    <button class="modal-close" onclick="closeTicketModal()">&times;</button>
                </div>
                <div class="modal-body" id="ticket-content" style="padding: 20px; font-family: monospace; font-size: 12px;">
                </div>
                <div class="modal-footer" style="display: flex; gap: 10px; padding: 15px;">
                    <button onclick="printTicket()" class="pos-btn primary" style="flex: 1;">🖨️ Imprimer</button>
                    <button onclick="closeTicketModal()" class="pos-btn" style="flex: 1;">Fermer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    elements.ticketModal = document.getElementById('ticket-modal');
}

function selectPaymentMethod(method) {
    state.paymentMethod = method;
    const cashSection = document.getElementById('cash-payment-section');
    if (cashSection) {
        cashSection.style.display = method === 'cash' ? 'block' : 'none';
    }
}

function closePaymentModal() {
    if (elements.paymentModal) elements.paymentModal.style.display = 'none';
}

function closeTicketModal() {
    if (elements.ticketModal) elements.ticketModal.style.display = 'none';
}

function updateChangeDisplay() {
    const cashInput = document.getElementById('cash-amount');
    const changeDiv = document.getElementById('change-amount');
    if (cashInput && changeDiv) {
        const total = getCartTotal();
        const received = parseFloat(cashInput.value) || 0;
        const change = received - total;
        if (change >= 0) {
            changeDiv.innerHTML = `Monnaie à rendre: <strong style="color: #10b981;">${change.toLocaleString()} FCFA</strong>`;
        } else {
            changeDiv.innerHTML = `Manque: <strong style="color: #ef4444;">${Math.abs(change).toLocaleString()} FCFA</strong>`;
        }
    }
}

async function confirmPayment() {
    const total = getCartTotal();

    if (state.paymentMethod === 'cash') {
        const cashReceived = parseFloat(document.getElementById('cash-amount')?.value) || 0;
        if (cashReceived < total) {
            showToast(`Montant insuffisant. Il manque ${(total - cashReceived).toLocaleString()} FCFA`, 'error');
            return;
        }
        state.cashReceived = cashReceived;
    }

    await processPayment(total);
}

function getCartTotal() {
    return state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// Événements
function attachEventListeners() {
    // Vérifier que les éléments existent avant d'ajouter des listeners
    if (elements.loginBtn) elements.loginBtn.addEventListener('click', handleLogin);

    // Scanner events
    const scanBarcodeBtn = document.getElementById('scan-barcode-btn');
    const scanQrBtn = document.getElementById('scan-qr-btn');
    const toggleTorchBtn = document.getElementById('toggle-torch');
    const switchCameraBtn = document.getElementById('switch-camera');

    if (scanBarcodeBtn) scanBarcodeBtn.addEventListener('click', startBarcodeScanner);
    if (scanQrBtn) scanQrBtn.addEventListener('click', startQRScanner);
    if (toggleTorchBtn) toggleTorchBtn.addEventListener('click', toggleTorch);
    if (switchCameraBtn) switchCameraBtn.addEventListener('click', switchCamera);

    if (elements.manualEntryBtn) elements.manualEntryBtn.addEventListener('click', () => showManualEntry());
    if (elements.clearCustomer) elements.clearCustomer.addEventListener('click', clearCustomer);

    // Recherche de produits
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterProducts(e.target.value);
        });
    }

    if (elements.checkoutBtn) elements.checkoutBtn.addEventListener('click', () => openPaymentModal());
    if (elements.closePad) elements.closePad.addEventListener('click', () => hideNumericPad());

    if (elements.padConfirm) {
        elements.padConfirm.addEventListener('click', () => {
            const value = elements.padInput?.value || '';
            hideNumericPad();
            if (window.padCallback) {
                window.padCallback(value);
                window.padCallback = null;
            }
        });
    }

    document.querySelectorAll('.pad-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const value = e.target.dataset.value;
            if (value === 'clear') {
                if (elements.padInput) elements.padInput.value = '';
            } else {
                if (elements.padInput) elements.padInput.value += value;
            }
        });
    });

    document.addEventListener('input', (e) => {
        if (e.target.id === 'cash-amount') {
            updateChangeDisplay();
        }
    });

    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) modal.style.display = 'none';
            if (currentScanner) {
                currentScanner.stop();
                currentScanner = null;
            }
        });
    });
}


// Filtrer les produits
function filterProducts(searchTerm) {
    if (!searchTerm.trim()) {
        displayProducts(state.allProducts);
        return;
    }

    const filtered = state.allProducts.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchTerm))
    );
    displayProducts(filtered);
}

// Changer de caméra
async function switchCamera() {
    if (!currentScanner) return;

    const videoInputDevices = await currentScanner.listVideoInputDevices();
    if (videoInputDevices.length <= 1) {
        showToast('Une seule caméra disponible', 'info');
        return;
    }

    const currentIndex = videoInputDevices.findIndex(d => d.deviceId === currentCameraId);
    const nextIndex = (currentIndex + 1) % videoInputDevices.length;
    currentCameraId = videoInputDevices[nextIndex].deviceId;

    await currentScanner.stop();
    await currentScanner.decodeFromVideoDevice(currentCameraId, document.getElementById('scanner-video'), (result, err) => {
        // Callback
    });

    showToast('Caméra changée', 'success');
}

// Allumer/éteindre la lampe
async function toggleTorch() {
    if (!currentScanner) return;

    torchEnabled = !torchEnabled;
    const track = currentScanner.getVideoTrack();
    if (track && track.applyConstraints) {
        await track.applyConstraints({
            advanced: [{ torch: torchEnabled }]
        });
    }
    const btn = document.getElementById('toggle-torch');
    if (btn) {
        btn.textContent = torchEnabled ? '🔦 Lampe ON' : '🔦 Lampe OFF';
    }
}

function openPaymentModal() {
    if (state.cart.length === 0) {
        showToast('Panier vide', 'error');
        return;
    }

    const total = getCartTotal();
    const totalEl = document.getElementById('payment-total');
    if (totalEl) totalEl.textContent = `${total.toLocaleString()} FCFA`;

    const cashInput = document.getElementById('cash-amount');
    if (cashInput) cashInput.value = '';
    selectPaymentMethod('cash');

    if (elements.paymentModal) elements.paymentModal.style.display = 'flex';
}

async function processPayment(total) {
    const customerId = (state.currentCustomer?.id === 'guest' || !state.currentCustomer) ? null : state.currentCustomerId;

    if (!state.merchant || !state.merchant.id) {
        console.error('Merchant not found:', state.merchant);
        showToast('Erreur: Commerçant non identifié', 'error');
        return;
    }

    try {
        for (const item of state.cart) {
            await updateProductStock(item.id, item.quantity);
        }

        const response = await fetch(`${API_URL}/transactions/purchase`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': state.token
            },
            body: JSON.stringify({
                amount: total,
                merchantId: state.merchant.id,
                customerId: customerId,
                description: `Achat en magasin (${state.cart.length} articles)`,
                paymentMethod: state.paymentMethod,
                items: state.cart.map(item => ({
                    productId: item.id,
                    quantity: item.quantity,
                    price: item.price
                }))
            })
        });

        const result = await response.json();

        if (result.success || response.ok) {
            await checkStockAlerts();
            showTicket(result.transaction || { amount: total });

            state.cart = [];
            displayProducts(state.allProducts);
            updateCartSummary();

            closePaymentModal();
            showToast(`✅ Vente de ${total.toLocaleString()} FCFA effectuée`, 'success');

            if (state.currentCustomer && state.currentCustomer.id !== 'guest') {
                const pointsEarned = Math.floor(total / 100);
                showToast(`⭐ +${pointsEarned} points de fidélité`, 'success');
            }
        } else {
            showToast(result.message || 'Erreur lors du paiement', 'error');
        }
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Erreur lors du traitement', 'error');
    }
}

async function updateProductStock(productId, quantity) {
    try {
        await fetch(`${API_URL}/products/${productId}/stock`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': state.token
            },
            body: JSON.stringify({
                quantity: quantity,
                operation: 'remove',
                reason: 'Vente en magasin'
            })
        });
    } catch (error) {
        console.error('Stock update error:', error);
    }
}

async function checkStockAlerts() {
    try {
        const response = await fetch(`${API_URL}/products/alerts/low-stock`, {
            headers: { 'x-auth-token': state.token }
        });
        const alerts = await response.json();

        if (alerts && alerts.length > 0) {
            const outOfStock = alerts.filter(a => a.severity === 'critical');
            const lowStockProducts = alerts.filter(a => a.severity === 'warning');

            if (outOfStock.length > 0) {
                showToast(`⚠️ Rupture: ${outOfStock.map(p => p.name).join(', ')}`, 'warning');
            } else if (lowStockProducts.length > 0) {
                showToast(`⚠️ Stock faible: ${lowStockProducts.map(p => p.name).join(', ')}`, 'warning');
            }
        }
    } catch (error) {
        console.error('Stock alerts error:', error);
    }
}

// Variables pour le scanner
let currentScanner = null;
let currentCameraId = null;
let torchEnabled = false;

// Générer un numéro de ticket unique
function generateTicketNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return `TKT-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

// Scanner de code-barres
async function startBarcodeScanner() {
    const modal = document.getElementById('scanner-modal');
    const video = document.getElementById('scanner-video');
    const resultDiv = document.getElementById('scanner-result');

    if (!modal || !video) return;

    modal.style.display = 'flex';
    resultDiv.innerHTML = '🔍 En attente de scan...';

    if (currentScanner) {
        await currentScanner.stop();
    }

    try {
        const codeReader = new ZXing.BrowserMultiFormatReader();
        currentScanner = codeReader;

        const videoInputDevices = await codeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
            resultDiv.innerHTML = '❌ Aucune caméra trouvée';
            return;
        }

        // Utiliser la caméra arrière si disponible
        const backCamera = videoInputDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environ')
        );

        currentCameraId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

        await codeReader.decodeFromVideoDevice(currentCameraId, video, (result, err) => {
            if (result) {
                const code = result.getText();
                resultDiv.innerHTML = `✅ Scanné: ${code}`;
                processScannedCode(code);
                setTimeout(() => {
                    closeScannerModal();
                }, 1500);
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
            }
        });

    } catch (error) {
        console.error('Scanner error:', error);
        resultDiv.innerHTML = '❌ Erreur d\'accès à la caméra';
    }
}

// Scanner QR Code
async function startQRScanner() {
    const modal = document.getElementById('scanner-modal');
    const video = document.getElementById('scanner-video');
    const resultDiv = document.getElementById('scanner-result');

    if (!modal || !video) return;

    modal.style.display = 'flex';
    resultDiv.innerHTML = '🔍 Scannez un QR Code...';

    if (currentScanner) {
        await currentScanner.stop();
    }

    try {
        const codeReader = new ZXing.BrowserQRCodeReader();
        currentScanner = codeReader;

        const videoInputDevices = await codeReader.listVideoInputDevices();

        if (videoInputDevices.length === 0) {
            resultDiv.innerHTML = '❌ Aucune caméra trouvée';
            return;
        }

        const backCamera = videoInputDevices.find(device =>
            device.label.toLowerCase().includes('back') ||
            device.label.toLowerCase().includes('environ')
        );

        currentCameraId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

        await codeReader.decodeFromVideoDevice(currentCameraId, video, (result, err) => {
            if (result) {
                const qrData = result.getText();
                resultDiv.innerHTML = `✅ QR scanné: ${qrData.substring(0, 30)}...`;
                processScannedQRCode(qrData);
                setTimeout(() => {
                    closeScannerModal();
                }, 1500);
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
            }
        });

    } catch (error) {
        console.error('QR Scanner error:', error);
        resultDiv.innerHTML = '❌ Erreur d\'accès à la caméra';
    }
}

function closeScannerModal() {
    const modal = document.getElementById('scanner-modal');
    if (modal) modal.style.display = 'none';
    if (currentScanner) {
        currentScanner.stop();
        currentScanner = null;
    }
}

function processScannedCode(code) {
    // Chercher le produit par code-barres
    const product = state.allProducts?.find(p => p.barcode === code);

    if (product) {
        addToCart(product);
        showToast(`${product.name} ajouté au panier`, 'success');
    } else {
        // Si code-barres non trouvé, demander le prix
        showNumericPad('Code non reconnu. Prix?', (price) => {
            if (price && parseFloat(price) > 0) {
                const manualProduct = {
                    id: `manual_${Date.now()}`,
                    name: `Article ${code}`,
                    price: parseFloat(price),
                    stock: 999,
                    barcode: code
                };
                addToCart(manualProduct);
            }
        });
    }
}

function processScannedQRCode(qrData) {
    try {
        const data = JSON.parse(qrData);

        if (data.customerId) {
            // QR Code client
            fetchCustomerById(data.customerId);
        } else if (data.productId) {
            // QR Code produit
            const product = state.allProducts?.find(p => p.id === data.productId);
            if (product) {
                addToCart(product);
            }
        } else if (data.amount && data.merchantId) {
            // QR Code paiement
            showToast(`QR de paiement détecté: ${data.amount} FCFA`, 'info');
        } else {
            showToast('QR Code non reconnu', 'error');
        }
    } catch (e) {
        // Si c'est un simple texte
        if (qrData.startsWith('CUST_')) {
            fetchCustomerById(qrData);
        } else if (qrData.length > 5 && qrData.length < 20) {
            // Probablement un code produit
            const product = state.allProducts?.find(p => p.barcode === qrData);
            if (product) {
                addToCart(product);
            }
        } else {
            showToast('QR Code invalide', 'error');
        }
    }
}

function showTicket(transaction) {
    const total = transaction.amount || getCartTotal();
    const change = state.paymentMethod === 'cash' ? state.cashReceived - total : 0;
    const customerName = state.currentCustomer?.name || 'Client Visiteur';
    const pointsEarned = state.currentCustomer?.id !== 'guest' ? Math.floor(total / 100) : 0;
    const ticketNumber = generateTicketNumber();

    const ticketHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="font-size: 16px; font-weight: bold;">🏪 CREALIS MARKET</div>
            <div style="font-size: 10px;">${state.merchant?.name || 'Point de vente'}</div>
            <div style="font-size: 10px;">${new Date().toLocaleString()}</div>
            <div style="margin: 8px 0;">
                <div class="ticket-number">🎫 ${ticketNumber}</div>
            </div>
            <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        </div>
        <div>
            ${state.cart.map(item => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toLocaleString()} FCFA</span>
                </div>
                ${item.barcode ? `<div style="font-size: 8px; color: #999; margin-top: -3px; margin-bottom: 5px;">Code: ${item.barcode}</div>` : ''}
            `).join('')}
        </div>
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>TOTAL</span>
            <span>${total.toLocaleString()} FCFA</span>
        </div>
        ${state.paymentMethod === 'cash' ? `
        <div style="display: flex; justify-content: space-between;">
            <span>Espèces reçues</span>
            <span>${state.cashReceived.toLocaleString()} FCFA</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
            <span>Monnaie rendue</span>
            <span>${change.toLocaleString()} FCFA</span>
        </div>
        ` : `
        <div style="display: flex; justify-content: space-between;">
            <span>Mode de paiement</span>
            <span>${state.paymentMethod === 'card' ? 'Carte bancaire' : 'Mobile Money'}</span>
        </div>
        `}
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        <div style="display: flex; justify-content: space-between;">
            <span>Client</span>
            <span>${customerName}</span>
        </div>
        ${pointsEarned > 0 ? `
        <div style="display: flex; justify-content: space-between; color: #10b981;">
            <span>⭐ Points gagnés</span>
            <span>+${pointsEarned} pts</span>
        </div>
        ` : ''}
        <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
        <div style="text-align: center; font-size: 10px;">
            Merci de votre visite !<br>
            À bientôt chez CREALIS
        </div>
    `;

    const ticketContent = document.getElementById('ticket-content');
    if (ticketContent) ticketContent.innerHTML = ticketHTML;
    if (elements.ticketModal) elements.ticketModal.style.display = 'flex';
}

function printTicket() {
    const ticketContent = document.getElementById('ticket-content');
    if (!ticketContent) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Ticket CREALIS</title>
            <style>
                body { font-family: monospace; font-size: 12px; padding: 20px; }
                .ticket { max-width: 300px; margin: 0 auto; }
            </style>
        </head>
        <body>
            <div class="ticket">${ticketContent.innerHTML}</div>
            <script>window.print();setTimeout(function(){window.close();}, 1000);<\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

async function loadProducts() {
    if (!state.token) return [];

    try {
        const response = await fetch(`${API_URL}/pos/products`, {
            headers: { 'x-auth-token': state.token }
        });

        const products = await response.json();
        console.log('Produits chargés:', products.length);

        state.allProducts = products;
        displayProducts(products);
        checkInitialStockAlerts(products);

        return products;
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

function checkInitialStockAlerts(products) {
    const lowStock = products.filter(p => p.stock <= (p.minStockAlert || 10) && p.stock > 0);
    const outOfStock = products.filter(p => p.stock === 0);

    if (outOfStock.length > 0) {
        showToast(`⚠️ ${outOfStock.length} produit(s) en rupture`, 'warning');
    } else if (lowStock.length > 0) {
        showToast(`⚠️ ${lowStock.length} produit(s) en stock faible`, 'warning');
    }
}

// Affichage des produits disponibles (toujours visible)
function displayProducts(products) {
    const container = elements.productsContainer;
    if (!container) return;

    if (!products || products.length === 0) {
        container.innerHTML = '<div class="empty-cart">Aucun produit disponible</div>';
        return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 15px;">';
    products.forEach(product => {
        const isOutOfStock = product.stock === 0;
        html += `
            <div class="product-card" style="border: 1px solid #e0e0e0; border-radius: 12px; padding: 15px; background: ${isOutOfStock ? '#fee2e2' : 'white'}; transition: all 0.2s;">
                <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">${escapeHtml(product.name)}</div>
                <div style="font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 8px;">${(product.price || 0).toLocaleString()} FCFA</div>
                <div style="font-size: 12px; color: ${isOutOfStock ? '#ef4444' : '#666'}; margin-bottom: 12px;">
                    ${isOutOfStock ? '❌ Rupture de stock' : `📦 Stock: ${product.stock} unités`}
                </div>
                <button class="add-to-cart-btn" 
                    data-id="${product.id}" 
                    data-name="${escapeHtml(product.name)}" 
                    data-price="${product.price}"
                    data-stock="${product.stock}"
                    ${isOutOfStock ? 'disabled' : ''}
                    style="width: 100%; padding: 10px; background: ${isOutOfStock ? '#9ca3af' : '#10b981'}; color: white; border: none; border-radius: 8px; cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'}; font-weight: bold;">
                    ${isOutOfStock ? '❌ Indisponible' : '➕ Ajouter au panier'}
                </button>
            </div>
        `;
    });
    html += '</div>';

    container.innerHTML = html;

    document.querySelectorAll('.add-to-cart-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            const price = parseFloat(btn.dataset.price);
            const stock = parseInt(btn.dataset.stock);
            addToCart({ id, name, price, stock });
        });
    });
}

// Ajouter au panier
function addToCart(product) {
    const existingItem = state.cart.find(item => item.id === product.id);

    if (existingItem) {
        if (product.stock && existingItem.quantity + 1 > product.stock) {
            showToast(`Stock insuffisant pour ${product.name}. Maximum: ${product.stock}`, 'error');
            return;
        }
        existingItem.quantity++;
    } else {
        if (product.stock && 1 > product.stock) {
            showToast(`Stock insuffisant pour ${product.name}`, 'error');
            return;
        }
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock
        });
    }

    updateCartSummary();
    showToast(`${product.name} ajouté au panier`, 'success');
}

// Mettre à jour le résumé du panier (affiché séparément)
function updateCartSummary() {
    const cartContainer = elements.cartItems;
    const itemCountSpan = elements.itemCount;
    const totalSpan = elements.cartTotalAmount;

    if (!cartContainer) return;

    if (state.cart.length === 0) {
        cartContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">🛒 Panier vide</div>';
        if (itemCountSpan) itemCountSpan.textContent = '0';
        if (totalSpan) totalSpan.textContent = '0 FCFA';
        return;
    }

    let html = '';
    let total = 0;
    let itemCount = 0;

    state.cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        itemCount += item.quantity;

        html += `
            <div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f0fdf4; border-radius: 8px; margin-bottom: 8px;">
                <div style="flex: 2;">
                    <div style="font-weight: bold;">${escapeHtml(item.name)}</div>
                    <div style="font-size: 11px; color: #666;">${item.price.toLocaleString()} FCFA</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="qty-btn" data-action="decr" data-id="${item.id}" style="width: 28px; height: 28px; background: #ef4444; color: white; border: none; border-radius: 14px; cursor: pointer;">-</button>
                    <span style="min-width: 30px; text-align: center;">${item.quantity}</span>
                    <button class="qty-btn" data-action="incr" data-id="${item.id}" style="width: 28px; height: 28px; background: #10b981; color: white; border: none; border-radius: 14px; cursor: pointer;">+</button>
                </div>
                <div style="min-width: 80px; text-align: right; font-weight: bold;">${itemTotal.toLocaleString()} FCFA</div>
                <button class="remove-item" data-action="remove" data-id="${item.id}" style="background: none; border: none; font-size: 18px; cursor: pointer; margin-left: 8px;">🗑️</button>
            </div>
        `;
    });

    cartContainer.innerHTML = html;
    if (itemCountSpan) itemCountSpan.textContent = itemCount;
    if (totalSpan) totalSpan.textContent = `${total.toLocaleString()} FCFA`;

    document.querySelectorAll('.qty-btn, .remove-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = btn.dataset.action;
            const productId = btn.dataset.id;
            const item = state.cart.find(i => i.id === productId);

            if (item) {
                if (action === 'incr') {
                    if (item.stock && item.quantity + 1 > item.stock) {
                        showToast(`Stock maximum atteint pour ${item.name}`, 'error');
                        return;
                    }
                    item.quantity++;
                } else if (action === 'decr') {
                    item.quantity--;
                    if (item.quantity <= 0) {
                        state.cart = state.cart.filter(i => i.id !== productId);
                    }
                } else if (action === 'remove') {
                    state.cart = state.cart.filter(i => i.id !== productId);
                }
                updateCartSummary();
            }
        });
    });
}

async function handleLogin() {
    const merchantCode = elements.merchantCode?.value?.trim() || '';
    const pin = elements.posPin?.value?.trim() || '';

    if (!merchantCode || !pin) {
        showToast('Veuillez entrer le code commerçant et le PIN', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/pos/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: merchantCode, pin: pin })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Identifiants invalides');
        }

        const data = await response.json();

        console.log('Réponse du login:', data);

        state.token = data.token;
        state.merchant = data.merchant;
        state.deviceId = merchantCode;
        state.isLoggedIn = true;

        const merchantName = data.merchant?.name || data.merchant?.businessName || 'Commerçant';
        const merchantCity = data.merchant?.city || '';

        if (elements.merchantName) elements.merchantName.textContent = merchantName;
        if (elements.merchantLocation) elements.merchantLocation.textContent = merchantCity;

        // Utiliser setCurrentCustomer avec le client invité
        setCurrentCustomer(state.guestCustomer);

        await loadProducts();

        if (elements.loginScreen) elements.loginScreen.classList.remove('active');
        if (elements.cashierScreen) elements.cashierScreen.classList.add('active');

        showToast(`Connecté en tant que ${merchantName}`, 'success');
        startSync();

    } catch (error) {
        console.error('Login error:', error);
        showToast(error.message || 'Échec de connexion', 'error');
    }
}

function showManualEntry() {
    showNumericPad('Saisir le numéro client', async (phone) => {
        if (!phone || phone.length < 9) {
            showToast('Numéro invalide', 'error');
            return;
        }
        showToast(`Client identifié: ${phone}`, 'success');
    });
}

function showProductSearch() {
    showNumericPad('Code barre', async (barcode) => {
        const product = state.allProducts?.find(p => p.barcode === barcode);
        if (product) {
            addToCart(product);
        } else {
            showToast('Produit non trouvé', 'error');
        }
    });
}

function setCurrentCustomer(customer) {
    if (!customer) {
        customer = state.guestCustomer;
    }

    state.currentCustomer = customer;
    state.currentCustomerId = customer.id;

    if (elements.customerInfoBar) elements.customerInfoBar.style.display = 'flex';
    if (elements.customerName) {
        elements.customerName.textContent = customer.name || customer.firstName ?
            `${customer.firstName || ''} ${customer.lastName || ''}`.trim() :
            customer.phoneNumber || 'Client Visiteur';
    }
    if (elements.customerPoints) {
        if (customer.id !== 'guest' && customer.loyaltyPoints !== undefined) {
            elements.customerPoints.textContent = `${customer.loyaltyPoints} pts`;
        } else {
            elements.customerPoints.textContent = `Invité`;
        }
    }
}

function clearCustomer() {
    setCurrentCustomer(state.guestCustomer);
    showToast('Client invité', 'info');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function (m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showNumericPad(title, callback) {
    const titleEl = document.getElementById('pad-title');
    if (titleEl) titleEl.textContent = title;
    if (elements.padInput) elements.padInput.value = '';
    if (elements.numericPad) elements.numericPad.style.display = 'block';
    window.padCallback = callback;
}

function hideNumericPad() {
    if (elements.numericPad) elements.numericPad.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 10px;
        text-align: center;
        animation: slideUp 0.3s ease;
        z-index: 1000;
    `;
    if (elements.toastContainer) elements.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function startTimeUpdate() {
    setInterval(() => {
        const now = new Date();
        if (elements.currentTime) {
            elements.currentTime.textContent = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        }
    }, 1000);
}

function startSync() {
    setInterval(async () => {
        try {
            await fetch(`${API_URL}/pos/${state.deviceId}/sync`, {
                method: 'POST',
                headers: { 'x-auth-token': state.token }
            });
            console.log('Synchronisation OK');
        } catch (error) {
            console.error('Sync error:', error);
        }
    }, 5 * 60 * 1000);
}

function checkAutoLogin() {
    const savedToken = localStorage.getItem('pos_token');
    if (savedToken) {
        state.token = savedToken;
    }
}

// Exporter les fonctions globales
window.closePaymentModal = closePaymentModal;
window.closeTicketModal = closeTicketModal;
window.printTicket = printTicket;

// Démarrer
init();
