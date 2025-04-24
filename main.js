var APIKEY = "";
document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const levelInputMin = document.getElementById('levelMin');
    const levelInputMax = document.getElementById('levelMax');
    const output = document.getElementById('output');
    const fetchBtn = document.getElementById('fetchBtn');
    const ApiBtn = document.getElementById('ApiBtn');
    const practiceTypeSelect = document.getElementById('practice');
    const StrokeButton = document.getElementById('StrokeButton');
    
    
    // Load stored API key if available
    const storedKey = localStorage.getItem('wanikani_api_key');
    if (storedKey) {
        document.getElementById('APIKeySection').classList.add('hidden');
        APIKEY = storedKey;
        document.getElementById('levelSection').classList.remove('hidden');
    }else{
        document.getElementById('APIKeySection').classList.remove('hidden');
        document.getElementById('levelSection').classList.add('hidden');
    }
    ApiBtn.addEventListener('click', async () => {
        APIKEY = apiKeyInput.value.trim();
        localStorage.setItem('wanikani_api_key', APIKEY);        
        const headers = {
            'Authorization': `Bearer ${APIKEY}`
        };

        try {
            const response = await fetch('https://api.wanikani.com/v2/user', { headers });
        
            if (!response.ok) {
                output.textContent = "Invalid API key";
                return;
            }else{
                //output.textContent = "Valid API key";
                document.getElementById('APIKeySection').classList.add('hidden');
                document.getElementById('levelSection').classList.remove('hidden');
                return;
            }    
        }catch (error) {
            output.textContent = "Invalid API key"
        }

    });

    
    fetchBtn.addEventListener('click', async () => {
     
      const levelMin = parseInt(levelInputMin.value);
      const levelMax = parseInt(levelInputMax.value);
      const practiceType = practiceTypeSelect.value;
      
      
  
      if (isNaN(levelMin) || isNaN(levelMax)|| levelMin < 1 || levelMin > 60 || levelMax < 1 || levelMax > 60) {
        output.textContent = "Please enter a level (1–60).";
        return;
      }
      if (levelMin > levelMax) {
        output.textContent = "Please enter a valid range.";
        return;
      }
      
      

      // Save API key to localStorage
      localStorage.setItem('wanikani_api_key', APIKEY);
      //console.log(APIKEY);
      
      const level = Math.floor(Math.random() * (levelMax - levelMin + 1)) + levelMin;
      let url = `https://api.wanikani.com/v2/subjects?types=vocabulary&levels=${level}`;

      try {
        
        const vocab = await getVocab(url);
        showItem(vocab, level, practiceType, levelMin, levelMax);
        

      } catch (err) {
        output.textContent = `Error: ${err.message}`;
      }
    });
  });

  async function getVocab(url){
    const headers = {
      'Authorization': `Bearer ${APIKEY}`
    };
    vocabItems= [];
    while (url) {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      vocabItems = vocabItems.concat(data.data);
      url = data.pages.next_url;
    }

    if (vocabItems.length === 0) {
      output.textContent = "No vocabulary found for that level.";
      return;
    }

    return vocabItems[Math.floor(Math.random() * vocabItems.length)];
  }

  function showItem(vocab, level, practiceType, levelMin, levelMax) {
    const body = document.getElementById('body');
    const strokeContainer = document.getElementById('StrokeOrder');
    strokeContainer.innerHTML = ''; // Clear previous
    if(!body.classList.contains('answer-shown')){body.classList.add('answer-shown');}
    const characters = vocab.data.characters;
    const meanings = vocab.data.meanings
          .filter(m => m.accepted_answer)
          .map(m => m.meaning)
          .join(', ');
    const reading = vocab.data.readings
          .map(m => m.reading)
          .join(', ');
    
    document.getElementById('Level').innerText = `Level ???`;
    if(practiceType=="writing"){
      document.getElementById('Reading').innerText = reading;
      document.getElementById('Meaning').innerText = meanings;
      document.getElementById('Kanji').innerText = "???"
    }else if(practiceType=="reading"){
      document.getElementById('Reading').innerText = "???";
      document.getElementById('Meaning').innerText = "???";
      document.getElementById('Kanji').innerText = characters;
    }

    var showNextButton = document.getElementById('Show');
  
    const newButton = showNextButton.cloneNode(true); 
    showNextButton.parentNode.replaceChild(newButton, showNextButton); 
    showNextButton = newButton
    showNextButton.addEventListener('click', showSolution);
    showNextButton.innerHTML = "Show Answer";
    StrokeButton.classList.add('hidden'); 

    async function showSolution(){
      document.getElementById('Reading').innerText = reading;
      document.getElementById('Meaning').innerText = meanings;
      document.getElementById('Kanji').innerText = characters;
      document.getElementById('Level').innerText = `Level ${level}`;

      showNextButton.removeEventListener('click', showSolution);
      showNextButton.addEventListener('click', repeatSetting);
      showNextButton.innerHTML = "Another one!";
      
      StrokeButton.classList.remove('hidden');
      StrokeButton.removeEventListener('click', () => {
        showStrokeOrder(characters);
      });
      StrokeButton.addEventListener('click', () => {
        showStrokeOrder(characters);
      });
      
      
      
    }

    async function repeatSetting(){
      const strokeContainer = document.getElementById('StrokeOrder');
      strokeContainer.innerHTML = ''; // Clear previous

        const level = Math.floor(Math.random() * (levelMax - levelMin + 1)) + levelMin;
        let url = `https://api.wanikani.com/v2/subjects?types=vocabulary&levels=${level}`;
        const vocab = await getVocab(url);
        showItem(vocab, level, practiceType, levelMin, levelMax);
        showNextButton.removeEventListener('click', repeatSetting);
        showNextButton.innerHTML = "Show Answer";
        StrokeButton.classList.add('hidden');
    }

    
    
    
    
    
  }

  function showStrokeOrder(kanji) {
    
  
    const strokeContainer = document.getElementById('StrokeOrder');
    strokeContainer.innerHTML = ''; // Clear previous
    document.getElementById('Kanji').innerText = "";
    for (let i = 0; i < kanji.length; i++) {
      const code = kanji[i].charCodeAt(0).toString(16).padStart(5, '0');
      const svgPath = `kanji/${code}.svg`;
      const objectEl = document.createElement('object');

      objectEl.classList.add('strokeOrderSVG');
      
      objectEl.type = 'image/svg+xml';
      objectEl.data = svgPath;
      objectEl.width = 150;
      objectEl.height = 150;
    
      strokeContainer.appendChild(objectEl);
    }
    
  }