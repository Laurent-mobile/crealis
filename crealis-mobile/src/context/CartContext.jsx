//crealis-mobile/src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

// Stockage en mémoire (fonctionne sur web et mobile)
let memoryCart = [];

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [cartTotal, setCartTotal] = useState(0);
    const [cartCount, setCartCount] = useState(0);

    // Charger le panier au démarrage
    useEffect(() => {
        loadCart();
    }, []);

    // Mettre à jour les totaux
    useEffect(() => {
        const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        setCartTotal(total);
        setCartCount(count);
        saveCart();
    }, [cartItems]);

    const loadCart = () => {
        try {
            if (Platform.OS === 'web') {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    setCartItems(JSON.parse(savedCart));
                }
            } else {
                if (memoryCart && memoryCart.length > 0) {
                    setCartItems(memoryCart);
                }
            }
        } catch (error) {
            console.error('Error loading cart:', error);
        }
    };

    const saveCart = () => {
        try {
            if (Platform.OS === 'web') {
                localStorage.setItem('cart', JSON.stringify(cartItems));
            } else {
                memoryCart = [...cartItems];
            }
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    };

    const addToCart = (product, merchant, quantity = 1) => {
        setCartItems(prevItems => {
            const existingItem = prevItems.find(
                item => item.productId === product.id && item.merchantId === merchant.id
            );

            if (existingItem) {
                return prevItems.map(item =>
                    item.productId === product.id && item.merchantId === merchant.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prevItems, {
                    id: `${merchant.id}_${product.id}`,
                    productId: product.id,
                    productName: product.name,
                    productPrice: product.price,
                    productImage: product.image_url,
                    merchantId: merchant.id,
                    merchantName: merchant.name,
                    quantity: quantity,
                    price: product.price
                }];
            }
        });
    };

    const removeFromCart = (itemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const updateQuantity = (itemId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(itemId);
            return;
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity: quantity } : item
            )
        );
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const getCartItemsByMerchant = () => {
        const grouped = {};
        cartItems.forEach(item => {
            if (!grouped[item.merchantId]) {
                grouped[item.merchantId] = {
                    merchantId: item.merchantId,
                    merchantName: item.merchantName,
                    items: [],
                    total: 0
                };
            }
            grouped[item.merchantId].items.push(item);
            grouped[item.merchantId].total += item.price * item.quantity;
        });
        return Object.values(grouped);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            cartTotal,
            cartCount,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartItemsByMerchant
        }}>
            {children}
        </CartContext.Provider>
    );
};
