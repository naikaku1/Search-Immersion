const URL_MAP = {
  yt: "*://www.youtube.com/watch*",
  ytm: "*://music.youtube.com/*",
  spotify: "*://open.spotify.com/*"
};

const SPOTIFY_CLIENT_ID = 'non'; 
//const REDIRECT_URI = chrome.identity.getRedirectURL();
//const SCOPES = "user-read-playback-state user-modify-playback-state user-read-currently-playing";

const AUTH_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

function generateRandomString(length) {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return hash;
}

function base64urlencode(a) {
    const str = new Uint8Array(a).reduce((c, b) => c + String.fromCharCode(b), '');
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function launchSpotifyAuth() {
    const codeVerifier = generateRandomString(128);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64urlencode(hashed);
    const state = generateRandomString(16);

    await chrome.storage.local.set({ sp_code_verifier: codeVerifier, sp_state: state });

    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CLIENT_ID,
        scope: SCOPES,
        redirect_uri: REDIRECT_URI,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
    });

    return new Promise((resolve, reject) => {
        chrome.identity.launchWebAuthFlow({
            url: `${AUTH_URL}?${params.toString()}`,
            interactive: true
        }, async (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
                console.error("Auth Error:", chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }
            const url = new URL(redirectUrl);
            const code = url.searchParams.get("code");
            const returnedState = url.searchParams.get("state");
            const storage = await chrome.storage.local.get(['sp_state', 'sp_code_verifier']);

            if (state !== returnedState) {
                reject("State mismatch");
                return;
            }
            await exchangeCodeForToken(code, storage.sp_code_verifier);
            resolve("success");
        });
    });
}

async function exchangeCodeForToken(code, verifier) {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
    });
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
    });
    const data = await res.json();
    if (data.access_token) await saveTokens(data);
}

async function refreshAccessToken() {
    const storage = await chrome.storage.local.get(['sp_refresh_token']);
    if (!storage.sp_refresh_token) throw new Error("No refresh token");
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: storage.sp_refresh_token,
        client_id: SPOTIFY_CLIENT_ID
    });
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
    });
    const data = await res.json();
    if (data.access_token) {
        await saveTokens(data);
        return data.access_token;
    }
    throw new Error("Failed to refresh");
}

async function saveTokens(data) {
    const now = Date.now();
    const items = { sp_access_token: data.access_token, sp_expires_at: now + (data.expires_in * 1000) };
    if (data.refresh_token) items.sp_refresh_token = data.refresh_token;
    await chrome.storage.local.set(items);
}


async function getSpotifyState() {
    let storage = await chrome.storage.local.get(['sp_access_token', 'sp_expires_at']);
    if (!storage.sp_access_token) return null; 
    
    if (Date.now() > storage.sp_expires_at) {
        try {
            const newToken = await refreshAccessToken();
            storage.sp_access_token = newToken;
        } catch (e) { return null; }
    }
    
    try {
        const res = await fetch(`${API_BASE}/me/player`, {
            headers: { 'Authorization': `Bearer ${storage.sp_access_token}` }
        });
        
        if (res.status === 204) return { isPlaying: false }; 
        if (res.status !== 200) return null;
        
        const data = await res.json();
        const largestImg = data.item?.album?.images?.[0]?.url || "";
        
        let features = null;
        if (data.item && data.item.id) {
             try {
                const fRes = await fetch(`${API_BASE}/audio-features/${data.item.id}`, {
                    headers: { 'Authorization': `Bearer ${storage.sp_access_token}` }
                });
                if(fRes.ok) features = await fRes.json();
             } catch(e) {}
        }

        return {
            status: "connected",
            data: {
                title: data.item?.name || "",
                artist: data.item?.artists?.map(a => a.name).join(', ') || "",
                artwork: largestImg,
                isPlaying: data.is_playing,
                features: features
            }
        };
    } catch (e) { console.error(e); return null; }
}

