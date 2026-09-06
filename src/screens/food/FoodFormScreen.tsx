import React, {useState} from 'react';
import {Alert, StyleSheet, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Button} from '../../components/Button';
import {Screen} from '../../components/Screen';
import {VoiceField} from '../../components/VoiceField';
import {inferMealType, useApp} from '../../context/AppContext';
import {useVoice} from '../../context/VoiceContext';
import type {RootStackParamList} from '../../navigation/types';
import type {FoodEntry, FoodUnit, MealType} from '../../types';

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

export function FoodFormScreen({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParamList, 'FoodForm'>) {
  const {foods, addFoods, updateFood, deleteFood, saveFoodTemplate} = useApp();
  const {logAnything} = useVoice();
  const existing = foods.find(item => item.id === route.params.id);
  const [name, setName] = useState(existing?.name ?? '');
  const [quantity, setQuantity] = useState(existing?.quantity?.toString() ?? '');
  const [unit, setUnit] = useState<string>(existing?.unit ?? 'g');
  const [calories, setCalories] = useState(existing?.calories?.toString() ?? '');
  const [protein, setProtein] = useState(existing?.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(existing?.carbs?.toString() ?? '');
  const [fat, setFat] = useState(existing?.fat?.toString() ?? '');
  const [mealType, setMealType] = useState<MealType>(existing?.mealType ?? inferMealType());

  const payload: Omit<FoodEntry, 'id'> = {
    timestamp: existing?.timestamp ?? new Date().toISOString(),
    name,
    quantity: quantity ? Number(quantity) : null,
    unit: (unit || 'g') as FoodUnit,
    calories: Number(calories) || 0,
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    mealType,
    source: existing?.source ?? 'manual',
    estimated: existing?.estimated ?? false,
    savedFoodId: existing?.savedFoodId,
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name needed');
      return;
    }
    if (existing) {
      await updateFood({...existing, ...payload});
    } else {
      await addFoods([payload]);
    }
    navigation.goBack();
  };

  return (
    <Screen>
      <VoiceField
        label="Food"
        value={name}
        onChangeText={setName}
        onVoice={() =>
          logAnything({
            expectedIntent: 'food',
            fieldKind: 'text',
            onFieldValue: value => setName(String(value)),
          })
        }
      />
      <VoiceField
        label="Quantity"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
        onVoice={() =>
          logAnything({
            fieldKind: 'quantity',
            onFieldValue: value => setQuantity(String(value)),
          })
        }
      />
      <VoiceField label="Unit" value={unit} onChangeText={setUnit} onVoice={() => undefined} />
      <VoiceField
        label="Calories"
        value={calories}
        onChangeText={setCalories}
        keyboardType="number-pad"
        onVoice={() =>
          logAnything({
            fieldKind: 'calories',
            onFieldValue: value => setCalories(String(value)),
          })
        }
      />
      <VoiceField
        label="Protein (g)"
        value={protein}
        onChangeText={setProtein}
        keyboardType="decimal-pad"
        onVoice={() =>
          logAnything({
            fieldKind: 'protein',
            onFieldValue: value => setProtein(String(value)),
          })
        }
      />
      <VoiceField
        label="Carbs (g)"
        value={carbs}
        onChangeText={setCarbs}
        keyboardType="decimal-pad"
        onVoice={() =>
          logAnything({
            fieldKind: 'carbs',
            onFieldValue: value => setCarbs(String(value)),
          })
        }
      />
      <VoiceField
        label="Fat (g)"
        value={fat}
        onChangeText={setFat}
        keyboardType="decimal-pad"
        onVoice={() =>
          logAnything({
            fieldKind: 'fat',
            onFieldValue: value => setFat(String(value)),
          })
        }
      />
      <View style={styles.row}>
        {MEALS.map(meal => (
          <View key={meal} style={styles.chip}>
            <Button
              label={meal}
              variant={mealType === meal ? 'primary' : 'ghost'}
              onPress={() => setMealType(meal)}
            />
          </View>
        ))}
      </View>
      <View style={styles.stack}>
        <Button label={existing ? 'Save changes' : 'Add food'} onPress={save} />
        <Button
          label="Save as food"
          variant="secondary"
          onPress={() =>
            saveFoodTemplate({
              name,
              defaultQuantity: Number(quantity) || 1,
              unit: (unit || 'g') as 'g',
              calories: Number(calories) || 0,
              protein: Number(protein) || 0,
              carbs: Number(carbs) || 0,
              fat: Number(fat) || 0,
              aliases: [],
            })
          }
        />
        {existing ? (
          <Button
            label="Delete"
            variant="danger"
            onPress={() =>
              Alert.alert('Delete this food?', name, [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await deleteFood(existing.id);
                    navigation.goBack();
                  },
                },
              ])
            }
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12},
  chip: {minWidth: 96},
  stack: {gap: 10, marginTop: 8},
});
