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

const zh = [
  '少躺沙发行动', '腰带新孔测试版', '零食谈判专家', '体重秤低语者', '小型重力叛乱',
  '脸颊通道开启', '冰箱冷战', '裤子停战协议', '汗水股权', '抖动审计', '双下巴驱逐令',
  '饼干限制令', '椅子承重补丁', '腰围热修复', '沙拉证人保护', '与沙发脱离',
  '肚腩缓存缩小', '又能看见袜子', '甜点外交', '楼梯停火协议', '屁股更小，气场更大',
  '叉车驾照已吊销', '镜中剧情反转', '重力税退款', '中场威胁', '变瘦的水豚',
  '腰带扣胜利圈', '告别脂肪细胞', '零食Boss已击败', 'T恤扩展包已卸载', '膝盖发来感谢',
  '冰箱访问被拒', '侧脸升级', '沙发想你了', '抖动特效削弱', '腰围已解锁',
  '体重秤道歉信', '卡路里案发现场', '裤子需要裁缝', '肚腩离职面谈', '有氧运动加入群聊',
  '旧腰带纪念碑', '脂肪海上失踪', '镜子看了两遍', '涡轮水豚', '零食免疫', '已读不回重力',
  '运动剧情护甲', '精瘦机器许可证', '最后脂肪细胞恐慌', '运动模式加载中', '终点线猎手',
  '水豚：最终形态',
];

export interface Achievement {
  week: number;
  title: Record<Language, string>;
  optimizedPath: string;
}

export const achievements: Achievement[] = en.map((title, index) => ({
  week: index + 1,
  title: { en: title, ru: ru[index]!, zh: zh[index]! },
  optimizedPath: `assets/achievements/optimized/week-${String(index + 1).padStart(2, '0')}.jpg`,
}));

export function achievementForWeek(week: number): Achievement | null {
  return achievements[week - 1] ?? null;
}
