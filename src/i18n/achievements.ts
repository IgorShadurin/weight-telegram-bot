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
  '沙发解绑计划', '腰带新孔内测', '零食谈判专家', '体重秤驯兽师', '对重力的小型叛乱',
  '脸颊终于让路', '和冰箱打冷战', '裤腰和平协议', '汗没白流', '赘肉物理检查', '双下巴搬迁通知',
  '饼干限行令', '椅子压力减轻', '腰围紧急修复', '沙拉进入保护名单', '成功脱离沙发引力',
  '肚腩缓存已清理', '低头又能看见袜子', '和甜点的外交谈判', '楼梯暂时停火', '屁股小了，气场大了',
  '叉车驾照作废', '镜子里的剧情反转', '重力税退回到账', '半程狠角色', '正在变瘦的水豚',
  '腰带扣胜利巡游', '脂肪细胞告别会', '零食大魔王已击败', 'T恤扩容包已卸载', '膝盖发来感谢信',
  '冰箱门禁升级', '侧脸版本更新', '沙发开始想你', '赘肉特效已削弱', '腰线正式解锁',
  '体重秤道歉信', '卡路里案发现场', '裤子申请改码', '肚腩离职面谈', '有氧运动加入群聊',
  '旧腰带纪念碑', '脂肪海上失联', '镜子忍不住看两遍', '涡轮水豚', '零食免疫体', '重力消息已读不回',
  '运动主角光环', '精瘦驾驶证', '最后一颗脂肪细胞慌了', '运动模式加载完毕', '终点线捕手',
  '水豚·最终形态',
];

const es = [
  'Operación Menos Sofá', 'Agujero de Cinturón Beta', 'Negociador de Antojos', 'Domador de Básculas', 'Pequeña Rebelión contra la Gravedad',
  'Carril Libre entre Mejillas', 'Guerra Fría con la Nevera', 'Tregua con los Pantalones', 'Sudor Bien Invertido', 'Auditoría del Michelín', 'Desahucio de la Papada',
  'Orden de Alejamiento para Galletas', 'Parche de Carga para la Silla', 'Arreglo Urgente de Cintura', 'Ensalada Bajo Protección', 'Desenganche del Sofá',
  'Caché de Barriga Reducida', 'Calcetines a la Vista', 'Diplomacia con el Postre', 'Alto el Fuego con las Escaleras', 'Menos Culo, Más Chulería',
  'Carné de Carretilla Retirado', 'Giro de Guion en el Espejo', 'Devolución del Impuesto Gravitatorio', 'Amenaza de Medio Camino', 'Capibara en Modo Fino',
  'Vuelta de Honor de la Hebilla', 'Adiós, Célula Grasa', 'Jefe Final del Picoteo Derrotado', 'Expansión de Camiseta Desinstalada', 'Las Rodillas Dan las Gracias',
  'Acceso a la Nevera Denegado', 'Perfil Lateral 2.0', 'El Sofá Te Echa de Menos', 'Física del Bamboleo Nerfeada', 'Cintura Desbloqueada',
  'Carta de Disculpa de la Báscula', 'Escena del Crimen Calórico', 'Los Pantalones Piden Sastre', 'Entrevista de Salida de la Barriga', 'El Cardio Entró al Chat',
  'Monumento al Cinturón Viejo', 'Grasa Perdida en Alta Mar', 'Doble Mirada al Espejo', 'Capibara Turbo', 'Inmunidad al Picoteo', 'Gravedad en Visto',
  'Armadura de Protagonista Deportivo', 'Licencia para Estar Fino', 'Pánico de la Última Célula Grasa', 'Modo Deporte Cargado', 'Cazador de la Meta',
  'Capibara: Forma Final',
];

const pt = [
  'Operação Menos Sofá', 'Furo Novo do Cinto Beta', 'Diplomata do Lanchinho', 'Encantador de Balanças', 'Pequena Rebelião contra a Gravidade',
  'Bochechas Liberando Passagem', 'Guerra Fria com a Geladeira', 'Trégua com a Calça', 'Suor que Virou Patrimônio', 'Auditoria da Gordurinha', 'Despejo do Queixo Duplo',
  'Medida Protetiva contra Biscoito', 'Patch de Carga da Cadeira', 'Hotfix da Cintura', 'Salada sob Proteção', 'Desgrude do Sofá',
  'Cache da Barriga Reduzido', 'Meias Visíveis de Novo', 'Diplomacia da Sobremesa', 'Cessar-Fogo com a Escada', 'Menos Bunda, Mais Presença',
  'CNH da Empilhadeira Cassada', 'Plot Twist no Espelho', 'Restituição do Imposto da Gravidade', 'Ameaça do Meio do Caminho', 'Capivara Afinando',
  'Volta da Vitória da Fivela', 'Tchau, Célula de Gordura', 'Chefão do Lanchinho Derrotado', 'Pacote de Expansão da Camiseta Removido', 'Os Joelhos Agradecem',
  'Acesso à Geladeira Negado', 'Perfil Lateral Atualizado', 'O Sofá Está com Saudade', 'Física da Balançada Nerfada', 'Cintura Desbloqueada',
  'Carta de Desculpas da Balança', 'Cena do Crime Calórico', 'A Calça Pediu um Alfaiate', 'Entrevista de Saída da Barriga', 'O Cardio Entrou no Grupo',
  'Memorial do Cinto Antigo', 'Gordura Perdida em Alto-Mar', 'O Espelho Olhou Duas Vezes', 'Capivara Turbo', 'Imunidade ao Lanchinho', 'Gravidade no Vácuo',
  'Armadura de Protagonista Fitness', 'Carteirinha de Corpo Leve', 'Pânico da Última Célula de Gordura', 'Modo Esporte Carregado', 'Caçador da Linha de Chegada',
  'Capivara: Forma Final',
];

