import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, FlatList, Image, Linking, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchProductsFromSanity, fetchToursFromSanity, SanityProduct, SanityTour } from '../services/sanity';
import { useCart } from '../context/CartContext';
import { Product } from '../types';

type Tab = 'tours' | 'shop';

const WONDERS_DOMAIN = 'https://wondersofrome.com';

const toProduct = (p: SanityProduct): Product => ({
  id: p.id,
  name: p.name,
  description: p.description ?? '',
  price: p.price,
  images: p.images ?? [],
  category: (p.category as any) ?? 'other',
  inStock: p.inStock,
  stockCount: p.stockCount,
  weight: p.weight,
  variants: p.variants,
});

export const ShopScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { addItem, totalItems } = useCart();
  const [tab, setTab] = useState<Tab>('tours');
  const [tours, setTours] = useState<SanityTour[]>([]);
  const [products, setProducts] = useState<SanityProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart sheet
  const cartSheetY = useRef(new Animated.Value(400)).current;
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [t, p] = await Promise.all([fetchToursFromSanity(), fetchProductsFromSanity()]);
        setTours(t);
        setProducts(p);
      } catch {
        // fallback: empty lists, user sees empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openCart = () => {
    setCartOpen(true);
    Animated.spring(cartSheetY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };
  const closeCart = () => {
    Animated.timing(cartSheetY, { toValue: 400, duration: 200, useNativeDriver: true }).start(() => setCartOpen(false));
  };

  const handleBookTour = async (tour: SanityTour) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const domain = tour.site?.domain ?? WONDERS_DOMAIN;
    await Linking.openURL(`${domain}/tour/${tour.slug}`);
  };

  const handleAddToCart = (p: SanityProduct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem(toProduct(p));
  };

  const renderTour = ({ item }: { item: SanityTour }) => (
    <View style={styles.tourCard}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.tourImage} resizeMode="cover" />
      ) : (
        <View style={[styles.tourImage, styles.tourImageFallback]} />
      )}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.tourGradient} />
      {item.badge && (
        <View style={styles.tourBadge}>
          <Text style={styles.tourBadgeText}>{item.badge}</Text>
        </View>
      )}
      <View style={styles.tourOverlay}>
        <Text style={styles.tourCategory}>{item.tourType ?? item.category ?? 'Tour'}</Text>
        <Text style={styles.tourTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.tourMeta}>
          {item.duration && (
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>{item.duration}</Text>
            </View>
          )}
          {item.rating && (
            <View style={styles.metaPill}>
              <Ionicons name="star" size={12} color="#FFD60A" />
              <Text style={styles.metaText}>{item.rating}</Text>
            </View>
          )}
          {item.groupSize && (
            <View style={styles.metaPill}>
              <Ionicons name="people-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.metaText}>{item.groupSize}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => handleBookTour(item)} activeOpacity={0.9} style={styles.bookBtn}>
          <Text style={styles.bookBtnText}>
            {item.price ? `Book · €${item.price}` : 'Book Now'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProduct = ({ item }: { item: SanityProduct }) => (
    <View style={styles.productCard}>
      <Image
        source={{ uri: item.images?.[0] ?? '' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.productDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.productBottom}>
          <Text style={styles.productPrice}>€{item.price.toFixed(2)}</Text>
          <TouchableOpacity
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.9}
            style={[styles.addBtn, !item.inStock && styles.addBtnDisabled]}
            disabled={!item.inStock}
          >
            <Ionicons name={item.inStock ? 'add' : 'close'} size={18} color={item.inStock ? '#fff' : 'rgba(255,255,255,0.4)'} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSub}>Tours & souvenirs</Text>
        </View>
        {totalItems > 0 && (
          <TouchableOpacity onPress={openCart} activeOpacity={0.9} style={styles.cartBtn}>
            <Ionicons name="bag-outline" size={22} color="#111" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setTab('tours')}
          activeOpacity={0.9}
          style={[styles.tabBtn, tab === 'tours' && styles.tabBtnActive]}
        >
          <Ionicons name="compass-outline" size={16} color={tab === 'tours' ? '#fff' : '#555'} />
          <Text style={[styles.tabText, tab === 'tours' && styles.tabTextActive]}>Tours</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('shop')}
          activeOpacity={0.9}
          style={[styles.tabBtn, tab === 'shop' && styles.tabBtnActive]}
        >
          <Ionicons name="bag-handle-outline" size={16} color={tab === 'shop' ? '#fff' : '#555'} />
          <Text style={[styles.tabText, tab === 'shop' && styles.tabTextActive]}>Souvenirs</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : tab === 'tours' ? (
        <FlatList
          data={tours}
          keyExtractor={t => t.id}
          renderItem={renderTour}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon="compass-outline" text="No tours yet — add them in Sanity" />}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<EmptyState icon="bag-handle-outline" text="No products yet — add them in Sanity" />}
        />
      )}

      {/* Cart sheet */}
      {cartOpen && <CartSheet translateY={cartSheetY} onClose={closeCart} />}
    </SafeAreaView>
  );
};

