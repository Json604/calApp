import React from 'react';
import {Alert, Text} from 'react-native';
import {Button} from '../../components/Button';
import {Card} from '../../components/Card';
import {EmptyState} from '../../components/EmptyState';
import {Screen} from '../../components/Screen';
import {useApp} from '../../context/AppContext';

export function SavedFoodsScreen() {
  const {theme, savedFoods, deleteSavedFood} = useApp();
  return (
    <Screen>
      <Text style={{color: theme.colors.ink, fontSize: 28, fontWeight: '600', marginBottom: 16}}>
        Saved foods
      </Text>
      {savedFoods.length === 0 ? (
        <EmptyState title="None yet" body="Save a corrected food so voice can reuse your numbers." />
      ) : (
        savedFoods.map(food => (
          <Card key={food.id}>
            <Text style={{color: theme.colors.ink, fontWeight: '600'}}>{food.name}</Text>
            <Text style={{color: theme.colors.muted, marginTop: 4}}>
              {food.defaultQuantity} {food.unit} · {food.calories} kcal · {food.protein}p
            </Text>
            <Button
              label="Delete"
              variant="ghost"
              onPress={() =>
                Alert.alert('Remove saved food?', food.name, [
                  {text: 'Cancel', style: 'cancel'},
                  {text: 'Delete', style: 'destructive', onPress: () => deleteSavedFood(food.id)},
                ])
              }
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
