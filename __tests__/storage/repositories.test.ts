import {createRepositories, memoryStore} from '../../src/storage';

describe('local repositories', () => {
  it('persists a profile and a food entry', async () => {
    const repos = createRepositories(memoryStore());
    await repos.migrate();
    await repos.profile.saveProfile({
      id: 'p1',
      age: 28,
      sex: 'male',
      heightCm: 178,
      currentWeightKg: 74.8,
      startingWeightKg: 77,
      activityLevel: 'light',
      createdAt: '2026-09-06T00:00:00.000Z',
    });
    const profile = await repos.profile.getProfile();
    expect(profile?.currentWeightKg).toBe(74.8);

    await repos.food.upsertFood({
      id: 'f1',
      timestamp: '2026-09-06T08:00:00.000Z',
      name: 'Egg',
      quantity: 3,
      unit: 'piece',
      calories: 210,
      protein: 18,
      carbs: 1,
      fat: 15,
      mealType: 'breakfast',
      source: 'manual',
      estimated: false,
    });
    const foods = await repos.food.listFoods();
    expect(foods).toHaveLength(1);
    expect(foods[0].name).toBe('Egg');
  });

  it('stores API keys in settings on the device, not from env', async () => {
    const repos = createRepositories(memoryStore());
    await repos.migrate();
    const initial = await repos.settings.get();
    expect(initial.groqApiKey).toBe('');
    expect(initial.nvidiaApiKey).toBe('');

    await repos.settings.save({
      ...initial,
      groqApiKey: 'gsk_test_key_value',
      nvidiaApiKey: 'nvapi-test-key-value',
    });
    const loaded = await repos.settings.get();
    expect(loaded.groqApiKey).toBe('gsk_test_key_value');
    expect(loaded.nvidiaApiKey).toBe('nvapi-test-key-value');
  });
});

