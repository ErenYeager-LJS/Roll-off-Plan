export const DEFAULT_TARGETS = {
  calories: { min: 2000, max: 2200 },
  protein: { min: 95, max: 115 },
  carbs: { min: 260, max: 330 },
  fat: { min: 55, max: 75 },
};

export const MEAL_LABELS = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
};

export const BUILT_IN_FOODS = [
  { id: "egg", name: "鸡蛋", category: "蛋白质", serving: "1个约50g", defaultGrams: 50, calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { id: "milk-lowfat", name: "低脂牛奶", category: "蛋白质", serving: "250ml", defaultGrams: 250, calories: 43, protein: 3.4, carbs: 5.2, fat: 1.0 },
  { id: "chicken-breast", name: "鸡胸肉", category: "蛋白质", serving: "熟重100g", defaultGrams: 100, calories: 165, protein: 31.0, carbs: 0, fat: 3.6 },
  { id: "shrimp", name: "虾仁", category: "蛋白质", serving: "熟重120g", defaultGrams: 120, calories: 99, protein: 24.0, carbs: 0.2, fat: 0.3 },
  { id: "beef-lean", name: "瘦牛肉", category: "蛋白质", serving: "熟重100g", defaultGrams: 100, calories: 188, protein: 30.3, carbs: 0, fat: 6.4 },
  { id: "pork-tenderloin", name: "猪里脊", category: "蛋白质", serving: "熟重100g", defaultGrams: 100, calories: 143, protein: 26.2, carbs: 0, fat: 3.5 },
  { id: "fish", name: "少刺鱼", category: "蛋白质", serving: "130g", defaultGrams: 130, calories: 120, protein: 18.0, carbs: 0, fat: 4.0 },
  { id: "squid", name: "鱿鱼", category: "蛋白质", serving: "120g", defaultGrams: 120, calories: 92, protein: 15.6, carbs: 3.1, fat: 1.4 },
  { id: "brown-rice", name: "糙米饭", category: "主食", serving: "熟重150g", defaultGrams: 150, calories: 112, protein: 2.3, carbs: 23.5, fat: 0.8 },
  { id: "potato", name: "土豆", category: "主食", serving: "熟重200g", defaultGrams: 200, calories: 86, protein: 1.7, carbs: 20.0, fat: 0.1 },
  { id: "corn", name: "玉米", category: "主食", serving: "熟重150g", defaultGrams: 150, calories: 96, protein: 3.4, carbs: 21.0, fat: 1.5 },
  { id: "buckwheat-noodle", name: "荞麦面", category: "主食", serving: "熟重220g", defaultGrams: 220, calories: 105, protein: 5.0, carbs: 22.0, fat: 0.7 },
  { id: "broccoli", name: "西兰花", category: "蔬菜", serving: "熟重250g", defaultGrams: 250, calories: 35, protein: 2.4, carbs: 7.2, fat: 0.4 },
  { id: "lettuce", name: "生菜", category: "蔬菜", serving: "100g", defaultGrams: 100, calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  { id: "lettuce-stem", name: "莴笋", category: "蔬菜", serving: "200g", defaultGrams: 200, calories: 15, protein: 1.0, carbs: 3.0, fat: 0.1 },
  { id: "enoki", name: "金针菇", category: "蔬菜", serving: "150g", defaultGrams: 150, calories: 37, protein: 2.7, carbs: 7.8, fat: 0.3 },
  { id: "tomato", name: "番茄", category: "蔬菜", serving: "150g", defaultGrams: 150, calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: "carrot", name: "胡萝卜丁", category: "蔬菜", serving: "50g", defaultGrams: 50, calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 },
  { id: "onion", name: "洋葱丝", category: "蔬菜", serving: "50g", defaultGrams: 50, calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  { id: "cooking-oil", name: "食用油", category: "调味料", serving: "10g", defaultGrams: 10, calories: 884, protein: 0, carbs: 0, fat: 100 },
  { id: "soy-sauce", name: "生抽/酱油", category: "调味料", serving: "10g", defaultGrams: 10, calories: 53, protein: 8.0, carbs: 4.9, fat: 0.1 },
  { id: "oyster-sauce", name: "蚝油", category: "调味料", serving: "10g", defaultGrams: 10, calories: 114, protein: 3.5, carbs: 22.0, fat: 0.3 },
  { id: "cooking-wine", name: "料酒", category: "调味料", serving: "10g", defaultGrams: 10, calories: 66, protein: 0.3, carbs: 3.0, fat: 0 },
  { id: "garlic-paste", name: "蒜泥", category: "调味料", serving: "10g", defaultGrams: 10, calories: 149, protein: 6.4, carbs: 33.1, fat: 0.5 },
  { id: "cumin-powder", name: "孜然粉", category: "调味料", serving: "2g", defaultGrams: 2, calories: 375, protein: 18.0, carbs: 44.0, fat: 22.0 },
  { id: "sugar", name: "白糖", category: "调味料", serving: "5g", defaultGrams: 5, calories: 400, protein: 0, carbs: 100, fat: 0 },
  { id: "starch", name: "淀粉", category: "调味料", serving: "10g", defaultGrams: 10, calories: 350, protein: 0.2, carbs: 86.0, fat: 0.1 },
];
