import React, { useState } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, HelperText } from 'react-native-paper';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { sendOtp, verifyOtp, isLoading } = useAuthStore();

  const handleSendOtp = async () => {
    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }
    try {
      await sendOtp(email);
      setOtpSent(true);
      Alert.alert('Success', 'OTP sent to your email');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit OTP');
      return;
    }
    try {
      const result = await verifyOtp(email, otp);
      if (result.isNewUser) {
        navigation.replace('Register');
      } else {
        navigation.replace('Main');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text variant="headlineLarge" style={styles.title}>
          BookSwap
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Exchange school books with parents near you
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            disabled={otpSent}
          />

          {otpSent && (
            <>
              <TextInput
                label="Enter 6-digit OTP"
                value={otp}
                onChangeText={setOtp}
                mode="outlined"
                keyboardType="number-pad"
                maxLength={6}
                style={styles.input}
              />
              <HelperText type="info">
                Check your email for the OTP code
              </HelperText>
            </>
          )}

          <Button
            mode="contained"
            onPress={otpSent ? handleVerifyOtp : handleSendOtp}
            style={styles.button}
            loading={isLoading}
            disabled={isLoading}
          >
            {otpSent ? 'Verify OTP' : 'Send OTP'}
          </Button>

          {otpSent && (
            <Button
              mode="text"
              onPress={() => {
                setOtpSent(false);
                setOtp('');
              }}
              style={styles.linkButton}
            >
              Change Email
            </Button>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  inner: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  form: {
    marginTop: 40,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: '#4CAF50',
  },
  linkButton: {
    marginTop: 8,
  },
});