const de = [
  'Operation Weniger Sofa', 'Neues Gürtelloch Beta', 'Snack-Verhandlungsprofi', 'Waagenflüsterer', 'Kleine Rebellion gegen die Schwerkraft',
  'Freie Bahn zwischen den Wangen', 'Kalter Krieg mit dem Kühlschrank', 'Hosen-Waffenstillstand', 'Schweiß mit Rendite', 'Wackelzonen-Audit', 'Doppelkinn-Räumung',
  'Kontaktverbot für Kekse', 'Belastungsupdate für den Stuhl', 'Taillen-Hotfix', 'Salat im Zeugenschutz', 'Vom Sofa abgekoppelt',
  'Bauchspeicher verkleinert', 'Socken wieder sichtbar', 'Dessert-Diplomatie', 'Frieden mit der Treppe', 'Weniger Hintern, mehr Haltung',
  'Staplerschein eingezogen', 'Plot-Twist im Spiegel', 'Schwerkraftsteuer erstattet', 'Halbzeit-Schreck', 'Capybara auf Schlankkurs',
  'Siegesrunde der Gürtelschnalle', 'Leb wohl, Fettzelle', 'Snack-Endgegner besiegt', 'T-Shirt-Erweiterung deinstalliert', 'Die Knie sagen Danke',
  'Kühlschrank-Zutritt verweigert', 'Seitenprofil-Update', 'Das Sofa vermisst dich', 'Wackelphysik abgeschwächt', 'Taille freigeschaltet',
  'Entschuldigungsschreiben der Waage', 'Kalorien-Tatort', 'Die Hose braucht einen Schneider', 'Abschiedsgespräch mit dem Bauch', 'Cardio ist dem Chat beigetreten',
  'Denkmal für den alten Gürtel', 'Fett auf hoher See verschollen', 'Der Spiegel schaut zweimal hin', 'Turbo-Capybara', 'Snack-Immunität', 'Schwerkraft auf Gelesen',
  'Sportliche Plot-Rüstung', 'Lizenz zum Leichtsein', 'Panik der letzten Fettzelle', 'Sportmodus geladen', 'Jäger der Ziellinie',
  'Capybara: Endform',
];

const fr = [
  'Opération Moins de Canapé', 'Nouveau Trou de Ceinture Bêta', 'Négociateur de Grignotage', 'Dompteur de Balance', 'Petite Révolte contre la Gravité',
  'Passage Libéré entre les Joues', 'Guerre Froide avec le Frigo', 'Trêve avec le Pantalon', 'Capital Transpiration', 'Audit du Flottement', 'Expulsion du Double Menton',
  'Ordonnance Anti-Biscuit', 'Mise à Jour de Charge de la Chaise', 'Correctif Express de la Taille', 'Salade sous Protection', 'Décrochage du Canapé',
  'Cache du Ventre Réduit', 'Chaussettes à Nouveau Visibles', 'Diplomatie du Dessert', 'Cessez-le-feu avec l’Escalier', 'Moins de Fesses, Plus de Panache',
  'Permis de Chariot Élévateur Retiré', 'Rebondissement dans le Miroir', 'Remboursement de la Taxe Gravité', 'Menace de Mi-Parcours', 'Capybara qui s’Affine',
  'Tour d’Honneur de la Boucle', 'Adieu, Cellule Grasse', 'Boss du Grignotage Terrassé', 'Extension de T-shirt Désinstallée', 'Les Genoux Disent Merci',
  'Accès au Frigo Refusé', 'Profil de Côté Mis à Jour', 'Le Canapé s’Ennuie de Toi', 'Physique du Flottement Nerfée', 'Taille Débloquée',
  'Lettre d’Excuses de la Balance', 'Scène de Crime Calorique', 'Le Pantalon Réclame un Tailleur', 'Entretien de Départ du Ventre', 'Le Cardio a Rejoint le Chat',
  'Mémorial de l’Ancienne Ceinture', 'Graisse Perdue en Mer', 'Le Miroir Regarde Deux Fois', 'Capybara Turbo', 'Immunité au Grignotage', 'Gravité Laissée en Vu',
  'Armure de Héros Sportif', 'Permis de Légèreté', 'Panique de la Dernière Cellule Grasse', 'Mode Sport Chargé', 'Chasseur de Ligne d’Arrivée',
  'Capybara : Forme Finale',
];

