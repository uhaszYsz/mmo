// ===================================================================================
// --- GAME CONFIGURATION ---
// ===================================================================================
const CONFIG = {
    // General Settings
    MAP_SIZE: 20,
    GAME_TICK: 200, // ms
    MAX_ATTACKERS: 5,
    BATTLEFIELDS_PER_CELL: 4,
    GAME_SEED: 'a-secret-seed-for-consistent-spawns',
    RATE_LIMIT_MS: 200, // Allow 5 actions per second
    CHAT_MESSAGE_LIMIT: 500, // Maximum number of chat messages to keep

    // Biome Settings
    BIOMES: {
        FOREST: {
            name: 'Forest',
            color: 'bg-green-600',
            borderColor: 'border-green-700',
            textColor: 'text-green-100',
            description: 'Lush forests with abundant wildlife and resources.'
        },
        DESERT: {
            name: 'Desert',
            color: 'bg-yellow-500',
            borderColor: 'border-yellow-600',
            textColor: 'text-yellow-900',
            description: 'Harsh deserts with scorching heat and hidden treasures.'
        },
        VOLCANIC: {
            name: 'Volcanic',
            color: 'bg-red-700',
            borderColor: 'border-red-800',
            textColor: 'text-red-100',
            description: 'Dangerous volcanic regions with fire-based creatures.'
        },
        ARCTIC: {
            name: 'Arctic',
            color: 'bg-blue-300',
            borderColor: 'border-blue-400',
            textColor: 'text-blue-900',
            description: 'Frozen arctic lands with ice and snow creatures.'
        }
    },
    BIOME_GENERATION: {
        NOISE_SCALE: 0.15,
        BIOME_SIZE: 8,
        BIOME_BLEND: 0.1
    },

    // Team Settings
    DEFAULT_TEAM_ID: 'team_noobs',
    DEFAULT_TEAM_NAME: 'Noobs',
    DEFAULT_TEAM_COLOR: 'gray-500',
    TEAM_COLORS: ['blue-600', 'red-600', 'green-500', 'yellow-500', 'purple-600', 'pink-600', 'indigo-500', 'teal-500'],

    // Player Settings
    PLAYER_DEFAULT_STATS: { hp: 100, maxHp: 100, mp: 50, maxMp: 50, stamina: 500, maxStamina: 500, dmg: 5, speed: 1, critical: 5, dodge: 5 },
    PLAYER_DEFAULT_INVENTORY: [
        { name: 'Rusty Sword', type: 'equipment', slot: 'hand', stats: { dmg: 2, speed: 0.1 }, level: 1, quality: 'Common', description: 'A basic sword.' },
        { name: 'Leather Tunic', type: 'equipment', slot: 'chest', stats: { maxHp: 100 }, level: 1, quality: 'Common', description: 'Simple leather armor.' },
        { name: 'Brick', type: 'material', quantity: 100, level: 1, quality: 'Common', description: 'A sturdy brick, used for construction.' },
        { name: 'Minor Health Potion', type: 'consumable', effects: { replenish: 'hp', value: 25 }, level: 1, quality: 'Common', description: 'Restores 25% of your max HP.'}
    ],
    PLAYER_DEFAULT_SKILLS: {
        hp: { level: 1, exp: 0 },
        heal: { level: 1, exp: 0 },
        woodcutting: { level: 1, exp: 0 },
        carpentry: { level: 1, exp: 0 },
        mining: { level: 1, exp: 0 },
        smithing: { level: 1, exp: 0 },
        engineering: { level: 1, exp: 0 },
        construction: { level: 1, exp: 0 },
        hunting: { level: 1, exp: 0 },
        battle: { level: 1, exp: 0 }
    },
    PLAYER_NAME_MIN_LENGTH: 3,
    PLAYER_NAME_MAX_LENGTH: 15,

    // Combat Settings
    PLAYER_STAMINA_COST_PER_ATTACK: 1,
    DODGE_CHANCE_STAT: 'dodge',
    CRITICAL_CHANCE_STAT: 'critical',
    CRITICAL_DAMAGE_MULTIPLIER: 2,
    SKILL_DAMAGE_BONUS_PER_LEVEL: 0.01, // 1% per level

    // Construction Settings
    CONSTRUCTION_BASE_HP: 100,
    CONSTRUCTION_BASE_BRICKS_REQUIRED: 10,
    CONSTRUCTION_TIME_PER_BRICK: 10000, // 10 seconds per brick
    
    // --- BUILDING TEMPLATES ---
    BUILDING_TEMPLATES: {
        'Storage': { 
            type: 'storage',
            description: 'Increases team storage capacity.', 
            bricks: 50 
        },
        'Personal Storage': { 
            type: 'personal_storage',
            description: 'A small, private stash for an individual.', 
            bricks: 20 
        },
        'Carpentry Workshop': { 
            type: 'crafting',
            description: 'Craft wooden items and siege weapons.', 
            bricks: 100,
            recipeIds: [0] // Wooden Shield
        },
        'Smithing Workshop': { 
            type: 'crafting',
            description: 'Forge metal armor and weapons.', 
            bricks: 100,
            recipeIds: [1, 3] // Iron Sword, Steel Armor
        },
        'Brewing Workshop': { 
            type: 'crafting',
            description: 'Create powerful potions.', 
            bricks: 75,
            recipeIds: [2, 4] // Health Potion, Magic Scroll
        },
        'Kitchen': { 
            type: 'crafting',
            description: 'Cook food for long-lasting buffs.', 
            bricks: 75,
            recipeIds: [] 
        }
    },

    // --- CRAFTING RECIPES ---
    CRAFTING_RECIPES: [
        {
            id: 0,
            name: "Wooden Shield",
            building: "Carpentry Workshop",
            materials: [{ name: 'Brick', quantity: 10 }], // Using bricks as placeholder for wood
            result: { name: 'Wooden Shield', type: 'equipment', slot: 'hand', stats: { maxHp: 50 }, level: 1, quality: 'Common', description: 'A simple wooden shield.' },
            craftingTime: 10000 // 10 seconds
        },
        {
            id: 1,
            name: "Iron Sword",
            building: "Smithing Workshop",
            materials: [{ name: 'Brick', quantity: 25 }], // Using bricks as placeholder for iron
            result: { name: 'Iron Sword', type: 'equipment', slot: 'hand', stats: { dmg: 8, speed: 0.2 }, level: 5, quality: 'Uncommon', description: 'A sturdy iron sword.' },
            craftingTime: 15000 // 15 seconds
        },
        {
            id: 2,
            name: "Health Potion",
            building: "Brewing Workshop",
            materials: [{ name: 'Brick', quantity: 5 }], // Using bricks as placeholder for herbs
            result: { name: 'Health Potion', type: 'consumable', effects: { replenish: 'hp', value: 50 }, level: 1, quality: 'Common', description: 'Restores 50 HP.' },
            craftingTime: 5000 // 5 seconds
        },
        {
            id: 3,
            name: "Steel Armor",
            building: "Smithing Workshop",
            materials: [{ name: 'Brick', quantity: 30 }], // Using bricks as placeholder for steel
            result: { name: 'Steel Armor', type: 'equipment', slot: 'chest', stats: { maxHp: 200, dmg: 2 }, level: 10, quality: 'Rare', description: 'Heavy steel armor providing excellent protection.' },
            craftingTime: 25000 // 25 seconds
        },
        {
            id: 4,
            name: "Magic Scroll",
            building: "Brewing Workshop",
            materials: [{ name: 'Brick', quantity: 15 }], // Using bricks as placeholder for magical ingredients
            result: { name: 'Magic Scroll', type: 'scroll', effects: { buff: { stat: 'dmg', percentage: 50, duration: 30000 } }, level: 1, quality: 'Uncommon', description: 'Temporarily increases damage by 50% for 30 seconds.' },
            craftingTime: 20000 // 20 seconds
        }
    ],

    // Siege Machine Settings
    SIEGE_MACHINE_COST: 10, // bricks
    SIEGE_MACHINE_HP: 300,
    SIEGE_MACHINE_DAMAGE: 10, // damage per second
    SIEGE_MACHINE_SELF_DAMAGE: 10, // self-damage per second

    // Enemy Settings
    ENEMY_RESPAWN_TIME: 5000, // 5 seconds
    ENEMY_STAT_SCALING_PER_LEVEL: 0.10, // 10% increase per level

    // --- ENEMY DEFINITIONS ---
    ENEMY_TEMPLATES: [
        // Forest Biome Monsters
        { name: 'Goblin Scout', rarity: 60, baseStats: { hp: 25, dmg: 3, speed: 1.2 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Leather Scraps', type: 'material', chance: 0.8, quantity: [1, 3], level: 1, quality: 'Common', description: 'Tough leather pieces.' }] },
        { name: 'Wolf', rarity: 70, baseStats: { hp: 40, dmg: 6, speed: 1.5 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Wolf Fang', type: 'material', chance: 0.6, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Sharp wolf fang.' }] },
        { name: 'Bear', rarity: 40, baseStats: { hp: 120, dmg: 12, speed: 0.8 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Bear Claw', type: 'material', chance: 0.7, quantity: [1, 3], level: 1, quality: 'Uncommon', description: 'Sharp bear claw.' }] },
        { name: 'Spider', rarity: 45, baseStats: { hp: 80, dmg: 10, speed: 1.3 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Spider Silk', type: 'material', chance: 0.6, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Strong spider silk.' }] },
        { name: 'Ant', rarity: 65, baseStats: { hp: 30, dmg: 4, speed: 1.6 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Ant Mandible', type: 'material', chance: 0.7, quantity: [1, 2], level: 1, quality: 'Common', description: 'Sharp ant mandible.' }] },
        { name: 'Bee', rarity: 60, baseStats: { hp: 25, dmg: 5, speed: 1.7 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Bee Stinger', type: 'material', chance: 0.8, quantity: [1, 1], level: 1, quality: 'Common', description: 'Sharp bee stinger.' }] },
        { name: 'Wasp', rarity: 50, baseStats: { hp: 35, dmg: 6, speed: 1.8 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Wasp Venom', type: 'material', chance: 0.6, quantity: [1, 1], level: 1, quality: 'Uncommon', description: 'Painful wasp venom.' }] },
        { name: 'Centipede', rarity: 40, baseStats: { hp: 80, dmg: 9, speed: 1.5 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Centipede Leg', type: 'material', chance: 0.7, quantity: [2, 4], level: 1, quality: 'Common', description: 'Sharp centipede leg.' }] },
        { name: 'Beetle', rarity: 45, baseStats: { hp: 90, dmg: 8, speed: 1.0 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Beetle Carapace', type: 'material', chance: 0.8, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Hard beetle carapace.' }] },
        { name: 'Mantis', rarity: 30, baseStats: { hp: 110, dmg: 12, speed: 1.3 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Mantis Claw', type: 'material', chance: 0.6, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Sharp mantis claw.' }] },
        { name: 'Eagle', rarity: 20, baseStats: { hp: 120, dmg: 14, speed: 1.8 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Eagle Feather', type: 'material', chance: 0.6, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Majestic eagle feather.' }] },
        { name: 'Owl', rarity: 25, baseStats: { hp: 100, dmg: 12, speed: 1.7 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Owl Feather', type: 'material', chance: 0.7, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Silent owl feather.' }] },
        { name: 'Hawk', rarity: 35, baseStats: { hp: 80, dmg: 10, speed: 1.9 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Hawk Talon', type: 'material', chance: 0.6, quantity: [1, 1], level: 1, quality: 'Uncommon', description: 'Sharp hawk talon.' }] },
        { name: 'Falcon', rarity: 30, baseStats: { hp: 70, dmg: 9, speed: 2.0 }, weakness: 'hunting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Falcon Wing', type: 'material', chance: 0.7, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Swift falcon wing.' }] },
        
        // Desert Biome Monsters
        { name: 'Bandit', rarity: 50, baseStats: { hp: 60, dmg: 8, speed: 1.0 }, weakness: 'hunting', isBoss: false, biome: 'DESERT', drops: [{ name: 'Copper Coin', type: 'material', chance: 0.9, quantity: [5, 15], level: 1, quality: 'Common', description: 'Small copper coins.' }] },
        { name: 'Snake', rarity: 35, baseStats: { hp: 120, dmg: 14, speed: 1.2 }, weakness: 'hunting', isBoss: false, biome: 'DESERT', drops: [{ name: 'Snake Venom', type: 'material', chance: 0.6, quantity: [1, 1], level: 1, quality: 'Uncommon', description: 'Deadly snake venom.' }] },
        { name: 'Scorpion', rarity: 30, baseStats: { hp: 100, dmg: 16, speed: 1.1 }, weakness: 'hunting', isBoss: false, biome: 'DESERT', drops: [{ name: 'Scorpion Stinger', type: 'material', chance: 0.5, quantity: [1, 1], level: 1, quality: 'Uncommon', description: 'Poisonous scorpion stinger.' }] },
        { name: 'Vulture', rarity: 30, baseStats: { hp: 90, dmg: 11, speed: 1.6 }, weakness: 'hunting', isBoss: false, biome: 'DESERT', drops: [{ name: 'Vulture Beak', type: 'material', chance: 0.5, quantity: [1, 1], level: 1, quality: 'Uncommon', description: 'Sharp vulture beak.' }] },
        { name: 'Raven', rarity: 40, baseStats: { hp: 60, dmg: 8, speed: 1.9 }, weakness: 'hunting', isBoss: false, biome: 'DESERT', drops: [{ name: 'Raven Feather', type: 'material', chance: 0.8, quantity: [1, 2], level: 1, quality: 'Common', description: 'Dark raven feather.' }] },
        { name: 'Crow', rarity: 45, baseStats: { hp: 50, dmg: 7, speed: 1.8 }, weakness: 'hunting', isBoss: false, biome: 'DESERT', drops: [{ name: 'Crow Feather', type: 'material', chance: 0.8, quantity: [1, 2], level: 1, quality: 'Common', description: 'Black crow feather.' }] },
        
        // Volcanic Biome Monsters
        { name: 'Troll', rarity: 30, baseStats: { hp: 200, dmg: 15, speed: 0.6 }, weakness: 'hunting', isBoss: false, biome: 'VOLCANIC', drops: [{ name: 'Troll Hide', type: 'material', chance: 0.8, quantity: [2, 4], level: 1, quality: 'Rare', description: 'Thick troll hide.' }] },
        { name: 'Gargoyle', rarity: 15, baseStats: { hp: 180, dmg: 20, speed: 0.9 }, weakness: 'hunting', isBoss: false, biome: 'VOLCANIC', drops: [{ name: 'Stone Essence', type: 'material', chance: 0.5, quantity: [1, 1], level: 1, quality: 'Rare', description: 'Magical stone essence.' }] },
        { name: 'Vampire', rarity: 10, baseStats: { hp: 250, dmg: 30, speed: 1.1 }, weakness: 'hunting', isBoss: false, biome: 'VOLCANIC', drops: [{ name: 'Vampire Dust', type: 'material', chance: 0.4, quantity: [1, 2], level: 1, quality: 'Epic', description: 'Mysterious vampire dust.' }] },
        { name: 'Dragon Wyrmling', rarity: 5, baseStats: { hp: 400, dmg: 35, speed: 1.0 }, weakness: 'hunting', isBoss: false, biome: 'VOLCANIC', drops: [{ name: 'Dragon Scale', type: 'material', chance: 0.3, quantity: [1, 1], level: 1, quality: 'Epic', description: 'Tough dragon scale.' }] },
        { name: 'Giant Phoenix', rarity: 3, baseStats: { hp: 500, dmg: 40, speed: 1.5 }, weakness: 'hunting', isBoss: false, biome: 'VOLCANIC', drops: [{ name: 'Phoenix Feather', type: 'material', chance: 0.2, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Burning phoenix feather.' }] },
        
        // Arctic Biome Monsters
        { name: 'Dire Wolf', rarity: 35, baseStats: { hp: 150, dmg: 18, speed: 1.4 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Dire Fang', type: 'material', chance: 0.5, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Massive wolf fang.' }] },
        { name: 'Harpy', rarity: 25, baseStats: { hp: 100, dmg: 12, speed: 1.6 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Harpy Feather', type: 'material', chance: 0.7, quantity: [2, 4], level: 1, quality: 'Uncommon', description: 'Beautiful harpy feather.' }] },
        { name: 'Minotaur', rarity: 20, baseStats: { hp: 300, dmg: 25, speed: 0.7 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Minotaur Horn', type: 'material', chance: 0.6, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Powerful minotaur horn.' }] },
        { name: 'Squid', rarity: 20, baseStats: { hp: 200, dmg: 18, speed: 1.1 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Squid Tentacle', type: 'material', chance: 0.5, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Rubbery squid tentacle.' }] },
        { name: 'Octopus', rarity: 25, baseStats: { hp: 180, dmg: 16, speed: 1.2 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Octopus Ink', type: 'material', chance: 0.6, quantity: [1, 1], level: 1, quality: 'Uncommon', description: 'Dark octopus ink.' }] },
        { name: 'Shark', rarity: 15, baseStats: { hp: 350, dmg: 30, speed: 1.4 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Shark Fin', type: 'material', chance: 0.4, quantity: [1, 1], level: 1, quality: 'Rare', description: 'Sharp shark fin.' }] },
        { name: 'Whale', rarity: 8, baseStats: { hp: 800, dmg: 25, speed: 0.6 }, weakness: 'hunting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Whale Blubber', type: 'material', chance: 0.3, quantity: [2, 4], level: 1, quality: 'Rare', description: 'Thick whale blubber.' }] },
        
        // Universal Monsters (appear in all biomes)
        { name: 'Bat', rarity: 55, baseStats: { hp: 50, dmg: 7, speed: 1.4 }, weakness: 'hunting', isBoss: false, biome: 'ALL', drops: [{ name: 'Bat Wing', type: 'material', chance: 0.8, quantity: [1, 2], level: 1, quality: 'Common', description: 'Leathery bat wing.' }] },
        { name: 'Cave Rat', rarity: 80, baseStats: { hp: 15, dmg: 2, speed: 1.8 }, weakness: 'hunting', isBoss: false, biome: 'ALL', drops: [{ name: 'Rat Tail', type: 'material', chance: 0.9, quantity: [1, 1], level: 1, quality: 'Common', description: 'Slimy rat tail.' }] },
        { name: 'Crab', rarity: 35, baseStats: { hp: 130, dmg: 10, speed: 0.8 }, weakness: 'hunting', isBoss: false, biome: 'ALL', drops: [{ name: 'Crab Shell', type: 'material', chance: 0.7, quantity: [1, 2], level: 1, quality: 'Uncommon', description: 'Hard crab shell.' }] },
        
        // Mining Sites (Mining weakness) - All biomes
        { name: 'Copper Vein', rarity: 80, baseStats: { hp: 50, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Copper Ore', type: 'material', chance: 1.0, quantity: [2, 5], level: 1, quality: 'Common', description: 'Raw copper ore.' }] },
        { name: 'Iron Deposit', rarity: 60, baseStats: { hp: 80, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Iron Ore', type: 'material', chance: 1.0, quantity: [3, 7], level: 1, quality: 'Common', description: 'Raw iron ore.' }] },
        { name: 'Gold Vein', rarity: 40, baseStats: { hp: 100, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Gold Ore', type: 'material', chance: 1.0, quantity: [1, 3], level: 1, quality: 'Uncommon', description: 'Precious gold ore.' }] },
        { name: 'Silver Deposit', rarity: 50, baseStats: { hp: 90, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Silver Ore', type: 'material', chance: 1.0, quantity: [2, 4], level: 1, quality: 'Uncommon', description: 'Shiny silver ore.' }] },
        { name: 'Diamond Mine', rarity: 20, baseStats: { hp: 150, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Diamond', type: 'material', chance: 1.0, quantity: [1, 1], level: 1, quality: 'Rare', description: 'Precious diamond.' }] },
        { name: 'Emerald Deposit', rarity: 25, baseStats: { hp: 120, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Emerald', type: 'material', chance: 1.0, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Beautiful emerald.' }] },
        { name: 'Ruby Vein', rarity: 30, baseStats: { hp: 110, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Ruby', type: 'material', chance: 1.0, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Deep red ruby.' }] },
        { name: 'Sapphire Deposit', rarity: 35, baseStats: { hp: 100, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Sapphire', type: 'material', chance: 1.0, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Deep blue sapphire.' }] },
        { name: 'Mithril Vein', rarity: 10, baseStats: { hp: 200, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Mithril Ore', type: 'material', chance: 1.0, quantity: [1, 2], level: 1, quality: 'Epic', description: 'Magical mithril ore.' }] },
        { name: 'Adamantium Deposit', rarity: 5, baseStats: { hp: 300, dmg: 0, speed: 0 }, weakness: 'mining', isBoss: false, biome: 'ALL', drops: [{ name: 'Adamantium Ore', type: 'material', chance: 1.0, quantity: [1, 1], level: 1, quality: 'Epic', description: 'Indestructible adamantium ore.' }] },
        
        // Woodcutting Sites (Woodcutting weakness) - Forest and Arctic biomes
        { name: 'Oak Tree', rarity: 80, baseStats: { hp: 40, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Oak Wood', type: 'material', chance: 1.0, quantity: [3, 6], level: 1, quality: 'Common', description: 'Strong oak wood.' }] },
        { name: 'Pine Tree', rarity: 70, baseStats: { hp: 30, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Pine Wood', type: 'material', chance: 1.0, quantity: [2, 5], level: 1, quality: 'Common', description: 'Light pine wood.' }] },
        { name: 'Maple Tree', rarity: 60, baseStats: { hp: 50, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Maple Wood', type: 'material', chance: 1.0, quantity: [3, 7], level: 1, quality: 'Common', description: 'Beautiful maple wood.' }] },
        { name: 'Birch Tree', rarity: 65, baseStats: { hp: 35, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'ARCTIC', drops: [{ name: 'Birch Wood', type: 'material', chance: 1.0, quantity: [2, 4], level: 1, quality: 'Common', description: 'Smooth birch wood.' }] },
        { name: 'Willow Tree', rarity: 75, baseStats: { hp: 25, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Willow Wood', type: 'material', chance: 1.0, quantity: [2, 5], level: 1, quality: 'Common', description: 'Flexible willow wood.' }] },
        { name: 'Cherry Tree', rarity: 50, baseStats: { hp: 60, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Cherry Wood', type: 'material', chance: 1.0, quantity: [2, 4], level: 1, quality: 'Uncommon', description: 'Beautiful cherry wood.' }] },
        { name: 'Mahogany Tree', rarity: 30, baseStats: { hp: 100, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Mahogany Wood', type: 'material', chance: 1.0, quantity: [2, 3], level: 1, quality: 'Rare', description: 'Precious mahogany wood.' }] },
        { name: 'Ebony Tree', rarity: 20, baseStats: { hp: 120, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Ebony Wood', type: 'material', chance: 1.0, quantity: [1, 2], level: 1, quality: 'Rare', description: 'Dark ebony wood.' }] },
        { name: 'Ancient Tree', rarity: 15, baseStats: { hp: 150, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'Ancient Wood', type: 'material', chance: 1.0, quantity: [1, 2], level: 1, quality: 'Epic', description: 'Magical ancient wood.' }] },
        { name: 'World Tree', rarity: 5, baseStats: { hp: 200, dmg: 0, speed: 0 }, weakness: 'woodcutting', isBoss: false, biome: 'FOREST', drops: [{ name: 'World Tree Sap', type: 'material', chance: 1.0, quantity: [1, 1], level: 1, quality: 'Epic', description: 'Sacred world tree sap.' }] },
        
        // Bosses (Hunting weakness) - Biome specific
        { name: 'Ancient Dragon', rarity: 1, baseStats: { hp: 2000, dmg: 80, speed: 1.2 }, weakness: 'hunting', isBoss: true, biome: 'VOLCANIC', drops: [{ name: 'Dragon Heart', type: 'material', chance: 0.1, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Powerful dragon heart.' }] },
        { name: 'Demon Lord', rarity: 1, baseStats: { hp: 1500, dmg: 70, speed: 1.4 }, weakness: 'hunting', isBoss: true, biome: 'VOLCANIC', drops: [{ name: 'Demon Essence', type: 'material', chance: 0.1, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Pure demon essence.' }] },
        { name: 'Behemoth', rarity: 1, baseStats: { hp: 3000, dmg: 60, speed: 0.8 }, weakness: 'hunting', isBoss: true, biome: 'ARCTIC', drops: [{ name: 'Behemoth Hide', type: 'material', chance: 0.1, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Impenetrable behemoth hide.' }] },
        { name: 'Kraken', rarity: 1, baseStats: { hp: 2500, dmg: 75, speed: 1.0 }, weakness: 'hunting', isBoss: true, biome: 'ARCTIC', drops: [{ name: 'Kraken Tentacle', type: 'material', chance: 0.1, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Massive kraken tentacle.' }] },
        { name: 'Titan', rarity: 1, baseStats: { hp: 4000, dmg: 90, speed: 0.6 }, weakness: 'hunting', isBoss: true, biome: 'DESERT', drops: [{ name: 'Titan Bone', type: 'material', chance: 0.1, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Ancient titan bone.' }] },
        { name: 'Ancient Treant', rarity: 1, baseStats: { hp: 1800, dmg: 65, speed: 0.9 }, weakness: 'hunting', isBoss: true, biome: 'FOREST', drops: [{ name: 'Ancient Wood', type: 'material', chance: 0.1, quantity: [1, 1], level: 1, quality: 'Legendary', description: 'Sacred ancient wood from the forest guardian.' }] },
    ],

    // Team Settings
    TEAM_NAME_MIN_LENGTH: 3,
    TEAM_NAME_MAX_LENGTH: 15,

    // --- INTERNAL CONSTANTS (DO NOT MODIFY) ---
    ENTITY_TYPES: { MOB: 'mob', PLAYER: 'player', CONSTRUCTION_SITE: 'construction_site', SIEGE_MACHINE: 'siege' },
    
    // Join Policies
    JOIN_POLICIES: {
        OPEN: 'open',
        REQUEST: 'request',
        CLOSED: 'closed'
    }
};

// Export for use in browser
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
}

// Export for use in Node.js
if (typeof module !== 'undefined') {
    module.exports = { CONFIG };
}