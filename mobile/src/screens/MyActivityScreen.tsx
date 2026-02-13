import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  SegmentedButtons,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import {
  useMyListings,
  useMyRequests,
  useMyMatches,
  useAcceptMatch,
  useRejectMatch,
  useCompleteMatch,
} from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import { Listing, BookRequest, Match } from '../types';

type Tab = 'listings' | 'requests' | 'matches';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#4CAF50',
  OPEN: '#2196F3',
  MATCHED: '#FF9800',
  PENDING: '#FF9800',
  ACCEPTED: '#4CAF50',
  RESERVED: '#FF9800',
  FULFILLED: '#4CAF50',
  COMPLETED: '#4CAF50',
  CANCELLED: '#999',
  REJECTED: '#F44336',
  EXCHANGED: '#4CAF50',
};

export default function MyActivityScreen() {
  const [tab, setTab] = useState<Tab>('listings');
  const { user } = useAuthStore();
  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const { data: requests, isLoading: requestsLoading } = useMyRequests();
  const { data: matches, isLoading: matchesLoading } = useMyMatches();
  const acceptMatch = useAcceptMatch();
  const rejectMatch = useRejectMatch();
  const completeMatch = useCompleteMatch();

  const handleAccept = (matchId: string) => {
    Alert.alert('Accept Match', 'Are you sure you want to accept this match?', [
      { text: 'Cancel' },
      { text: 'Accept', onPress: () => acceptMatch.mutate(matchId) },
    ]);
  };

  const handleReject = (matchId: string) => {
    Alert.alert('Reject Match', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => rejectMatch.mutate(matchId) },
    ]);
  };

  const handleComplete = (matchId: string) => {
    Alert.alert('Complete Exchange', 'Confirm that the book exchange has been completed?', [
      { text: 'Cancel' },
      { text: 'Complete', onPress: () => completeMatch.mutate(matchId) },
    ]);
  };

  const renderListing = ({ item }: { item: Listing }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">
            Class {item.class} - {item.board}
          </Text>
          <Chip
            compact
            style={{ backgroundColor: STATUS_COLORS[item.status] + '20' }}
            textStyle={{ color: STATUS_COLORS[item.status] }}
          >
            {item.status}
          </Chip>
        </View>
        <Text variant="bodySmall" style={styles.meta}>
          {item.listingType === 'SET' ? 'Full Set' : 'Individual'} | {item.condition.replace('_', ' ')}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {item.items.length} book(s) | {item.city}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderRequest = ({ item }: { item: BookRequest }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">
            Class {item.class} - {item.board}
          </Text>
          <Chip
            compact
            style={{ backgroundColor: STATUS_COLORS[item.status] + '20' }}
            textStyle={{ color: STATUS_COLORS[item.status] }}
          >
            {item.status}
          </Chip>
        </View>
        <Text variant="bodySmall" style={styles.meta}>{item.city}</Text>
        {item.isFloated && (
          <Chip compact icon="bell" style={{ marginTop: 4, alignSelf: 'flex-start' }}>
            Floated - waiting for matches
          </Chip>
        )}
        {item.subjects.length > 0 && (
          <Text variant="bodySmall" style={styles.meta}>
            Subjects: {item.subjects.join(', ')}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  const renderMatch = ({ item }: { item: Match }) => {
    const isGiver = item.giverId === user?.id;
    const otherUser = isGiver ? item.receiver : item.giver;

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium">
              {isGiver ? 'Giving to' : 'Receiving from'} {otherUser.name}
            </Text>
            <Chip
              compact
              style={{ backgroundColor: STATUS_COLORS[item.status] + '20' }}
              textStyle={{ color: STATUS_COLORS[item.status] }}
            >
              {item.status}
            </Chip>
          </View>
          <Text variant="bodySmall" style={styles.meta}>
            Class {item.listing.items?.[0] ? `${item.listing.class}` : ''} | {otherUser.city}
          </Text>

          {item.status === 'PENDING' && (
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
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const isLoading = tab === 'listings' ? listingsLoading : tab === 'requests' ? requestsLoading : matchesLoading;

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        My Activity
      </Text>

      <SegmentedButtons
        value={tab}
        onValueChange={(v) => setTab(v as Tab)}
        buttons={[
          { value: 'listings', label: 'Listings' },
          { value: 'requests', label: 'Requests' },
          { value: 'matches', label: 'Matches' },
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
                <Text style={styles.empty}>No listings yet</Text>
              }
            />
          )}
          {tab === 'requests' && (
            <FlatList
              data={requests || []}
              renderItem={renderRequest}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>No requests yet</Text>
              }
            />
          )}
          {tab === 'matches' && (
            <FlatList
              data={matches || []}
              renderItem={renderMatch}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.empty}>No matches yet</Text>
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
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
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
