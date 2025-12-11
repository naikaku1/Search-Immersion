const URL_MAP = {
  yt: "*://www.youtube.com/watch*",
  ytm: "*://music.youtube.com/*",
  spotify: "*://open.spotify.com/*"
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    chrome.history.search({ text: request.query, maxResults: 100 }, (results) => {
      sendResponse({ data: results });
    });
    return true; 
  }

  if (request.action === "deleteHistory") {
    if (request.url) {
        chrome.history.deleteUrl({ url: request.url }, () => {
            sendResponse({ success: true });
        });
        return true;
    }
  }

  if (request.action === "fetchNews") {
    const targetUrl = request.url;
    if (!targetUrl) {
      sendResponse({ error: "URL not specified" });
      return true;
    }
    fetch(targetUrl)
      .then(r => r.text())
      .then(data => sendResponse({ data }))
      .catch(e => sendResponse({ error: e.toString() }));
    return true;
  }

  const getSettings = (req) => req.enabledSettings || { yt:true, ytm:true, spotify:true };

  if (request.action === "getYouTubeData") {
    const settings = getSettings(request);
    const targetPatterns = [];
    if (settings.yt) targetPatterns.push(URL_MAP.yt);
    if (settings.ytm) targetPatterns.push(URL_MAP.ytm);
    if (settings.spotify) targetPatterns.push(URL_MAP.spotify);

    if (targetPatterns.length === 0) { sendResponse({ status: "disabled" }); return; }

    chrome.tabs.query({ url: targetPatterns }, (tabs) => {
      const targetTab = tabs.find(t => t.audible) || tabs[0];
      if (!targetTab) { sendResponse({ status: "no_tab" }); return; }
      
      chrome.scripting.executeScript({ target: { tabId: targetTab.id }, func: scrapeMediaPage }, (results) => {
        if (chrome.runtime.lastError) return;
        if (results && results[0]) sendResponse({ status: "connected", data: results[0].result });
      });
    });
    return true;
  }

  if (request.action === "controlYouTube") {
    const settings = getSettings(request);
    const targetPatterns = [];
    if (settings.yt) targetPatterns.push(URL_MAP.yt);
    if (settings.ytm) targetPatterns.push(URL_MAP.ytm);
    if (settings.spotify) targetPatterns.push(URL_MAP.spotify);
    if (targetPatterns.length === 0) return;

    chrome.tabs.query({ url: targetPatterns }, (tabs) => {
      const targetTab = tabs.find(t => t.audible) || tabs[0];
      if (targetTab) {
        chrome.scripting.executeScript({ target: { tabId: targetTab.id }, func: controlMediaPage, args: [request.command] });
      }
    });
  }
});


function scrapeMediaPage() {
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
        let cleanT = t.replace(/【.*?】/g, '').replace(/\[.*?\]/g, '').replace(/\(.*?(MV|Official).*?\)/gi, '');
        const match = cleanT.match(/『(.*?)』/);
        if (match) cleanT = match[1]; else if (cleanT.includes(' / ')) cleanT = cleanT.split(' / ')[1] || cleanT.split(' / ')[0];
        if (a && cleanT.startsWith(a)) cleanT = cleanT.replace(a, '').trim();
        d.title = cleanT.trim() || t;
        d.artist = a.replace(/(-|\|)?\s*(Official|Channel|公式).*$/i, '').trim();
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
  } catch(e) {} return d;
}

function controlMediaPage(c) {
  const host = window.location.hostname; const v = document.querySelector('video, audio');
  if (host.includes('spotify.com')) {
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