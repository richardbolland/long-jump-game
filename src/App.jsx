import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shuffle, ArrowDownAZ, Star, Trophy, RotateCcw, AlertCircle, Check, Play, X, Info,
  ChevronRight, ChevronLeft, Crown, BookOpen, Mail, FileText, Sparkles, Eye, ArrowLeft, Ruler, LogOut, Share2, CheckCheck, Heart, Zap,
  Settings, ScrollText, Volume2, VolumeX, Moon, Sun, Download, Flag, AlertTriangle
} from 'lucide-react';

// --- RIVE IMPORTS ---
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
// --- CRAZY GAMES SDK IMPORT ---
import { initSDK, gameStart, gameStop, happyTime, requestAd, requestRewardAd, getUser, promptLogin } from './CrazyGamesSDK';

// --- FIREBASE IMPORTS ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, getDocs, orderBy, limit, where } from 'firebase/firestore';

// --- FIREBASE CONFIGURATION ---
const YOUR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDbREHqfDMDLg2kFMBQUdVaKcSEdVKSdTk",
  authDomain: "long-jump-game.firebaseapp.com",
  projectId: "long-jump-game",
  storageBucket: "long-jump-game.firebasestorage.app",
  messagingSenderId: "983608423354",
  appId: "1:983608423354:web:64b5adc4eb1d2f5a80e383"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : YOUR_FIREBASE_CONFIG;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const dbAppId = typeof __app_id !== 'undefined' ? __app_id : 'long-jump-game';

// --- THEMES ---
const THEME_LIGHT = {
  background: '#f0f0e6',
  boardBackground: '#f0eae9',
  boardLines: '#dcd8cc',
  tileLocked: '#f8f5ed',
  tileLockedText: '#111827',
  tileTemp: '#fef08a',
  tileTempRing: '#facc15',
  tileWild: '#ffd700',
  tileWildPlaced: '#fff8c4',
  tileObstacle: '#374151',
  accentPrimary: '#59AD20',
  accentSecondary: '#4d961b',
  textMain: '#1f2937',
  textSub: '#6b7280',
  starGold: '#fbbf24',
  starPurple: '#a855f7',
  overlayComplete: '#ffffff',
  startArrow: '#000000',
  modalBg: '#ffffff',
  settingsBg: '#ffffff',
  handBg: '#dcd8cc',
};

const THEME_DARK = {
  background: '#111827',
  boardBackground: '#1f2937',
  boardLines: '#374151',
  tileLocked: '#374151',
  tileLockedText: '#f3f4f6',
  tileTemp: '#854d0e',
  tileTempRing: '#ca8a04',
  tileWild: '#b45309',
  tileWildPlaced: '#78350f',
  tileObstacle: '#000000',
  accentPrimary: '#65a30d',
  accentSecondary: '#4d7c0f',
  textMain: '#f9fafb',
  textSub: '#9ca3af',
  starGold: '#fbbf24',
  starPurple: '#c084fc',
  overlayComplete: '#1f2937',
  startArrow: '#ffffff',
  modalBg: '#1f2937',
  settingsBg: '#111827',
  handBg: '#1f2937',
};

// --- CONSTANTS & CONFIG ---
const GRID_ROWS = 5;
const GRID_COLS_STANDARD = 50; 
const GRID_COLS_MAZE = 50; 
const INITIAL_HAND_SIZE_STANDARD = 30;
const INITIAL_HAND_SIZE_MAZE = 30;
const CELL_SIZE = 40;

const LETTER_POOL = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
  '*': 2
};

const LOCAL_DICTIONARY = new Set([
    "EXTORTIONATELY", "ORNERIER", "RAINILY", "NET", "KITE", "KITES", "TOXICALLY", "OUR", "OURS",
    "AA","AB","AD","AE","AG","AH","AI","AL","AM","AN","AR","AS","AT","AW","AX","AY",
    "BA","BE","BI","BO","BY",
    "CH",
    "DA","DE","DI","DO",
    "EA","ED","EE","EF","EH","EL","EM","EN","ER","ES","ET","EW","EX",
    "FA","FE","FY",
    "GI","GO","GU",
    "HA","HE","HI","HM","HO",
    "ID","IF","IN","IO","IS","IT",
    "JA","JO",
    "KA","KI","KO","KY",
    "LA","LI","LO",
    "MA","ME","MI","MM","MO","MU","MY",
    "NA","NE","NO","NU","NY",
    "OB","OD","OE","OF","OH","OI","OK","OM","ON","OO","OP","OR","OS","OU","OW","OX","OY",
    "PA","PE","PI","PO",
    "QI",
    "RE",
    "SH","SI","SO","ST",
    "TA","TE","TI","TO",
    "UG","UH","UM","UN","UP","UR","US","UT",
    "WE","WO",
    "XI","XU",
    "YA","YE","YO","YU",
    "ZA","ZE","ZO"
]);

const NAME_ADJECTIVES = ['Neon', 'Fast', 'Pink', 'Blue', 'Gold', 'Epic', 'Cool', 'Tiny', 'Mega', 'Wild', 'Red', 'Ice', 'Fire'];
const NAME_ANIMALS = ['Fox', 'Bear', 'Wolf', 'Lion', 'Hawk', 'Owl', 'Cat', 'Dog', 'Frog', 'Crab', 'Pug', 'Bird'];

// --- HELPER FUNCTIONS ---

const createEmptyGrid = (cols = GRID_COLS_STANDARD) => Array(GRID_ROWS).fill(null).map(() => Array(cols).fill(null));

const createTile = (letter, isNew = false) => {
    return {
        id: Math.random().toString(36).substring(2, 15) + Date.now().toString(36),
        letter,
        isNew,
        isPlaced: false 
    };
};

const getOrdinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const formatDateWithOrdinal = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-GB', { month: 'short' });
    return `${getOrdinal(day)} ${month}`;
};

const mulberry32 = (a) => {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

const cyrb128 = (str) => {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return (h1^h2^h3^h4) >>> 0;
}

const getDailySeed = () => {
    return new Date().toISOString().split('T')[0];
};

const generateRandomBonuses = (seedDateString, cols, mode) => {
  const seed = cyrb128(seedDateString);
  const rand = mulberry32(seed);
  const spots = [];
  const count = Math.floor(cols * 0.3);
  const used = new Set();

  // 1. Generate Standard Random Bonuses
  while (spots.length < count) {
    const r = Math.floor(rand() * GRID_ROWS);
    const c = Math.floor(rand() * cols);
    if (c === 0) continue;

    // MAZE EXCLUSIVE: Skip col 14 & 29 (Reserved for specific pattern)
    if (mode === 'maze' && (c === 14 || c === 29)) continue;

    const key = `${r},${c}`;
    if (!used.has(key)) {
      used.add(key);
      const rVal = rand();
      let val = 1;
      let type = 'star';

      if (rVal > 0.5) val = 2;
      if (rVal > 0.8) val = 3;
      spots.push({ r, c, val, type });
    }
  }

  // 2. MAZE MODE: Force Fill Gold Strips (Cols 14 & 29)
  if (mode === 'maze') {
      [14, 29].forEach(c => {
          if (c < cols) {
            for (let r = 0; r < GRID_ROWS; r++) {
                if ((r + c) % 3 === 0) continue; // Leave spot for Wildcard

                const pseudoRand = ((r * c * 13) % 10) / 10;
                const val = pseudoRand > 0.5 ? 3 : 2;
                
                spots.push({ r, c, val, type: 'star' });
            }
          }
      });
  }

  return spots;
};

const generateRandomObstacles = (seedDateString, cols, mode) => {
    const seed = cyrb128(seedDateString + "OBSTACLES");
    const rand = mulberry32(seed);
    const spots = [];
    
    // --- STANDARD MODE ---
    if (mode !== 'maze') {
        const count = Math.floor(cols * 0.1); 
        const used = new Set();
        while (spots.length < count) {
            const r = Math.floor(rand() * GRID_ROWS);
            const c = Math.floor(rand() * cols);
            if (c === 0) continue;
            const key = `${r},${c}`;
            if (!used.has(key)) {
                used.add(key);
                spots.push({ r, c });
            }
        }
        return spots;
    }

    // --- MAZE MODE (High Density with Path) ---
    const protectedCells = new Set();
    
    // 1. Protect the Gold Strips (15m = col 14, 30m = col 29)
    for(let r=0; r<GRID_ROWS; r++) {
        protectedCells.add(`${r},14`);
        protectedCells.add(`${r},29`);
    }

    // 2. Helper to Carve a Random Walk Path
    const carvePath = (pathSeedSuffix, startRow) => {
        const pSeed = cyrb128(seedDateString + pathSeedSuffix);
        const pRand = mulberry32(pSeed);
        let currentRow = startRow;
        
        for (let c = 1; c < cols; c++) {
            protectedCells.add(`${currentRow},${c}`);
            
            const roll = pRand();
            // 30% chance to move Up, 30% chance to move Down, 40% straight
            if (roll < 0.3 && currentRow > 0) currentRow--;
            else if (roll > 0.7 && currentRow < GRID_ROWS - 1) currentRow++;
            
            protectedCells.add(`${currentRow},${c}`);
        }
    };

    // 3. Carve Guaranteed Path
    carvePath("PATH_MAIN", 2); // Carve one solid path through the middle-ish

    // 4. Fill the rest with VERY dense obstacles (45%)
    const totalCells = cols * GRID_ROWS;
    const targetCount = Math.floor(totalCells * 0.45); 
    const used = new Set();
    let attempts = 0;
    
    while (spots.length < targetCount && attempts < totalCells * 5) {
        attempts++;
        const r = Math.floor(rand() * GRID_ROWS);
        const c = Math.floor(rand() * cols);
        
        if (c === 0) continue; 
        
        const key = `${r},${c}`;
        
        // Skip if protected or used
        if (protectedCells.has(key) || used.has(key)) continue;
        
        used.add(key);
        spots.push({ r, c });
    }
    
    return spots;
};

const generateWildcardSpots = (seedDateString, obstacles, cols) => {
    const seed = cyrb128(seedDateString + "WILDCARDS_V3"); 
    const rand = mulberry32(seed);
    const spots = [];
    
    // 1. Generate Standard Wildcards
    let count = 0;
    while(count < 100) {
        const r = Math.floor(rand() * GRID_ROWS);
        const minCol = 5;
        const maxCol = Math.min(29, cols - 2);
        if (maxCol <= minCol) break; 

        const c = Math.floor(rand() * (maxCol - minCol + 1)) + minCol;
        if (c === 14 || c === 29) continue; // Skip Gold Strips
        
        if (!obstacles.some(o => o.r === r && o.c === c)) {
            spots.push({ r, c });
            break;
        }
        count++;
    }

    if (cols > 30) {
        count = 0;
        while(count < 100) {
            const r = Math.floor(rand() * GRID_ROWS);
            const minCol = 30;
            const maxCol = cols - 5; 
            const c = Math.floor(rand() * (maxCol - minCol + 1)) + minCol;
            if (c === 14 || c === 29) continue; // Skip Gold Strips
            
            if (!obstacles.some(o => o.r === r && o.c === c)) {
                spots.push({ r, c });
                break;
            }
            count++;
        }
    }

    // 2. MAZE MODE: Force Fill Gold Strips (Cols 14 & 29)
    [14, 29].forEach(c => {
        if (c < cols) {
            for (let r = 0; r < GRID_ROWS; r++) {
                // Fill the spots skipped by generateRandomBonuses
                if ((r + c) % 3 === 0) {
                     if (!obstacles.some(o => o.r === r && o.c === c)) {
                         spots.push({ r, c });
                     }
                }
            }
        }
    });

    return spots;
};

const generateCheerSquad = () => {
    return [
        { id: 't1', type: 'top', offset: 0, startCol: 2 },
        { id: 't2', type: 'top', offset: -1, startCol: 1 },
        { id: 't3', type: 'top', offset: -2, startCol: 0 },
        { id: 'b1', type: 'bottom', offset: 0, startCol: 2 },
        { id: 'b2', type: 'bottom', offset: -1, startCol: 1 },
        { id: 'b3', type: 'bottom', offset: -2, startCol: 0 },
        { id: 't4', type: 'top', offset: 1, startCol: 3 },
        { id: 'b4', type: 'bottom', offset: 1, startCol: 3 },
        { id: 't5', type: 'top', offset: 2, startCol: 4 },
        { id: 'b5', type: 'bottom', offset: 2, startCol: 4 },
    ];
};

const generateDailySequence = (seedDateString) => {
  const seed = cyrb128(seedDateString);
  const rand = mulberry32(seed);
  let basePool = [];
  Object.entries(LETTER_POOL).forEach(([letter, count]) => {
    for (let i = 0; i < count; i++) basePool.push(letter);
  });
  let fullDeck = [];
  for(let i=0; i<10; i++) {
      fullDeck = fullDeck.concat(basePool);
  }
  for (let i = fullDeck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [fullDeck[i], fullDeck[j]] = [fullDeck[j], fullDeck[i]];
  }
  
  const handSize = INITIAL_HAND_SIZE_STANDARD; 
  const firstChunk = fullDeck.slice(0, handSize);
  if (!firstChunk.includes('*')) {
      const blankIndex = fullDeck.indexOf('*', handSize);
      if (blankIndex !== -1) {
          const swapTarget = Math.floor(rand() * handSize);
          [fullDeck[swapTarget], fullDeck[blankIndex]] = [fullDeck[blankIndex], fullDeck[swapTarget]];
      }
  }
  return fullDeck;
};

const updatePlayerStats = (currentScore) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const savedStats = JSON.parse(localStorage.getItem('longJumpStats')) || {
        gamesPlayed: 0,
        currentStreak: 0,
        maxStreak: 0,
        totalDistance: 0,
        lastPlayedDate: null
    };

    let { gamesPlayed, currentStreak, maxStreak, totalDistance, lastPlayedDate } = savedStats;

    gamesPlayed += 1;
    totalDistance += currentScore;

    if (lastPlayedDate !== todayStr) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastPlayedDate === yesterdayStr) {
            currentStreak += 1;
        } else {
            currentStreak = 1;
        }
    }

    if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
    }

    const newStats = {
        gamesPlayed,
        currentStreak,
        maxStreak,
        totalDistance,
        lastPlayedDate: todayStr
    };

    localStorage.setItem('longJumpStats', JSON.stringify(newStats));
    return newStats;
};

