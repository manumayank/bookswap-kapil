import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { useListings, useCreateRequest, useFloatRequest, useSchools } from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import { Listing, Board, BookCondition } from '../types';

export default function NeedBooksScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [board, setBoard] = useState<Board>(user?.board || 'CBSE');
  const [classNum, setClassNum] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [school, setSchool] = useState('');
  const [searched, setSearched] = useState(false);

  const { data, isLoading, refetch } = useListings(
    searched
      ? {
          board,
          class: classNum ? parseInt(classNum) : undefined,
          city: city || undefined,
          school: school || undefined,
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
    console.log('handleRequest called');
    console.log('classNum:', classNum, 'board:', board, 'city:', city, 'school:', school);
    
    if (!classNum) {
      Alert.alert('Error', 'Please search first before requesting');
      return;
    }
    
    try {
      console.log('Creating request...');
      const result = await createRequest.mutateAsync({
        board,
        class: parseInt(classNum),
        city,
        school: school || undefined,
        subjects: [],
      });
      console.log('Request created:', result);

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
      console.error('Request error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to create request');
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
        <View style={styles.chipRow}>
          {(['CBSE', 'ICSE', 'STATE', 'IB'] as Board[]).map((b) => (
            <Chip
              key={b}
              selected={board === b}
              onPress={() => setBoard(b)}
              style={[styles.chip, board === b && styles.chipSelected]}
              mode={board === b ? 'flat' : 'outlined'}
              showSelectedCheck={false}
            >
              {b === 'STATE' ? 'State' : b}
            </Chip>
          ))}
        </View>
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
        <TextInput
          label="School (optional)"
          value={school}
          onChangeText={setSchool}
          mode="outlined"
          style={styles.input}
          dense
          placeholder="e.g., Delhi Public School"
        />
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
    color: '#3B82F6',
  },
  filters: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
  },
  row: {
    flexDirection: 'row',
  },
  input: {
    marginBottom: 8,
  },
  searchButton: {
    backgroundColor: '#3B82F6',
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
    backgroundColor: '#3B82F6',
    marginBottom: 16,
  },
});
