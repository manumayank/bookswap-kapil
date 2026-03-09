import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  IconButton,
  Divider,
  List,
  Avatar,
} from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, setUser, fetchUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');

  // Add child state
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childClass, setChildClass] = useState('');

  const handleSaveProfile = async () => {
    try {
      const { data } = await api.put('/users/me', { name, phone, city });
      setUser(data.data);
      setEditing(false);
      Alert.alert('Success', 'Profile updated');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Update failed');
    }
  };

  const handleAddChild = async () => {
    if (!childClass) {
      Alert.alert('Error', 'Class is required');
      return;
    }
    try {
      await api.post('/users/me/children', {
        name: childName || undefined,
        currentClass: parseInt(childClass),
      });
      setAddingChild(false);
      setChildName('');
      setChildClass('');
      fetchUser();
      Alert.alert('Success', 'Child added');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add child');
    }
  };

  const handleDeleteChild = (childId: string) => {
    Alert.alert('Remove Child', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/users/me/children/${childId}`);
            fetchUser();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to remove child');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <ScrollView style={styles.container}>
      {/* Avatar and basic info */}
      <View style={styles.avatarSection}>
        <Avatar.Text size={72} label={initials} style={{ backgroundColor: '#4CAF50' }} />
        <Text variant="titleLarge" style={styles.userName}>
          {user.name}
        </Text>
        <Text variant="bodyMedium" style={styles.userEmail}>
          {user.email}
        </Text>
      </View>

      {/* Profile Info */}
      <Card style={styles.card}>
        <Card.Content>
          {editing ? (
            <>
              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                dense
              />
              <TextInput
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                keyboardType="phone-pad"
                style={styles.input}
                dense
              />
              <TextInput
                label="City"
                value={city}
                onChangeText={setCity}
                mode="outlined"
                style={styles.input}
                dense
              />
              <View style={styles.editActions}>
                <Button mode="contained" onPress={handleSaveProfile} style={styles.saveButton}>
                  Save
                </Button>
                <Button mode="text" onPress={() => setEditing(false)}>
                  Cancel
                </Button>
              </View>
            </>
          ) : (
            <>
              <List.Item
                title="Phone"
                description={user.phone || 'Not set'}
                left={(props) => <List.Icon {...props} icon="phone" />}
              />
              <List.Item
                title="City"
                description={user.city || 'Not set'}
                left={(props) => <List.Icon {...props} icon="map-marker" />}
              />
              <List.Item
                title="Board"
                description={user.board || 'Not set'}
                left={(props) => <List.Icon {...props} icon="school" />}
              />
              <Button
                mode="outlined"
                onPress={() => {
                  setName(user.name || '');
                  setPhone(user.phone || '');
                  setCity(user.city || '');
                  setEditing(true);
                }}
                style={{ marginTop: 8 }}
                compact
              >
                Edit Profile
              </Button>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Children */}
      <Divider style={{ marginVertical: 16 }} />
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium">Children</Text>
        <Button
          mode="text"
          compact
          icon="plus"
          onPress={() => setAddingChild(!addingChild)}
        >
          Add
        </Button>
      </View>

      {addingChild && (
        <Card style={styles.card}>
          <Card.Content>
            <TextInput
              label="Child's Name (optional)"
              value={childName}
              onChangeText={setChildName}
              mode="outlined"
              style={styles.input}
              dense
            />
            <TextInput
              label="Current Class (1-12)"
              value={childClass}
              onChangeText={setChildClass}
              mode="outlined"
              keyboardType="number-pad"
              style={styles.input}
              dense
            />
            <Button mode="contained" onPress={handleAddChild} style={styles.saveButton}>
              Add Child
            </Button>
          </Card.Content>
        </Card>
      )}

      {user.children?.map((child) => (
        <Card key={child.id} style={styles.card}>
          <Card.Content>
            <View style={styles.childRow}>
              <View>
                <Text variant="bodyLarge">{child.name || 'Child'}</Text>
                <Text variant="bodySmall" style={styles.info}>
                  Class {child.currentClass}
                  {child.school ? ` | ${child.school.name}` : ''}
                </Text>
              </View>
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteChild(child.id)}
              />
            </View>
          </Card.Content>
        </Card>
      ))}

      {(!user.children || user.children.length === 0) && !addingChild && (
        <Text style={styles.emptyText}>No children added yet</Text>
      )}

      {/* Logout */}
      <Divider style={{ marginVertical: 16 }} />
      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor="#F44336"
        icon="logout"
      >
        Logout
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 12,
  },
  userEmail: {
    color: '#666',
    marginTop: 2,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  input: {
    marginBottom: 8,
  },
  info: {
    color: '#666',
    marginTop: 2,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  logoutButton: {
    borderColor: '#F44336',
  },
});