const generateRandomName = () => {
  const adj = NAME_ADJECTIVES[Math.floor(Math.random() * NAME_ADJECTIVES.length)];
  const animal = NAME_ANIMALS[Math.floor(Math.random() * NAME_ANIMALS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${animal}${num}`;
};

const isLinearPlacement = (tiles) => {
  if (tiles.length <= 1) return true;
  const firstRow = tiles[0].r;
  const firstCol = tiles[0].c;
  return tiles.every(t => t.r === firstRow) || tiles.every(t => t.c === firstCol);
};

// --- AUDIO & HAPTICS ENGINE ---
const SoundEngine = {
  ctx: null,
  init: () => {
    if (!SoundEngine.ctx) {
      SoundEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play: (type) => {
    if (!SoundEngine.ctx) SoundEngine.init();
    const ctx = SoundEngine.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    const variance = 0.5 + Math.random(); 
    
    if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 * variance, now);
      osc.frequency.exponentialRampToValueAtTime(100 * variance, now + 0.15);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 * variance, now);
      osc.frequency.setValueAtTime(600 * variance, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'click') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'fanfare') {
      osc.type = 'square'; 
      osc.frequency.setValueAtTime(261.63, now);       // C4
      osc.frequency.setValueAtTime(329.63, now + 0.1); // E4
      osc.frequency.setValueAtTime(392.00, now + 0.2); // G4
      osc.frequency.setValueAtTime(523.25, now + 0.3); // C5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.setValueAtTime(0.2, now + 0.3);       
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      osc.start(now);
      osc.stop(now + 0.8);
    }
  }
};

const triggerHaptic = (type) => {
  if (!navigator.vibrate) return;
  switch (type) {
    case 'light': navigator.vibrate(5); break; 
    case 'medium': navigator.vibrate(15); break; 
    case 'success': navigator.vibrate([10, 30, 10]); break; 
    case 'error': navigator.vibrate([50, 20, 50]); break; 
    case 'heavy': navigator.vibrate(50); break;
    default: break;
  }
};

// --- Confetti Component ---
const Confetti = ({ theme }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    if (width === 0 || height === 0) return;
    canvas.width = width;
    canvas.height = height;
    const particles = [];
    const colors = ['#f97316', '#fbbf24', '#ffffff', '#ef4444', '#3b82f6', theme.accentPrimary];
    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height - height,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 5 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1
      });
    }
    let animationId;
    const animate = () => {
      if (!ctx || !canvas.width || !canvas.height) return;
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y / 50);
        p.rotation += p.rotationSpeed;
        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(p.rotation) || !Number.isFinite(p.size)) return; 
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();
    const handleResize = () => {
        if (!canvas) return;
        width = window.innerWidth;
        height = window.innerHeight;
        if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
        }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [theme]);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
};

const RiveLogo = () => {
   const { RiveComponent } = useRive({
     src: 'longjumplogo.riv',
     stateMachines: 'State Machine 1',
     autoplay: true,
     layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
   });
   return (
     <RiveComponent
       style={{ width: '100%', maxWidth: '500px', aspectRatio: '500/220', display: 'block', margin: '0 auto', padding: '20px 0' }}
     />
   );
};

const Fan = ({ trigger }) => {
    const { rive, RiveComponent } = useRive({
      src: 'fan.riv',
      autoplay: true,
      layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    });
    useEffect(() => {
        if (trigger && rive && rive.viewModelInstance) {
            try {
                const vm = rive.viewModelInstance('View Model 1');
                if (vm) {
                    const celebrateTrigger = vm.trigger('Celebrate');
                    if (celebrateTrigger) celebrateTrigger.fire();
                }
            } catch (e) { console.warn("Rive trigger warning:", e); }
        }
    }, [trigger, rive]);
    if (!RiveComponent) return null;
    return (
      <div style={{ width: `${CELL_SIZE}px`, height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
          <div style={{ width: '39px', height: '60px' }}>
             <RiveComponent />
          </div>
      </div>
    );
};

// --- Leaderboard Component ---
const DailyLeaderboard = ({ highlightName, user, onRankFound, lastUpdated, initialMode = 'standard', onParCalculated, theme }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('daily');
  const [modeFilter, setModeFilter] = useState(initialMode);
  const [error, setError] = useState(null);

  useEffect(() => {
      setModeFilter(initialMode);
  }, [initialMode]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    // CRAZY GAMES EXCLUSIVE LEADERBOARD
    const scoresRef = collection(db, 'artifacts', dbAppId, 'public', 'data', 'scores_crazygames');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeekDate = new Date(today.setDate(diff));
    const startOfWeekStr = startOfWeekDate.toISOString().split('T')[0];

    const todayForMonth = new Date();
    const startOfMonthDate = new Date(todayForMonth.getFullYear(), todayForMonth.getMonth(), 1);
    const startOfMonthStr = startOfMonthDate.toISOString().split('T')[0];

    let constraints = [];
    
    // CHANGED: Filter for 'maze' instead of 'quick'
    if (modeFilter === 'maze') {
        constraints.push(where("mode", "==", "maze"));
    }

    if (view === 'daily') {
        constraints.push(where("date", "==", todayStr));
        constraints.push(orderBy("score", "desc"));
        constraints.push(orderBy("timestamp", "asc"));
        constraints.push(limit(100));
    } else if (view === 'weekly') {
        constraints.push(where("date", ">=", startOfWeekStr));
        constraints.push(orderBy("date", "desc"));
        constraints.push(orderBy("score", "desc"));
        constraints.push(limit(500));
    } else {
        constraints.push(where("date", ">=", startOfMonthStr));
        constraints.push(orderBy("date", "desc"));
        constraints.push(orderBy("score", "desc"));
        constraints.push(limit(500));
    }

    try {
        const q = query(scoresRef, ...constraints);
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            setLeaderboard([]);
            setLoading(false);
            // CHANGED: Default Par for Maze is 20, Standard is 25
            if(onParCalculated && view === 'daily') onParCalculated(modeFilter === 'maze' ? 20 : 25, modeFilter);
            return;
        }

        let fetchedScores = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (modeFilter === 'standard') {
            fetchedScores = fetchedScores.filter(s => !s.mode || s.mode === 'standard');
        }

        if (view === 'daily' && onParCalculated) {
             const scoreSum = fetchedScores.reduce((acc, curr) => acc + curr.score, 0);
             const avgScore = scoreSum / fetchedScores.length;
             // CHANGED: Calculate dynamic par based on Mode
             const basePar = modeFilter === 'maze' ? 20 : 25;
             const calculatedPar = Math.floor((basePar + avgScore) / 2);
             onParCalculated(calculatedPar, modeFilter);
        }

        if (view === 'weekly' || view === 'monthly') {
            const uniqueBestScores = new Map();
            fetchedScores.forEach(scoreEntry => {
                const existing = uniqueBestScores.get(scoreEntry.name);
                if (!existing) {
                    uniqueBestScores.set(scoreEntry.name, scoreEntry);
                } else {
                    if (scoreEntry.score > existing.score) {
                        uniqueBestScores.set(scoreEntry.name, scoreEntry);
                    } 
                    else if (scoreEntry.score === existing.score && scoreEntry.timestamp < existing.timestamp) {
                        uniqueBestScores.set(scoreEntry.name, scoreEntry);
                    }
                }
            });
            fetchedScores = Array.from(uniqueBestScores.values());
            fetchedScores.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return a.timestamp - b.timestamp;
            });
            fetchedScores = fetchedScores.slice(0, 100);
        }

        setLeaderboard(fetchedScores);
        setLoading(false);

        if (highlightName && onRankFound) {
            const rankIndex = fetchedScores.findIndex(s => s.name === highlightName);
            if (rankIndex !== -1) onRankFound(rankIndex + 1);
        }

    } catch (err) {
        console.error("🔥 FIRESTORE ERROR:", err);
        setError(err.message);
        setLoading(false);
    }
  };

  useEffect(() => {
      fetchData();
  }, [user, view, modeFilter, highlightName, lastUpdated]);

  return (
    <div className="rounded-2xl p-4 shadow-xl border w-full h-full flex flex-col relative transition-colors duration-300"
         style={{ backgroundColor: theme.modalBg + 'DD', borderColor: theme.boardLines }}> 
         
       {error && error.includes("index") && (
           <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-4 text-center bg-white/90">
               <AlertCircle className="text-red-500 mb-2" size={32} />
               <p className="text-xs font-bold text-red-600 mb-2">DATABASE INDEX MISSING</p>
               <button onClick={fetchData} className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Retry</button>
           </div>
       )}

       <div className="flex flex-col gap-2 mb-2 pb-2 border-b shrink-0" style={{ borderColor: theme.boardLines }}>
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                <Crown size={20} className="text-yellow-500" />
                <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textSub }}>
                    {view === 'daily' ? 'Today\'s Top' : (view === 'weekly' ? 'Weekly Best' : 'Monthly Best')}
                </h3>
             </div>
             <div className="flex rounded-lg p-1" style={{ backgroundColor: theme.boardLines }}>
                 <button onClick={() => setView('daily')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${view === 'daily' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>Daily</button>
                 <button onClick={() => setView('weekly')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${view === 'weekly' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>Weekly</button>
                 <button onClick={() => setView('monthly')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${view === 'monthly' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>Monthly</button>
             </div>
         </div>

         <div className="flex justify-center">
             <div className="flex rounded-lg p-1 w-full" style={{ backgroundColor: theme.boardLines }}>
                 <button onClick={() => setModeFilter('standard')} className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${modeFilter === 'standard' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>Standard</button>
                 {/* CHANGED: Quick -> Maze (UI Update) */}
                 <button onClick={() => setModeFilter('maze')} className={`flex-1 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${modeFilter === 'maze' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}>Maze Mode</button>
             </div>
         </div>
       </div>

       <div className="flex-1 overflow-y-auto no-scrollbar pr-1">
         {loading ? (
           <div className="text-center py-8 text-gray-400 text-sm animate-pulse">Loading...</div>
         ) : leaderboard.length === 0 ? (
           <div className="text-center py-8 text-gray-400 text-sm italic">No scores yet.<br/>Be the first!</div>
         ) : (
           <div className="space-y-1">
             {leaderboard.map((entry, idx) => {
  // CHANGED: Strict check for scores above 40 only
  // This applies to ALL modes (Maze and Standard)
  const isElite = entry.score > 40; 
  
  // Note: If you meant "40 or higher", change the line above to:
  // const isElite = entry.score >= 40;

  let dateDisplay = '';
  if (view === 'weekly') {
      dateDisplay = new Date(entry.date).toLocaleDateString(undefined, {weekday: 'short'});
  } else if (view === 'monthly') {
      dateDisplay = formatDateWithOrdinal(entry.date);
  }

  return (
   <div key={idx} className={`flex justify-between items-center p-2 rounded-lg text-sm transition-all border ${entry.name === highlightName ? `bg-[${theme.accentPrimary}]/10 border-[${theme.accentPrimary}]/20` : (isElite ? 'bg-amber-100 border-amber-300' : 'hover:bg-white/10 border-transparent')}`}
        style={entry.name !== highlightName && !isElite ? { borderColor: 'transparent' } : {}}>
       <div className="flex items-center gap-2">
           <span className={`font-black w-5 text-center ${idx === 0 ? 'text-yellow-600 text-lg' : idx === 1 ? 'text-gray-500 text-base' : idx === 2 ? 'text-orange-700 text-base' : 'text-gray-500'}`}>{idx + 1}</span>
           <div className="flex items-center gap-1 overflow-hidden">
               {isElite && <Crown size={14} className="text-yellow-600 fill-yellow-600 shrink-0" />}
               <span className={`font-bold truncate max-w-[90px] ${entry.name === highlightName ? '' : (isElite ? 'text-amber-900' : '')}`} style={{ color: entry.name === highlightName ? theme.textMain : (isElite ? '#78350f' : theme.textMain) }}>{entry.name}</span>
               {dateDisplay && (<span className="text-[9px] font-normal ml-1 border-l pl-1" style={{ color: theme.textSub, borderColor: theme.boardLines }}>{dateDisplay}</span>)}
           </div>
       </div>
       <span className={`font-mono font-black px-2 py-0.5 rounded-md text-xs ${isElite ? 'bg-amber-200 text-amber-900' : 'bg-gray-100 text-gray-900'}`}>{entry.score}m</span>
   </div>
  );
})}
           </div>
         )}
       </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [gameMode, setGameMode] = useState('standard');
  const [playerName, setPlayerName] = useState(() => {
    const saved = localStorage.getItem('longJumpPlayerName');
    return saved || generateRandomName();
  });
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showFans, setShowFans] = useState(() => {
      const saved = localStorage.getItem('longJumpShowFans');
      return saved === null ? true : saved !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
      const saved = localStorage.getItem('longJumpSound');
      return saved === null ? true : saved !== 'false';
  });
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
      const saved = localStorage.getItem('longJumpHaptics');
      return saved === null ? true : saved !== 'false';
  });
  const [darkMode, setDarkMode] = useState(() => {
      const saved = localStorage.getItem('longJumpDarkMode');
      return saved === 'true';
  });

  // Current Theme Derived State
  const theme = darkMode ? THEME_DARK : THEME_LIGHT;

  // New Modals State
  const [showReportModal, setShowReportModal] = useState(false);
  const [pendingReportWord, setPendingReportWord] = useState(null);
  const [showUndoModal, setShowUndoModal] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
      window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          setDeferredPrompt(e);
      });
  }, []);

  const handleInstallClick = () => {
      if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt');
              }
              setDeferredPrompt(null);
          });
      }
  };

  // --- SUGGESTION STATE ---
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionStatus, setSuggestionStatus] = useState('idle');

  const handleSubmitSuggestion = async () => {
      if (!suggestionText.trim()) return;
      setSuggestionStatus('submitting');
      try {
          const suggestionsRef = collection(db, 'suggestions');
          await addDoc(suggestionsRef, {
              text: suggestionText,
              player: playerName,
              date: new Date().toISOString(),
              version: '8.11'
          });
          setSuggestionStatus('success');
          setSuggestionText('');
          setTimeout(() => setSuggestionStatus('idle'), 3000);
      } catch (e) {
          console.error("Error submitting suggestion:", e);
          setSuggestionStatus('idle');
          setMessage({ text: "Could not send suggestion. Try again.", type: "error" });
      }
  };

  const [grid, setGrid] = useState(() => createEmptyGrid(GRID_COLS_STANDARD));
  const [hand, setHand] = useState([]); 
  const [history, setHistory] = useState([]);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [isReviewingBoard, setIsReviewingBoard] = useState(false);
  const [dailyDeck, setDailyDeck] = useState([]);
  const [drawCount, setDrawCount] = useState(0);
  const [bonusSpots, setBonusSpots] = useState([]);
  const [obstacleSpots, setObstacleSpots] = useState([]); 
  const [starSpots, setStarSpots] = useState([]); 
  const [fanSpots, setFanSpots] = useState([]); 
  const [selectedTileId, setSelectedTileId] = useState(null);
  const [selectedGridSpot, setSelectedGridSpot] = useState(null);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [playerRank, setPlayerRank] = useState(null); 
  const [isCopied, setIsCopied] = useState(false); 
  const [celebrateFans, setCelebrateFans] = useState(false); 
  const [message, setMessage] = useState({ text: "Goal: Get as far right as you can.", type: "neutral", invalidWord: null });
  const [isValidating, setIsValidating] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [showReviveModal, setShowReviveModal] = useState(false);
  const [hasShownMidgameAd, setHasShownMidgameAd] = useState(false);
  const [cgUser, setCgUser] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRules, setShowRules] = useState(false); 
  const [isFinishing, setIsFinishing] = useState(false);
  const [showStartHint, setShowStartHint] = useState(false);
  const [showBlankPicker, setShowBlankPicker] = useState(false);
  const [pendingBlankPlacement, setPendingBlankPlacement] = useState(null); 
  const [user, setUser] = useState(null);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [dailyLeader, setDailyLeader] = useState(null);
  const [dailyPar, setDailyPar] = useState(25); 
  const [finalPlayerStats, setFinalPlayerStats] = useState(null);
  const [playedWords, setPlayedWords] = useState([]);
  const kPressCount = useRef(0); // For the test mode trigger
  
  // Dictionary and Undo Limit State
  const [missingWords, setMissingWords] = useState(new Set());
  const [hasUsedUndo, setHasUsedUndo] = useState(false);

  const parCache = useRef({ standard: 25, quick: 12 });
  const scrollContainerRef = useRef(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const hasLockedTiles = grid.some(row => row.some(cell => cell !== null));

  // --- LOCAL STORAGE EFFECTS ---
  useEffect(() => { localStorage.setItem('longJumpPlayerName', playerName); }, [playerName]);
  useEffect(() => { localStorage.setItem('longJumpShowFans', showFans); }, [showFans]);
  useEffect(() => { localStorage.setItem('longJumpSound', soundEnabled); }, [soundEnabled]);
  useEffect(() => { localStorage.setItem('longJumpHaptics', hapticsEnabled); }, [hapticsEnabled]);
  useEffect(() => { localStorage.setItem('longJumpDarkMode', darkMode); }, [darkMode]);

  // --- INIT SDK & USER ---
  useEffect(() => {
      // 1. Initialize CrazyGames SDK (Independent)
      const initCG = async () => {
          await initSDK();
          const crazyUser = await getUser();
          if (crazyUser) {
              setCgUser(crazyUser);
              setPlayerName(crazyUser.username);
          }
      };
      initCG();

      // 2. Initialize Firebase Auth (Independent)
      const initAuth = async () => {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(auth, __initial_auth_token);
          } else {
              await signInAnonymously(auth);
          }
      };
      initAuth();

      // Listen for Auth State
      const unsub = onAuthStateChanged(auth, (u) => {
          console.log("Firebase Auth State Changed:", u ? "Logged In" : "Logged Out");
          setUser(u);
      }); 
      return () => unsub(); 
  }, []);

  useEffect(() => {
      const loadMissingWords = async () => {
          try {
              const q = query(collection(db, 'missing_words'));
              const snapshot = await getDocs(q);
              const words = new Set();
              snapshot.forEach(doc => {
                  if (doc.data().word) words.add(doc.data().word.toUpperCase());
              });
              setMissingWords(words);
          } catch (e) {
              console.error("Error loading missing words:", e);
          }
      };
      loadMissingWords();
  }, []);

  useEffect(() => {
    if (displayScore === score) return;
    const duration = 500;
    const startTime = performance.now();
    const startValue = displayScore;
    const endValue = score;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * ease);
      setDisplayScore(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);
  
  useEffect(() => {
    const fetchDailyLeader = async () => {
      try {
        // CRAZY GAMES EXCLUSIVE LEADERBOARD
              const scoresRef = collection(db, 'artifacts', dbAppId, 'public', 'data', 'scores_crazygames');
        const todayStr = new Date().toISOString().split('T')[0];

        
        let constraints = [
            where("date", "==", todayStr), 
            orderBy("score", "desc"), 
            orderBy("timestamp", "asc")
        ];

        if (gameMode === 'quick') {
            constraints.push(where("mode", "==", "quick"));
            constraints.push(limit(1));
        } else {
            constraints.push(limit(50));
        }

        const q = query(scoresRef, ...constraints);
        const snapshot = await getDocs(q);
        
        let leader = null;
        if (!snapshot.empty) {
            const docs = snapshot.docs.map(d => d.data());
            if (gameMode === 'quick') {
                leader = docs[0];
            } else {
                leader = docs.find(s => !s.mode || s.mode === 'standard');
            }
        }
        setDailyLeader(leader || null);

      } catch (e) { console.error("Error fetching leader:", e); }
    };
    fetchDailyLeader();
  }, [lastSubmitTime, gameMode]);

  const handleParUpdate = useCallback((val, mode) => {
      if (mode === 'quick' || mode === 'standard') {
          parCache.current[mode] = val;
      }
      setDailyPar(val);
  }, []);

  const handleFeedback = (type) => {
      if (soundEnabled) SoundEngine.play(type === 'light' ? 'pop' : type);
      if (hapticsEnabled) triggerHaptic(type);
  };

  useEffect(() => { initGame('standard'); }, []);

  const initGame = (mode = 'standard') => {
    const today = getDailySeed();
    
    // CHANGE: Append suffix for Maze mode so the letter shuffle is different
    const deckSeed = mode === 'maze' ? today + "-MAZE" : today;
    const newDeck = generateDailySequence(deckSeed);
    
    setDailyDeck(newDeck);
    setGameMode(mode);

    // CHANGED: Use MAZE constants
    const currentCols = mode === 'maze' ? GRID_COLS_MAZE : GRID_COLS_STANDARD;
    const handSize = mode === 'maze' ? INITIAL_HAND_SIZE_MAZE : INITIAL_HAND_SIZE_STANDARD;
    
    // ... (Hand generation logic remains the same) ...
    let initialHandLetters;
    // We treat Maze like standard regarding cards (no guaranteed wildcard)
    // Unless you want to keep the Quick mode logic:
    if (mode === 'maze') { 
         // Optional: Give them a wildcard to start because mazes are hard?
         // For now, let's treat it like standard:
         initialHandLetters = newDeck.slice(0, handSize);
    } else {
        initialHandLetters = newDeck.slice(0, handSize);
    }
    
    const initialHand = initialHandLetters.map(l => createTile(l, false)).sort((a, b) => a.letter.localeCompare(b.letter));
    setHand(initialHand);
    setDrawCount(handSize);

    setGrid(createEmptyGrid(currentCols));
    setPlacedTiles([]);
    setHistory([]); 
    setPlayedWords([]);
    setScore(0);
    setDisplayScore(0);
    setPlayerRank(null);
    setIsCopied(false); 
    setCelebrateFans(false);
    
    setBonusSpots(generateRandomBonuses(today, currentCols, mode));

    const obstacles = generateRandomObstacles(today, currentCols, mode);
    setObstacleSpots(obstacles);
    
    setStarSpots(generateWildcardSpots(today, obstacles, currentCols));
    setFanSpots(generateCheerSquad()); 

    setMessage({ text: "Goal: Get as far right as you can.", type: "neutral" });
    setIsFinishing(false);
    setShowConfirmSubmit(false);
    setShowTutorial(false);
    setShowRules(false);
    setIsSubmittingScore(false);
    setHasShownMidgameAd(false);
    setShowStartHint(false); 
    setShowExitConfirmation(false);
    setIsReviewingBoard(false);
    setSelectedTileId(null);
    setSelectedGridSpot(null);
    setShowSettings(false);
    
    // CHANGED: Default par for Maze
    const cachedPar = parCache.current[mode] || (mode === 'maze' ? 20 : 25);
    setDailyPar(cachedPar);

    setSelectedGridSpot({ r: 2, c: 0 });
    setHasUsedUndo(false);

    if(scrollContainerRef.current) scrollContainerRef.current.scrollLeft = 0;
  };

const handleCGLogin = async () => {
      handleFeedback('click');
      const user = await promptLogin();
      if (user) {
          setCgUser(user);
          setPlayerName(user.username);
      }
  };


  const handleStartGame = (mode) => {
    handleFeedback('click');
    if (!playerName.trim()) setPlayerName(generateRandomName());
    setGameState('playing');
    initGame(mode);
    gameStart(); // SDK Hook
    setShowTutorial(true);
  };

  const handlePlayAgain = () => {
      handleFeedback('click');
      setGameState('menu');
      initGame('standard'); 
  };

  // --- NEW UNDO UI LOGIC ---
  const handleUndoRequest = () => {
      handleFeedback('click');
      if (history.length === 0) return;
      
      // Check limit
      if (hasUsedUndo) {
          setMessage({ text: "Already used Undo this turn!", type: "error" });
          handleFeedback('error');
          return;
      }

      // Open Modal
      setShowUndoModal(true);
  };

  const confirmUndo = () => {
      const previousState = history[history.length - 1];
      const newHistory = history.slice(0, -1);
      
      setGrid(previousState.grid);
      setScore(previousState.score);
      setDrawCount(previousState.drawCount);
      
      const uniqueRestoredHand = Array.from(
          new Map(
              previousState.hand.map(tile => [tile.id, { ...tile, isPlaced: false }])
          ).values()
      );

      setHand(uniqueRestoredHand);
      setHistory(newHistory);
      setPlacedTiles([]); 
      setSelectedTileId(null);
      setMessage({ text: "Move undone", type: "info" });
      
      setHasUsedUndo(true); // Mark as used
      setShowUndoModal(false); // Close Modal
  };

  const findTileInHand = (char) => {
    const target = char.toUpperCase();
    return [...hand].reverse().find(t => t.letter === target && !t.isPlaced);
  };

  // Cancel Placement & Reset Cursor
  const handleCancelPlacement = () => {
      if (placedTiles.length === 0) return;
      
      handleFeedback('click');

      // 1. Capture the start coordinates (Save as primitive values)
      const sortedTiles = [...placedTiles].sort((a, b) => (a.r - b.r) || (a.c - b.c));
      const startTile = sortedTiles[0];
      const targetR = startTile ? startTile.r : null;
      const targetC = startTile ? startTile.c : null;

      // 2. Return letters to hand
      const returnedLetters = placedTiles.map(t => t.isWild ? '*' : t.letter);
      const freshTiles = returnedLetters.map(l => createTile(l, false));
      
      setHand(prev => {
          const cleanedHand = prev.filter(t => !t.isPlaced);
          return [...cleanedHand, ...freshTiles].sort((a, b) => {
              if (a.letter !== b.letter) return a.letter.localeCompare(b.letter);
              return (a.isNew === b.isNew) ? 0 : (a.isNew ? 1 : -1);
          });
      });

      // 3. Clear the board state
      setPlacedTiles([]);
      setSelectedTileId(null);

      // 4. FORCE UPDATE: Set to null first, then jump to target
      if (targetR !== null && targetC !== null) {
          setSelectedGridSpot(null);
          
          setTimeout(() => {
              setSelectedGridSpot({ r: targetR, c: targetC });
          }, 10);
      }
  };

  const moveCursor = (direction) => {
    const currentCols = grid[0].length;
    if (!selectedGridSpot) {
      setSelectedGridSpot({ r: 2, c: score });
      return;
    }
    let { r, c } = selectedGridSpot;
    if (direction === 'ArrowUp') r = Math.max(0, r - 1);
    if (direction === 'ArrowDown') r = Math.min(GRID_ROWS - 1, r + 1);
    if (direction === 'ArrowLeft') c = Math.max(0, c - 1);
    if (direction === 'ArrowRight') c = Math.min(currentCols - 1, c + 1);
    setSelectedGridSpot({ r, c });
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      // --- TEST MODE TRIGGER ---
      if (e.key === 'k' || e.key === 'K') {
          kPressCount.current += 1;
          if (kPressCount.current >= 10) {
              handleFeedback('fanfare');
              setPlayedWords(["TEST", "MODE", "ACTIVE", "RANDOM", "WORDS", "SHOWN", "HERE", "FOR", "DEBUG", "PURPOSES"]);
              setScore(42);
              setDisplayScore(42);
              // Mock stats so the UI doesn't crash
              setFinalPlayerStats({ 
                  gamesPlayed: 10, currentStreak: 5, maxStreak: 10, totalDistance: 420, lastPlayedDate: new Date().toISOString().split('T')[0] 
              });
              setGameState('gameOver');
              kPressCount.current = 0;
              return;
          }
      } else {
          kPressCount.current = 0; // Reset if they type anything else
      }

      if (gameState !== 'playing' || isFinishing || showRules || showTutorial || showConfirmSubmit || showBlankPicker || showExitConfirmation || showSettings || showReportModal || showUndoModal) return;

      if (e.code === 'Space') {
          e.preventDefault(); 
          shuffleHand();
          return;
      }
      if (e.key === 'Escape') {
          handleCancelPlacement();
          return;
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault(); 
        moveCursor(e.key);
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
         if (selectedGridSpot) {
             const { r, c } = selectedGridSpot;
             const tempTile = placedTiles.find(t => t.r === r && t.c === c);
             if (tempTile) handleGridClick(r, c); 
             else moveCursor('ArrowLeft');
         }
         return;
      }

      if (e.key === 'Enter') {
          if (placedTiles.length > 0) validateAndCommit();
          return;
      }

      if (/^[a-zA-Z]$/.test(e.key)) {
        const currentCols = grid[0].length;
        if (!selectedGridSpot) {
            setSelectedGridSpot({ r: 2, c: score });
            return;
        }
        const { r, c } = selectedGridSpot;
        if ((grid[r] && grid[r][c]) || obstacleSpots.some(o => o.r === r && o.c === c)) {
             moveCursor('ArrowRight');
             return;
        }
        
        let tile = findTileInHand(e.key);
        let letterToUse = null;

        if (!tile) {
            const wildTile = findTileInHand('*');
            if (wildTile) {
                tile = wildTile;
                letterToUse = e.key.toUpperCase(); 
            }
        }

        if (tile) {
            placeTileAt(tile, r, c, letterToUse);
            setSelectedGridSpot({ r, c: Math.min(currentCols - 1, c + 1) });
        } else {
            setMessage({ text: `No '${e.key.toUpperCase()}' or Wildcard in hand`, type: 'error' });
            setTimeout(() => setMessage({ text: "Goal: Get as far right as you can.", type: "neutral" }), 1000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isFinishing, selectedGridSpot, hand, placedTiles, showRules, showTutorial, showConfirmSubmit, showBlankPicker, showExitConfirmation, showSettings, showReportModal, showUndoModal]);

  useEffect(() => {
    if (selectedGridSpot && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cellLeft = selectedGridSpot.c * CELL_SIZE;
      const cellRight = cellLeft + CELL_SIZE;
      const viewLeft = container.scrollLeft;
      const viewRight = viewLeft + container.clientWidth;
      const PADDING = 100;
      if (cellLeft < viewLeft) {
        container.scrollTo({ left: Math.max(0, cellLeft - PADDING), behavior: 'smooth' });
      } else if (cellRight > viewRight) {
        container.scrollTo({ left: cellRight - container.clientWidth + PADDING, behavior: 'smooth' });
      }
    }
  }, [selectedGridSpot]);

  const handleRequestSubmit = () => setShowReviveModal(true);

  const handleRevive = () => {
      requestRewardAd(() => {
          // Reward: Add 5 random tiles
          const rewardTiles = dailyDeck.slice(drawCount, drawCount + 5).map(l => createTile(l, true));
          setHand(prev => [...prev, ...rewardTiles].sort((a, b) => a.letter.localeCompare(b.letter)));
          setDrawCount(prev => prev + 5);
          setShowReviveModal(false);
          setMessage({ text: "Revived! +5 Letters", type: "success" });
          happyTime();
      });
  };

  const handleSkipRevive = () => {
      setShowReviveModal(false);
      setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = async () => {
      setShowConfirmSubmit(false);
      setIsFinishing(true); 
      setIsSubmittingScore(true);
      
      handleFeedback('fanfare');
      happyTime(); // SDK Hook: Win/End run

      const isTestUser = playerName.trim().toLowerCase() === 'test';

      if (user && !isTestUser) { 
          try {
              const todayStr = new Date().toISOString().split('T')[0];
              const scoresRef = collection(db, 'artifacts', dbAppId, 'public', 'data', 'scores_crazygames');
              await addDoc(scoresRef, {
                  name: playerName || "Anonymous",
                  score: score,
                  mode: gameMode,
                  date: todayStr,
                  timestamp: Date.now(),
                  userId: user.uid
              });
              setLastSubmitTime(Date.now());
              console.log("✅ SUCCESS: Score saved to 'scores_crazygames'!");
          } catch (e) { console.error("Error saving score:", e); }
      }

      const newStats = updatePlayerStats(score);
      setFinalPlayerStats(newStats);

      setIsSubmittingScore(false);
      const animationTime = (score * 50) + 800;
      const minTime = 2500;
      setTimeout(() => {
          setGameState('gameOver');
          gameStop(); // SDK Hook
          setIsFinishing(false);
      }, Math.max(animationTime, minTime));
  };

  const handleCancelSubmit = () => setShowConfirmSubmit(false);
  const handleLogoClick = () => gameState === 'playing' ? setShowExitConfirmation(true) : setGameState('menu');
  const confirmExit = () => { 
      setShowExitConfirmation(false); 
      setGameState('menu'); 
      gameStop(); // SDK Hook
      initGame(); 
      setShowRules(false); 
  };

  const handleShareText = async () => {
    const rankText = playerRank ? getOrdinal(playerRank) : "top";
    const shareUrl = "https://www.longjump.co.za";
    
    // Create word list string
    const wordListStr = playedWords.length > 0 
        ? `\n\n📝 Words: ${playedWords.join(', ')}` 
        : "";

    let shareString = playerRank 
        ? `${playerName} placed ${rankText} in Long-Jump with a distance of ${score}m. How far can you get? ${shareUrl}${wordListStr}`
        : `${playerName} got a distance of ${score}m in Long-Jump. How far can you get? ${shareUrl}${wordListStr}`;
    
    try {
        if (navigator.share) {
             await navigator.share({
                 title: 'Long Jump Result',
                 text: shareString
             });
        } else {
             await navigator.clipboard.writeText(shareString);
             setIsCopied(true);
             setTimeout(() => setIsCopied(false), 1000);
        }
    } catch (err) { 
        console.error('Failed to copy/share: ', err); 
        // Fallback for desktop clipboard if share API fails/cancelled
        try {
            await navigator.clipboard.writeText(shareString);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 1000);
        } catch (e) {}
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('[draggable="true"]') || e.target.tagName === 'BUTTON') return;
    setIsDraggingBoard(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDraggingBoard(false);
  const handleMouseUp = () => setIsDraggingBoard(false);
  const handleMouseMove = (e) => {
    if (!isDraggingBoard) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const placeTileAt = (tile, r, c, overrideLetter = null) => {
      handleFeedback('light');
      
      if (tile.letter === '*' && !overrideLetter) {
          setPendingBlankPlacement({r, c, tileId: tile.id});
          setShowBlankPicker(true);
          return;
      }
      
      const isWild = tile.letter === '*';
      commitTilePlacement(tile, r, c, isWild, overrideLetter);
  };

  const commitTilePlacement = (tile, r, c, isFromBlank = false, overrideLetter = null) => {
      const isFirstMove = grid.every(row => row.every(cell => cell === null));
      if (isFirstMove && placedTiles.length === 0 && c !== 0) {
        setShowStartHint(true);
        setTimeout(() => setShowStartHint(false), 3000);
        return;
      }
      const letterToUse = overrideLetter || tile.letter;
      const potentialPlaced = [...placedTiles, { r, c, letter: letterToUse, isWild: isFromBlank, id: tile.id }];

      if (!isLinearPlacement(potentialPlaced)) {
          setMessage({ text: "⚠️ Tiles must be placed in a single row or column", type: "error" });
          handleFeedback('error');
          return;
      }
      setPlacedTiles(potentialPlaced);
      
      setHand(prev => prev.map(t => t.id === tile.id ? { ...t, isPlaced: true } : t));
      
      setShowStartHint(false);
      if (message.type === 'error') setMessage({ text: "Goal: Get as far right as you can.", type: "neutral" });
  };

  const handleBlankSelection = (letter) => {
      handleFeedback('light');
      if (pendingBlankPlacement) {
          const dummyTile = { id: pendingBlankPlacement.tileId, letter: '*', isNew: false };
          commitTilePlacement(dummyTile, pendingBlankPlacement.r, pendingBlankPlacement.c, true, letter);
          
          setSelectedGridSpot({ 
             r: pendingBlankPlacement.r, 
             c: Math.min(grid[0].length - 1, pendingBlankPlacement.c + 1) 
          });

          setShowBlankPicker(false);
          setPendingBlankPlacement(null);
          setSelectedTileId(null);
      }
  };

  const handleHandClick = (tileId) => {
    handleFeedback('light');
    if (isFinishing) return;
    if (gameState !== 'playing') return;

    if (selectedGridSpot) {
        const { r, c } = selectedGridSpot;
        const currentCols = grid[0].length;
        
        const isBlocked = (grid[r] && grid[r][c]) || obstacleSpots.some(o => o.r === r && o.c === c);

        if (!isBlocked) {
            const tile = hand.find(t => t.id === tileId);
            if (tile) {
                placeTileAt(tile, r, c);
                setSelectedGridSpot({ r, c: Math.min(currentCols - 1, c + 1) });
            }
            return;
        }
    }

    if (selectedTileId === tileId) {
      setSelectedTileId(null);
    } else {
      setSelectedTileId(tileId);
    }
  };

  const handleGridClick = (r, c) => {
    if (isDraggingBoard || isFinishing || gameState !== 'playing') return; 
    if (grid[r] && grid[r][c]) return;
    if (obstacleSpots.some(o => o.r === r && o.c === c)) return;

    const existingTempIndex = placedTiles.findIndex(t => t.r === r && t.c === c);
    if (existingTempIndex !== -1) {
      handleFeedback('light');
      const tileToRemove = placedTiles[existingTempIndex];
      const newPlaced = [...placedTiles];
      newPlaced.splice(existingTempIndex, 1);
      setPlacedTiles(newPlaced);
      
      setHand(prev => prev.map(t => t.id === tileToRemove.id ? { ...t, isPlaced: false } : t));
      
      setSelectedTileId(null);
      setSelectedGridSpot({ r, c });
      return;
    }

    if (selectedTileId) {
      const tile = hand.find(t => t.id === selectedTileId);
      if (tile) {
          const currentCols = grid[0].length;
          placeTileAt(tile, r, c);
          setSelectedTileId(null);
          setSelectedGridSpot({ r, c: Math.min(currentCols - 1, c + 1) });
      }
    } else {
      setSelectedGridSpot({ r, c });
    }
  };

  const handleDragStart = (e, data) => {
    if (isFinishing || gameState !== 'playing') return;
    e.dataTransfer.setData("text/plain", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };

  const handleDropOnGrid = (e, r, c) => {
    if (isFinishing || gameState !== 'playing') return;
    e.preventDefault(); e.stopPropagation();
    if (obstacleSpots.some(o => o.r === r && o.c === c)) return;

    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      if (grid[r] && grid[r][c]) return;
      const existingTempIndex = placedTiles.findIndex(t => t.r === r && t.c === c);
      const currentCols = grid[0].length;

      if (data.type === 'hand') {
        handleFeedback('light');
        const tile = data.tile; 
        if (tile.letter === '*') {
            setPendingBlankPlacement({r, c, tileId: tile.id});
            setShowBlankPicker(true);
            return;
        }
        const isFirstMove = grid.every(row => row.every(cell => cell === null));
        if (isFirstMove && placedTiles.length === 0 && c !== 0) {
           setShowStartHint(true);
           setTimeout(() => setShowStartHint(false), 3000);
           return;
        }
        if (existingTempIndex !== -1) {
            const existingTile = placedTiles[existingTempIndex];
            const newPlaced = [...placedTiles];
            
            setHand(prev => prev.map(t => {
                if (t.id === tile.id) return { ...t, isPlaced: true };
                if (t.id === existingTile.id) return { ...t, isPlaced: false };
                return t;
            }));

            newPlaced.splice(existingTempIndex, 1, { r, c, letter: tile.letter, isWild: false, id: tile.id });
            setPlacedTiles(newPlaced);
        } else {
            const potentialPlaced = [...placedTiles, { r, c, letter: tile.letter, isWild: false, id: tile.id }];
            if (!isLinearPlacement(potentialPlaced)) {
              setMessage({ text: "⚠️ Tiles must be placed in a single row or column", type: "error" });
              handleFeedback('error');
              return;
            }
            setPlacedTiles(potentialPlaced);
            setHand(prev => prev.map(t => t.id === tile.id ? { ...t, isPlaced: true } : t));
        }
        setShowStartHint(false);
        setSelectedTileId(null);
        
        setSelectedGridSpot({r, c: Math.min(currentCols - 1, c + 1)});
        
        if (message.type === 'error') setMessage({ text: "Goal: Get as far right as you can.", type: "neutral" });
      }
      else if (data.type === 'board') {
        if (data.r === r && data.c === c) return;
        const movingTileIndex = placedTiles.findIndex(t => t.r === data.r && t.c === data.c);
        if (movingTileIndex === -1) return;
        const movingTile = placedTiles[movingTileIndex];
        const newPlaced = [...placedTiles];
        if (existingTempIndex !== -1) {
            const targetTile = placedTiles[existingTempIndex];
            newPlaced[existingTempIndex] = { ...targetTile, r: data.r, c: data.c };
            newPlaced[movingTileIndex] = { ...movingTile, r, c };
        } else {
            newPlaced[movingTileIndex] = { ...movingTile, r, c };
        }
        if (!isLinearPlacement(newPlaced)) {
            setMessage({ text: "⚠️ Tiles must be placed in a single row or column", type: "error" });
            handleFeedback('error');
            return;
        }
        setPlacedTiles(newPlaced);
        setSelectedGridSpot({r, c: Math.min(currentCols - 1, c + 1)});
      }
    } catch (err) {}
  };

  const handleDropOnHand = (e) => {
    if (isFinishing || gameState !== 'playing') return;
    e.preventDefault(); e.stopPropagation();
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr) return;
    try {
      const data = JSON.parse(dataStr);
      if (data.type === 'board') {
         const tile = placedTiles.find(t => t.r === data.r && t.c === data.c);
         setPlacedTiles(prev => prev.filter(t => !(t.r === data.r && t.c === data.c)));
         setHand(prev => prev.map(t => t.id === tile.id ? { ...t, isPlaced: false } : t));
         handleFeedback('light');
      }
    } catch (err) {}
  };

  const getCellContent = (r, c) => {
    if (!grid || !grid[r]) return null;
    if (grid[r][c]) return { letter: grid[r][c], type: 'locked' };
    const temp = placedTiles.find(t => t.r === r && t.c === c);
    if (temp) return { letter: temp.letter, type: 'temp', isWild: temp.isWild };
    return null;
  };

  const getBonusAt = (r, c) => bonusSpots.find(b => b.r === r && b.c === c);
  const getObstacleAt = (r, c) => obstacleSpots.find(o => o.r === r && o.c === c);

  const validateAndCommit = async () => {
    if (placedTiles.length === 0) return;
    setIsValidating(true);
    setMessage({ text: "Validating...", type: "info" });

    const tempGrid = grid.map(row => [...row]);
    placedTiles.forEach(t => {
      if (tempGrid[t.r]) tempGrid[t.r][t.c] = t.letter;
    });

    if (placedTiles.length > 1) {
        const sortedTiles = [...placedTiles].sort((a, b) => (a.r - b.r) || (a.c - b.c));
        const first = sortedTiles[0];
        const last = sortedTiles[sortedTiles.length - 1];
        if (first.r === last.r) {
            for (let c = first.c; c <= last.c; c++) {
                if (!tempGrid[first.r][c]) { failValidation("Cannot leave gaps between tiles."); return; }
            }
        } else {
            for (let r = first.r; r <= last.r; r++) {
                if (!tempGrid[r][first.c]) { failValidation("Cannot leave gaps between tiles."); return; }
            }
        }
    }

    const isFirstMove = grid.every(row => row.every(cell => cell === null));
    let touchesStart = false;
    let connectsToExisting = false;
    const currentCols = grid[0].length;

    placedTiles.forEach(t => {
      if (t.c === 0) touchesStart = true;
      const neighbors = [{r: t.r+1, c: t.c}, {r: t.r-1, c: t.c}, {r: t.r, c: t.c+1}, {r: t.r, c: t.c-1}];
      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < GRID_ROWS && n.c >= 0 && n.c < currentCols) {
          if (grid[n.r] && grid[n.r][n.c]) connectsToExisting = true;
        }
      });
    });

    if (isFirstMove && !touchesStart) { failValidation("First word must start in Column 1."); return; }
    if (!isFirstMove && !connectsToExisting) { failValidation("Tiles must connect to existing words."); return; }

    const words = getWords(tempGrid);
    const newWords = words.filter(w => w.cells.some(wc => placedTiles.some(pt => pt.r === wc.r && pt.c === wc.c)));

    if (newWords.length === 0) { failValidation("Words must be at least 2 letters."); return; }

    try {
      const invalidWords = [];
      for (const wordObj of newWords) {
        const isValid = await checkWordAPI(wordObj.word);
        if (!isValid) invalidWords.push(wordObj.word);
      }
      if (invalidWords.length > 0) { failValidation(`Invalid word(s): ${invalidWords.join(", ")}`, invalidWords[0]); return; }
      commitMove(tempGrid, newWords);
    } catch (e) { console.error(e); failValidation("Error checking dictionary. Try again."); }
  };

  const checkWordAPI = async (word) => {
    const cleanWord = word.toLowerCase().trim();
    const upperWord = cleanWord.toUpperCase();
    
    // 1. Check local lists first (Fastest / Free)
    if (missingWords.has(upperWord)) return true;
    if (LOCAL_DICTIONARY.has(upperWord)) return true;
    if (cleanWord.length === 2) return false; 

    // 2. Merriam-Webster Collegiate API Check
    try {
      const apiKey = "4e64bca3-60b7-40bf-bcda-d8e496a67a7f";
      // Use the Collegiate endpoint
      const url = `https://dictionaryapi.com/api/v3/references/collegiate/json/${encodeURIComponent(cleanWord)}?key=${apiKey}`;
      
      const res = await fetch(url);
      if (!res.ok) return false;
      
      const data = await res.json();
      
      // CHECK 1: Empty response or "Suggestions" (Array of Strings) means invalid
      if (!Array.isArray(data) || data.length === 0) return false;
      if (typeof data[0] === 'string') return false;

      // CHECK 2: Validate against Stems and Labels
      const isValidEntry = data.some(entry => {
          // A. Sanity check: must be an object with meta data
          if (typeof entry !== 'object' || !entry.meta) return false;

          // B. Filter out Abbreviations
          if (entry.fl === "abbreviation" || entry.fl === "abbr") return false;

          // C. Check Stems
          if (Array.isArray(entry.meta.stems)) {
              const stems = entry.meta.stems.map(s => s.toLowerCase());
              return stems.includes(cleanWord);
          }

          return false;
      });

      return isValidEntry;

    } catch (e) { 
        // Fail-safe: If API limits are hit or network fails, allow the word
        console.warn("M-W API Error:", e);
        return true; 
    }
  };

  // --- REPORT WORD REQUEST ---
  const handleReportRequest = (word) => {
      setPendingReportWord(word);
      setShowReportModal(true);
  };

  // --- REPORT CONFIRMATION ---
  const confirmReport = async () => {
      if (!pendingReportWord) return;
      try {
          const wordsRef = collection(db, 'missing_words');
          await addDoc(wordsRef, {
              word: pendingReportWord.toUpperCase(),
              reportedBy: playerName,
              date: new Date().toISOString()
          });
          setMissingWords(prev => new Set(prev).add(pendingReportWord.toUpperCase()));
          setMessage({ text: `Reported '${pendingReportWord}' - You can use it now!`, type: "success" });
      } catch (e) {
          console.error("Error reporting word:", e);
          setMessage({ text: "Could not report word.", type: "error" });
      }
      setShowReportModal(false);
      setPendingReportWord(null);
  };

  const getWords = (board) => {
    let words = [];
    const currentCols = grid[0].length;
    for (let r = 0; r < GRID_ROWS; r++) {
      let currentWord = "";
      let currentCells = [];
      for (let c = 0; c < currentCols; c++) {
        if (board[r] && board[r][c]) {
          currentWord += board[r][c];
          currentCells.push({r, c});
        } else {
          if (currentWord.length > 1) words.push({ word: currentWord, cells: [...currentCells], type: 'H' });
          currentWord = "";
          currentCells = [];
        }
      }
      if (currentWord.length > 1) words.push({ word: currentWord, cells: [...currentCells], type: 'H' });
    }
    for (let c = 0; c < currentCols; c++) {
      let currentWord = "";
      let currentCells = [];
      for (let r = 0; r < GRID_ROWS; r++) {
        if (board[r] && board[r][c]) {
          currentWord += board[r][c];
          currentCells.push({r, c});
        } else {
          if (currentWord.length > 1) words.push({ word: currentWord, cells: [...currentCells], type: 'V' });
          currentWord = "";
          currentCells = [];
        }
      }
      if (currentWord.length > 1) words.push({ word: currentWord, cells: [...currentCells], type: 'V' });
    }
    return words;
  };

  const failValidation = (msg, invalidWord = null) => { 
      setMessage({ text: msg, type: "error", invalidWord }); 
      setIsValidating(false); 
      handleFeedback('error');
  };

  const commitMove = (newGrid, newWords) => {
    handleFeedback('success');
    const gridSnapshot = JSON.parse(JSON.stringify(grid));
    setPlayedWords(prev => [...prev, ...newWords.map(w => w.word)]);
    
    // FIXED: Removed 'christmasCells' from the history object here
    setHistory(prev => [...prev, { grid: gridSnapshot, hand: hand.map(t => ({...t, isPlaced: false})), score, drawCount }]);
    
    setGrid(newGrid); 
    setCelebrateFans(true); 
    setTimeout(() => setCelebrateFans(false), 200);
    
    let bonus = 0; 
    let wildcardsEarned = 0; // Counter logic (Kept this as requested)
    let giftType = null; 
    
    // REMOVED: let xmas = false;

    newWords.forEach(w => {
      // REMOVED: The check for CHRISTMAS_WORDS and setChristmasCells
      w.cells.forEach(wc => {
        const b = getBonusAt(wc.r, wc.c); 
        const isPlaced = placedTiles.some(pt => pt.r === wc.r && pt.c === wc.c);
        
        if (b && isPlaced) { 
            if (b.type && b.type.startsWith('gift')) giftType = b.type; 
            else if (b.val) bonus += b.val; 
        }
        
        // This is the Double Wildcard logic you wanted (Accumulative)
        if (starSpots.some(s => s.r === wc.r && s.c === wc.c)) wildcardsEarned++;
      });
    });

    let nextHand = hand.filter(t => !t.isPlaced);
    
    // Add Bonus Letter Tiles
    if (bonus > 0) { 
        const newTiles = dailyDeck.slice(drawCount, drawCount + bonus).map(l => createTile(l, true)); 
        nextHand = [...nextHand, ...newTiles]; 
        setDrawCount(prev => prev + bonus); 
    }
    
    // Add Wildcards (Based on the counter)
    if (wildcardsEarned > 0) {
        const newWilds = Array(wildcardsEarned).fill(null).map(() => createTile('*', true));
        nextHand = [...nextHand, ...newWilds];
    }
    
    nextHand.sort((a, b) => a.letter.localeCompare(b.letter)); 
    setHand(nextHand);

    // Handle Gifts or Messages
    if (giftType) { 
        const pool = dailyDeck.slice(drawCount, drawCount + (giftType === 'gift_large' ? 5 : giftType === 'gift_medium' ? 4 : 3)); 
        setActiveGiftType(giftType); 
        setActiveGiftPool(pool); 
        setSelectedGiftIndices(new Set()); 
        setTimeout(() => setShowGiftModal(true), 500); 
    }
    // REMOVED: else if (xmas) check
    else if (bonus > 0 || wildcardsEarned > 0) {
        happyTime(); // SDK Hook
        // Updated message to show exact number of wildcards earned
        const wildcardMsg = wildcardsEarned > 0 ? `${wildcardsEarned} Wildcard${wildcardsEarned > 1 ? 's' : ''} Unlocked!` : '';
        const bonusMsg = bonus > 0 ? `+${bonus} Tiles!` : '';
        setMessage({ text: `${wildcardMsg} ${bonusMsg}`, type: "success" });
    }
    else { 
        setMessage({ text: "Valid move!", type: "success" }); 
    }

    // Update Score (Max Column Reached)
    let maxCol = score - 1; 
    placedTiles.forEach(t => { if (t.c > maxCol) maxCol = t.c; });
    const currentCols = newGrid[0].length;
    for(let r=0; r<GRID_ROWS; r++) { for(let c=0; c<currentCols; c++) { if(newGrid[r] && newGrid[r][c] && c > maxCol) maxCol = c; } }
      // TRIGGER MIDGAME AD @ 25m
    if ((maxCol + 1) >= 25 && !hasShownMidgameAd) {
        setHasShownMidgameAd(true);
        requestAd('midgame');
    }
    
    setScore(maxCol + 1); 
    setPlacedTiles([]); 
    setIsValidating(false); 
    setSelectedGridSpot(null); 
    setHasUsedUndo(false);
  };

  const shuffleHand = () => {
      handleFeedback('click');
      setHand(prev => [...prev].sort(() => Math.random() - 0.5));
  };
  const sortHand = () => {
      handleFeedback('click');
      setHand(prev => [...prev].sort((a, b) => {
        if (a.letter !== b.letter) return a.letter.localeCompare(b.letter);
        return (a.isNew === b.isNew) ? 0 : (a.isNew ? 1 : -1);
      }));
  };

  const groupedHand = hand.reduce((acc, tile) => {
      if (!acc[tile.letter]) acc[tile.letter] = [];
      acc[tile.letter].push(tile);
      return acc;
  }, {});
  const uniqueLetters = Array.from(new Set(hand.map(t => t.letter)));
  const showTwoRows = uniqueLetters.length >= 6;
  const midPoint = Math.ceil(uniqueLetters.length / 2);
  const topRowLetters = showTwoRows ? uniqueLetters.slice(0, midPoint) : uniqueLetters;
  const bottomRowLetters = showTwoRows ? uniqueLetters.slice(midPoint) : [];

  const HandTile = ({ letter }) => {
      const tiles = groupedHand[letter] || [];
      const available = tiles.filter(t => !t.isPlaced);
      const visualCount = Math.min(available.length, 15);
      const top = available[available.length - 1]; 

      if (tiles.length > 0 && visualCount === 0) {
          // UPDATED: Smaller placeholder on mobile
          return <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg border-2 border-dashed opacity-30" style={{ borderColor: theme.textSub }} />;
      }
      if (visualCount === 0) return null;

      const isSelected = top && selectedTileId === top.id;
      const stackOffset = 8; 
      
      return (
          // UPDATED: Smaller width on mobile. Removed inline height calculation.
          <div className="relative w-8 md:w-10 flex items-end transition-all duration-300">
              
              {[...Array(visualCount - 1)].map((_, i) => {
                  const rotation = ((letter.charCodeAt(0) + i) % 7) - 3;
                  return (
                    // UPDATED: Smaller tiles in stack on mobile
                    <div key={i} className="absolute w-8 h-8 md:w-10 md:h-10 rounded-lg border shadow-sm bg-white" 
                         style={{ 
                             borderColor: 'rgba(0,0,0,0.1)', 
                             bottom: `${i * stackOffset}px`, 
                             zIndex: i, 
                             transform: `rotate(${rotation}deg)` 
                         }} 
                    />
                  );
              })}
              
              <button
                draggable={!isFinishing && gameState === 'playing'}
                onDragStart={(e) => handleDragStart(e, { type: 'hand', tile: top })}
                onClick={(e) => { e.stopPropagation(); handleHandClick(top.id); }}
                // UPDATED: Smaller button, smaller font, 'relative' positioning
                className={`relative w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center text-lg md:text-2xl font-bold font-mono shadow-[0_4px_6px_rgba(0,0,0,0.15)] transition-all 
                    ${gameState === 'playing' ? 'cursor-grab active:cursor-grabbing hover:-translate-y-1' : 'cursor-default'}
                `}
                style={{
                    // UPDATED: Use marginBottom to create space for the stack
                    marginBottom: `${(visualCount - 1) * stackOffset}px`,
                    zIndex: visualCount + 10,
                    backgroundColor: isSelected ? theme.accentPrimary : (letter === '*' ? theme.tileTemp : '#ffffff'),
                    color: isSelected ? 'white' : '#1f2937',
                    border: '1px solid rgba(0,0,0,0.1)',
                    transform: isSelected ? 'translateY(-12px) rotate(0deg)' : `translateY(0) rotate(${isSelected ? 0 : (letter.charCodeAt(0) % 5 - 2)}deg)`
                }}
              >
                  {/* UPDATED: Smaller and repositioned "NEW" badge */}
                  {top.isNew && <div className="absolute -top-1 -right-1 md:-top-2 md:-right-1 bg-green-600 text-white text-[6px] md:text-[7px] font-black px-1 py-0.5 rounded shadow-sm z-50 tracking-tighter leading-none">NEW</div>}
                  {/* UPDATED: Smaller wildcard icon */}
                  {letter === '*' ? <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-500" fill={theme.starPurple} /> : letter}
              </button>
          </div>
      );
  };

  // --- MENU RENDER ---
  if (gameState === 'menu') {
    return (
      <div className="fixed inset-0 z-50 font-sans flex flex-col lg:flex-row items-center justify-start lg:justify-center p-4 gap-8 lg:gap-12 overflow-y-auto transition-colors duration-300" style={{ backgroundColor: theme.background, color: theme.textMain }}>
        <div className="fixed top-4 right-4 z-[60]">
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-black/5 transition-colors bg-white/50 backdrop-blur-sm shadow-sm" style={{ color: theme.textSub }}>
                <Settings size={24} />
            </button>
        </div>
        <div className="w-full max-w-md flex flex-col items-center text-center space-y-12 animate-fade-in justify-start pt-0 lg:pt-0 lg:justify-center relative lg:flex-1 lg:h-[600px] lg:self-stretch">
            <div className="space-y-4 flex flex-col items-center w-full mt-0 lg:mt-24">
                { <RiveLogo /> }
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400 mt-4">
                    <span>Refreshed Daily</span>
                    <Star size={12} className="text-yellow-500 fill-yellow-500 animate-[spin_4s_linear_infinite]" />
                </div>
                <div className="flex flex-col gap-1 items-center">
                    <p className="text-lg font-medium leading-relaxed max-w-sm mx-auto" style={{ color: theme.textSub }}>Jump as far as you can by building words, connecting tiles and picking up extra letters.</p>
                    {/* PAR INDICATOR */}
                    <div className="text-xs font-bold px-3 py-1 rounded-full border mt-2" style={{ backgroundColor: theme.tileLocked, color: theme.accentSecondary, borderColor: theme.accentPrimary }}>
                        Today's Par: {dailyPar}m
                    </div>
                </div>
            </div>

            <div className="w-full max-w-xs space-y-4">
                {cgUser ? (
                    // LOGGED IN STATE
                    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all animate-fade-in" style={{ backgroundColor: theme.modalBg, borderColor: theme.accentPrimary }}>
                        <img src={cgUser.profilePictureUrl} alt="Avatar" className="w-12 h-12 rounded-full border-2 shadow-sm" style={{ borderColor: theme.boardLines }} />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textSub }}>Logged in as</span>
                            <span className="text-xl font-black" style={{ color: theme.textMain }}>{cgUser.username}</span>
                        </div>
                    </div>
                ) : (
                    // GUEST STATE (Manual Input + Login Button)
                    <div className="space-y-3">
                        <div className="group">
                            <label className="block text-xs font-bold tracking-widest uppercase text-left pl-1 mb-1 transition-colors" style={{ color: theme.textSub }}>Guest Name</label>
                            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player 1" maxLength={12} className="w-full border-2 border-transparent outline-none px-6 py-3 rounded-2xl text-xl font-bold text-center shadow-sm transition-all" style={{ backgroundColor: theme.modalBg, color: theme.textMain, borderColor: 'transparent' }} onFocus={(e) => e.target.style.borderColor = theme.accentPrimary} onBlur={(e) => e.target.style.borderColor = 'transparent'} />
                        </div>
                        <div className="relative flex items-center justify-center">
                            <div className="border-t w-full absolute" style={{ borderColor: theme.boardLines }}></div>
                            <span className="bg-transparent px-2 text-[10px] font-bold uppercase z-10 relative" style={{ color: theme.textSub, backgroundColor: theme.background }}>OR</span>
                        </div>
                        <button onClick={handleCGLogin} className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-md hover:scale-105 transition-transform flex items-center justify-center gap-2" style={{ backgroundColor: '#6b21a8' }}>
                            Login with CrazyGames
                        </button>
                    </div>
                )}
            </div>

            {/* Buttons Row */}
<div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-md justify-center">
                <button
                    onClick={() => handleStartGame('standard')}
                    className="flex-1 py-2 rounded-2xl font-black text-lg uppercase shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-white"
                    style={{ backgroundColor: theme.accentPrimary }} 
                >
                    Play <Play size={20} fill="currentColor" />
                </button>

                <button
                    onClick={() => handleStartGame('maze')}
                    className="flex-1 py-2 rounded-2xl font-black text-lg uppercase shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all flex flex-col items-center justify-center gap-0 text-white"
                    style={{ backgroundColor: '#d97706' }}
                >
                    <span>MAZE MODE</span>
                    <span className="text-[10px] font-bold text-orange-100/80 tracking-widest">
                        HARDCORE
                    </span>
                </button>
            </div>
            
            {/* Tip Jar & Attribution */}
            <div className="flex flex-col items-center gap-3 mt-2 w-full">
                <div className="flex flex-row items-center justify-center gap-4">
                    <button onClick={() => setShowChangelog(true)} className="group flex items-center gap-2 px-3 py-2 rounded-full font-bold text-xs transition-colors shadow-sm whitespace-nowrap" style={{ backgroundColor: theme.tileLocked, color: theme.textSub }} title="Updates">
                         <ScrollText size={14} />
                    </button>
                    <a href="https://www.richardbolland.co.za" target="_blank" rel="noopener noreferrer" className="text-xs hover:opacity-80 border-b border-gray-500 transition-colors pb-0.5 whitespace-nowrap" style={{ color: theme.textSub }}>By Richard Bolland</a>
                    <span style={{ color: theme.boardLines }}>|</span>
                    <a href="https://pay.yoco.com/richard-bolland" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full text-pink-600 font-bold text-xs hover:bg-pink-100 transition-colors shadow-sm whitespace-nowrap">
                        <Heart size={14} className="fill-pink-600" />
                        <span>Tip Jar</span>
                    </a>
                </div>
                <span className="text-[10px] text-center max-w-xs leading-tight" style={{ color: theme.textSub }}>Help cover server costs & keep the game running.</span>
            </div>

            <div className="block lg:hidden w-full h-full min-h-[300px]">
                  <DailyLeaderboard user={user} lastUpdated={lastSubmitTime} initialMode='standard' onParCalculated={handleParUpdate} theme={theme} />
            </div>
        </div>

        {/* Desktop Leaderboard (Hidden on Mobile) */}
        <div className="hidden lg:block w-full max-w-sm lg:h-[600px] flex-1 self-stretch">
             <DailyLeaderboard user={user} lastUpdated={lastSubmitTime} initialMode='standard' onParCalculated={handleParUpdate} theme={theme} />
        </div>

        {/* SETTINGS MODAL (Moved OUTSIDE the hidden div so it works on mobile) */}
        {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4 pointer-events-auto">
                <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full border max-h-[85vh] overflow-y-auto custom-scrollbar bg-white" style={{ backgroundColor: theme.modalBg }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black uppercase" style={{ color: theme.textMain }}>Settings</h3>
                        <button onClick={() => setShowSettings(false)} className="hover:opacity-70" style={{ color: theme.textSub }}><X size={24} /></button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: theme.textSub }}>Username</label>
                            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} className="w-full border-2 px-4 py-3 rounded-xl font-bold outline-none transition-all bg-gray-50" style={{ borderColor: theme.boardLines, color: theme.textMain }} />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sun size={20} className="text-yellow-500" /><span className="font-bold text-sm" style={{ color: theme.textMain }}>Dark Mode</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Volume2 size={20} className="text-blue-500" /><span className="font-bold text-sm" style={{ color: theme.textMain }}>Sound Effects</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Zap size={20} className="text-orange-500" /><span className="font-bold text-sm" style={{ color: theme.textMain }}>Haptics</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={hapticsEnabled} onChange={() => setHapticsEnabled(!hapticsEnabled)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">🎉</span><span className="font-bold text-sm" style={{ color: theme.textMain }}>Crowd Fans</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={showFans} onChange={() => setShowFans(!showFans)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: theme.boardLines }}>
                          <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: theme.textSub }}>Make a Suggestion</label>
                          <textarea value={suggestionText} onChange={(e) => setSuggestionText(e.target.value)} 
                            className="w-full border-2 px-4 py-3 rounded-xl font-medium text-sm outline-none transition-all resize-none h-24 bg-gray-50" 
                            style={{ borderColor: theme.boardLines, color: theme.textMain }} placeholder="Ideas..." /><button onClick={handleSubmitSuggestion} 
                              disabled={suggestionStatus !== 'idle' || !suggestionText.trim()} 
                              className={`w-full mt-2 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-sm bg-gray-500 text-white`}
                          >Submit Suggestion</button></div>
                        
                        {/* PRIVACY POLICY LINK */}
                        <div className="flex justify-center pt-2">
                            <a href="https://www.richardbolland.co.za/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[10px] opacity-50 hover:opacity-100 font-bold uppercase tracking-widest transition-opacity" style={{ color: theme.textSub }}>
                                Privacy Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        )}
      
  

        {/* CHANGELOG MODAL */}
        {showChangelog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
              <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full border" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {/* v9.10 - Maze Mode Update */}
                        <div className="border-l-2 pl-3" style={{ borderColor: '#D97706' }}>
                           <div className="text-xs font-bold uppercase" style={{ color: '#D97706' }}>v9.10</div>
                           <div className="font-bold" style={{ color: theme.textMain }}>Maze Mode Arrives!</div>
                           <p className="text-xs" style={{ color: theme.textSub }}>
                               New hardcore mode! Navigate dense obstacles with big rewards!.
                           </p>
                           <ul className="text-[10px] list-disc list-inside mt-1" style={{ color: theme.textSub }}>
                               <li>New "Maze" Leaderboard</li>
                               <li>End Game Word List & Stats</li>
                           </ul>
                       </div>

                        {/* v9.01 - Christmas Polish */}
                        <div className="border-l-2 pl-3 border-gray-200">
                           <div className="text-xs font-bold uppercase text-gray-400">v9.01</div>
                           <div className="font-bold" style={{ color: theme.textSub }}>Christmas Mode (Archived)</div>
                           <p className="text-xs" style={{ color: theme.textSub }}>New Gift Boxes, Secret Rewards, and festive fixes.</p>
                       </div>
                       
                       {/* v8.11 - Dictionary */}
                       <div className="border-l-2 border-gray-200 pl-3">
                           <div className="text-xs font-bold text-gray-400 uppercase">v8.11</div>
                           <div className="font-bold" style={{ color: theme.textSub }}>Dictionary Upgrade</div>
                           <p className="text-xs" style={{ color: theme.textSub }}>Now powered by Merriam-Webster Collegiate Dictionary!</p>
                       </div>
                  </div>
                  
                  <button onClick={() => setShowChangelog(false)} className="w-full mt-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-all" style={{ backgroundColor: theme.boardLines, color: theme.textMain }}>Close</button>
              </div>
          </div>
      )}

      </div>
    );
  }

  // --- GAME RENDER ---
  return (
    <div className="fixed inset-0 w-full h-full font-sans flex flex-col items-center overflow-hidden touch-none select-none transition-colors duration-300" style={{ backgroundColor: theme.background, color: theme.textMain }}>
      {gameState === 'gameOver' && !isReviewingBoard && (
          <div className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col lg:flex-row items-center justify-start lg:justify-center p-6 gap-6 lg:gap-12 overflow-y-auto animate-fade-in pt-20 lg:pt-6">
              <Confetti theme={theme} />
              {/* NEW GAME OVER CARD */}
              <div className="backdrop-blur-md p-8 rounded-3xl shadow-2xl text-center border max-w-md w-full flex flex-col relative z-[101]" style={{ backgroundColor: theme.modalBg + 'EE', borderColor: theme.boardLines }}>
                  <h3 className="text-xl font-black uppercase tracking-widest mb-6" style={{ color: theme.textMain }}>STATISTICS</h3>
                  
                  {/* Stats Grid */}
                  <div className="flex justify-between items-start mb-8 px-1 gap-1">
                      <div className="flex flex-col items-center">
                          <span className="text-2xl md:text-3xl font-black mb-1" style={{ color: theme.textMain }}>{finalPlayerStats?.gamesPlayed || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: theme.textSub }}>Played</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-2xl md:text-3xl font-black mb-1" style={{ color: theme.textMain }}>{finalPlayerStats?.currentStreak || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: theme.textSub }}>Current<br/>Streak</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-2xl md:text-3xl font-black mb-1" style={{ color: theme.textMain }}>{finalPlayerStats?.maxStreak || 0}</span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: theme.textSub }}>Max<br/>Streak</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-2xl md:text-3xl font-black mb-1" style={{ color: theme.textMain }}>
                              {finalPlayerStats?.gamesPlayed > 0 
                                ? Math.round(finalPlayerStats.totalDistance / finalPlayerStats.gamesPlayed) 
                                : 0}m
                          </span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: theme.textSub }}>Avg<br/>Dist</span>
                      </div>
                      <div className="flex flex-col items-center">
                          <span className="text-2xl md:text-3xl font-black mb-1" style={{ color: theme.textMain }}>
                              {(finalPlayerStats?.totalDistance || 0) >= 1000 
                                ? (finalPlayerStats.totalDistance / 1000).toFixed(1) + 'k' 
                                : (finalPlayerStats?.totalDistance || 0) + 'm'}
                          </span>
                          <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wide leading-tight" style={{ color: theme.textSub }}>Total<br/>Dist</span>
                      </div>
                  </div>

                  {/* Compact Score Display & Word List */}
                  <div className="rounded-2xl overflow-hidden mb-6 shadow-sm border" style={{ backgroundColor: theme.settingsBg, borderColor: theme.boardLines }}>
                    
                    {/* Top Row: Athlete & Distance Side-by-Side */}
                    <div className="flex border-b" style={{ borderColor: theme.boardLines }}>
                        <div className="flex-1 p-4 border-r" style={{ borderColor: theme.boardLines }}>
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60" style={{ color: theme.textSub }}>Athlete</div>
                            <div className="text-xl font-black truncate" style={{ color: theme.textMain }}>{playerName}</div>
                        </div>
                        <div className="flex-1 p-4 bg-black/5">
                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60" style={{ color: theme.textSub }}>Distance</div>
                            <div className="text-3xl font-black" style={{ color: theme.accentPrimary }}>{displayScore}m</div>
                        </div>
                    </div>

                    {/* Bottom Row: Word List */}
                    <div className="p-4 bg-white/50">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-2 opacity-60 text-left" style={{ color: theme.textSub }}>
                            Words Found ({playedWords.length})
                        </div>
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar content-start">
                            {playedWords.length > 0 ? (
                                playedWords.map((word, i) => (
                                    <span key={i} className="px-2 py-1 rounded text-[10px] font-bold border" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines, color: theme.textMain }}>
                                        {word}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs italic opacity-50">No words found yet.</span>
                            )}
                        </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                      <button onClick={handleShareText} className="w-full py-4 border-2 rounded-xl font-bold text-lg uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 hover:opacity-80" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines, color: theme.textMain }}>
                        {isCopied ? (<><CheckCheck size={20} /> Copied</>) : (<><Share2 size={20} /> Share Result</>)}
                      </button>
                      
                      <div className="flex gap-2">
                        <button onClick={handlePlayAgain} className="flex-1 py-4 text-white rounded-xl font-bold text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-lg" style={{ backgroundColor: '#111827' }}>Play Again</button>
                        <button onClick={() => setIsReviewingBoard(true)} className="flex-none px-4 py-4 border-2 rounded-xl hover:opacity-80 shadow-sm transition-all flex items-center justify-center" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines, color: theme.textMain }} title="View Board"><Eye size={24} /></button>
                      </div>
                  </div>
              </div>

              {/* Leaderboard Section */}
              <div className="w-full max-w-sm lg:h-[600px] z-[101] relative">
                  <DailyLeaderboard 
                    highlightName={playerName} 
                    user={user} 
                    onRankFound={setPlayerRank} 
                    lastUpdated={lastSubmitTime} 
                    initialMode={gameMode} 
                    onParCalculated={handleParUpdate}
                    theme={theme}
                  />
              </div>
          </div>
      )}

      {showBlankPicker && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
              <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center border" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <h3 className="text-xl font-black mb-4 uppercase" style={{ color: theme.textMain }}>Pick a Letter</h3>
                  <div className="grid grid-cols-6 gap-2">
                      {Object.keys(LETTER_POOL).filter(l => l !== '*').map(l => (
                          <button key={l} onClick={() => handleBlankSelection(l)} className="w-10 h-10 rounded-lg font-bold text-xl shadow-sm hover:scale-110 transition-transform border" style={{ backgroundColor: theme.tileTemp, borderColor: theme.tileTempRing, color: theme.textMain }}>{l}</button>
                      ))}
                  </div>
                  <button onClick={() => { setShowBlankPicker(false); setPendingBlankPlacement(null); }} className="mt-6 text-sm font-bold hover:opacity-80" style={{ color: theme.textSub }}>Cancel</button>
              </div>
          </div>
      )}

      {/* REPORT CONFIRMATION MODAL */}
      {showReportModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
              <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full border text-center" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <div className="flex justify-center mb-4">
                      <div className="bg-yellow-100 p-3 rounded-full">
                          <Flag size={32} className="text-yellow-600" />
                      </div>
                  </div>
                  <h3 className="text-xl font-black mb-2 uppercase" style={{ color: theme.textMain }}>Report Missing Word</h3>
                  <p className="mb-4 text-sm font-bold" style={{ color: theme.textMain }}>"{pendingReportWord}"</p>
                  
                  <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-6 text-left">
                      <p className="text-xs text-red-700 leading-relaxed font-medium">
                          <strong>⚠️ Warning:</strong> Moderators check all reported words. If you abuse this feature to create fake words, your high scores will be deleted.
                      </p>
                  </div>

                  <div className="flex gap-3">
                      <button onClick={() => { setShowReportModal(false); setPendingReportWord(null); }} className="flex-1 py-3 rounded-xl font-bold hover:opacity-80 transition-colors" style={{ backgroundColor: theme.boardLines, color: theme.textSub }}>Cancel</button>
                      <button onClick={confirmReport} className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all bg-yellow-500 hover:bg-yellow-600">Report & Add</button>
                  </div>
              </div>
          </div>
      )}

      {/* UNDO CONFIRMATION MODAL */}
      {showUndoModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
              <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full border text-center" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <div className="flex justify-center mb-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                          <RotateCcw size={32} className="text-blue-600" />
                      </div>
                  </div>
                  <h3 className="text-xl font-black mb-2 uppercase" style={{ color: theme.textMain }}>Use Undo?</h3>
                  <p className="mb-6 text-sm" style={{ color: theme.textSub }}>
                      You can only use Undo <strong style={{ color: theme.accentPrimary }}>once per turn</strong>. <br/><br/>
                      Are you sure you want to go back?
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowUndoModal(false)} className="flex-1 py-3 rounded-xl font-bold hover:opacity-80 transition-colors" style={{ backgroundColor: theme.boardLines, color: theme.textSub }}>Cancel</button>
                      <button onClick={confirmUndo} className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all bg-blue-500 hover:bg-blue-600">Confirm Undo</button>
                  </div>
              </div>
          </div>
      )}

      {(showTutorial || showRules) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
              <div className="rounded-2xl p-8 shadow-2xl max-w-md w-full text-center border relative" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 p-4 rounded-full shadow-xl" style={{ backgroundColor: theme.modalBg }}>
                      <BookOpen size={48} style={{ color: theme.accentPrimary }} />
                  </div>
                  <h3 className="text-2xl font-black mt-8 mb-4 uppercase tracking-tight" style={{ color: theme.textMain }}>Game Rules</h3>
                  <div className="text-left mb-6 text-sm space-y-3" style={{ color: theme.textSub }}>
                      <p className="flex gap-2"><span className="font-bold" style={{ color: theme.textMain }}>•</span><span>This is a <strong>daily seeded game</strong>. Everyone gets the same letters and board - refreshed daily.</span></p>
                      <p className="flex gap-2"><span className="font-bold" style={{ color: theme.textMain }}>•</span><span>Place words <strong>Left to Right</strong> or <strong>Top to Bottom</strong> (Scrabble rules).</span></p>
                      <p className="flex gap-2"><span className="font-bold" style={{ color: theme.textMain }}>•</span><span>Minimum <strong>2 letter</strong> words.</span></p>
                      <p className="flex gap-2"><span className="font-bold" style={{ color: theme.textMain }}>•</span><span>Start in <strong>Column 1</strong> (left).</span></p>
                      <p className="flex gap-2 items-center"><Star size={16} className="text-yellow-500 fill-yellow-500" /><span><strong>Yellow Stars:</strong> Give +1, +2, or +3 random letters.</span></p>
                      <p className="flex gap-2 items-center"><Sparkles size={16} className="text-purple-500 fill-purple-500" /><span><strong>Purple Sparkles:</strong> Give you a blank Wildcard tile!</span></p>
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-2">
                          <p className="text-xs text-yellow-800 font-bold mb-1 flex items-center gap-1"><Zap size={10} fill="currentColor"/> HANDY TIP:</p>
                          <p className="text-xs text-yellow-800">Stars act like <b>Double Word Scores</b> in Scrabble! If you place a vertical AND horizontal word over a star, you get double the letters.</p>
                      </div>
                  </div>
                  <button onClick={() => { setShowTutorial(false); setShowRules(false); }} className="w-full py-4 rounded-xl font-black text-white shadow-lg hover:scale-105 transition-all uppercase tracking-widest text-lg" style={{ backgroundColor: theme.accentPrimary }}>{showTutorial ? "Let's Jump!" : "Close"}</button>
              </div>
          </div>
      )}

      {showExitConfirmation && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
              <div className="rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <div className="flex justify-center mb-4"><div className="bg-red-100 p-3 rounded-full"><LogOut size={32} className="text-red-500" /></div></div>
                  <h3 className="text-2xl font-black mb-2" style={{ color: theme.textMain }}>Exit Game?</h3>
                  <p className="mb-8" style={{ color: theme.textSub }}>Are you sure you want to quit? You will lose your current progress.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setShowExitConfirmation(false)} className="flex-1 py-3 rounded-xl font-bold hover:opacity-80 transition-colors" style={{ backgroundColor: theme.boardLines, color: theme.textSub }}>Cancel</button>
                      <button onClick={confirmExit} className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all bg-red-500 hover:bg-red-600">Exit</button>
                  </div>
              </div>
          </div>
      )}

      {/* REVIVE MODAL */}
      {showReviveModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4">
              <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full border text-center bg-white" style={{ borderColor: theme.boardLines }}>
                  <div className="flex justify-center mb-4"><div className="bg-purple-100 p-3 rounded-full"><Play size={32} className="text-purple-600" /></div></div>
                  <h3 className="text-xl font-black mb-2 text-gray-900">Need a boost?</h3>
                  <p className="mb-6 text-sm text-gray-600">Watch a short video to get <strong>+5 Extra Letters</strong> and continue your run!</p>
                  <div className="flex flex-col gap-3">
                      <button onClick={handleRevive} className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2">
                          <Play size={16} fill="currentColor"/> Watch Ad (+5 Letters)
                      </button>
                      <button onClick={handleSkipRevive} className="w-full py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                          No thanks, end run
                      </button>
                      <button onClick={() => setShowReviveModal(false)} className="w-full py-2 rounded-xl font-bold text-gray-400 hover:text-gray-600 transition-colors text-xs uppercase tracking-widest">
                          Return to Game
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showConfirmSubmit && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
              <div className="rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border" style={{ backgroundColor: theme.modalBg, borderColor: theme.boardLines }}>
                  <h3 className="text-2xl font-black mb-2" style={{ color: theme.textMain }}>Submit Score?</h3>
                  <p className="mb-8" style={{ color: theme.textSub }}>You reached column <strong style={{ color: theme.accentPrimary }}>{score}</strong>. This will end your current run.</p>
                  <div className="flex gap-3">
                      <button onClick={handleCancelSubmit} className="flex-1 py-3 rounded-xl font-bold hover:opacity-80 transition-colors" style={{ backgroundColor: theme.boardLines, color: theme.textSub }}>Cancel</button>
                      <button onClick={handleConfirmSubmit} className="flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition-all" style={{ backgroundColor: theme.accentPrimary }}>Confirm</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* IN-GAME SETTINGS MODAL */}
      {/* SETTINGS MODAL */}
        {showSettings && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in p-4 pointer-events-auto">
                <div className="rounded-2xl p-6 shadow-2xl max-w-sm w-full border max-h-[85vh] overflow-y-auto custom-scrollbar bg-white" style={{ backgroundColor: theme.modalBg }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black uppercase" style={{ color: theme.textMain }}>Settings</h3>
                        <button onClick={() => setShowSettings(false)} className="hover:opacity-70" style={{ color: theme.textSub }}><X size={24} /></button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: theme.textSub }}>Username</label>
                            <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} maxLength={12} className="w-full border-2 px-4 py-3 rounded-xl font-bold outline-none transition-all bg-gray-50" style={{ borderColor: theme.boardLines, color: theme.textMain }} />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Sun size={20} className="text-yellow-500" /><span className="font-bold text-sm" style={{ color: theme.textMain }}>Dark Mode</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={() => setDarkMode(!darkMode)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Volume2 size={20} className="text-blue-500" /><span className="font-bold text-sm" style={{ color: theme.textMain }}>Sound Effects</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Zap size={20} className="text-orange-500" /><span className="font-bold text-sm" style={{ color: theme.textMain }}>Haptics</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={hapticsEnabled} onChange={() => setHapticsEnabled(!hapticsEnabled)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                            <div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-xl">🎉</span><span className="font-bold text-sm" style={{ color: theme.textMain }}>Crowd Fans</span></div>
                                <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={showFans} onChange={() => setShowFans(!showFans)} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div></label>
                            </div>
                        </div>
                        <div className="pt-4 border-t" style={{ borderColor: theme.boardLines }}><label className="text-xs font-bold uppercase tracking-widest mb-2 block" style={{ color: theme.textSub }}>Make a Suggestion</label><textarea value={suggestionText} onChange={(e) => setSuggestionText(e.target.value)} className="w-full border-2 px-4 py-3 rounded-xl font-medium text-sm outline-none transition-all resize-none h-24 bg-gray-50" style={{ borderColor: theme.boardLines, color: theme.textMain }} placeholder="Ideas..." /><button onClick={handleSubmitSuggestion} disabled={suggestionStatus !== 'idle' || !suggestionText.trim()} className={`w-full mt-2 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-sm bg-gray-500 text-white`}>Submit Suggestion</button></div>
                    </div>
                </div>
            </div>
        )}

      {/* 1. HEADER */}
      <div className="w-full max-w-6xl px-4 pt-4 landscape:pt-2 pb-1 relative z-50">
        
        {/* --- MOBILE LAYOUT (2 Columns) --- */}
        <div className="flex lg:hidden justify-between items-start w-full">
            
            {/* LEFT COLUMN: Logo + Action Button */}
            <div className="flex flex-col gap-2 items-start">
                <div className="w-32 cursor-pointer active:scale-95 transition-transform mb-6" onClick={handleLogoClick}>
                    <RiveLogo />
                </div>
                
                {/* End Run / Back Button */}
                {gameState === 'playing' && score > 0 && (
                    <button onClick={handleRequestSubmit} disabled={isFinishing || isValidating} className="h-9 px-3 rounded-lg bg-[#111827] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border border-gray-800 animate-fade-in">
                        <span className="text-[10px] font-black uppercase tracking-wider">End Run</span> <Trophy size={12} className="text-yellow-400" />
                    </button>
                )}
                {gameState === 'gameOver' && isReviewingBoard && (
                     <button onClick={() => setIsReviewingBoard(false)} className="h-9 px-3 rounded-lg bg-[#59AD20] text-white flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm animate-fade-in">
                        <ArrowLeft size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Results</span>
                    </button>
                )}
            </div>

            {/* RIGHT COLUMN: Score + Icons */}
            <div className="flex flex-col items-end gap-1">
                {/* Name & Score */}
                <div className="flex flex-col items-end">
                     <span className="text-[10px] font-bold tracking-widest uppercase opacity-80" style={{ color: theme.accentPrimary }}>{playerName || "PLAYER 1"}</span>
                     <div className="flex items-center gap-1 font-black text-xl leading-none" style={{ color: theme.accentPrimary }}>
                        <Ruler size={18} /> {displayScore}m
                     </div>
                </div>
                
                {/* Horizontal Icon Stack */}
                <div className="flex gap-2 mt-1">
                    <button onClick={() => setShowRules(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/5 text-gray-500 active:bg-black/10 active:scale-95 transition-all shadow-sm" style={{ color: theme.textSub }}>
                        <Info size={20} />
                    </button>
                    <button onClick={() => setShowSettings(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-black/5 text-gray-500 active:bg-black/10 active:scale-95 transition-all shadow-sm" style={{ color: theme.textSub }}>
                        <Settings size={20} />
                    </button>
                    <button onClick={() => setShowExitConfirmation(true)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-50 text-red-500 active:bg-red-100 active:scale-95 transition-all shadow-sm border border-red-100">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* --- DESKTOP LAYOUT (Original 3-Column) --- */}
        <div className="hidden lg:flex justify-between items-start w-full">
             {/* Left: Date */}
             <div className="flex flex-col items-start w-32"> 
                <div className="text-[10px] md:text-xs font-bold tracking-widest uppercase opacity-60" style={{ color: theme.textSub }}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</div>
                {dailyLeader && (<div className="flex items-center gap-1 mt-0.5 text-[10px] animate-fade-in whitespace-nowrap"><Crown size={10} className="text-yellow-500 fill-yellow-500" /><span className="font-bold opacity-80" style={{ color: theme.textSub }}>LEADER</span><span className="font-bold truncate max-w-[80px]" style={{ color: theme.textMain }}>{dailyLeader.name}</span><span className="font-mono opacity-60" style={{ color: theme.textSub }}>{dailyLeader.score}m</span></div>)}
             </div>

             {/* Center: Logo & Button */}
             <div className="flex flex-col items-center flex-1 -mt-2">
                <div className="w-64 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleLogoClick}><RiveLogo /></div>
                <div className="mt-2">
                    {gameState === 'playing' && score > 0 && (
                        <button onClick={handleRequestSubmit} disabled={isFinishing || isValidating} className="px-4 py-1 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all flex items-center gap-2 animate-fade-in" style={{ backgroundColor: '#111827' }}>END RUN <Trophy size={10} style={{ color: THEME_LIGHT.starGold }} /></button>
                    )}
                    {gameState === 'gameOver' && isReviewingBoard && (
                        <button onClick={() => setIsReviewingBoard(false)} className="px-4 py-1 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm hover:scale-105 transition-all flex items-center gap-2 animate-fade-in" style={{ backgroundColor: theme.accentPrimary }}><ArrowLeft size={14} /> BACK TO RESULTS</button>
                    )}
                </div>
             </div>

             {/* Right: Controls */}
             <div className="flex flex-col items-end w-32 gap-1">
                  <span className="text-xs font-bold tracking-widest" style={{ color: theme.accentPrimary }}>{playerName || "PLAYER 1"}</span>
                  <div className="flex items-center gap-1 font-black text-lg" style={{ color: theme.accentPrimary }}><Ruler size={16} /> {displayScore}m</div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowRules(true)} className="text-[10px] font-bold hover:opacity-70 uppercase tracking-widest flex items-center gap-1 opacity-50 hover:opacity-100" style={{ color: theme.textSub }}>Rules <Info size={12} /></button>
                    <button onClick={() => setShowExitConfirmation(true)} className="hover:opacity-70 opacity-50 hover:opacity-100" style={{ color: theme.textSub }} title="Exit Game"><LogOut size={14} /></button>
                    <button onClick={() => setShowSettings(true)} className="hover:opacity-70 opacity-50 hover:opacity-100" style={{ color: theme.textSub }}><Settings size={14} /></button>
                  </div>
             </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[95vw] relative flex items-center justify-center min-h-0 landscape:min-h-0 landscape:mt-0" onMouseDown={handleMouseDown} onMouseLeave={handleMouseLeave} onMouseUp={handleMouseUp} onMouseMove={handleMouseMove}>
        <div ref={scrollContainerRef} className={`w-full overflow-x-auto overflow-y-visible custom-scrollbar flex items-center landscape:h-full no-scrollbar relative z-0 ${isDraggingBoard ? 'cursor-grabbing' : 'cursor-grab'} py-4`} style={{ userSelect: 'none' }}>
            <div className="relative p-1 mx-4 pt-16 pb-16" style={{ width: 'fit-content', minWidth: 'fit-content' }} id="board-capture-area">
                
                {/* PAR LINE */}
                <div className="absolute top-0 bottom-0 border-r-2 border-red-400 border-dashed z-20 pointer-events-none opacity-60" style={{ left: `${dailyPar * CELL_SIZE}px` }}>
                   <span className="absolute top-[-20px] right-0 translate-x-1/2 text-red-500 text-[10px] font-black tracking-widest">PAR</span>
                </div>

                <div className="flex relative mb-3" style={{ width: `${grid[0].length * CELL_SIZE}px`, height: '24px' }}>
                   {Array(grid[0].length).fill(0).map((_, c) => {
                       const isStart = c === 0;
                       const isMilestone = (c + 1) % 5 === 0;
                       if (!isStart && !isMilestone) return null;
                       const raiseStartLabel = score < 3;
                       return (
                           <div key={`ruler-${c}`} className={`absolute bottom-0 font-bold select-none transform -translate-x-1/2 text-center flex flex-col items-center justify-end transition-transform duration-1000 ease-in-out`} style={{ left: c * CELL_SIZE + (CELL_SIZE/2), transform: `translateX(-50%) ${isStart && raiseStartLabel ? 'translateY(-45px)' : 'translateY(0)'}` }}>
                               <span className={`text-xs tracking-wider`} style={{ color: isStart ? theme.textMain : theme.textSub }}>{isStart ? 'START' : `${c + 1}m`}</span>
                               <div className={`w-0.5 h-1.5 mt-0.5`} style={{ backgroundColor: isStart ? theme.textMain : theme.boardLines }}></div>
                           </div>
                       )
                   })}
                </div>
                <div className="relative">
                    <div className="absolute top-0 left-0 w-full h-full z-30 pointer-events-none">
                        {showFans && fanSpots.filter(f => f.type === 'top').map((fan, i) => {
                            const targetCol = Math.max(fan.startCol, score + fan.offset);
                            return (<div key={`fan-top-${fan.id}`} className="absolute -top-[55px]" style={{ left: `${targetCol * CELL_SIZE}px`, transition: 'left 1.2s ease-in-out', zIndex: 50 }}><Fan trigger={celebrateFans} /></div>);
                        })}
                    </div>
                    <div className="relative z-10 grid gap-0 rounded-xl shadow-inner border-4" style={{ gridTemplateColumns: `repeat(${grid[0].length}, ${CELL_SIZE}px)`, gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`, backgroundColor: theme.boardBackground, borderColor: theme.boardLines }}>
                        {Array(GRID_ROWS).fill(0).map((_, r) => (Array(grid[0].length).fill(0).map((_, c) => {
                            const content = getCellContent(r, c);
                            const bonus = getBonusAt(r, c);
                            const obstacle = getObstacleAt(r, c); 
                            const isStarSpot = starSpots.some(s => s.r === r && s.c === c);
                            const isColStart = c === 0;
                            const isStartZone = isColStart && !content && !hasLockedTiles;
                            const isLocked = content?.type === 'locked';
                            const isMilestone = (c + 1) % 5 === 0;
                            const isCompleted = c < displayScore;
                            const isSelected = selectedGridSpot && selectedGridSpot.r === r && selectedGridSpot.c === c;
                            const animationClass = isFinishing && isLocked ? 'animate-jump-green' : '';

                            return (
  <div 
      key={`${r}-${c}`} 
      onClick={() => handleGridClick(r, c)} 
      onDragOver={handleDragOver} 
      onDrop={(e) => handleDropOnGrid(e, r, c)}
      className={`relative flex items-center justify-center transition-all duration-300 w-full h-full ${content ? (content.type === 'temp' ? 'cursor-grab active:cursor-grabbing shadow-sm' : 'cursor-default shadow-sm') : (obstacle ? 'cursor-not-allowed' : 'hover:bg-white/20')} ${isLocked ? '' : ''} ${content?.type === 'temp' ? `bg-[${theme.tileTemp}] ring-2 ring-[${theme.tileTempRing}] -translate-y-[2px] z-10` : ''} ${!content && !obstacle && isCompleted ? `bg-white/20` : (c === 0 && !content ? 'bg-green-100/40' : (!content && !obstacle && !isStartZone && (r + c) % 2 === 0 ? 'bg-black/5' : 'bg-transparent'))} ${isSelected ? 'ring-4 ring-blue-400 z-20' : ''} ${!content && isSelected ? 'bg-blue-50/20' : ''} ${!content && isMilestone ? 'border-r-2 border-r-black/10' : 'border border-black/5'} ${isCompleted ? 'animate-pop-green' : ''} ${animationClass}`}
      style={{
          // NESTED TERNARY FOR STYLE PRIORITY:
          // 1. Locked Tiles (Highest Priority)
          ...(isLocked 
              ? { 
                  backgroundColor: isCompleted ? theme.overlayComplete : theme.tileLocked, 
                  color: theme.tileLockedText, 
                  boxShadow: '0 2px 0 rgba(0,0,0,0.1)', 
                  animationDelay: isFinishing ? `${c * 50}ms` : '0ms' 
                } 
              : (content?.type === 'temp' 
                  // 2. Temporary/Placed Tiles
                  ? { 
                      backgroundColor: content.isWild ? theme.tileWildPlaced : theme.tileTemp, 
                      boxShadow: '0 4px 0 rgba(0,0,0,0.1)' 
                    } 
                  : (obstacle 
                      // 3. Obstacles
                      ? { 
                          backgroundColor: theme.tileObstacle, 
                          borderRadius: '8px', 
                          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px)' 
                        } 
                      // 4. MAZE MODE GOLD STRIPS (Cols 14 & 29) - Only if empty
                      : (gameMode === 'maze' && (c === 14 || c === 29) 
                          ? { 
                              backgroundColor: '#fef08a', 
                              borderLeft: '2px solid #eab308', 
                              borderRight: '2px solid #eab308' 
                            } 
                          : {}
                      )
                  )
              )
          )
      }}
  >
      {!content && isStartZone && (<div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none z-10"><ChevronRight size={20} style={{ color: theme.startArrow }} /></div>)}
      {!content && obstacle && (<div className="tile-obstacle absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none z-10"></div>)}
      {!content && bonus && !obstacle && !isStarSpot && (<div className="absolute inset-0 flex flex-col items-center justify-center opacity-80 pointer-events-none z-10"><Star className="w-6 h-6" fill={theme.starGold} stroke={theme.starGold} /><span className="text-[16px] font-black mt-[-2px]" style={{ color: '#000000' }}>+{bonus.val}</span></div>)}
      {!content && isStarSpot && !obstacle && (<div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 animate-pulse"><Sparkles className="w-7 h-7" fill={theme.starPurple} stroke={theme.starPurple} /></div>)}
      {content && (<div draggable={content.type === 'temp' && !isFinishing && gameState === 'playing'} onDragStart={(e) => handleDragStart(e, { type: 'board', r, c, letter: content.letter })} className={`w-full h-full flex items-center justify-center ${content.type === 'temp' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}><span className="text-2xl font-bold select-none font-mono">{content.letter}</span>{content.isWild && <Sparkles size={12} className="absolute top-0.5 right-0.5 text-purple-500 fill-purple-500" />}</div>)}
  </div>
);
                        })))}
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full z-30 pointer-events-none">
                        {showFans && fanSpots.filter(f => f.type === 'bottom').map((fan, i) => {
                            const targetCol = Math.max(fan.startCol, score + fan.offset);
                            return (<div key={`fan-bottom-${fan.id}`} className="absolute -bottom-[35px]" style={{ left: `${targetCol * CELL_SIZE}px`, transition: 'left 1.2s ease-in-out', zIndex: 50 }}><Fan trigger={celebrateFans} /></div>);
                        })}
                    </div>
                </div>
                {showStartHint && (
                    <div className="absolute top-1/2 left-14 z-50 -translate-y-1/2 animate-bounce-horizontal pointer-events-none">
                        <div className="bg-black text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 whitespace-nowrap relative">
                            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-black rotate-45"></div>
                            <ChevronLeft size={16} />
                            Start Here!
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="w-full max-w-4xl px-4 pb-2 md:pb-6 landscape:pb-2 flex flex-col items-center shrink-0 relative z-50">        <div className="w-full flex flex-col-reverse md:flex-row items-center justify-between gap-2 md:gap-4 mb-2 md:mb-4">
            <div className={`px-4 py-3 rounded-lg text-xs md:text-sm font-bold transition-colors shadow-sm w-full md:w-auto text-center flex items-center justify-center gap-2 ${message.type === 'error' ? 'bg-red-100 text-red-700' : message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-white text-gray-600'}`}>
                <span>{isValidating ? "Checking..." : message.text}</span>
                {message.type === 'error' && message.invalidWord && (
                    <button onClick={() => handleReportRequest(message.invalidWord)} className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wide flex items-center gap-1 transition-colors hover:opacity-80" style={{ backgroundColor: theme.accentPrimary, color: 'white' }}>
                        Report <Flag size={10} />
                    </button>
                )}
            </div>
            <div className="flex gap-2 md:gap-4 items-center flex-wrap justify-center">
                <button onClick={handleUndoRequest} disabled={isFinishing || history.length === 0 || gameState !== 'playing'} className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md hover:opacity-90 transition-all uppercase tracking-wider disabled:opacity-50" style={{ backgroundColor: theme.modalBg, color: theme.textMain }} title="Undo last move"><RotateCcw size={16} /></button>
                <button onClick={shuffleHand} disabled={isFinishing || gameState !== 'playing'} className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md hover:opacity-90 transition-all uppercase tracking-wider disabled:opacity-50" style={{ backgroundColor: theme.modalBg, color: theme.textMain }}><Shuffle size={16} /> Shuffle</button>
                <button onClick={sortHand} disabled={isFinishing || gameState !== 'playing'} className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:shadow-md hover:opacity-90 transition-all uppercase tracking-wider disabled:opacity-50" style={{ backgroundColor: theme.modalBg, color: theme.textMain }}><ArrowDownAZ size={16} /> Sort A-Z</button>
                {placedTiles.length > 0 && (
                <button onClick={validateAndCommit} disabled={isValidating || isFinishing || gameState !== 'playing'} className={`flex items-center gap-2 px-6 md:px-8 py-2 md:py-3 rounded-xl font-black text-xs md:text-sm shadow-lg hover:-translate-y-1 active:translate-y-0 active:shadow-none uppercase tracking-wider transition-all ${isValidating || isFinishing ? 'bg-gray-400 text-gray-200 cursor-wait' : ''}`} style={!(isValidating || isFinishing) ? { backgroundColor: theme.accentPrimary, color: 'white' } : {}}>{isValidating ? 'Checking...' : 'JUMP'} <Check size={18} strokeWidth={4} /></button>
                )}
                {placedTiles.length > 0 && (
                <button 
                    onClick={handleCancelPlacement} 
                    disabled={isFinishing || gameState !== 'playing'} 
                    className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-red-100 text-red-600 rounded-xl font-bold text-xs md:text-sm shadow-sm hover:bg-red-200 transition-all disabled:opacity-50"
                >
                    <X size={16} />
                </button>
                )}
            </div>
        </div>
        <div onDragOver={handleDragOver} onDrop={handleDropOnHand} className="flex flex-col items-center justify-center p-2 md:p-3 rounded-2xl shadow-inner w-full transition-colors border-4 border-white/40 backdrop-blur-sm" style={{ backgroundColor: theme.handBg }}>
           {uniqueLetters.length === 0 && <div className="italic" style={{ color: theme.textSub }}>Empty Hand</div>}
           
           {/* ROW 1: Scrollable/No-Wrap on Mobile | Wrapped/Centered on Desktop */}
                        {/* UPDATED: w-fit + mx-auto to center content, max-w-full to allow scroll when overflowing */}
                        <div className="w-fit max-w-full md:w-auto mx-auto flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible justify-start md:justify-center gap-2 md:gap-3 px-1 md:px-0 no-scrollbar">
                            {topRowLetters.map(l => <HandTile key={l} letter={l} />)}
                        </div>

                        {/* ROW 2: Scrollable/No-Wrap on Mobile | Wrapped/Centered on Desktop */}
                        {bottomRowLetters.length > 0 && (
                            <div className="w-fit max-w-full md:w-auto mx-auto flex flex-nowrap md:flex-wrap overflow-x-auto md:overflow-visible justify-start md:justify-center gap-2 md:gap-3 mt-1 md:mt-[-5px] px-1 md:px-0 no-scrollbar">
                                {bottomRowLetters.map(l => <HandTile key={l} letter={l} />)}
                            </div>
                        )}
        </div>
      </div>

      <style>{`
        html, body { overflow: hidden; height: 100%; width: 100%; margin: 0; padding: 0; overscroll-behavior: none; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(0,0,0,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(0,0,0,0.2); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        .animate-flash-orange { animation: flash-orange 0.6s ease-in-out infinite; }
        .animate-pop-green { animation: pop-green 0.3s ease-out forwards; }
        .animate-jump-green { animation: jump-green 0.6s ease-in-out forwards; }
        .animate-bounce-horizontal { animation: bounce-horizontal 1s infinite; }
        @keyframes bounce-horizontal { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(25%); } }
        @keyframes pop-green { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
        @keyframes jump-green { 0% { transform: translateY(0); background-color: #f8f5ed; color: #111827; } 20% { transform: translateY(-12px) scale(1.1); background-color: #59AD20; color: white; border-color: #59AD20; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); } 40% { transform: translateY(0) scale(1); background-color: #59AD20; color: white; } 80% { background-color: #59AD20; color: white; } 100% { transform: translateY(0); background-color: #f8f5ed; color: #111827; } }
        @keyframes pulse-white { 0%, 100% { background-color: rgba(255,255,255,0.05); } 50% { background-color: rgba(255,255,255,0.7); } }
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flash-orange { 0%, 100% { background-color: #f8f5ed; color: black; } 50% { background-color: #f97316; color: white; border-color: #f97316; } }
      `}</style>
    </div>
  );
}