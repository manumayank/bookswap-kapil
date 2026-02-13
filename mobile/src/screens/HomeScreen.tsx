import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

export default function HomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        📚 BookSwap
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Exchange school books with parents near you
      </Text>

      <View style={styles.cardContainer}>
        <Card style={styles.card} onPress={() => navigation.navigate('GiveBooks')}>
          <Card.Content>
            <Text variant="titleLarge">📦 Give Books</Text>
            <Text variant="bodyMedium">List books you want to give away</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card} onPress={() => navigation.navigate('NeedBooks')}>
          <Card.Content>
            <Text variant="titleLarge">🔍 Need Books</Text>
            <Text variant="bodyMedium">Find books for your child</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text variant="headlineSmall">0</Text>
          <Text variant="bodySmall">Active Listings</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="headlineSmall">0</Text>
          <Text variant="bodySmall">Pending Requests</Text>
        </View>
        <View style={styles.stat}>
          <Text variant="headlineSmall">0</Text>
          <Text variant="bodySmall">Matches</Text>
        </View>
      </View>
    </View>
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
    marginTop: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  cardContainer: {
    marginTop: 30,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 40,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
  },
});
