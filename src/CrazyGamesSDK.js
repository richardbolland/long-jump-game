// src/CrazyGamesSDK.js

let sdk = null;

export const initSDK = async () => {
  if (window.CrazyGames && window.CrazyGames.SDK) {
    try {
      sdk = window.CrazyGames.SDK;
      await sdk.init();
      console.log('CrazyGames SDK v3 initialized');
    } catch (e) {
      console.error('Error initializing CrazyGames SDK', e);
    }
  } else {
    console.log('CrazyGames SDK not found (Local/Web Mode)');
  }
};

export const attachAuthListener = (callback) => {
    if (sdk) {
        // The SDK returns a "removeListener" function, which we return to the caller
        return sdk.user.addAuthListener(callback);
    }
    return () => {}; // Return a dummy cleanup function if SDK isn't ready
};

// Add these to your existing exports
export const gameplayStart = () => {
  if (sdk) sdk.game.gameplayStart();
};

export const gameplayStop = () => {
  if (sdk) sdk.game.gameplayStop();
};

export const gameStart = () => {
  if (sdk) sdk.game.gameplayStart();
};

export const gameStop = () => {
  if (sdk) sdk.game.gameplayStop();
};

export const happyTime = () => {
  if (sdk) sdk.game.happytime();
};

export const getUser = async () => {
    // --- TESTING TOGGLE ---
    // Set to TRUE to force "Guest Mode" (No user logged in)
    // Set to FALSE to let the SDK decide (will show "User1" on localhost)
    const FORCE_GUEST_MODE = false; 

    if (FORCE_GUEST_MODE) {
        console.log("SDK: Forced Guest Mode for testing");
        return null; 
    }
    // ----------------------

    if (sdk) {
        try {
            return await sdk.user.getUser();
        } catch (e) {
            console.error("CG User Error:", e);
            return null;
        }
    }
    return null;
};

export const requestAd = (type = 'midgame', callbacks = {}) => {
  const { onAdStarted, onAdFinished, onAdError } = callbacks;

  if (sdk) {
    console.log('CG: Requesting Ad:', type);
    sdk.ad.requestAd(type, {
      adStarted: () => {
        console.log('CG: Ad started');
        if (onAdStarted) onAdStarted();
      },
      adFinished: () => {
        console.log('CG: Ad finished');
        if (onAdFinished) onAdFinished();
      },
      adError: (error) => {
        console.log('CG: Ad error', error);
        // Important: If ad fails, we must still run 'finished' logic to let the user play
        if (onAdError) onAdError(error);
        if (onAdFinished) onAdFinished(); 
      },
    });
  } else {
    // Local/Guest Mode: Simulate instant ad completion
    console.log('CG: Local Mode - Skipping Ad');
    if (onAdFinished) onAdFinished();
  }
};

// NEW: Rewarded Ad Handler
export const requestRewardAd = (onRewarded) => {
    if (sdk) {
        sdk.ad.requestAd('rewarded', {
            adStarted: () => console.log('CG: Reward Ad started'),
            adFinished: () => {
                console.log('CG: Reward Ad finished');
                if (onRewarded) onRewarded();
            },
            adError: (error) => console.log('CG: Reward Ad error', error),
        });
    } else {
        // For local testing, instantly grant reward
        console.log('CG: Local Mode - Granting Reward');
        if (onRewarded) onRewarded();
    }
};

export const promptLogin = async () => {
    if (sdk) {
        try {
            // Show the official CrazyGames login modal
            const user = await sdk.user.showAuthPrompt();
            return user;
        } catch (e) {
            console.error("CG Login Error:", e);
            return null;
        }
    }
    return null;
};