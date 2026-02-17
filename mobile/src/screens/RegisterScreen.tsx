import React from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, Chip } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../stores/authStore';
import { Board } from '../types';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  city: z.string().min(2, 'City is required'),
  board: z.enum(['CBSE', 'ICSE', 'STATE', 'IB', 'IGCSE']),
});

type RegisterForm = z.infer<typeof registerSchema>;

const BOARDS: { value: Board; label: string }[] = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'STATE', label: 'State' },
  { value: 'IB', label: 'IB' },
  { value: 'IGCSE', label: 'IGCSE' },
];

export default function RegisterScreen({ navigation }: any) {
  const { verifiedEmail, register: registerUser, isLoading } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', phone: '', city: '', board: 'CBSE' },
  });

  const onSubmit = async (formData: RegisterForm) => {
    try {
      await registerUser({ ...formData, email: verifiedEmail });
      navigation.replace('Main');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Complete Your Profile
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Registering as {verifiedEmail}
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Full Name"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                style={styles.input}
                error={!!errors.name}
              />
            )}
          />
          {errors.name && (
            <Text style={styles.error}>{errors.name.message}</Text>
          )}

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Phone Number"
                value={value}
                onChangeText={onChange}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                error={!!errors.phone}
              />
            )}
          />
          {errors.phone && (
            <Text style={styles.error}>{errors.phone.message}</Text>
          )}

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
          {errors.city && (
            <Text style={styles.error}>{errors.city.message}</Text>
          )}

          <Text variant="bodyMedium" style={styles.label}>
            School Board
          </Text>
          <Controller
            control={control}
            name="board"
            render={({ field: { onChange, value } }) => (
              <View style={styles.chipRow}>
                {BOARDS.map((b) => (
                  <Chip
                    key={b.value}
                    selected={value === b.value}
                    onPress={() => onChange(b.value)}
                    style={[styles.chip, value === b.value && styles.chipSelected]}
                    mode={value === b.value ? 'flat' : 'outlined'}
                    showSelectedCheck={false}
                  >
                    {b.label}
                  </Chip>
                ))}
              </View>
            )}
          />

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            Create Account
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
  },
  form: {
    marginTop: 30,
  },
  input: {
    marginBottom: 12,
  },
  label: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: '#3B82F6',
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
  },
  error: {
    color: '#B00020',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
});
