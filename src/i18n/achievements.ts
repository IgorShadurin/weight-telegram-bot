import type { Language } from '../config.js';

const en = [
  'Operation: Less Sofa', 'Belt Hole Beta', 'Snack Negotiator', 'Scale Whisperer', 'Tiny Gravity Rebellion',
  'Cheek Clearance', 'Fridge Cold War', 'Pants Truce', 'Sweat Equity', 'The Jiggle Audit', 'Second Chin Eviction',
  'Cookie Restraining Order', 'Chair Load Patch', 'Waistline Hotfix', 'Salad Witness Protection', 'Couch Detachment',
  'Belly Buffer Shrunk', 'Socks Visible Again', 'Dessert Diplomacy', 'Stairs Ceasefire', 'Smaller Ass, Bigger Swagger',
  'Forklift License Revoked', 'Mirror Plot Twist', 'Gravity Tax Refund', 'Midpoint Menace', 'The Leaning Capybara',
  'Buckle Victory Lap', 'Fat Cell Farewell', 'Snack Boss Defeated', 'T-Shirt Expansion Pack Removed', 'Knees Send Thanks',
  'Fridge Access Denied', 'Side Profile Upgrade', 'Couch Misses You', 'Jiggle Physics Nerfed', 'Waistline Unlocked',
  'Scale Apology Letter', 'Calorie Crime Scene', 'Pants Need a Tailor', 'Belly Exit Interview', 'Cardio Has Entered Chat',
  'Old Belt Memorial', 'Fat Lost at Sea', 'Mirror Double Take', 'Turbo Capybara', 'Snack Immunity', 'Gravity on Read',
  'Athletic Plot Armor', 'Lean Machine Permit', 'Final Fat Cell Panic', 'Sport Mode Loading', 'Goal Line Predator',
  'Capybara: Final Form',
];

const ru = [
  'Операция «Меньше дивана»', 'Тест новой дырки ремня', 'Переговорщик с перекусом', 'Заклинатель весов', 'Бунт против гравитации',
  'Щёки дают проход', 'Холодная война с холодильником', 'Перемирие со штанами', 'Потовый капитал', 'Аудит тряски', 'Выселение второго подбородка',
  'Судебный запрет печенькам', 'Стул получил патч', 'Хотфикс талии', 'Салат под защитой свидетелей', 'Отстыковка от дивана',
  'Буфер живота уменьшен', 'Носки снова видны', 'Десертная дипломатия', 'Перемирие с лестницей', 'Зад меньше — гонору больше',
  'Лицензия погрузчика отозвана', 'Поворот сюжета в зеркале', 'Возврат налога на гравитацию', 'Угроза экватора', 'Стройнеющая капибара',
  'Победный круг пряжки', 'Прощай, жировая клетка', 'Босс перекусов повержен', 'Дополнение для футболки удалено', 'Колени благодарят',
  'Доступ к холодильнику закрыт', 'Профиль обновлён', 'Диван скучает', 'Физика тряски ослаблена', 'Талия разблокирована',
  'Письмо с извинениями от весов', 'Место преступления калорий', 'Штанам нужен портной', 'Выходное интервью живота', 'Кардио вошло в чат',
  'Мемориал старому ремню', 'Жир потерян в море', 'Зеркало смотрит дважды', 'Турбокапибара', 'Иммунитет к перекусам', 'Гравитация оставлена на прочитанном',
  'Спортивная сюжетная броня', 'Права на стройность', 'Паника последней жировой клетки', 'Спортрежим загружается', 'Хищник финишной линии',
  'Финальная форма капибары',
];

export interface Achievement {
  week: number;
  title: Record<Language, string>;
  optimizedPath: string;
}

export const achievements: Achievement[] = en.map((title, index) => ({
  week: index + 1,
  title: { en: title, ru: ru[index]! },
  optimizedPath: `assets/achievements/optimized/week-${String(index + 1).padStart(2, '0')}.jpg`,
}));

export function achievementForWeek(week: number): Achievement | null {
  return achievements[week - 1] ?? null;
}
