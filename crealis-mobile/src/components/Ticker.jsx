// crealis-mobile/src/components/Ticker.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Dimensions,
    Animated,
} from 'react-native';
import api from '../api/client';

const { width: screenWidth } = Dimensions.get('window');

export default function Ticker() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const scrollViewRef = useRef(null);
    const intervalRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Animation pour le défilement continu d'un seul message
    const marqueeAnim = useRef(new Animated.Value(screenWidth)).current;

    // Fonction pour charger les messages
    const loadMessages = async () => {
        try {
            const response = await api.get('/ticker/active');
            setMessages(response.data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Error fetching ticker messages:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
        const refreshInterval = setInterval(loadMessages, 30000);
        return () => {
            clearInterval(refreshInterval);
            stopAutoScroll();
            marqueeAnim.stopAnimation();
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            if (messages.length === 1) {
                startMarqueeAnimation();
            } else {
                startAutoScroll();
            }
        }
        return () => {
            stopAutoScroll();
            marqueeAnim.stopAnimation();
        };
    }, [messages]);

    const startMarqueeAnimation = () => {
        const textLength = messages[0].message.length;
        const textWidth = Math.min(textLength * 12, screenWidth * 2);
        const duration = textLength * 100;

        marqueeAnim.setValue(screenWidth);

        Animated.timing(marqueeAnim, {
            toValue: -textWidth,
            duration: duration,
            useNativeDriver: true,
            isInteraction: false,
        }).start(({ finished }) => {
            if (finished && messages.length === 1) {
                startMarqueeAnimation();
            }
        });
    };

    const startAutoScroll = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        if (messages.length <= 1) return;

        intervalRef.current = setInterval(() => {
            if (scrollViewRef.current) {
                let nextIndex = currentIndex + 1;
                if (nextIndex >= messages.length) {
                    nextIndex = 0;
                    scrollViewRef.current.scrollTo({
                        x: 0,
                        animated: false,
                    });
                    setCurrentIndex(0);
                } else {
                    scrollViewRef.current.scrollTo({
                        x: nextIndex * (screenWidth - 100),
                        animated: true,
                    });
                    setCurrentIndex(nextIndex);
                }
            }
        }, 4000);
    };

    const stopAutoScroll = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };

    const handlePress = (message) => {
        setSelectedMessage(message);
        setShowModal(true);
        stopAutoScroll();
        marqueeAnim.stopAnimation();
    };

    const closeModal = () => {
        setShowModal(false);
        if (messages.length === 1) {
            startMarqueeAnimation();
        } else {
            startAutoScroll();
        }
    };

    const getTypeStyle = (type) => {
        switch (type) {
            case 'promotion':
                return { bg: '#fee2e2', color: '#dc2626', icon: '🎉' };
            case 'info':
                return { bg: '#dbeafe', color: '#2563eb', icon: 'ℹ️' };
            case 'warning':
                return { bg: '#fed7aa', color: '#d97706', icon: '⚠️' };
            case 'update':
                return { bg: '#d1fae5', color: '#059669', icon: '🔄' };
            default:
                return { bg: '#f3e8ff', color: '#9333ea', icon: '📢' };
        }
    };

    if (loading) {
        return null;
    }

    if (messages.length === 0) {
        return null;
    }

    // Affichage pour un seul message (défilement continu)
    if (messages.length === 1) {
        const singleMessage = messages[0];
        return (
            <>
                <TouchableOpacity
                    style={styles.tickerContainer}
                    onPress={() => handlePress(singleMessage)}
                    activeOpacity={0.9}
                >
                    <View style={styles.tickerIcon}>
                        <Text style={styles.tickerIconText}>
                            {getTypeStyle(singleMessage.type).icon}
                        </Text>
                    </View>
                    <View style={styles.marqueeContainer}>
                        <Animated.View
                            style={[
                                styles.marqueeTextContainer,
                                { transform: [{ translateX: marqueeAnim }] }
                            ]}
                        >
                            <Text style={styles.tickerText} numberOfLines={1}>
                                {singleMessage.message}
                            </Text>
                        </Animated.View>
                    </View>
                    <View style={styles.tickerArrow}>
                        <Text style={styles.tickerArrowText}>›</Text>
                    </View>
                </TouchableOpacity>

                <Modal
                    visible={showModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={closeModal}
                >
                    <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
                        <View style={styles.modalContent}>
                            <View style={[
                                styles.modalHeader,
                                { backgroundColor: getTypeStyle(singleMessage.type).bg }
                            ]}>
                                <Text style={styles.modalIcon}>
                                    {getTypeStyle(singleMessage.type).icon}
                                </Text>
                                <Text style={[
                                    styles.modalType,
                                    { color: getTypeStyle(singleMessage.type).color }
                                ]}>
                                    {singleMessage.type === 'promotion' ? 'Promotion' :
                                        singleMessage.type === 'info' ? 'Information' :
                                            singleMessage.type === 'warning' ? 'Alerte' :
                                                singleMessage.type === 'update' ? 'Mise à jour' : 'Annonce'}
                                </Text>
                            </View>
                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalMessage}>{singleMessage.message}</Text>
                            </ScrollView>
                            <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                                <Text style={styles.modalCloseText}>Fermer</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>
            </>
        );
    }

    // Affichage pour plusieurs messages
    return (
        <>
            <TouchableOpacity
                style={styles.tickerContainer}
                onPress={() => handlePress(messages[currentIndex])}
                activeOpacity={0.9}
            >
                <View style={styles.tickerIcon}>
                    <Text style={styles.tickerIconText}>
                        {getTypeStyle(messages[currentIndex]?.type).icon}
                    </Text>
                </View>
                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    scrollEnabled={false}
                    style={styles.tickerScroll}
                >
                    {messages.map((msg) => (
                        <View key={msg.id} style={[styles.tickerItem, { width: screenWidth - 100 }]}>
                            <Text style={styles.tickerText} numberOfLines={1}>
                                {msg.message}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
                <View style={styles.tickerArrow}>
                    <Text style={styles.tickerArrowText}>›</Text>
                </View>
            </TouchableOpacity>

            <Modal
                visible={showModal}
                transparent={true}
                animationType="slide"
                onRequestClose={closeModal}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
                    <View style={styles.modalContent}>
                        {selectedMessage && (
                            <>
                                <View style={[
                                    styles.modalHeader,
                                    { backgroundColor: getTypeStyle(selectedMessage.type).bg }
                                ]}>
                                    <Text style={styles.modalIcon}>
                                        {getTypeStyle(selectedMessage.type).icon}
                                    </Text>
                                    <Text style={[
                                        styles.modalType,
                                        { color: getTypeStyle(selectedMessage.type).color }
                                    ]}>
                                        {selectedMessage.type === 'promotion' ? 'Promotion' :
                                            selectedMessage.type === 'info' ? 'Information' :
                                                selectedMessage.type === 'warning' ? 'Alerte' :
                                                    selectedMessage.type === 'update' ? 'Mise à jour' : 'Annonce'}
                                    </Text>
                                </View>
                                <ScrollView style={styles.modalBody}>
                                    <Text style={styles.modalMessage}>{selectedMessage.message}</Text>
                                </ScrollView>
                                <TouchableOpacity style={styles.modalCloseBtn} onPress={closeModal}>
                                    <Text style={styles.modalCloseText}>Fermer</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    tickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 5,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tickerIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    tickerIconText: {
        fontSize: 16,
    },
    tickerScroll: {
        flex: 1,
    },
    tickerItem: {
        paddingHorizontal: 5,
        justifyContent: 'center',
    },
    tickerText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    tickerArrow: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    tickerArrowText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    marqueeContainer: {
        flex: 1,
        overflow: 'hidden',
    },
    marqueeTextContainer: {
        flexDirection: 'row',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '85%',
        maxHeight: '70%',
        overflow: 'hidden',
    },
    modalHeader: {
        padding: 20,
        alignItems: 'center',
    },
    modalIcon: {
        fontSize: 40,
        marginBottom: 10,
    },
    modalType: {
        fontSize: 16,
        fontWeight: '600',
    },
    modalBody: {
        padding: 20,
    },
    modalMessage: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        textAlign: 'center',
    },
    modalCloseBtn: {
        backgroundColor: '#2563eb',
        padding: 15,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
