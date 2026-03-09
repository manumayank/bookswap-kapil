import React from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Surface } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';
import { useMyListings, useMyDeals, useRecentListings } from '../hooks/useApi';
import { Listing } from '../types';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { data: myListings, isLoading: listingsLoading } = useMyListings();
  const { data: deals, isLoading: dealsLoading } = useMyDeals();
  const { data: recentData, isLoading: recentLoading, refetch } = useRecentListings(4);

  const activeListings = myListings?.filter((l) => l.status === 'ACTIVE').length || 0;
  const pendingDeals = deals?.filter((d) => d.status === 'PENDING' || d.status === 'ACCEPTED').length || 0;

  const recentListings = recentData?.data || [];

  const formatPrice = (price: number) => {
    return '\u20B9' + price.toFixed(0);
  };

  const renderRecentListing = (item: Listing) => (
    <Card key={item.id} style={styles.listingCard}>
      <Card.Content>
        <Text variant="titleSmall" numberOfLines={1}>
          {item.title}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {item.condition.replace('_', ' ')} | {item.city}
        </Text>
        <Text variant="titleMedium" style={styles.price}>
          {formatPrice(item.sellingPrice)}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
    >
      <Text variant="headlineMedium" style={styles.title}>
        BookSwap
      </Text>
      {user && (
        <Text variant="bodyLarge" style={styles.greeting}>
          Welcome, {user.name}!
        </Text>
      )}

      {/* Quick Action Cards */}
      <View style={styles.actionCards}>
        <Card
          style={[styles.actionCard, { backgroundColor: '#E8F5E9' }]}
          onPress={() => navigation.navigate('Sell')}
        >
          <Card.Content style={styles.actionContent}>
            <Text variant="titleMedium" style={{ color: '#2E7D32' }}>
              Sell a Book
            </Text>
            <Text variant="bodySmall" style={{ color: '#4CAF50' }}>
              List books you want to sell
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={[styles.actionCard, { backgroundColor: '#E3F2FD' }]}
          onPress={() => navigation.navigate('Browse')}
        >
          <Card.Content style={styles.actionContent}>
            <Text variant="titleMedium" style={{ color: '#1565C0' }}>
              Browse Books
            </Text>
            <Text variant="bodySmall" style={{ color: '#2196F3' }}>
              Find books you need
            </Text>
          </Card.Content>
        </Card>

        <Card
          style={[styles.actionCard, { backgroundColor: '#FFF3E0' }]}
          onPress={() => navigation.navigate('Activity')}
        >
          <Card.Content style={styles.actionContent}>
            <Text variant="titleMedium" style={{ color: '#E65100' }}>
              My Deals
            </Text>
            <Text variant="bodySmall" style={{ color: '#FF9800' }}>
              Track your transactions
            </Text>
          </Card.Content>
        </Card>
      </View>

      {/* Stats */}
      <Surface style={styles.statsContainer} elevation={1}>
        {listingsLoading || dealsLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <View style={styles.stat}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {activeListings}
              </Text>
              <Text variant="bodySmall">Active Listings</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {pendingDeals}
              </Text>
              <Text variant="bodySmall">Pending Deals</Text>
            </View>
          </>
        )}
      </Surface>

      {/* Pending deals notification */}
      {deals && deals.filter((d) => d.status === 'PENDING').length > 0 && (
        <Card
          style={[styles.notifCard, { backgroundColor: '#E8F5E9' }]}
          onPress={() => navigation.navigate('Activity')}
        >
          <Card.Content>
            <Text variant="titleSmall">
              You have {deals.filter((d) => d.status === 'PENDING').length} pending deal(s)!
            </Text>
            <Text variant="bodySmall" style={{ color: '#666' }}>
              Tap to review and respond
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Recently Listed */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Recently Listed
      </Text>
      {recentLoading ? (
        <ActivityIndicator style={{ marginTop: 16 }} />
      ) : recentListings.length > 0 ? (
        <View style={styles.recentGrid}>
          {recentListings.map(renderRecentListing)}
        </View>
      ) : (
        <Text style={styles.emptyText}>No listings yet</Text>
      )}

      {recentListings.length > 0 && (
        <Button
          mode="text"
          onPress={() => navigation.navigate('Browse')}
          style={{ marginTop: 4 }}
        >
          View All
        </Button>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  greeting: {
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
  actionCards: {
    marginTop: 24,
    gap: 12,
  },
  actionCard: {
    borderRadius: 12,
  },
  actionContent: {
    paddingVertical: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  notifCard: {
    marginTop: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  recentGrid: {
    gap: 10,
  },
  listingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
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
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 16,
  },
});
