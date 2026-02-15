import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Chip,
  Card,
  IconButton,
  Divider,
} from 'react-native-paper';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateListing } from '../hooks/useApi';
import { useAuthStore } from '../stores/authStore';
import { Board, BookCondition, ExchangePreference } from '../types';

const listingSchema = z.object({
  listingType: z.enum(['SET', 'INDIVIDUAL']),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']),
  class: z.string().min(1, 'Class is required'),
  city: z.string().min(2, 'City is required'),
  yearOfPurchase: z.string().optional(),
  items: z.array(
    z.object({
      subject: z.string().min(1, 'Subject is required'),
      title: z.string().optional(),
      publisher: z.string().optional(),
    })
  ).min(1, 'Add at least one book'),
});

type ListingForm = z.infer<typeof listingSchema>;

const CONDITIONS: { value: BookCondition; label: string }[] = [
  { value: 'UNUSED', label: 'Unused' },
  { value: 'ALMOST_NEW', label: 'Almost New' },
  { value: 'WATER_MARKS', label: 'Water Marks' },
  { value: 'UNDERLINED', label: 'Underlined' },
];

export default function GiveBooksScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const createListing = useCreateListing();
  const [exchangePref, setExchangePref] = useState<ExchangePreference>('PICKUP');
  const [conditions, setConditions] = useState<BookCondition[]>(['ALMOST_NEW']);

  const { control, handleSubmit, formState: { errors } } = useForm<ListingForm>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      listingType: 'SET',
      board: user?.board || 'CBSE',
      class: '',
      city: user?.city || '',
      items: [{ subject: '', title: '', publisher: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const toggleCondition = (cond: BookCondition) => {
    setConditions((prev) =>
      prev.includes(cond)
        ? prev.filter((c) => c !== cond)
        : [...prev, cond]
    );
  };

  const onSubmit = async (data: ListingForm) => {
    console.log('onSubmit called with data:', data);
    console.log('conditions:', conditions);
    console.log('exchangePref:', exchangePref);
    
    if (conditions.length === 0) {
      Alert.alert('Error', 'Select at least one book condition');
      return;
    }

    try {
      console.log('Creating listing with data:', {
        ...data,
        class: parseInt(data.class),
        yearOfPurchase: data.yearOfPurchase ? parseInt(data.yearOfPurchase) : undefined,
        condition: conditions,
        exchangePreference: [exchangePref],
      });
      const result = await createListing.mutateAsync({
        ...data,
        class: parseInt(data.class),
        yearOfPurchase: data.yearOfPurchase ? parseInt(data.yearOfPurchase) : undefined,
        condition: conditions,
        exchangePreference: [exchangePref],
      });
      console.log('Listing created:', result);
      Alert.alert('Success', 'Listing created! We will find matches for you.', [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error: any) {
      console.error('Create listing error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to create listing';
      Alert.alert('Error', errorMsg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleLarge" style={styles.heading}>
        List Your Books
      </Text>

      {/* Listing Type */}
      <Text style={styles.label}>Listing Type</Text>
      <Controller
        control={control}
        name="listingType"
        render={({ field: { onChange, value } }) => (
          <SegmentedButtons
            value={value}
            onValueChange={onChange}
            buttons={[
              { value: 'SET', label: 'Full Set' },
              { value: 'INDIVIDUAL', label: 'Individual' },
            ]}
            style={styles.segmented}
          />
        )}
      />

      {/* Board */}
      <Text style={styles.label}>Board</Text>
      <Controller
        control={control}
        name="board"
        render={({ field: { onChange, value } }) => (
          <View style={styles.chipRow}>
            {(['CBSE', 'ICSE', 'STATE', 'IB'] as const).map((b) => (
              <Chip
                key={b}
                selected={value === b}
                onPress={() => onChange(b)}
                style={[styles.chip, value === b && styles.chipSelected]}
                mode={value === b ? 'flat' : 'outlined'}
                showSelectedCheck={false}
              >
                {b === 'STATE' ? 'State' : b}
              </Chip>
            ))}
          </View>
        )}
      />

      {/* Class & City */}
      <Controller
        control={control}
        name="class"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Class (1-12)"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
            error={!!errors.class}
          />
        )}
      />

      <Controller
        control={control}
        name="city"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="City"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            style={styles.input}
            error={!!errors.city}
          />
        )}
      />

      {/* Condition - Multi-select */}
      <Text style={styles.label}>Book Condition</Text>
      <View style={styles.chipRow}>
        {CONDITIONS.map((c) => (
          <Chip
            key={c.value}
            selected={conditions.includes(c.value)}
            onPress={() => toggleCondition(c.value)}
            style={[styles.chip, conditions.includes(c.value) && styles.chipSelected]}
            mode={conditions.includes(c.value) ? 'flat' : 'outlined'}
            showSelectedCheck={false}
          >
            {c.label}
          </Chip>
        ))}
      </View>

      {/* Year of Purchase */}
      <Controller
        control={control}
        name="yearOfPurchase"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Year of Purchase (optional)"
            value={value}
            onChangeText={onChange}
            mode="outlined"
            keyboardType="number-pad"
            style={styles.input}
          />
        )}
      />

      {/* Exchange Preference - Single-select */}
      <Text style={styles.label}>Exchange Preference</Text>
      <View style={styles.chipRow}>
        {(['PICKUP', 'SCHOOL', 'PORTER'] as ExchangePreference[]).map((pref) => (
          <Chip
            key={pref}
            selected={exchangePref === pref}
            onPress={() => setExchangePref(pref)}
            style={[styles.chip, exchangePref === pref && styles.chipSelected]}
            mode={exchangePref === pref ? 'flat' : 'outlined'}
            showSelectedCheck={false}
          >
            {pref === 'PICKUP' ? 'Self Pickup' : pref === 'SCHOOL' ? 'At School' : 'Porter'}
          </Chip>
        ))}
      </View>

      {/* Book Items */}
      <Divider style={{ marginVertical: 16 }} />
      <Text variant="titleMedium" style={styles.label}>Books</Text>

      {fields.map((field, index) => (
        <Card key={field.id} style={styles.itemCard}>
          <Card.Content>
            <View style={styles.itemHeader}>
              <Text variant="bodyLarge">Book {index + 1}</Text>
              {fields.length > 1 && (
                <IconButton icon="delete" size={20} onPress={() => remove(index)} />
              )}
            </View>
            <Controller
              control={control}
              name={`items.${index}.subject`}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Subject *"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  dense
                  style={styles.itemInput}
                />
              )}
            />
            <Controller
              control={control}
              name={`items.${index}.title`}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Book Title (optional)"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  dense
                  style={styles.itemInput}
                />
              )}
            />
            <Controller
              control={control}
              name={`items.${index}.publisher`}
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Publisher (optional)"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  dense
                  style={styles.itemInput}
                />
              )}
            />
          </Card.Content>
        </Card>
      ))}

      <Button
        mode="outlined"
        icon="plus"
        onPress={() => append({ subject: '', title: '', publisher: '' })}
        style={styles.addButton}
      >
        Add Another Book
      </Button>

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit, (formErrors) => {
          console.log('Form validation errors:', formErrors);
          const errorMessages = Object.entries(formErrors)
            .map(([key, value]) => `${key}: ${value?.message || 'Invalid'}`)
            .join('\n');
          Alert.alert('Validation Error', errorMessages || 'Please check the form');
        })}
        style={styles.submitButton}
        loading={createListing.isPending}
        disabled={createListing.isPending}
      >
        Create Listing
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
    color: '#3B82F6',
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    marginBottom: 12,
  },
  segmented: {
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInput: {
    marginBottom: 8,
  },
  addButton: {
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
  },
});