async function controlSpotify(command) {
    let storage = await chrome.storage.local.get(['sp_access_token']);
    if (!storage.sp_access_token) return;
    
    let method = command;
    if (command === 'toggle') {
        const currentState = await getSpotifyState();
        method = (currentState && currentState.data && currentState.data.isPlaying) ? 'pause' : 'play';
    }
    
    let endpoint = "";
    let httpMethod = "POST"; 

    if (method === 'pause') {
        endpoint = "pause";
        httpMethod = "PUT";
    } else if (method === 'play') {
        endpoint = "play";
        httpMethod = "PUT";
    } else if (method === 'next') {
        endpoint = "next";
        httpMethod = "POST";
    } else if (method === 'prev') {
        endpoint = "previous";
        httpMethod = "POST";
    }
    
    if (endpoint) {
        await fetch(`${API_BASE}/me/player/${endpoint}`, {
            method: httpMethod, 
            headers: { 'Authorization': `Bearer ${storage.sp_access_token}` }
        });
    }
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const getSettings = (req) => req.enabledSettings || { yt:true, ytm:true, spotify:true };

  if (request.action === "fetchWeather") {
    fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(request.city)}&count=1&language=ja&format=json`)
      .then(r => r.json()).then(geo => {
        if (!geo.results) throw new Error("City not found");
        const { latitude, longitude } = geo.results[0];
        return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      }).then(r => r.json()).then(data => sendResponse({ data })).catch(e => sendResponse({ error: e.toString() }));
    return true;
  }
  
  if (request.action === "searchHistory") {
    chrome.history.search({ text: request.query, maxResults: 100 }, (results) => { sendResponse({ data: results }); });
    return true; 
  }

  if (request.action === "deleteHistory") {
    if (request.url) { chrome.history.deleteUrl({ url: request.url }, () => { sendResponse({ success: true }); }); return true; }
  }

  if (request.action === "fetchNews") {
    if (!request.url) { sendResponse({ error: "URL not specified" }); return true; }
    fetch(request.url).then(r => r.text()).then(data => sendResponse({ data })).catch(e => sendResponse({ error: e.toString() }));
    return true;
  }

  if (request.action === "fetchCalendar") {
    if (!request.url) { sendResponse({ error: "URL not specified" }); return true; }
    const fetchUrl = request.url.includes('?') ? request.url + '&t=' + Date.now() : request.url + '?t=' + Date.now();
    fetch(fetchUrl).then(r => r.text()).then(data => sendResponse({ data })).catch(e => sendResponse({ error: e.toString() }));
    return true;
  }

  if (request.action === "loginSpotify") {
      launchSpotifyAuth().then(() => { sendResponse({success: true}); }).catch((e) => { sendResponse({success: false, error: e}); });
      return true;
  }
  
  if (request.action === "checkSpotifyLogin") {
      chrome.storage.local.get(['sp_access_token'], (res) => {
          sendResponse({ loggedIn: !!res.sp_access_token });
      });
      return true;
  }

  if (request.action === "transferSpotify") {
    (async () => {
      const storage = await chrome.storage.local.get(['sp_access_token']);
      if (!storage.sp_access_token) {
        sendResponse({ success: false, error: "not_logged_in" });
        return;
      }
      try {
        const dRes = await fetch(`${API_BASE}/me/player/devices`, {
          headers: { 'Authorization': `Bearer ${storage.sp_access_token}` }
        });
        const dData = await dRes.json();
        const pc = dData.devices && dData.devices.find(d => d.type === 'Computer');

        if (pc) {
          await fetch(`${API_BASE}/me/player`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${storage.sp_access_token}`, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ device_ids: [pc.id], play: true })
          });
          sendResponse({ success: true, deviceName: pc.name });
        } else {
          sendResponse({ success: false, error: "no_device_found" });
        }
      } catch (e) {
        sendResponse({ success: false, error: e.toString() });
      }
    })();
    return true; 
  }

  if (request.action === "fetchLyrics") {
    const { title, artist } = request;
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`;
    fetch(url).then(r => { if (!r.ok) throw new Error("Lyrics not found"); return r.json(); })
      .then(data => { sendResponse({ lyrics: data.plainLyrics || data.syncedLyrics || "No lyrics found." }); })
      .catch(e => { sendResponse({ error: "Lyrics not found" }); });
    return true;
  }

  if (request.action === "getYouTubeData") {
    const settings = getSettings(request);
    if (settings.spotify) {
        getSpotifyState().then(apiResult => {
            if (apiResult && apiResult.data && (apiResult.data.isPlaying || apiResult.data.title)) {
                sendResponse(apiResult);
            } else {
                fallbackToTabScraping(settings, sendResponse);
            }
        });
        return true; 
    }
    fallbackToTabScraping(settings, sendResponse);
    return true;
  }

  if (request.action === "controlYouTube") {
    const settings = getSettings(request);
    if (settings.spotify) {
        getSpotifyState().then(apiResult => {
             if (apiResult && apiResult.data && (apiResult.data.isPlaying || apiResult.data.title)) {
                 controlSpotify(request.command);
             } else {
                 controlMediaTabs(settings, request.command);
             }
        });
    } else {
        controlMediaTabs(settings, request.command);
    }
  }


  if (request.action === "setZoom") {
    const zoom = parseFloat(request.zoomFactor);
    
    if (sender.tab && sender.tab.id) {
        chrome.tabs.setZoom(sender.tab.id, zoom);
    } else {

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.setZoom(tabs[0].id, zoom);
            }
        });
    }
    return true;
  }

  if (request.action === "getZoom") {
    if (sender.tab && sender.tab.id) {
        chrome.tabs.getZoom(sender.tab.id, (zoomFactor) => {
             sendResponse({ zoomFactor });
        });
    } else {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.getZoom(tabs[0].id, (zoomFactor) => {
                     sendResponse({ zoomFactor });
                });
            }
        });
    }
    return true;
  }
  
  if (request.action === "fetchGoogleSuggestions") {
    const url = `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(request.query)}`;
    fetch(url)
      .then(res => res.json())
      .then(data => sendResponse({ data: data[1] || [] }))
      .catch(err => sendResponse({ error: err.toString() }));
    return true; 
  }
  
  
}); 

function fallbackToTabScraping(settings, sendResponse) {
    const targetPatterns = [];
    if (settings.yt) targetPatterns.push(URL_MAP.yt);
    if (settings.ytm) targetPatterns.push(URL_MAP.ytm);
    if (settings.spotify) targetPatterns.push(URL_MAP.spotify);

    if (targetPatterns.length === 0) { sendResponse({ status: "disabled" }); return; }

    chrome.tabs.query({ url: targetPatterns }, (tabs) => {
      const targetTab = tabs.find(t => t.audible) || tabs[0];
      if (!targetTab) { sendResponse({ status: "no_tab" }); return; }
      chrome.scripting.executeScript({ target: { tabId: targetTab.id }, func: scrapeMediaPage, world: 'MAIN' }, (results) => {
        if (chrome.runtime.lastError) {
             sendResponse({ status: "error", error: chrome.runtime.lastError.message });
             return;
        }
        if (results && results[0]) sendResponse({ status: "connected", data: results[0].result });
        else sendResponse({ status: "no_data" });
      });
    });
}

function controlMediaTabs(settings, command) {
    const targetPatterns = [];
    if (settings.yt) targetPatterns.push(URL_MAP.yt);
    if (settings.ytm) targetPatterns.push(URL_MAP.ytm);
    if (settings.spotify) targetPatterns.push(URL_MAP.spotify);
    if (targetPatterns.length === 0) return;

    chrome.tabs.query({ url: targetPatterns }, (tabs) => {
      const targetTab = tabs.find(t => t.audible) || tabs[0];
      if (targetTab) {
        chrome.scripting.executeScript({ target: { tabId: targetTab.id }, func: controlMediaPage, args: [command], world: 'MAIN' });
      }
    });
}

function scrapeMediaPage() {
  try {
    if (navigator.mediaSession && navigator.mediaSession.metadata) {
      const meta = navigator.mediaSession.metadata;
      let bestArt = "";
      if (meta.artwork && meta.artwork.length > 0) {
        bestArt = meta.artwork[meta.artwork.length - 1].src;
      }
      if (meta.title) return { title: meta.title, artist: meta.artist || "", artwork: bestArt, isPlaying: navigator.mediaSession.playbackState === 'playing' };
    }
  } catch(e) {}

  const host = window.location.hostname;
  let d = { title: "", artist: "", artwork: "", isPlaying: false };
  try {
    if (host.includes('youtube.com')) {
      const v = document.querySelector('video'); d.isPlaying = v ? !v.paused : false;
      if (host.includes('music')) { 
        const player = document.querySelector('ytmusic-player-bar');
        if (player) {
          d.title = player.querySelector('.title')?.innerText || "";
          let artistText = player.querySelector('.subtitle')?.innerText || "";
          if (artistText.includes('•')) artistText = artistText.split('•')[0].trim();
          d.artist = artistText;
          const img = player.querySelector('.thumbnail-image-wrapper img');
          if (img) d.artwork = img.src.replace(/w\d+-h\d+/, 'w1200-h1200');
        }
      } else { 
        let t = document.querySelector('h1.title')?.innerText || "";
        let a = document.querySelector('#upload-info #channel-name a')?.innerText || "";
        d.title = t; d.artist = a;
        const id = new URLSearchParams(window.location.search).get('v');
        d.artwork = id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : "";
      }
    } else if (host.includes('spotify.com')) {
      const playBtn = document.querySelector('[data-testid="control-button-playpause"]');
      d.isPlaying = playBtn ? playBtn.getAttribute('aria-label') === 'Pause' : false;
      d.title = document.querySelector('[data-testid="context-item-info-title"]')?.innerText || document.title;
      d.artist = document.querySelector('[data-testid="context-item-info-subtitles"]')?.innerText || "";
      const img = document.querySelector('[data-testid="cover-art-image"]');
      d.artwork = img ? img.src : "";
    }
  } catch(e) {} 
  return d;
}

function controlMediaPage(c) {
  if (navigator.mediaSession) {
      const v = document.querySelector('video, audio');
      if (c === 'toggle') {
          if (navigator.mediaSession.playbackState === 'playing') {
               if(v) v.pause(); else document.querySelector('[data-testid="control-button-playpause"]')?.click();
          } else {
               if(v) v.play(); else document.querySelector('[data-testid="control-button-playpause"]')?.click();
          }
      }
      if (c === 'next') navigator.mediaSession.setActionHandler ? null : document.querySelector('[data-testid="control-button-skip-forward"], .ytp-next-button, .next-button')?.click();
      if (c === 'prev') navigator.mediaSession.setActionHandler ? null : document.querySelector('[data-testid="control-button-skip-back"], .ytp-prev-button, .previous-button')?.click();
      return;
  }
  const host = window.location.hostname; const v = document.querySelector('video, audio');
  if (host.includes('open.spotify.com')) {
    if(c==='toggle') document.querySelector('[data-testid="control-button-playpause"]')?.click();
    if(c==='next') document.querySelector('[data-testid="control-button-skip-forward"]')?.click();
    if(c==='prev') document.querySelector('[data-testid="control-button-skip-back"]')?.click();
  } else if (host.includes('youtube.com')) {
    if (host.includes('music')) { 
      if(c==='toggle') document.querySelector('#play-pause-button')?.click();
      if(c==='next') document.querySelector('.next-button')?.click();
      if(c==='prev') document.querySelector('.previous-button')?.click();
    } else { 
      if(c==='toggle') v.paused ? v.play() : v.pause();
      if(c === "prev") document.querySelector('.ytp-prev-button')?.click();
      if(c === "next") document.querySelector('.ytp-next-button')?.click();
    }
  } else { if(c==='toggle' && v) v.paused ? v.play() : v.pause(); }
}