// ── Cart sheet ────────────────────────────────────────────────────────────────

const CartSheet: React.FC<{ translateY: Animated.Value; onClose: () => void }> = ({ translateY, onClose }) => {
  const { items, totalPrice, removeItem, setQty, clear } = useCart();
  const insets = useSafeAreaInsets();

  const handleCheckout = async () => {
    // Opens wondersofrome.com checkout with cart items encoded as query params
    // In a future iteration this can be replaced with a native Stripe payment sheet
    const params = items.map(i => `${i.product.id}:${i.quantity}`).join(',');
    const url = `${WONDERS_DOMAIN}/checkout?cart=${encodeURIComponent(params)}`;
    await Linking.openURL(url);
  };

  return (
    <Animated.View style={[styles.cartSheet, { transform: [{ translateY }], paddingBottom: insets.bottom + 16 }]}>
      <BlurView intensity={95} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.cartHandle} />
      <View style={styles.cartHeader}>
        <Text style={styles.cartTitle}>Your Bag</Text>
        <TouchableOpacity onPress={onClose} style={styles.cartClose}>
          <Ionicons name="close" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.cartItems} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <Text style={styles.cartEmpty}>Your bag is empty</Text>
        ) : (
          items.map(item => (
            <View key={`${item.product.id}::${item.variantId ?? ''}`} style={styles.cartItem}>
              <Image source={{ uri: item.product.images[0] }} style={styles.cartItemImage} />
              <View style={styles.cartItemInfo}>
                <Text style={styles.cartItemName} numberOfLines={1}>{item.product.name}</Text>
                {item.variantId && (
                  <Text style={styles.cartItemVariant}>
                    {item.product.variants?.find(v => v.id === item.variantId)?.label}
                  </Text>
                )}
                <Text style={styles.cartItemPrice}>€{(item.product.price * item.quantity).toFixed(2)}</Text>
              </View>
              <View style={styles.cartQtyRow}>
                <TouchableOpacity onPress={() => setQty(item.product.id, item.quantity - 1, item.variantId)} style={styles.qtyBtn}>
                  <Ionicons name="remove" size={16} color="#111" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity onPress={() => setQty(item.product.id, item.quantity + 1, item.variantId)} style={styles.qtyBtn}>
                  <Ionicons name="add" size={16} color="#111" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.cartFooter}>
          <View style={styles.cartTotal}>
            <Text style={styles.cartTotalLabel}>Total</Text>
            <Text style={styles.cartTotalValue}>€{totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity onPress={handleCheckout} activeOpacity={0.9} style={styles.checkoutBtn}>
            <Text style={styles.checkoutText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clear} activeOpacity={0.8} style={styles.clearCartBtn}>
            <Text style={styles.clearCartText}>Clear bag</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const EmptyState: React.FC<{ icon: keyof typeof Ionicons.glyphMap; text: string }> = ({ icon, text }) => (
  <View style={styles.emptyWrap}>
    <Ionicons name={icon} size={48} color="rgba(60,60,67,0.3)" />
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 34, fontWeight: '900', color: '#111' },
  headerSub: { fontSize: 13, fontWeight: '700', color: 'rgba(60,60,67,0.7)', marginTop: 2 },
  cartBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cartBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(118,118,128,0.12)', borderRadius: 14, padding: 3, gap: 3 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 11 },
  tabBtnActive: { backgroundColor: '#111' },
  tabText: { fontSize: 13, fontWeight: '800', color: '#555' },
  tabTextActive: { color: '#fff' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 15, fontWeight: '700', color: 'rgba(60,60,67,0.6)' },
  // Tours
  tourCard: { height: 280, borderRadius: 22, overflow: 'hidden', marginBottom: 16, backgroundColor: '#1C1C1E' },
  tourImage: { ...StyleSheet.absoluteFillObject },
  tourImageFallback: { backgroundColor: '#2C2C2E' },
  tourGradient: { ...StyleSheet.absoluteFillObject },
  tourBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: '#FFD60A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tourBadgeText: { fontSize: 11, fontWeight: '900', color: '#000' },
  tourOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, gap: 6 },
  tourCategory: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.8 },
  tourTitle: { fontSize: 22, fontWeight: '900', color: '#fff', lineHeight: 26 },
  tourMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  metaText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, height: 46, marginTop: 4 },
  bookBtnText: { fontSize: 15, fontWeight: '900', color: '#000' },
  // Products
  productRow: { gap: 12, marginBottom: 12 },
  productCard: { flex: 1, backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  productImage: { width: '100%', height: 140, backgroundColor: '#F2F2F7' },
  productInfo: { padding: 12, gap: 4 },
  productName: { fontSize: 14, fontWeight: '900', color: '#111' },
  productDesc: { fontSize: 12, fontWeight: '600', color: 'rgba(60,60,67,0.7)', lineHeight: 16 },
  productBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  productPrice: { fontSize: 16, fontWeight: '900', color: '#111' },
  addBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  addBtnDisabled: { backgroundColor: 'rgba(0,0,0,0.15)' },
  // Cart sheet
  cartSheet: { position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.9)' },
  cartHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.15)', marginTop: 10, marginBottom: 4 },
  cartHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  cartTitle: { fontSize: 20, fontWeight: '900', color: '#111' },
  cartClose: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  cartItems: { paddingHorizontal: 20, maxHeight: 300 },
  cartEmpty: { textAlign: 'center', paddingVertical: 32, fontSize: 15, fontWeight: '700', color: 'rgba(60,60,67,0.6)' },
  cartItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)' },
  cartItemImage: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F2F2F7' },
  cartItemInfo: { flex: 1, gap: 2 },
  cartItemName: { fontSize: 14, fontWeight: '800', color: '#111' },
  cartItemVariant: { fontSize: 12, fontWeight: '600', color: 'rgba(60,60,67,0.7)' },
  cartItemPrice: { fontSize: 14, fontWeight: '900', color: '#111' },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.08)', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 15, fontWeight: '900', color: '#111', minWidth: 20, textAlign: 'center' },
  cartFooter: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  cartTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartTotalLabel: { fontSize: 16, fontWeight: '700', color: 'rgba(60,60,67,0.8)' },
  cartTotalValue: { fontSize: 22, fontWeight: '900', color: '#111' },
  checkoutBtn: { height: 54, borderRadius: 18, backgroundColor: '#111', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  checkoutText: { fontSize: 17, fontWeight: '900', color: '#fff' },
  clearCartBtn: { alignItems: 'center', paddingVertical: 8 },
  clearCartText: { fontSize: 13, fontWeight: '700', color: 'rgba(60,60,67,0.6)' },
  // Empty state
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '700', color: 'rgba(60,60,67,0.6)', textAlign: 'center' },
});
