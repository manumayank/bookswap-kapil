import React, { useEffect } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';
import { useMyListings, useMyRequests, useMyMatches } from '../hooks/useApi';

export default function HomeScreen({ navigation }: any) {
  const { user, fetchUser } = useAuthStore();
  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const { data: requests, isLoading: requestsLoading } = useMyRequests();
  const { data: matches, isLoading: matchesLoading, refetch } = useMyMatches();

  useEffect(() => {
    fetchUser();
  }, []);

  const activeListings = listings?.filter((l) => l.status === 'ACTIVE').length || 0;
  const openRequests = requests?.filter((r) => r.status === 'OPEN' || r.status === 'MATCHED').length || 0;
  const pendingMatches = matches?.filter((m) => m.status === 'PENDING' || m.status === 'ACCEPTED').length || 0;

  const isLoading = listingsLoading || requestsLoading || matchesLoading;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => refetch()} />}
    >
      <Text variant="headlineMedium" style={styles.title}>
        🪃 Bookerang
      </Text>
      <Text style={styles.tagline}>Books come back around</Text>
      {user && (
        <Text variant="bodyLarge" style={styles.greeting}>
          Welcome, {user.name}!
        </Text>
      )}

      <View style={styles.cardContainer}>
        <Card style={styles.card} onPress={() => navigation.navigate('GiveBooks')}>
          <Card.Content>
            <Text variant="titleLarge">Give Books</Text>
            <Text variant="bodyMedium" style={styles.cardDesc}>
              List books you want to give away
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate('NeedBooks')}>
          <Card.Content>
            <Text variant="titleLarge">Need Books</Text>
            <Text variant="bodyMedium" style={styles.cardDesc}>
              Find books for your child
            </Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsContainer}>
        {isLoading ? (
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
                {openRequests}
              </Text>
              <Text variant="bodySmall">Open Requests</Text>
            </View>
            <View style={styles.stat}>
              <Text variant="headlineSmall" style={styles.statNumber}>
                {pendingMatches}
              </Text>
              <Text variant="bodySmall">Matches</Text>
            </View>
          </>
        )}
      </View>

      {matches && matches.filter((m) => m.status === 'PENDING').length > 0 && (
        <Card
          style={[styles.card, { marginTop: 16, backgroundColor: '#DBEAFE' }]}
          onPress={() => navigation.navigate('MyActivity')}
        >
          <Card.Content>
            <Text variant="titleMedium">
              You have {matches.filter((m) => m.status === 'PENDING').length} new match(es)!
            </Text>
            <Text variant="bodySmall">Tap to review and accept</Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#EFF6FF',
  },
  title: {
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
    color: '#1E40AF',
  },
  tagline: {
    textAlign: 'center',
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 2,
  },
  greeting: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  cardContainer: {
    marginTop: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
  },
  cardDesc: {
    color: '#666',
    marginTop: 4,
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
    color: '#3B82F6',
    fontWeight: 'bold',
  },
});
