import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Searchbar,
  Card,
  Chip,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import { useListings } from '../hooks/useApi';
import { Listing, Board, Category } from '../types';

const BOARDS: Board[] = ['CBSE', 'ICSE', 'STATE', 'IB'];
const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'BOOK', label: 'Books' },
  { value: 'STATIONERY', label: 'Stationery' },
];

export default function BrowseScreen() {
  const [search, setSearch] = useState('');
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showClassFilter, setShowClassFilter] = useState(false);

  const filters: Record<string, any> = { sortBy: 'newest' };
  if (search) filters.search = search;
  if (selectedBoard) filters.board = selectedBoard;
  if (selectedClass) filters.class = parseInt(selectedClass);
  if (selectedCategory) filters.category = selectedCategory;

  const { data, isLoading, refetch, isFetching } = useListings(filters);
  const listings = data?.data || [];

  const formatPrice = (price: number) => '\u20B9' + price.toFixed(0);

  const clearFilters = () => {
    setSearch('');
    setSelectedBoard(null);
    setSelectedClass(null);
    setSelectedCategory(null);
    setShowClassFilter(false);
  };

  const hasFilters = selectedBoard || selectedClass || selectedCategory;

  const renderListing = useCallback(({ item }: { item: Listing }) => (
    <Card style={styles.listingCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium" numberOfLines={1} style={{ flex: 1 }}>
            {item.title}
          </Text>
          <Text variant="titleMedium" style={styles.price}>
            {formatPrice(item.sellingPrice)}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.meta}>
          {item.condition.replace('_', ' ')}
          {item.board ? ` | ${item.board}` : ''}
          {item.class ? ` | Class ${item.class}` : ''}
        </Text>
        <Text variant="bodySmall" style={styles.meta}>
          {item.city} | by {item.user.name}
        </Text>
        {item.subject && (
          <Chip compact style={styles.subjectChip}>
            {item.subject}
          </Chip>
        )}
      </Card.Content>
    </Card>
  ), []);

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <Searchbar
        placeholder="Search books, subjects..."
        onChangeText={setSearch}
        value={search}
        style={styles.searchbar}
        onSubmitEditing={() => refetch()}
      />

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.value}
            selected={selectedCategory === cat.value}
            onPress={() =>
              setSelectedCategory(selectedCategory === cat.value ? null : cat.value)
            }
            style={styles.filterChip}
            compact
          >
            {cat.label}
          </Chip>
        ))}
        {BOARDS.map((board) => (
          <Chip
            key={board}
            selected={selectedBoard === board}
            onPress={() => setSelectedBoard(selectedBoard === board ? null : board)}
            style={styles.filterChip}
            compact
          >
            {board}
          </Chip>
        ))}
        <Chip
          onPress={() => setShowClassFilter(!showClassFilter)}
          style={styles.filterChip}
          compact
          selected={!!selectedClass}
        >
          {selectedClass ? `Class ${selectedClass}` : 'Class'}
        </Chip>
        {hasFilters && (
          <Chip
            onPress={clearFilters}
            style={styles.filterChip}
            compact
            icon="close"
          >
            Clear
          </Chip>
        )}
      </View>

      {/* Class filter row */}
      {showClassFilter && (
        <View style={styles.classRow}>
          {CLASSES.map((cls) => (
            <Chip
              key={cls}
              selected={selectedClass === cls}
              onPress={() => {
                setSelectedClass(selectedClass === cls ? null : cls);
                setShowClassFilter(false);
              }}
              style={styles.classChip}
              compact
            >
              {cls}
            </Chip>
          ))}
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={() => refetch()} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text variant="bodyLarge" style={{ color: '#999' }}>
                No listings found
              </Text>
              <Text variant="bodySmall" style={{ color: '#bbb', marginTop: 4 }}>
                Try adjusting your search or filters
              </Text>
            </View>
          }
          ListHeaderComponent={
            data?.pagination ? (
              <Text variant="bodySmall" style={styles.resultCount}>
                {data.pagination.total} result(s)
              </Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchbar: {
    margin: 12,
    marginBottom: 8,
    elevation: 2,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    marginBottom: 4,
  },
  classRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 6,
    marginBottom: 8,
    backgroundColor: '#fff',
    padding: 8,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  classChip: {
    marginBottom: 4,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  listingCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  meta: {
    color: '#666',
    marginTop: 2,
  },
  subjectChip: {
    alignSelf: 'flex-start',
    marginTop: 6,
    height: 28,
  },
  resultCount: {
    color: '#666',
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
});
