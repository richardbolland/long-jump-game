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

export const requestAd = (type = 'midgame') => {
  if (sdk) {
    console.log('CG: Requesting Ad:', type);
    sdk.ad.requestAd(type, {
      adStarted: () => console.log('CG: Ad started'),
      adFinished: () => console.log('CG: Ad finished'),
      adError: (error) => console.log('CG: Ad error', error),
    });
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