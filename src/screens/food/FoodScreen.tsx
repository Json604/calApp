import React, {useMemo, useState} from 'react';
import {Alert, StyleSheet, Text, View} from 'react-native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Input} from '../../components/Input';
import {Screen} from '../../components/Screen';
import {SectionHeader} from '../../components/SectionHeader';
import {useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import {todayKey, yesterdayKey} from '../../utils/dates';
import {inferMealType} from '../../context/AppContext';

export function FoodScreen({
  navigation,
}: {
  navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const {theme, foods, savedFoods, savedMeals, addFoods, deleteFood} = useApp();
  const {logAnything} = useVoice();
  const [query, setQuery] = useState('');
  const today = todayKey();
  const todayFoods = foods.filter(item => item.timestamp.startsWith(today));
  const recents = useMemo(() => {
    const seen = new Set<string>();
    return foods.filter(item => {
      const key = item.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return query ? key.includes(query.toLowerCase()) : true;
    }).slice(0, 8);
  }, [foods, query]);

  const copyYesterday = async (meal?: 'breakfast' | 'lunch' | 'dinner') => {
    const y = yesterdayKey();
    const items = foods.filter(
      item => item.timestamp.startsWith(y) && (!meal || item.mealType === meal),
    );
    if (items.length === 0) {
      Alert.alert('Nothing to copy', 'No matching meal from yesterday.');
      return;
    }
    await addFoods(
      items.map(item => ({
        ...item,
        timestamp: new Date().toISOString(),
        source: 'copied',
      })),
    );
  };

  return (
    <Screen>
      <Text style={[styles.title, {color: theme.colors.ink}]}>Food</Text>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button label="Add food" onPress={() => navigation.navigate('FoodForm', {})} />
        </View>
        <View style={styles.flex}>
          <Button label="Voice" variant="secondary" onPress={() => logAnything({expectedIntent: 'food'})} />
        </View>
      </View>
      <Input placeholder="Search recents and saved" value={query} onChangeText={setQuery} />
      <SectionHeader title="Today" />
      {todayFoods.length === 0 ? (
        <EmptyState title="No food yet" body="Log a meal manually or by voice." />
      ) : (
        todayFoods.map(item => (
          <Card
            key={item.id}
            onPress={() => navigation.navigate('FoodForm', {id: item.id})}>
            <View style={styles.between}>
              <Text style={[styles.item, {color: theme.colors.ink}]}>{item.name}</Text>
              <Text style={{color: theme.colors.muted}}>{item.calories} kcal</Text>
            </View>
            <Text style={{color: theme.colors.faint, marginTop: 4}}>
              {item.mealType} · {item.quantity ?? '?'} {item.unit}
            </Text>
            <View style={styles.row}>
              <Button
                label="Duplicate"
                variant="ghost"
                onPress={() =>
                  addFoods([{...item, timestamp: new Date().toISOString(), source: 'copied'}])
                }
              />
              <Button
                label="Delete"
                variant="ghost"
                onPress={() =>
                  Alert.alert('Delete food?', item.name, [
                    {text: 'Cancel', style: 'cancel'},
                    {text: 'Delete', style: 'destructive', onPress: () => deleteFood(item.id)},
                  ])
                }
              />
            </View>
          </Card>
        ))
      )}
      <SectionHeader title="Quick copy" />
      <View style={styles.row}>
        <Button label="Yesterday" variant="secondary" onPress={() => copyYesterday()} />
        <Button label="Breakfast" variant="ghost" onPress={() => copyYesterday('breakfast')} />
      </View>
      <SectionHeader title="Recents" action="Saved" onAction={() => navigation.navigate('SavedFoods')} />
      {recents.map(item => (
        <Card
          key={item.id + item.name}
          onPress={() =>
            addFoods([
              {
                timestamp: new Date().toISOString(),
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                mealType: inferMealType(),
                source: 'saved',
                estimated: item.estimated,
                savedFoodId: item.savedFoodId,
              },
            ])
          }>
          <Text style={[styles.item, {color: theme.colors.ink}]}>{item.name}</Text>
          <Text style={{color: theme.colors.muted}}>{item.calories} kcal</Text>
        </Card>
      ))}
      {savedMeals.length > 0 ? (
        <>
          <SectionHeader title="Saved meals" />
          {savedMeals.map(meal => (
            <Card
              key={meal.id}
              onPress={() =>
                addFoods(
                  meal.items.map(item => ({
                    ...item,
                    timestamp: new Date().toISOString(),
                    mealType: inferMealType(),
                  })),
                )
              }>
              <Text style={[styles.item, {color: theme.colors.ink}]}>{meal.name}</Text>
            </Card>
          ))}
        </>
      ) : null}
      {savedFoods.length > 0 ? (
        <>
          <SectionHeader title="Saved foods" />
          {savedFoods
            .filter(food =>
              query ? food.name.toLowerCase().includes(query.toLowerCase()) : true,
            )
            .map(food => (
              <Card
                key={food.id}
                onPress={() =>
                  addFoods([
                    {
                      timestamp: new Date().toISOString(),
                      name: food.name,
                      quantity: food.defaultQuantity,
                      unit: food.unit,
                      calories: food.calories,
                      protein: food.protein,
                      carbs: food.carbs,
                      fat: food.fat,
                      mealType: inferMealType(),
                      source: 'saved',
                      estimated: false,
                      savedFoodId: food.id,
                    },
                  ])
                }>
                <Text style={[styles.item, {color: theme.colors.ink}]}>{food.name}</Text>
              </Card>
            ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 32, fontWeight: '600', marginBottom: 16},
  row: {flexDirection: 'row', gap: 8, marginBottom: 12},
  flex: {flex: 1},
  between: {flexDirection: 'row', justifyContent: 'space-between'},
  item: {fontSize: 16, fontWeight: '600'},
});
