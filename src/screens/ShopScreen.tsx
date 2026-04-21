import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, FlatList, Linking, ScrollView,
  StyleSheet, Text, TouchableOpacity, View, StatusBar, Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { fetchToursFromSanity, SanityTour } from '../services/sanity';
import { fetchProducts } from '../services/content';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

type Tab = 'tours' | 'shop';

const WONDERS_DOMAIN = 'https://wondersofrome.com';

export const ShopScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { addItem, totalItems } = useCart();
  const [tab, setTab] = useState<Tab>('tours');
  const [tours, setTours] = useState<SanityTour[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart sheet
  const cartSheetY = useRef(new Animated.Value(600)).current;
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, p] = await Promise.all([fetchToursFromSanity(), fetchProducts()]);
        setTours(t);
        setProducts(p);
      } catch (err) {
        console.error('Error fetching shop data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCart = () => {
    setCartOpen(true);
    Animated.spring(cartSheetY, { toValue: 0, useNativeDriver: true, tension: 60, friction: 12 }).start();
  };
  const closeCart = () => {
    Animated.timing(cartSheetY, { toValue: 600, duration: 250, useNativeDriver: true }).start(() => setCartOpen(false));
  };

  const handleBookTour = async (tour: SanityTour) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const domain = tour.site?.domain ?? WONDERS_DOMAIN;
    await Linking.openURL(`${domain}/tour/${tour.slug}`);
  };

  const handleAddToCart = (p: Product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(p);
  };

  const renderTour = ({ item }: { item: SanityTour }) => (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => handleBookTour(item)}
      style={styles.tourCard}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.tourImage} contentFit="cover" transition={500} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.95)']} style={styles.tourGradient} />
      {item.badge && (
        <View style={styles.tourBadge}>
          <Text style={styles.tourBadgeText}>{item.badge.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.tourOverlay}>
        <Text style={styles.tourCategory}>{item.tourType ?? 'GUIDED TOUR'}</Text>
        <Text style={styles.tourTitle}>{item.title}</Text>
        <View style={styles.tourMeta}>
          <View style={styles.metaPill}>
            <Ionicons name="star" size={10} color="#FFD700" />
            <Text style={styles.metaText}>{item.rating ?? '4.9'}</Text>
          </View>
          <Text style={styles.priceText}>From €{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        <Image source={{ uri: item.images?.[0] }} style={styles.productImage} contentFit="cover" transition={500} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>€{item.price.toFixed(2)}</Text>
        <TouchableOpacity 
          onPress={() => handleAddToCart(item)}
          style={styles.productAddBtn}
        >
          <Ionicons name="add" size={20} color={theme.colors.cream} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Fixed Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <LinearGradient
          colors={[theme.colors.background, 'transparent']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Shop</Text>
            <Text style={styles.headerSub}>Premium Experiences</Text>
          </View>
          {totalItems > 0 && (
            <TouchableOpacity onPress={openCart} style={styles.cartBtn}>
              <Ionicons name="bag-handle" size={24} color={theme.colors.cream} />
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.tabRow}>
          <TouchableOpacity 
            onPress={() => setTab('tours')}
            style={[styles.tabBtn, tab === 'tours' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'tours' && styles.tabTextActive]}>Tours</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setTab('shop')}
            style={[styles.tabBtn, tab === 'shop' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, tab === 'shop' && styles.tabTextActive]}>Souvenirs</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.center}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : tab === 'tours' ? (
          <View style={styles.list}>
            {tours.map(t => renderTour({ item: t }))}
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map(p => renderProduct({ item: p }))}
          </View>
        )}
      </ScrollView>

      {/* Cart Drawer */}
      {cartOpen && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity 
            style={styles.backdrop} 
            activeOpacity={1} 
            onPress={closeCart} 
          />
          <Animated.View style={[styles.cartDrawer, { transform: [{ translateY: cartSheetY }], paddingBottom: insets.bottom + 20 }]}>
            <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.drawerHandle} />
            <CartContent onClose={closeCart} />
          </Animated.View>
        </View>
      )}
    </View>
  );
};

const CartContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { items, totalPrice, clear, removeItem, setQty } = useCart();
  
  return (
    <View style={styles.cartContent}>
      <Text style={styles.cartTitle}>Your Bag</Text>
      <ScrollView style={styles.cartList}>
        {items.map(item => (
          <View key={item.product.id} style={styles.cartItem}>
            <Image source={{ uri: item.product.images[0] }} style={styles.cartItemImage} contentFit="cover" transition={500} />
            <View style={styles.cartItemInfo}>
              <Text style={styles.cartItemName}>{item.product.name}</Text>
              <Text style={styles.cartItemPrice}>€{(item.product.price * item.quantity).toFixed(2)}</Text>
            </View>
            <View style={styles.cartQty}>
              <TouchableOpacity onPress={() => setQty(item.product.id, item.quantity - 1)}>
                <Ionicons name="remove-circle-outline" size={24} color={theme.colors.textMuted} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity onPress={() => setQty(item.product.id, item.quantity + 1)}>
                <Ionicons name="add-circle-outline" size={24} color={theme.colors.brandLight} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.cartFooter}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>€{totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn}>
          <Text style={styles.checkoutText}>Checkout Now</Text>
          <Ionicons name="arrow-forward" size={18} color={theme.colors.cream} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: theme.colors.cream },
  headerSub: { fontSize: 12, fontWeight: '900', color: theme.colors.brandLight, textTransform: 'uppercase', letterSpacing: 1 },
  cartBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: theme.colors.cream, fontSize: 10, fontWeight: 'bold' },
  tabRow: { flexDirection: 'row', gap: 12 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, backgroundColor: theme.colors.surface },
  tabBtnActive: { backgroundColor: theme.colors.brand },
  tabText: { color: theme.colors.textMuted, fontWeight: 'bold' },
  tabTextActive: { color: theme.colors.cream },
  scrollContent: { paddingBottom: 120 },
  list: { paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  loadingText: { color: theme.colors.textMuted },
  // Tours
  tourCard: { height: 240, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: theme.colors.surface },
  tourImage: { ...StyleSheet.absoluteFillObject },
  tourGradient: { ...StyleSheet.absoluteFillObject },
  tourBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(212,175,55,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  tourBadgeText: { color: '#000', fontSize: 10, fontWeight: '900' },
  tourOverlay: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  tourCategory: { fontSize: 10, fontWeight: '900', color: theme.colors.brandLight, letterSpacing: 1, marginBottom: 4 },
  tourTitle: { fontSize: 24, fontWeight: 'bold', color: theme.colors.cream, marginBottom: 8 },
  tourMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  metaText: { color: theme.colors.cream, fontSize: 12, fontWeight: 'bold' },
  priceText: { color: theme.colors.cream, fontSize: 16, fontWeight: 'bold' },
  // Products
  productCard: { width: '50%', padding: 8 },
  productImageContainer: { aspectRatio: 1, borderRadius: 12, backgroundColor: theme.colors.surface, overflow: 'hidden', marginBottom: 8 },
  productImage: { width: '100%', height: '100%' },
  productInfo: { gap: 2 },
  productName: { color: theme.colors.cream, fontSize: 14, fontWeight: 'bold' },
  productPrice: { color: theme.colors.brandLight, fontSize: 13, fontWeight: '900' },
  productAddBtn: { position: 'absolute', right: 8, bottom: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' },
  // Cart Drawer
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  cartDrawer: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  drawerHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 12 },
  cartContent: { flex: 1, padding: 24 },
  cartTitle: { fontSize: 28, fontWeight: 'bold', color: theme.colors.cream, marginBottom: 20 },
  cartList: { flex: 1 },
  cartItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
  cartItemImage: { width: 64, height: 64, borderRadius: 8 },
  cartItemInfo: { flex: 1 },
  cartItemName: { color: theme.colors.cream, fontSize: 16, fontWeight: 'bold' },
  cartItemPrice: { color: theme.colors.brandLight, fontSize: 14, fontWeight: '900' },
  cartQty: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyText: { color: theme.colors.cream, fontSize: 16, fontWeight: 'bold' },
  cartFooter: { marginTop: 20, gap: 16 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { color: theme.colors.textMuted, fontSize: 16, fontWeight: 'bold' },
  totalValue: { color: theme.colors.cream, fontSize: 32, fontWeight: 'bold' },
  checkoutBtn: { height: 56, borderRadius: 28, backgroundColor: theme.colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  checkoutText: { color: theme.colors.cream, fontSize: 18, fontWeight: 'bold' },
});
