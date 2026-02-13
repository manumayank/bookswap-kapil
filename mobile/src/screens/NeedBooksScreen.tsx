import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  SegmentedButtons,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useListings, useCreateRequest, useFloatRequest } from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import { Listing, Board, BookCondition } from '../types';

export default function NeedBooksScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [board, setBoard] = useState<Board>(user?.board || 'CBSE');
  const [classNum, setClassNum] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [searched, setSearched] = useState(false);

  const { data, isLoading, refetch } = useListings(
    searched
      ? {
          board,
          class: classNum ? parseInt(classNum) : undefined,
          city: city || undefined,
        }
      : undefined
  );

  const createRequest = useCreateRequest();
  const floatRequest = useFloatRequest();

  const handleSearch = () => {
    if (!classNum) {
      Alert.alert('Error', 'Please enter a class');
      return;
    }
    setSearched(true);
    refetch();
  };

  const handleRequest = async () => {
    if (!classNum) return;
    try {
      const result = await createRequest.mutateAsync({
        board,
        class: parseInt(classNum),
        city,
        subjects: [],
      });

      if (data?.data && data.data.length === 0) {
        Alert.alert(
          'No Books Found',
          'Would you like to float this request? You will be notified when matching books are listed.',
          [
            { text: 'No Thanks' },
            {
              text: 'Float Request',
              onPress: () => floatRequest.mutate(result.id),
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Request created! Check My Activity for matches.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create request');
    }
  };

  const renderListing = ({ item }: { item: Listing }) => (
    <Card style={styles.listingCard}>
      <Card.Content>
        <View style={styles.listingHeader}>
          <Text variant="titleMedium">
            Class {item.class} - {item.board}
          </Text>
          <Chip compact>{item.condition.replace('_', ' ')}</Chip>
        </View>
        <Text variant="bodySmall" style={styles.listingMeta}>
          {item.listingType === 'SET' ? 'Full Set' : 'Individual'} | {item.city}
        </Text>
        <Text variant="bodySmall" style={styles.listingMeta}>
          By {item.user.name}
        </Text>
        <Divider style={{ marginVertical: 8 }} />
        <Text variant="bodySmall" style={{ fontWeight: '600' }}>
          Books ({item.items.length}):
        </Text>
        {item.items.map((book) => (
          <Text key={book.id} variant="bodySmall">
            - {book.subject}{book.title ? `: ${book.title}` : ''}
          </Text>
        ))}
        <View style={styles.exchangeRow}>
          {item.exchangePreference.map((pref) => (
            <Chip key={pref} compact style={styles.exchangeChip}>
              {pref === 'PICKUP' ? 'Pickup' : pref === 'SCHOOL' ? 'School' : 'Porter'}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        Find Books
      </Text>

      {/* Search Filters */}
      <View style={styles.filters}>
        <SegmentedButtons
          value={board}
          onValueChange={(v) => setBoard(v as Board)}
          buttons={[
            { value: 'CBSE', label: 'CBSE' },
            { value: 'ICSE', label: 'ICSE' },
            { value: 'STATE', label: 'State' },
            { value: 'IB', label: 'IB' },
          ]}
          style={styles.segmented}
        />
        <View style={styles.row}>
          <TextInput
            label="Class"
            value={classNum}
            onChangeText={setClassNum}
            mode="outlined"
            keyboardType="number-pad"
            style={[styles.input, { flex: 1 }]}
            dense
          />
          <TextInput
            label="City"
            value={city}
            onChangeText={setCity}
            mode="outlined"
            style={[styles.input, { flex: 2, marginLeft: 8 }]}
            dense
          />
        </View>
        <Button mode="contained" onPress={handleSearch} style={styles.searchButton}>
          Search
        </Button>
      </View>

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : searched ? (
        <>
          <Text variant="bodyMedium" style={styles.resultCount}>
            {data?.data?.length || 0} listing(s) found
          </Text>
          <FlatList
            data={data?.data || []}
            renderItem={renderListing}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text variant="bodyLarge">No books found for this search</Text>
                <Button
                  mode="outlined"
                  onPress={handleRequest}
                  style={{ marginTop: 12 }}
                  loading={createRequest.isPending}
                >
                  Create Request & Float
                </Button>
              </View>
            }
          />
          {(data?.data?.length || 0) > 0 && (
            <Button
              mode="contained"
              onPress={handleRequest}
              style={styles.requestButton}
              loading={createRequest.isPending}
            >
              Request These Books
            </Button>
          )}
        </>
      ) : (
        <View style={styles.empty}>
          <Text variant="bodyLarge" style={{ color: '#999' }}>
            Search for books by class, board, and city
          </Text>
        </View>
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
  filters: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: '#4CAF50',
  },
  resultCount: {
    marginBottom: 8,
    color: '#666',
  },
  listingCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingMeta: {
    color: '#666',
    marginTop: 2,
  },
  exchangeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  exchangeChip: {
    height: 28,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    marginBottom: 16,
  },
});
