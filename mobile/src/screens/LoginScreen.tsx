import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    // TODO: Call API to send OTP
    setOtpSent(true);
  };

  const handleVerifyOtp = () => {
    // TODO: Call API to verify OTP
    navigation.replace('Main');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>📚 BookSwap</Text>
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
        />

        {otpSent && (
          <TextInput
            label="Enter OTP"
            value={otp}
            onChangeText={setOtp}
            mode="outlined"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
        )}

        <Button
          mode="contained"
          onPress={otpSent ? handleVerifyOtp : handleSendOtp}
          style={styles.button}
        >
          {otpSent ? 'Verify OTP' : 'Send OTP'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 8,
  },
});
