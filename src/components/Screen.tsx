import React from 'react';
import {ScrollView, StyleSheet, View, type ScrollViewProps} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useApp} from '../context/AppContext';

export function Screen({
  children,
  scroll = true,
  padded = true,
  ...rest
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
} & ScrollViewProps) {
  const {theme} = useApp();
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[padded && styles.pad, rest.contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      {...rest}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.pad]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.flex, {backgroundColor: theme.colors.bg}]} edges={['top']}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  pad: {paddingHorizontal: 20, paddingBottom: 40, paddingTop: 8},
});
