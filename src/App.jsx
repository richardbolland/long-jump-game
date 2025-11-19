/**
 * Long Jump Game - Version 0.8.1
 * Saved on: 19 Nov 2025
 * Features: Submit Button in Header, Responsive Layout, Main Menu, Draggable Board, Start Restrictions, 50 Columns, Confetti
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Shuffle, ArrowDownAZ, Star, Trophy, RotateCcw, AlertCircle, Check, Play, X } from 'lucide-react';

// --- Constants & Config ---

const GRID_ROWS = 5;
const GRID_COLS = 50;
const INITIAL_HAND_SIZE = 30;
const CELL_SIZE = 40;

const LETTER_POOL = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1
};

// --- Helper Components ---

const Confetti = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles = [];
    const colors = ['#f97316', '#fbbf24', '#ffffff', '#ef4444', '#3b82f6'];

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
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y / 50);
        p.rotation += p.rotationSpeed;

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }

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
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

// --- Helper Functions ---

const generateRandomBonuses = () => {
  const spots = [];
  const count = 15; 
  const used = new Set();

  while (spots.length < count) {
    const r = Math.floor(Math.random() * GRID_ROWS);
    const c = Math.floor(Math.random() * GRID_COLS);
    if (c === 0) continue;

    const key = `${r},${c}`;
    if (!used.has(key)) {
      used.add(key);
      const rand = Math.random();
      let val = 1;
      if (rand > 0.5) val = 2;
      if (rand > 0.8) val = 3;
      spots.push({ r, c, val });
    }
  }
  return spots;
};

const getRandomTiles = (count) => {
  let pool = [];
  Object.entries(LETTER_POOL).forEach(([letter, count]) => {
    for (let i = 0; i < count; i++) pool.push(letter);
  });
  
  const selected = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length);
    selected.push(pool[randomIndex]);
  }
  return selected;
};

const createEmptyGrid = () => {
  return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null));
};

const isLinearPlacement = (tiles) => {
  if (tiles.length <= 1) return true;
  const firstRow = tiles[0].r;
  const firstCol = tiles[0].c;
  return tiles.every(t => t.r === firstRow) || tiles.every(t => t.c === firstCol);
};

// --- Main Component ---

export default function LongJumpGame() {
  // -- State --
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'playing' | 'gameOver'
  const [playerName, setPlayerName] = useState('');
  
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [hand, setHand] = useState([]);
  const [bonusSpots, setBonusSpots] = useState([]);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  const [placedTiles, setPlacedTiles] = useState([]);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState({ text: "Start at Column 1", type: "info" });
  const [isValidating, setIsValidating] = useState(false);

  // UI Logic State
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  // Scroll Drag State
  const scrollContainerRef = useRef(null);
  const [isDraggingBoard, setIsDraggingBoard] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  const hasLockedTiles = grid.some(row => row.some(cell => cell !== null));

  // -- Initialization --
  useEffect(() => {
    initGame();
  }, []);

  const initGame = () => {
    setGrid(createEmptyGrid());
    setHand(getRandomTiles(INITIAL_HAND_SIZE));
    setPlacedTiles([]);
    setScore(0);
    setBonusSpots(generateRandomBonuses());
    setMessage({ text: "Drag or Click letters to place them.", type: "neutral" });
    setIsFinishing(false);
    setShowConfirmSubmit(false);
    
    if(scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  };

  const handleStartGame = () => {
    if (!playerName.trim()) {
        setPlayerName("Player 1");
    }
    setGameState('playing');
    initGame();
  };

  const handlePlayAgain = () => {
      setGameState('menu');
      initGame();
  };

  // -- Submit Logic --
  const handleRequestSubmit = () => {
      setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = () => {
      setShowConfirmSubmit(false);
      setIsFinishing(true);
      
      setTimeout(() => {
          setGameState('gameOver');
          setIsFinishing(false);
      }, 2000);
  };

  const handleCancelSubmit = () => {
      setShowConfirmSubmit(false);
  };

  // -- Board Scroll Logic --

  const handleMouseDown = (e) => {
    if (e.target.closest('[draggable="true"]') || e.target.tagName === 'BUTTON') return;
    setIsDraggingBoard(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDraggingBoard(false);
  };

  const handleMouseUp = () => {
    setIsDraggingBoard(false);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingBoard) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; 
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  // -- Interaction Logic (Click) --

  const handleHandClick = (index) => {
    if (isFinishing) return;
    if (selectedTileIndex === index) {
      setSelectedTileIndex(null); 
    } else {
      setSelectedTileIndex(index);
    }
  };

  const handleGridClick = (r, c) => {
    if (isDraggingBoard || isFinishing) return;
    if (grid[r] && grid[r][c]) return;

    const existingTempIndex = placedTiles.findIndex(t => t.r === r && t.c === c);

    if (existingTempIndex !== -1) {
      const tileToRemove = placedTiles[existingTempIndex];
      const newPlaced = [...placedTiles];
      newPlaced.splice(existingTempIndex, 1);
      setPlacedTiles(newPlaced);
      setHand(prev => [...prev, tileToRemove.letter]);
      setSelectedTileIndex(null);
      return;
    }

    if (selectedTileIndex !== null) {
      const isFirstMove = grid.every(row => row.every(cell => cell === null));
      if (isFirstMove && placedTiles.length === 0 && c !== 0) {
        setMessage({ text: "⚠️ Start Game: Place first tile in Column 1", type: "error" });
        return;
      }

      const letter = hand[selectedTileIndex];
      const potentialPlaced = [...placedTiles, { r, c, letter }];
      
      if (!isLinearPlacement(potentialPlaced)) {
         setMessage({ text: "⚠️ Tiles must be placed in a single row or column", type: "error" });
         return;
      }
      
      setPlacedTiles(potentialPlaced);
      setHand(prev => prev.filter((_, i) => i !== selectedTileIndex));
      setSelectedTileIndex(null);
      
      if (message.type === 'error') {
         setMessage({ text: "Drag or Click letters to place them.", type: "neutral" });
      }
    }
  };

  // -- Interaction Logic (Drag & Drop) --

  const handleDragStart = (e, data) => {
    if (isFinishing) return;
    e.dataTransfer.setData("text/plain", JSON.stringify(data));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnGrid = (e, r, c) => {
    if (isFinishing) return;
    e.preventDefault();
    e.stopPropagation();
    
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr || !dataStr.trim() || !dataStr.trim().startsWith('{')) return;
    
    try {
      const data = JSON.parse(dataStr);
      if (grid[r] && grid[r][c]) return;

      const existingTempIndex = placedTiles.findIndex(t => t.r === r && t.c === c);

      if (data.type === 'hand') {
        const isFirstMove = grid.every(row => row.every(cell => cell === null));
        if (isFirstMove && placedTiles.length === 0 && c !== 0) {
          setMessage({ text: "⚠️ Start Game: Place first tile in Column 1", type: "error" });
          return;
        }

        const letter = data.letter;

        if (existingTempIndex !== -1) {
           const existingTile = placedTiles[existingTempIndex];
           const newPlaced = [...placedTiles];
           newPlaced.splice(existingTempIndex, 1, { r, c, letter }); 
           setPlacedTiles(newPlaced);

           const newHand = [...hand];
           newHand.splice(data.index, 1); 
           newHand.push(existingTile.letter); 
           setHand(newHand);
        } else {
           const potentialPlaced = [...placedTiles, { r, c, letter }];
           if (!isLinearPlacement(potentialPlaced)) {
              setMessage({ text: "⚠️ Tiles must be placed in a single row or column", type: "error" });
              return;
           }
           setPlacedTiles(potentialPlaced);
           setHand(prev => prev.filter((_, i) => i !== data.index));
        }
        setSelectedTileIndex(null);
        if (message.type === 'error') setMessage({ text: "Drag or Click letters to place them.", type: "neutral" });
      }
      else if (data.type === 'board') {
        if (data.r === r && data.c === c) return;

        const isFirstMove = grid.every(row => row.every(cell => cell === null));
        if (isFirstMove && placedTiles.length === 1 && c !== 0) {
             setMessage({ text: "⚠️ Start tile must stay in Column 1", type: "error" });
             return;
        }

        const movingTileIndex = placedTiles.findIndex(t => t.r === data.r && t.c === data.c);
        if (movingTileIndex === -1) return; 

        let potentialPlaced = [...placedTiles];
        
        if (existingTempIndex !== -1) {
           const targetTile = potentialPlaced[existingTempIndex];
           const movingTile = potentialPlaced[movingTileIndex];
           potentialPlaced[existingTempIndex] = { ...targetTile, r: data.r, c: data.c };
           potentialPlaced[movingTileIndex] = { ...movingTile, r, c };
        } else {
           potentialPlaced[movingTileIndex] = { ...potentialPlaced[movingTileIndex], r, c };
        }

        if (!isLinearPlacement(potentialPlaced)) {
            setMessage({ text: "⚠️ Tiles must be placed in a single row or column", type: "error" });
            return;
        }
        setPlacedTiles(potentialPlaced);
      }
    } catch (err) {}
  };

  const handleDropOnHand = (e) => {
    if (isFinishing) return;
    e.preventDefault();
    e.stopPropagation();
    const dataStr = e.dataTransfer.getData("text/plain");
    if (!dataStr || !dataStr.trim() || !dataStr.trim().startsWith('{')) return;
    try {
      const data = JSON.parse(dataStr);
      if (data.type === 'board') {
         setPlacedTiles(prev => prev.filter(t => !(t.r === data.r && t.c === data.c)));
         setHand(prev => [...prev, data.letter]);
      }
    } catch (err) {}
  };

  // -- Game Logic Helpers --

  const getCellContent = (r, c) => {
    if (!grid || !grid[r]) return null;
    if (grid[r][c]) return { letter: grid[r][c], type: 'locked' };
    const temp = placedTiles.find(t => t.r === r && t.c === c);
    if (temp) return { letter: temp.letter, type: 'temp' };
    return null;
  };

  const getBonusAt = (r, c) => {
    return bonusSpots.find(b => b.r === r && b.c === c);
  };

  // -- Validation Logic --

  const validateAndCommit = async () => {
    if (placedTiles.length === 0) return;
    setIsValidating(true);
    setMessage({ text: "Validating...", type: "info" });

    const tempGrid = grid.map(row => [...row]);
    placedTiles.forEach(t => {
      if (tempGrid[t.r]) {
        tempGrid[t.r][t.c] = t.letter;
      }
    });

    const isFirstMove = grid.every(row => row.every(cell => cell === null));
    let touchesStart = false;
    let connectsToExisting = false;

    placedTiles.forEach(t => {
      if (t.c === 0) touchesStart = true;
      const neighbors = [
        {r: t.r+1, c: t.c}, {r: t.r-1, c: t.c}, 
        {r: t.r, c: t.c+1}, {r: t.r, c: t.c-1}
      ];
      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < GRID_ROWS && n.c >= 0 && n.c < GRID_COLS) {
          if (grid[n.r] && grid[n.r][n.c]) connectsToExisting = true;
        }
      });
    });

    if (isFirstMove && !touchesStart) {
      failValidation("First word must start in Column 1.");
      return;
    }

    if (!isFirstMove && !connectsToExisting) {
      failValidation("Tiles must connect to existing words.");
      return;
    }

    const words = getWords(tempGrid);
    const newWords = words.filter(w => {
      return w.cells.some(wc => placedTiles.some(pt => pt.r === wc.r && pt.c === wc.c));
    });

    if (newWords.length === 0) {
       failValidation("Words must be at least 2 letters.");
       return;
    }

    try {
      const invalidWords = [];
      for (const wordObj of newWords) {
        const isValid = await checkWordAPI(wordObj.word);
        if (!isValid) invalidWords.push(wordObj.word);
      }

      if (invalidWords.length > 0) {
        failValidation(`Invalid word(s): ${invalidWords.join(", ")}`);
        return;
      }

      commitMove(tempGrid, newWords);
    } catch (e) {
      console.error(e);
      failValidation("Error checking dictionary. Try again.");
    }
  };

  const checkWordAPI = async (word) => {
    if (word.length === 2) {
      const validTwoLetter = ["AM","AN","AS","AT","BE","BY","DO","GO","HE","HI","IF","IN","IS","IT","ME","MY","NO","OF","OH","ON","OR","OX","SO","TO","UP","US","WE"];
      return validTwoLetter.includes(word);
    }
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      return res.ok; 
    } catch (e) {
      return true; 
    }
  };

  const getWords = (board) => {
    let words = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      let currentWord = "";
      let currentCells = [];
      for (let c = 0; c < GRID_COLS; c++) {
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
    for (let c = 0; c < GRID_COLS; c++) {
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

  const failValidation = (msg) => {
    setMessage({ text: msg, type: "error" });
    setIsValidating(false);
  };

  const commitMove = (newGrid, newWords) => {
    setGrid(newGrid);
    let bonusTilesToAdd = 0;
    newWords.forEach(w => {
      w.cells.forEach(wc => {
        const bonus = getBonusAt(wc.r, wc.c);
        const isPlacedTile = placedTiles.some(pt => pt.r === wc.r && pt.c === wc.c);
        if (bonus && isPlacedTile) {
          bonusTilesToAdd += bonus.val;
        }
      });
    });

    if (bonusTilesToAdd > 0) {
      const newTiles = getRandomTiles(bonusTilesToAdd);
      setHand(prev => [...prev, ...newTiles]);
      setMessage({ text: `Great! +${bonusTilesToAdd} Bonus Tiles!`, type: "success" });
    } else {
      setMessage({ text: "Valid move!", type: "success" });
    }

    let maxCol = score - 1;
    placedTiles.forEach(t => {
      if (t.c > maxCol) maxCol = t.c;
    });
    for(let r=0; r<GRID_ROWS; r++){
        for(let c=0; c<GRID_COLS; c++){
            if(newGrid[r] && newGrid[r][c] && c > maxCol) maxCol = c;
        }
    }
    setScore(maxCol + 1);
    setPlacedTiles([]);
    setIsValidating(false);
  };

  const shuffleHand = () => {
    setHand(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const sortHand = () => {
    setHand(prev => [...prev].sort());
  };

  // -- Render Game Over --
  if (gameState === 'gameOver') {
      return (
          <div className="h-screen w-screen bg-[#f0f0e6] flex flex-col items-center justify-center relative overflow-hidden selection:bg-orange-200 font-sans">
              <Confetti />
              <div className="z-10 bg-white/80 backdrop-blur-md p-12 rounded-3xl shadow-2xl text-center animate-fade-in border border-white/50 max-w-lg w-full mx-4">
                  <Trophy size={64} className="mx-auto text-yellow-500 mb-6 drop-shadow-md" />
                  <h2 className="text-5xl font-black text-gray-800 mb-2 tracking-tighter uppercase">Long Jump</h2>
                  <h3 className="text-2xl font-bold text-orange-500 mb-8 tracking-widest uppercase">Complete</h3>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100 shadow-inner">
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Athlete</div>
                    <div className="text-3xl font-black text-gray-800 mb-6">{playerName}</div>
                    
                    <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Distance</div>
                    <div className="text-6xl font-black text-orange-600">{score}</div>
                  </div>

                  <button 
                    onClick={handlePlayAgain}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg uppercase tracking-widest hover:bg-black hover:scale-105 transition-all shadow-lg"
                  >
                      Play Again
                  </button>
              </div>
          </div>
      );
  }

  // -- Render Main Menu --
  if (gameState === 'menu') {
    return (
      <div className="h-screen w-screen bg-[#f0f0e6] font-sans text-gray-800 flex flex-col items-center justify-center p-4 selection:bg-orange-200">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-12 animate-fade-in">
            
            {/* Title Group */}
            <div className="space-y-4">
                <h1 className="text-7xl font-black tracking-tighter text-black uppercase drop-shadow-sm">
                    Long Jump
                </h1>
                <p className="text-gray-500 text-lg font-medium leading-relaxed max-w-sm mx-auto">
                    Jump as far as you can by building words, connecting tiles and picking up extra letters.
                </p>
            </div>

            {/* Input Section */}
            <div className="w-full max-w-xs space-y-2 group">
                <label className="block text-xs font-bold tracking-widest text-gray-400 uppercase text-left pl-1 group-focus-within:text-orange-400 transition-colors">
                    Enter your name
                </label>
                <input 
                    type="text" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Player 1"
                    maxLength={12}
                    className="w-full bg-white border-2 border-transparent focus:border-orange-300 outline-none px-6 py-4 rounded-2xl text-2xl font-bold text-center placeholder-gray-200 text-gray-800 shadow-sm transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleStartGame()}
                />
            </div>

            {/* Play Button */}
            <button 
                onClick={handleStartGame}
                className="group relative px-12 py-6 bg-orange-500 text-white rounded-2xl font-black text-xl tracking-widest uppercase shadow-[0_10px_20px_rgba(249,115,22,0.2)] hover:shadow-[0_15px_30px_rgba(249,115,22,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all duration-300 animate-pulse-slow"
            >
                <span className="relative z-10 flex items-center gap-3">
                    Play Game <Play size={24} fill="currentColor" />
                </span>
            </button>
            
        </div>
      </div>
    );
  }

  // -- Render Game --
  return (
    <div className="min-h-screen w-full landscape:h-screen landscape:w-screen landscape:overflow-hidden bg-[#f0f0e6] font-sans text-gray-800 flex flex-col items-center selection:bg-orange-200">
      
      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm w-full mx-4 text-center border border-white/50">
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Submit Score?</h3>
                  <p className="text-gray-500 mb-8">You reached column <strong className="text-orange-600">{score}</strong>. This will end your current run.</p>
                  <div className="flex gap-3">
                      <button 
                        onClick={handleCancelSubmit}
                        className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                        onClick={handleConfirmSubmit}
                        className="flex-1 py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-orange-500/30 transition-all"
                      >
                          Confirm
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <div className="w-full max-w-6xl px-4 pt-4 landscape:pt-2 pb-1 flex justify-between items-end shrink-0 relative">
        {/* Left: Date */}
        <div className="text-sm font-bold tracking-widest text-gray-500 w-32">
          {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
        
        {/* Center: Title & Submit Button */}
        <div className="flex flex-col items-center flex-1">
            <h1 className="text-4xl font-black tracking-tight text-black uppercase cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setGameState('menu')}>
                Long Jump
            </h1>
            {score > 0 && (
                <button 
                    onClick={handleRequestSubmit}
                    disabled={isFinishing || isValidating}
                    className="mt-1 px-4 py-1 bg-gray-800 text-white rounded-full font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-black transition-all flex items-center gap-2 animate-fade-in"
                >
                   Submit Score <Trophy size={10} className="text-yellow-400" />
                </button>
            )}
        </div>

        {/* Right: Player Name */}
        <div className="flex flex-col items-end text-xs font-bold tracking-widest text-gray-500 w-32">
             <span className="text-orange-400">{playerName || "PLAYER 1"}</span>
        </div>
      </div>

      {/* Score / Message Bar */}
      <div className="w-full max-w-6xl px-4 mb-1 flex justify-between items-center shrink-0">
         <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
           message.type === 'error' ? 'bg-red-100 text-red-700' :
           message.type === 'success' ? 'bg-green-100 text-green-800' :
           'bg-white/50 text-gray-600'
         }`}>
           {isValidating ? "Checking..." : message.text}
         </div>
         <div className="flex gap-6">
             <div className="text-center">
                 <span className="block text-[10px] uppercase tracking-widest text-orange-400">Current</span>
                 <span className="font-black text-2xl text-orange-600">{score}</span>
             </div>
         </div>
      </div>

      {/* Game Board Area */}
      <div 
        className="landscape:flex-1 w-full max-w-[95vw] relative flex items-center justify-center min-h-0 landscape:min-h-0 mt-4 landscape:mt-0"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        <div 
          ref={scrollContainerRef}
          className={`
            w-full overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center landscape:h-full
            ${isDraggingBoard ? 'cursor-grabbing' : 'cursor-grab'}
            py-8
          `}
          style={{ userSelect: 'none' }}
        >
            <div className="relative bg-[#e6e2d6] rounded-xl shadow-inner border-4 border-[#dcd8cc] p-1 mx-4"
                style={{ width: 'fit-content', minWidth: 'fit-content' }}>
            
            <div 
                className="grid gap-[2px]"
                style={{ 
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(${CELL_SIZE}px, 1fr))`,
                gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`
                }}
            >
                {Array(GRID_ROWS).fill(0).map((_, r) => (
                Array(GRID_COLS).fill(0).map((_, c) => {
                    const content = getCellContent(r, c);
                    const bonus = getBonusAt(r, c);
                    const isColStart = c === 0;
                    const isStartZone = isColStart && !content && !hasLockedTiles;
                    const isLocked = content?.type === 'locked';

                    return (
                    <div 
                        key={`${r}-${c}`}
                        onClick={() => handleGridClick(r, c)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOnGrid(e, r, c)}
                        className={`
                        relative flex items-center justify-center rounded-[4px] transition-all duration-100 w-10 h-10
                        ${content ? (content.type === 'temp' ? 'cursor-grab active:cursor-grabbing shadow-sm' : 'cursor-default shadow-sm') : 'hover:bg-white/20'}
                        ${isLocked ? 'bg-[#f8f5ed] text-black shadow-[0_2px_0_rgba(0,0,0,0.1)]' : ''}
                        ${content?.type === 'temp' ? 'bg-yellow-50 ring-2 ring-yellow-400 shadow-[0_4px_0_rgba(0,0,0,0.1)] -translate-y-[2px] z-10' : ''}
                        ${!content && !isStartZone && (r + c) % 2 === 0 ? 'bg-black/5' : 'bg-transparent'} 
                        ${isStartZone ? 'animate-start-column' : ''}
                        ${isFinishing && isLocked ? 'animate-flash-orange' : ''}
                        border border-black/5
                        `}
                    >
                        {r === 0 && (
                            <div className="absolute -top-6 text-[10px] font-bold text-orange-800/40 select-none z-10">
                                {c + 1}
                            </div>
                        )}

                        {r === GRID_ROWS - 1 && (
                            <div className="absolute -bottom-6 text-[10px] font-bold text-orange-800/40 select-none z-10">
                                {c + 1}
                            </div>
                        )}

                        {!content && bonus && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60 pointer-events-none">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-[8px] font-bold text-yellow-700">+{bonus.val}</span>
                        </div>
                        )}

                        {content && (
                        <span 
                            draggable={content.type === 'temp' && !isFinishing}
                            onDragStart={(e) => handleDragStart(e, { type: 'board', r, c, letter: content.letter })}
                            className={`text-xl font-bold select-none font-mono w-full h-full flex items-center justify-center ${content.type === 'temp' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                        >
                            {content.letter}
                        </span>
                        )}
                    </div>
                    );
                })
                ))}
            </div>
            </div>
        </div>
      </div>

      {/* Controls & Rack */}
      <div className="w-full max-w-4xl px-4 mt-2 pb-10 landscape:pb-2 flex flex-col items-center shrink-0">
        
        {/* Hand */}
        <div 
          onDragOver={handleDragOver}
          onDrop={handleDropOnHand}
          className="flex flex-wrap justify-center gap-2 mb-4 bg-[#e6e2d6] p-4 rounded-2xl shadow-inner min-h-[90px] transition-colors hover:bg-[#e0dccf]"
        >
           {hand.length === 0 && <div className="text-gray-400 italic self-center pointer-events-none">Empty Hand</div>}
           {hand.map((letter, i) => (
             <button
               key={i}
               draggable={!isFinishing}
               onDragStart={(e) => handleDragStart(e, { type: 'hand', index: i, letter })}
               onClick={() => handleHandClick(i)}
               className={`
                 w-12 h-12 rounded-lg flex items-center justify-center text-2xl font-bold font-mono shadow-[0_3px_0_rgba(0,0,0,0.15)] transition-all cursor-grab active:cursor-grabbing
                 ${selectedTileIndex === i 
                    ? 'bg-orange-500 text-white -translate-y-2 shadow-[0_6px_0_rgba(0,0,0,0.2)]' 
                    : 'bg-white text-gray-800 hover:-translate-y-1'
                  }
               `}
             >
               {letter}
             </button>
           ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 items-center flex-wrap justify-center">
           <button onClick={shuffleHand} disabled={isFinishing} className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:bg-gray-50 transition-all uppercase tracking-wider disabled:opacity-50">
             <Shuffle size={16} /> Shuffle
           </button>
           
           <button onClick={sortHand} disabled={isFinishing} className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:bg-gray-50 transition-all uppercase tracking-wider disabled:opacity-50">
             <ArrowDownAZ size={16} /> Sort A-Z
           </button>

           <div className="w-4 hidden md:block"></div> 

            {placedTiles.length > 0 && (
             <button 
                onClick={validateAndCommit}
                disabled={isValidating || isFinishing}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-black text-sm shadow-[0_4px_0_rgba(0,0,0,0.2)] uppercase tracking-wider transition-all
                  ${isValidating || isFinishing 
                    ? 'bg-gray-400 text-gray-200 cursor-wait' 
                    : 'bg-orange-500 text-white hover:bg-orange-600 hover:-translate-y-1 hover:shadow-[0_6px_0_rgba(0,0,0,0.2)] active:translate-y-0 active:shadow-none'
                  }
                `}
             >
               {isValidating ? 'Checking...' : 'Validate & Jump'} <Check size={18} strokeWidth={4} />
             </button>
            )}

            {placedTiles.length > 0 && (
             <button 
                onClick={() => {
                    const returnedLetters = placedTiles.map(t => t.letter);
                    setHand(prev => [...prev, ...returnedLetters]);
                    setPlacedTiles([]);
                    setSelectedTileIndex(null);
                }}
                disabled={isFinishing}
                className="flex items-center gap-2 px-4 py-3 bg-red-100 text-red-600 rounded-xl font-bold text-sm shadow-sm hover:bg-red-200 transition-all disabled:opacity-50"
             >
               <RotateCcw size={16} />
             </button>
            )}
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.2);
        }
        
        .animate-start-column {
          animation: pulse-white 3s infinite ease-in-out;
        }
        
        .animate-pulse-slow {
            animation: pulse-slow 3s infinite ease-in-out;
        }
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        .animate-flash-orange {
            animation: flash-orange 0.6s ease-in-out infinite;
        }

        @keyframes pulse-white {
           0%, 100% { background-color: rgba(255,255,255,0.05); }
           50% { background-color: rgba(255,255,255,0.7); }
        }
        @keyframes pulse-slow {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes flash-orange {
             0%, 100% { background-color: #f8f5ed; color: black; }
             50% { background-color: #f97316; color: white; border-color: #f97316; }
        }
      `}</style>
    </div>
  );
}