const ja = [
  '脱ソファ作戦', 'ベルト穴ベータ版', 'おやつ交渉人', '体重計の調教師', '重力への小さな反乱',
  'ほっぺ通行許可', '冷蔵庫と冷戦中', 'ズボンと休戦協定', '汗は裏切らない', 'ぷるぷる監査', '二重あご退去命令',
  'クッキー接近禁止令', '椅子の負荷軽減パッチ', 'ウエスト緊急修正', 'サラダ証人保護制度', 'ソファの引力を脱出',
  'お腹のキャッシュ削減', '靴下ふたたび発見', 'デザート外交', '階段と一時停戦', 'お尻は小さく、存在感は大きく',
  'フォークリフト免許返納', '鏡の中の急展開', '重力税の還付', '折り返しの強敵', 'すっきりカピバラ',
  'ベルト穴の凱旋', 'さらば脂肪細胞', 'おやつボス撃破', 'Tシャツ拡張パック削除', 'ひざから感謝状',
  '冷蔵庫アクセス拒否', '横顔アップデート', 'ソファが恋しがる頃', 'ぷるぷる物理を弱体化', 'ウエストライン解放',
  '体重計からの謝罪文', 'カロリー事件現場', 'ズボンが仕立て直しを希望', 'お腹の退職面談', '有酸素運動が入室しました',
  '古いベルト記念碑', '脂肪、海上で消息不明', '鏡が二度見', 'ターボ・カピバラ', 'おやつ耐性獲得', '重力を既読スルー',
  'スポーツ主人公補正', '軽やかライセンス', '最後の脂肪細胞が動揺', 'スポーツモード起動完了', 'ゴールライン・ハンター',
  'カピバラ最終形態',
];

const id = [
  'Operasi Kurangi Rebahan', 'Lubang Sabuk Versi Beta', 'Diplomat Camilan', 'Penjinak Timbangan', 'Pemberontakan Kecil Melawan Gravitasi',
  'Jalur Pipi Dibuka', 'Perang Dingin dengan Kulkas', 'Gencatan Senjata dengan Celana', 'Keringat Jadi Aset', 'Audit Goyangan', 'Surat Penggusuran Dagu Dua',
  'Perintah Jaga Jarak untuk Biskuit', 'Patch Beban Kursi', 'Perbaikan Darurat Pinggang', 'Salad dalam Perlindungan Saksi', 'Lepas dari Tarikan Sofa',
  'Cache Perut Diperkecil', 'Kaus Kaki Terlihat Lagi', 'Diplomasi Pencuci Mulut', 'Damai Sementara dengan Tangga', 'Pantat Mengecil, Aura Membesar',
  'SIM Forklift Dicabut', 'Plot Twist di Cermin', 'Pajak Gravitasi Dikembalikan', 'Jagoan Tengah Perjalanan', 'Kapibara Makin Ramping',
  'Pawai Kemenangan Kepala Sabuk', 'Selamat Tinggal Sel Lemak', 'Bos Camilan Dikalahkan', 'Paket Ekspansi Kaus Dihapus', 'Lutut Mengirim Terima Kasih',
  'Akses Kulkas Ditolak', 'Profil Samping Diperbarui', 'Sofa Mulai Kangen', 'Fisika Goyangan Dilemahkan', 'Garis Pinggang Terbuka',
  'Surat Maaf dari Timbangan', 'TKP Kalori', 'Celana Minta Penjahit', 'Wawancara Keluar Perut', 'Kardio Masuk Grup',
  'Monumen Sabuk Lama', 'Lemak Hilang di Laut', 'Cermin Menoleh Dua Kali', 'Kapibara Turbo', 'Kebal Camilan', 'Gravitasi Cuma Dibaca',
  'Plot Armor Atletis', 'Lisensi Badan Ringan', 'Panik Sel Lemak Terakhir', 'Mode Olahraga Aktif', 'Pemburu Garis Akhir',
  'Kapibara: Wujud Terakhir',
];

export interface Achievement {
  week: number;
  title: Record<Language, string>;
  optimizedPath: string;
}

export const achievements: Achievement[] = en.map((title, index) => ({
  week: index + 1,
  title: {
    en: title, ru: ru[index]!, zh: zh[index]!, es: es[index]!, pt: pt[index]!, de: de[index]!,
    fr: fr[index]!, ja: ja[index]!, id: id[index]!,
  },
  optimizedPath: `assets/achievements/optimized/week-${String(index + 1).padStart(2, '0')}.jpg`,
}));

export function achievementForWeek(week: number): Achievement | null {
  return achievements[week - 1] ?? null;
}
