import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import {
  useMyListings,
  useMyDeals,
  useAcceptDeal,
  useRejectDeal,
  useCompleteDeal,
  useCancelDeal,
} from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import { Listing, Deal } from '../types';

type Tab = 'listings' | 'deals';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9800',
  ACTIVE: '#4CAF50',
  ACCEPTED: '#4CAF50',
  SOLD: '#2196F3',
  COMPLETED: '#4CAF50',
  CANCELLED: '#999',
  REJECTED: '#F44336',
};

export default function MyActivityScreen() {
  const [tab, setTab] = useState<Tab>('listings');
  const { user } = useAuthStore();
  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const { data: deals, isLoading: dealsLoading } = useMyDeals();
  const acceptDeal = useAcceptDeal();
  const rejectDeal = useRejectDeal();
  const completeDeal = useCompleteDeal();
  const cancelDeal = useCancelDeal();

  const formatPrice = (price: number) => '\u20B9' + price.toFixed(0);

  const handleAccept = (dealId: string) => {
    Alert.alert('Accept Deal', 'Are you sure you want to accept this deal?', [
      { text: 'Cancel' },
      { text: 'Accept', onPress: () => acceptDeal.mutate(dealId) },
    ]);
  };

  const handleReject = (dealId: string) => {
    Alert.alert('Reject Deal', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectDeal.mutate(dealId) },
    ]);
  };

  const handleComplete = (dealId: string) => {
    Alert.alert('Complete Deal', 'Confirm that the transaction has been completed?', [
      { text: 'Cancel' },
      { text: 'Complete', onPress: () => completeDeal.mutate(dealId) },
    ]);
  };

  const handleCancel = (dealId: string) => {
    Alert.alert('Cancel Deal', 'Are you sure you want to cancel?', [
      { text: 'No' },
      { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelDeal.mutate(dealId) },
    ]);
  };

  const renderListing = ({ item }: { item: Listing }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" numberOfLines={1} style={{ flex: 1 }}>
            {item.title}
          </Text>
          <Chip
            compact
            style={{ backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }}
            textStyle={{ color: STATUS_COLORS[item.status] || '#999' }}
          >
            {item.status}
          </Chip>
        </View>
        <Text variant="bodySmall" style={styles.meta}>
          {item.category} | {item.condition.replace('_', ' ')} | {item.city}
        </Text>
        <Text variant="titleSmall" style={styles.price}>
          {formatPrice(item.sellingPrice)}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderDeal = ({ item }: { item: Deal }) => {
    const isSeller = item.sellerId === user?.id;
    const otherUser = isSeller ? item.buyer : item.seller;
    const role = isSeller ? 'Seller' : 'Buyer';

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" numberOfLines={1}>
                {item.listing?.title || 'Listing'}
              </Text>
              <Text variant="bodySmall" style={styles.meta}>
                {role} | {otherUser?.name || 'User'} ({otherUser?.city || ''})
              </Text>
            </View>
            <Chip
              compact
              style={{ backgroundColor: (STATUS_COLORS[item.status] || '#999') + '20' }}
              textStyle={{ color: STATUS_COLORS[item.status] || '#999' }}
            >
              {item.status}
            </Chip>
          </View>

          {item.offeredPrice && (
            <Text variant="bodySmall" style={styles.meta}>
              Offered: {formatPrice(item.offeredPrice)}
            </Text>
          )}

          {/* Actions based on status and role */}
          {item.status === 'PENDING' && isSeller && (
            <View style={styles.actions}>
              <Button
                mode="contained"
                compact
                onPress={() => handleAccept(item.id)}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              >
                Accept
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleReject(item.id)}
                style={styles.actionButton}
              >
                Reject
              </Button>
            </View>
          )}

          {item.status === 'PENDING' && !isSeller && (
            <View style={styles.actions}>
              <Text variant="bodySmall" style={{ color: '#FF9800', flex: 1 }}>
                Waiting for seller to respond...
              </Text>
              <Button
                mode="text"
                compact
                onPress={() => handleCancel(item.id)}
                textColor="#F44336"
              >
                Cancel
              </Button>
            </View>
          )}

          {item.status === 'ACCEPTED' && (
            <View style={styles.actions}>
              <Button
                mode="contained"
                compact
                onPress={() => handleComplete(item.id)}
                style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              >
                Mark Complete
              </Button>
              <Button
                mode="text"
                compact
                onPress={() => handleCancel(item.id)}
                textColor="#F44336"
              >
                Cancel
              </Button>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const isLoading = tab === 'listings' ? listingsLoading : dealsLoading;

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        My Activity
      </Text>

      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        buttons={[
          { value: 'listings', label: 'My Listings' },
          { value: 'deals', label: 'My Deals' },
        ]}
        style={styles.tabs}
      />

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <>
          {tab === 'listings' && (
            <FlatList
              data={listings || []}
              renderItem={renderListing}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>No listings yet. Sell a book to get started!</Text>
              }
            />
          )}
          {tab === 'deals' && (
            <FlatList
              data={deals || []}
              renderItem={renderDeal}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>No deals yet. Browse and buy books!</Text>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  heading: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4CAF50',
  },
  tabs: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: '#666',
    marginTop: 2,
  },
  price: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
});
