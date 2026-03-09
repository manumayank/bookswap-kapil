import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Surface,
  Menu,
} from 'react-native-paper';
import { useCreateListing } from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import { Board, Category, BookCondition } from '../types';

const CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: 'HARDLY_USED', label: 'Hardly Used' },
  { value: 'WELL_MAINTAINED', label: 'Well Maintained' },
  { value: 'MARKER_USED', label: 'Marker Used' },
  { value: 'STAINS', label: 'Stains' },
  { value: 'TORN_PAGES', label: 'Torn Pages' },
];

const BOARDS: Board[] = ['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE'];

export default function SellScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const createListing = useCreateListing();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('BOOK');
  const [board, setBoard] = useState<Board | ''>((user?.board as Board) || '');
  const [classNum, setClassNum] = useState('');
  const [subject, setSubject] = useState('');
  const [condition, setCondition] = useState<BookCondition>('WELL_MAINTAINED');
  const [buyingPrice, setBuyingPrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [yearOfPurchase, setYearOfPurchase] = useState('');

  // Board menu
  const [boardMenuVisible, setBoardMenuVisible] = useState(false);

  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return false;
    }
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid selling price');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: any = {
      title: title.trim(),
      category,
      condition,
      sellingPrice: parseFloat(sellingPrice),
      city: city.trim(),
    };

    if (description.trim()) payload.description = description.trim();
    if (board) payload.board = board;
    if (classNum) payload.class = parseInt(classNum);
    if (subject.trim()) payload.subject = subject.trim();
    if (buyingPrice) payload.buyingPrice = parseFloat(buyingPrice);
    if (yearOfPurchase) payload.yearOfPurchase = parseInt(yearOfPurchase);

    try {
      await createListing.mutateAsync(payload);
      Alert.alert(
        'Success',
        'Submitted for review! Your listing will be live once approved.',
        [{ text: 'OK', onPress: () => navigation.navigate('Home') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create listing');
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text variant="titleLarge" style={styles.heading}>
        Sell a Book
      </Text>

      {/* Title */}
      <TextInput
        label="Title *"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
        placeholder="e.g. NCERT Maths Class 10"
      />

      {/* Description */}
      <TextInput
        label="Description"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
        placeholder="Describe the condition, edition, etc."
      />

      {/* Category */}
      <Text style={styles.label}>Category</Text>
      <SegmentedButtons
        value={category}
        onValueChange={(v) => setCategory(v as Category)}
        buttons={[
          { value: 'BOOK', label: 'Book' },
          { value: 'STATIONERY', label: 'Stationery' },
        ]}
        style={styles.segmented}
      />

      {/* Board */}
      <Text style={styles.label}>Board</Text>
      <Menu
        visible={boardMenuVisible}
        onDismiss={() => setBoardMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setBoardMenuVisible(true)}
            style={styles.menuButton}
            contentStyle={{ justifyContent: 'flex-start' }}
          >
            {board || 'Select Board (optional)'}
          </Button>
        }
      >
        <Menu.Item
          onPress={() => {
            setBoard('');
            setBoardMenuVisible(false);
          }}
          title="None"
        />
        {BOARDS.map((b) => (
          <Menu.Item
            key={b}
            onPress={() => {
              setBoard(b);
              setBoardMenuVisible(false);
            }}
            title={b}
          />
        ))}
      </Menu>

      {/* Class & Subject */}
      <View style={styles.row}>
        <TextInput
          label="Class"
          value={classNum}
          onChangeText={setClassNum}
          mode="outlined"
          keyboardType="number-pad"
          style={[styles.input, { flex: 1 }]}
          placeholder="1-12"
        />
        <View style={{ width: 12 }} />
        <TextInput
          label="Subject"
          value={subject}
          onChangeText={setSubject}
          mode="outlined"
          style={[styles.input, { flex: 2 }]}
          placeholder="e.g. Mathematics"
        />
      </View>

      {/* Condition */}
      <Text style={styles.label}>Condition *</Text>
      <View style={styles.chipRow}>
        {CONDITIONS.map((c) => (
          <Chip
            key={c.value}
            selected={condition === c.value}
            onPress={() => setCondition(c.value)}
            style={styles.chip}
          >
            {c.label}
          </Chip>
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.row}>
        <TextInput
          label="Buying Price"
          value={buyingPrice}
          onChangeText={setBuyingPrice}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }]}
          left={<TextInput.Affix text={'\u20B9'} />}
        />
        <View style={{ width: 12 }} />
        <TextInput
          label="Selling Price *"
          value={sellingPrice}
          onChangeText={setSellingPrice}
          mode="outlined"
          keyboardType="numeric"
          style={[styles.input, { flex: 1 }]}
          left={<TextInput.Affix text={'\u20B9'} />}
        />
      </View>

      {/* City */}
      <TextInput
        label="City *"
        value={city}
        onChangeText={setCity}
        mode="outlined"
        style={styles.input}
      />

      {/* Year of Purchase */}
      <TextInput
        label="Year of Purchase"
        value={yearOfPurchase}
        onChangeText={setYearOfPurchase}
        mode="outlined"
        keyboardType="number-pad"
        style={styles.input}
        placeholder="e.g. 2024"
      />

      {/* Image placeholder */}
      <Surface style={styles.imagePlaceholder} elevation={1}>
        <Text variant="bodyMedium" style={{ color: '#999' }}>
          Image upload coming soon
        </Text>
        <Text variant="bodySmall" style={{ color: '#bbb', marginTop: 4 }}>
          You can add photos after creating the listing
        </Text>
      </Surface>

      {/* Submit */}
      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.submitButton}
        loading={createListing.isPending}
        disabled={createListing.isPending}
      >
        Submit Listing
      </Button>

      <View style={{ height: 40 }} />
    </ScrollView>
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
    marginBottom: 16,
    color: '#4CAF50',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    marginBottom: 4,
  },
  menuButton: {
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  imagePlaceholder: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  submitButton: {
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
  },
});
