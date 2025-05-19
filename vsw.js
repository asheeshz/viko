/*
विजेट का परिचय:
यह एक 'खोजें और सीखें' विजेट है जो उपयोगकर्ताओं को YouTube पर विभिन्न श्रेणियों (पढ़ाई, परीक्षा, मनोरंजन, समाचार) में वीडियो खोजने की अनुमति देता है।
यह इनपुट विकल्पों के आधार पर खोज बटन को सक्षम/अक्षम करता है और परिणामों को एक स्लाइडर और प्लेयर में दिखाता है।

उपयोग के निर्देश:
1. कैटेगरी बटन पर क्लिक करके अपनी पसंद की श्रेणी चुनें।
2. खुले हुए बॉक्स में ड्रॉपडाउन से कम से कम दो विकल्प चुनें या टेक्स्ट बॉक्स में कुछ टाइप करें।
3. जब 'खोजें' बटन सक्षम हो जाए (मंद दिखना बंद हो जाए), तो उस पर क्लिक करें।
4. खोज परिणाम नीचे वीडियो स्लाइडर में दिखाई देंगे। किसी वीडियो को मुख्य प्लेयर में देखने के लिए उसके थंबनेल पर क्लिक करें।
5. मुख्य मेनू पर वापस जाने के लिए 'Main Menu' बटन का उपयोग करें।
*/
let vsw_mainWidget,vsw_categoryButtonsContainer,vsw_categoryBanner,vsw_allSearchContainers,vsw_videoSliderContainer,vsw_videoDisplay,vsw_videoSliderNav,vsw_messageBox,vsw_videoSlider,vsw_youtubeIframe,vsw_messageTexts;
let vsw_currentVideoItems=[],vsw_videoSlideIndex=0,vsw_itemsPerPage=4,vsw_activeSearchContainerId=null,vsw_messageTimeout,vsw_resizeTimeout,vsw_scrollTimeout;
document.addEventListener('DOMContentLoaded',()=>{
    vsw_mainWidget=document.getElementById('vsw-main-widget');vsw_categoryButtonsContainer=document.getElementById('vsw-category-buttons');vsw_categoryBanner=document.getElementById('vsw-category-banner');vsw_allSearchContainers=document.querySelectorAll('.vsw-search-category-container');vsw_videoSliderContainer=document.getElementById('vsw-video-slider-container');vsw_videoDisplay=document.getElementById('vsw-video-display');vsw_videoSliderNav=document.getElementById('vsw-video-slider-nav');vsw_messageBox=document.getElementById('vsw-messageBox');vsw_videoSlider=document.getElementById('vsw-video-slider');vsw_youtubeIframe=document.getElementById('vsw-youtube-iframe');vsw_messageTexts=document.getElementById('vsw-message-texts');
    if(vsw_mainWidget&&vsw_categoryButtonsContainer&&vsw_messageTexts&&vsw_messageBox){
        vsw_setupCategoryButtons();vsw_setupBackButtons();vsw_setupOutsideClickListener();window.addEventListener('resize',vsw_handleResize);window.addEventListener('scroll',vsw_handleScroll);
        vsw_mainWidget.addEventListener('change',vsw_handleInputChange);vsw_mainWidget.addEventListener('input',vsw_handleInputChange);vsw_mainWidget.addEventListener('click',vsw_handleSearchButtonClick);
        vsw_showCategoriesAndBanner();
        vsw_allSearchContainers.forEach(container=>{container.style.display='none';container.classList.remove('vsw-active-search-box');container.style.opacity=0;});
        vsw_hideVideoSections();
    }else{
        console.error("VSW Error: Essential elements missing.");
        if(vsw_messageBox){vsw_messageBox.textContent="VSW Initialization Error: Essential elements missing.";vsw_messageBox.style.display='block';}
    }
});
function vsw_handleSearchButtonClick(event){
     const target=event.target;const searchButton=target.closest('.vsw-search-button');
     if(searchButton){
         const searchBox=searchButton.closest('.vsw-search-box');const categoryContainer=searchBox?searchBox.closest('.vsw-search-category-container'):null;
         if(categoryContainer&&categoryContainer.id===vsw_activeSearchContainerId){
             if(searchButton.disabled){
                 event.preventDefault();event.stopPropagation();vsw_showMessage(vsw_getTextById('vsw-msgMinInputRequired'),4000);
             }
         }
     }
}
function vsw_handleInputChange(event){
     const target=event.target;
     if(target.tagName==='SELECT'||(target.tagName==='INPUT'&&target.classList.contains('vsw-custom-search-input'))){
         const searchBox=target.closest('.vsw-search-box');const categoryContainer=searchBox?searchBox.closest('.vsw-search-category-container'):null;
         if(searchBox&&categoryContainer&&categoryContainer.id===vsw_activeSearchContainerId){
              vsw_checkInputsAndToggleSearchButton(searchBox);vsw_hideMessage();
         }
     }
}
function vsw_checkInputsAndToggleSearchButton(searchBoxElement){
     const searchButton=searchBoxElement.querySelector('.vsw-search-button');if(!searchButton)return;
     let inputCount=0;const selects=searchBoxElement.querySelectorAll('select');const textInput=searchBoxElement.querySelector('.vsw-custom-search-input');
     selects.forEach(select=>{if(select.value?.trim()&&select.value!==""){inputCount++;}});
     if(textInput&&textInput.value.trim()){inputCount++;}
     const minInputsRequired=2;
     if(inputCount>=minInputsRequired){searchButton.disabled=false;}else{searchButton.disabled=true;}
}
function vsw_showCategoriesAndBanner(){
     if(vsw_categoryButtonsContainer){
          vsw_categoryButtonsContainer.style.display='flex';
          setTimeout(()=>{vsw_categoryButtonsContainer.classList.remove('vsw-hidden');vsw_categoryButtonsContainer.style.opacity=1;},10);
     }
     if(vsw_categoryBanner){
         vsw_categoryBanner.style.display='block';
         setTimeout(()=>{vsw_categoryBanner.classList.remove('vsw-hidden');vsw_categoryBanner.style.opacity=1;},10);
     }
}
function vsw_hideCategoriesAndBanner(){
    if(vsw_categoryButtonsContainer){
         vsw_categoryButtonsContainer.style.opacity=0;
         const catBtnHandler=function(){this.style.display='none';this.removeEventListener('transitionend',catBtnHandler);};
         if(parseFloat(vsw_categoryButtonsContainer.style.opacity)>0){vsw_categoryButtonsContainer.addEventListener('transitionend',catBtnHandler,{once:true});}
         else{vsw_categoryButtonsContainer.style.display='none';}
         vsw_categoryButtonsContainer.classList.add('vsw-hidden');
    }
     if(vsw_categoryBanner){
         vsw_categoryBanner.style.opacity=0;
         const bannerHandler=function(){this.style.display='none';this.removeEventListener('transitionend',bannerHandler);};
         if(parseFloat(vsw_categoryBanner.style.opacity)>0){vsw_categoryBanner.addEventListener('transitionend',bannerHandler,{once:true});}
         else{vsw_categoryBanner.style.display='none';}
          vsw_categoryBanner.classList.add('vsw-hidden');
     }
}
function vsw_getTextById(id){
    if(!vsw_messageTexts){console.error("VSW Error: Message text container not found.");return`[${id}]`;}
    const element=vsw_messageTexts.querySelector(`#${id}`);
    if(element){return element.textContent||`[${id}]`;}else{console.warn(`VSW Warning: Message ID "${id}" not found.`);return`[${id}]`;}
}
function vsw_setupCategoryButtons(){
    if(!vsw_categoryButtonsContainer)return;
    const buttons=vsw_categoryButtonsContainer.querySelectorAll('button[data-target]');
    buttons.forEach(button=>{
        button.addEventListener('click',(event)=>{
            event.stopPropagation();const targetId=button.getAttribute('data-target');
            if(targetId){vsw_toggleCategory(targetId);}else{console.warn("VSW Warning: Button missing data-target.");}
        });
    });
}
function vsw_setupBackButtons(){
    const backButtons=document.querySelectorAll('.vsw-back-button');
    backButtons.forEach(button=>{
        button.addEventListener('click',(event)=>{event.stopPropagation();vsw_closeCurrentlyActiveCategory();});
    });
}
function vsw_closeCurrentlyActiveCategory(){
     if(vsw_activeSearchContainerId){
         const currentActiveContainer=document.getElementById(vsw_activeSearchContainerId);
         if(currentActiveContainer){
             const searchButton=currentActiveContainer.querySelector('.vsw-search-button');if(searchButton){searchButton.disabled=true;}
              currentActiveContainer.style.opacity=0;
              const containerHandler=function(){this.style.display='none';this.classList.remove('vsw-active-search-box');
                   const selects=this.querySelectorAll('select');const textInput=this.querySelector('.vsw-custom-search-input');
                   selects.forEach(select=>select.value="");if(textInput)textInput.value="";
                   this.removeEventListener('transitionend',containerHandler);};
              if(parseFloat(currentActiveContainer.style.opacity)>0){currentActiveContainer.addEventListener('transitionend',containerHandler,{once:true});}
              else{currentActiveContainer.style.display='none';currentActiveContainer.classList.remove('vsw-active-search-box');
                   const selects=currentActiveContainer.querySelectorAll('select');const textInput=currentActiveContainer.querySelector('.vsw-custom-search-input');
                   selects.forEach(select=>select.value="");if(textInput)textInput.value="";}
             vsw_hideVideoSections();vsw_clearVideoResults();
         }else{console.warn(`VSW Warning: Active container ID ${vsw_activeSearchContainerId} not found.`);}
         vsw_activeSearchContainerId=null;vsw_showCategoriesAndBanner();
     }vsw_hideMessage();
}
function vsw_toggleCategory(containerIdToShow){
    const containerToShow=document.getElementById(containerIdToShow);
    if(!containerToShow){console.error(`VSW Error: Target container ID ${containerIdToShow} not found.`);return;}
    if(containerIdToShow===vsw_activeSearchContainerId){vsw_closeCurrentlyActiveCategory();return;}
    if(vsw_activeSearchContainerId){
        const currentActiveContainer=document.getElementById(vsw_activeSearchContainerId);
         if(currentActiveContainer){
              const searchButton=currentActiveContainer.querySelector('.vsw-search-button');if(searchButton){searchButton.disabled=true;}
              currentActiveContainer.style.opacity=0;
              const oldContainerHandler=function(){this.style.display='none';this.classList.remove('vsw-active-search-box');
                   const selects=this.querySelectorAll('select');const textInput=this.querySelector('.vsw-custom-search-input');
                   selects.forEach(select=>select.value="");if(textInput)textInput.value="";
                  this.removeEventListener('transitionend',oldContainerHandler);};
              if(parseFloat(currentActiveContainer.style.opacity)>0){currentActiveContainer.addEventListener('transitionend',oldContainerHandler,{once:true});}
              else{currentActiveContainer.style.display='none';currentActiveContainer.classList.remove('vsw-active-search-box');
                   const selects=currentActiveContainer.querySelectorAll('select');const textInput=currentActiveContainer.querySelector('.vsw-custom-search-input');
                   selects.forEach(select=>select.value="");if(textInput)textInput.value="";}
         }
    }vsw_hideCategoriesAndBanner();
    containerToShow.style.display='block';
    setTimeout(()=>{
         containerToShow.classList.add('vsw-active-search-box');containerToShow.style.opacity=1;
         const searchBoxElement=containerToShow.querySelector('.vsw-search-box');if(searchBoxElement){vsw_checkInputsAndToggleSearchButton(searchBoxElement);}
         setTimeout(()=>{const widgetRect=vsw_mainWidget.getBoundingClientRect();const targetScrollTop=window.scrollY+widgetRect.top;window.scrollTo({top:targetScrollTop,behavior:'smooth'});},400);
    },10);
    vsw_activeSearchContainerId=containerIdToShow;vsw_clearVideoResults();vsw_hideVideoSections();vsw_itemsPerPage=vsw_calculateItemsPerPage();vsw_hideMessage();
}
function vsw_setupOutsideClickListener(){
    if(!vsw_mainWidget)return; // Ensure main widget exists
    document.addEventListener('click',(event)=>{
        if(!vsw_activeSearchContainerId)return;
         // Check if the click occurred inside the main widget container
         if(vsw_mainWidget.contains(event.target)){
             // If inside the main widget, do not close the category.
             // Specific element clicks (like video items, nav buttons, back button, enabled search button)
             // are handled by their own listeners or onclick attributes.
             return;
         }
        // If click is outside the main widget and a category is active, close it
        vsw_closeCurrentlyActiveCategory();
    });
}
function vsw_handleScroll(){
     clearTimeout(vsw_scrollTimeout);
     vsw_scrollTimeout=setTimeout(()=>{
         if(vsw_activeSearchContainerId&&vsw_mainWidget){
             // Do NOT close category on scroll if video results are currently displayed
             if(vsw_videoDisplay&&vsw_videoDisplay.style.display!=='none'){
                  return;
             }
             const widgetRect=vsw_mainWidget.getBoundingClientRect();const threshold=Math.min(widgetRect.height*.3,window.innerHeight*.3);
             const isOutOfView=(widgetRect.bottom<threshold||widgetRect.top>window.innerHeight-threshold);
             if(isOutOfView){vsw_closeCurrentlyActiveCategory();}
         }
     },100);
}
async function vsw_fetchYouTubeData(searchTerm=''){
    const apiKey='AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q'; /* DEMO KEY - REPLACE IN PRODUCTION! */
    if(!apiKey||apiKey==='YOUR_API_KEY_HERE'||apiKey.length<30||apiKey.startsWith('AIzaSyB')){
         console.error("VSW Error: API Key config missing/invalid.");vsw_showMessage(vsw_getTextById('vsw-msgApiKeyError'),8000);
         vsw_hideVideoSections();vsw_clearVideoResults();return;
    }
    const apiHost='youtube.googleapis.com';const maxResults=30;const safeSearchTerm=searchTerm||'educational videos in Hindi';
    let apiUrl=`https://${apiHost}/youtube/v3/search?part=snippet&type=video&maxResults=${maxResults}&key=${apiKey}`;
    apiUrl+=`&q=${encodeURIComponent(safeSearchTerm)}`;
     const hasHindiChars=/[\u0900-\u097F]/.test(safeSearchTerm);const hasCommonHindiWords=/\b(हिंदी|कक्षा|परीक्षा|विज्ञान|गणित|इतिहास|भूगोल|समाचार|लाइव|कहानी|कविता)\b/i.test(safeSearchTerm);
    if(hasHindiChars||hasCommonHindiWords||safeSearchTerm.toLowerCase().includes("hindi")){apiUrl+=`&relevanceLanguage=hi`;}
    vsw_showMessage(vsw_getTextById('vsw-msgSearchingVideos'),2500);vsw_hideVideoSections();vsw_clearVideoResults();
    try{
        const response=await fetch(apiUrl,{method:'GET',headers:{'Accept':'application/json'}});
        const data=await response.json();
        if(!response.ok){
            console.error('VSW API Error Response:',data);let errorId='vsw-msgApiGenericErrorPrefix';let errorDetails=`(${response.status})`;
            if(data.error?.message){
                if(data.error.errors?.[0]?.reason==='quotaExceeded'){errorId='vsw-msgApiQuotaError';errorDetails='';}
                else if(data.error.errors?.[0]?.reason==='keyInvalid'){errorId='vsw-msgApiKeyInvalid';errorDetails='';}
                else{errorDetails=`:${data.error.message}`;}
            }else{errorDetails=`(${response.status})`;}
            const apiError=new Error(vsw_getTextById(errorId)+errorDetails);apiError.statusCode=response.status;throw apiError;
        }
        if(!data?.items||data.items.length===0){
            vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound'),4000);vsw_hideVideoSections();vsw_clearVideoResults();vsw_currentVideoItems=[];return;
        }
        vsw_currentVideoItems=data.items.filter(item=>item.id?.videoId&&item.snippet);
        if(vsw_currentVideoItems.length===0){
             vsw_showMessage(vsw_getTextById('vsw-msgNoVideosFound')+" (valid items not found)",4000);
            vsw_hideVideoSections();vsw_clearVideoResults();return;
        }
        vsw_displayVideos(vsw_currentVideoItems);vsw_showVideoSections();vsw_hideMessage();
    }catch(error){
        console.error('VSW Fetch Error:',error);let displayError=vsw_getTextById('vsw-msgInternalError');
        if(error.message&&(error.message.startsWith(vsw_getTextById('vsw-msgApiGenericErrorPrefix'))||error.message.startsWith(vsw_getTextById('vsw-msgApiQuotaError'))||error.message.startsWith(vsw_getTextById('vsw-msgApiKeyInvalid'))||error.message.startsWith(vsw_getTextById('vsw-msgApiKeyError')))){
             displayError=error.message;
         }else if(error.message){displayError=`${vsw_getTextById('vsw-msgVideoLoadErrorPrefix')}: ${error.message.substring(0,100)}...`;}
        vsw_showMessage(displayError,6000);vsw_hideVideoSections();vsw_clearVideoResults();vsw_currentVideoItems=[];
    }
}
function vsw_displayVideos(videos){
    if(!vsw_videoSlider||!vsw_videoSliderContainer||!vsw_videoDisplay||!vsw_youtubeIframe){console.error("VSW Video display elements not found.");return;}
    vsw_videoSlider.innerHTML='';vsw_videoSlideIndex=0;vsw_currentVideoItems=videos;
    if(!vsw_currentVideoItems||vsw_currentVideoItems.length===0){
        if(vsw_videoSliderContainer){vsw_videoSlider.innerHTML=`<p style="color:#ccc; padding: 20px; text-align: center; width: 100%;">${vsw_getTextById('vsw-msgNoVideosFound')}</p>`;vsw_videoSliderContainer.style.display='block';}
        if(vsw_videoSliderNav)vsw_videoSliderNav.style.display='none';if(vsw_youtubeIframe)vsw_youtubeIframe.src='';if(vsw_videoDisplay)vsw_videoDisplay.style.display='none';return;
    }
    vsw_currentVideoItems.forEach((video,index)=>{
        if(!video.id?.videoId||!video.snippet){console.warn("VSW Skipping invalid video item:",video);return;}
        const videoId=video.id.videoId;const videoTitle=video.snippet.title||'Untitled Video';
        const thumbnailUrl=video.snippet.thumbnails?.medium?.url||video.snippet.thumbnails?.default?.url||'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        const videoItem=document.createElement('div');videoItem.classList.add('vsw-video-item');videoItem.setAttribute('data-index',index);videoItem.setAttribute('data-videoid',videoId);
        const thumbnail=document.createElement('img');thumbnail.src=thumbnailUrl;thumbnail.alt=videoTitle;
        thumbnail.onerror=function(){this.onerror=null;this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';console.warn(`VSW Thumbnail failed for ${videoId}`);};
        const title=document.createElement('p');const tempEl=document.createElement('textarea');tempEl.innerHTML=videoTitle;title.textContent=tempEl.value;
        videoItem.appendChild(thumbnail);videoItem.appendChild(title);
        videoItem.addEventListener('click',()=>{vsw_displayEmbeddedVideo(videoId);
            if(vsw_videoDisplay&&vsw_videoDisplay.style.display!=='none'){const playerRect=vsw_videoDisplay.getBoundingClientRect();if(playerRect.top<20){window.scrollTo({top:window.scrollY+playerRect.top-20,behavior:'smooth'});}}
        });
        vsw_videoSlider.appendChild(videoItem);
    });
    if(vsw_currentVideoItems.length>0&&vsw_currentVideoItems[0].id?.videoId){vsw_displayEmbeddedVideo(vsw_currentVideoItems[0].id.videoId);}
    else{if(vsw_youtubeIframe)vsw_youtubeIframe.src='';if(vsw_videoDisplay)vsw_videoDisplay.style.display='none';}
    vsw_itemsPerPage=vsw_calculateItemsPerPage();vsw_updateVideoSlider();
    if(vsw_videoSliderContainer)vsw_videoSliderContainer.style.display='block';
    if(vsw_videoSliderNav){vsw_videoSliderNav.style.display=vsw_currentVideoItems.length>vsw_itemsPerPage?'flex':'none';}
}
function vsw_displayEmbeddedVideo(videoId){
    if(!vsw_youtubeIframe||!vsw_videoDisplay)return;
    if(!videoId){vsw_youtubeIframe.src='';vsw_videoDisplay.style.display='none';return;}
    vsw_youtubeIframe.src=`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&hl=hi`;
    vsw_videoDisplay.style.display='block';
    vsw_youtubeIframe.onerror=()=>{console.error('VSW iFrame failed to load video ID:',videoId);vsw_showMessage(vsw_getTextById('vsw-msgVideoLoadFailed'),3000);vsw_videoDisplay.style.display='none';};
    vsw_youtubeIframe.onload=()=>{console.log(`VSW iFrame loaded ID: ${videoId}`);if(vsw_youtubeIframe.src.includes(videoId)){vsw_videoDisplay.style.display='block';}};
    if(!vsw_youtubeIframe.src||vsw_youtubeIframe.src==='about:blank'){vsw_videoDisplay.style.display='none';}
}
function vsw_clearVideoResults(){
    if(vsw_videoSlider)vsw_videoSlider.innerHTML='';
    if(vsw_youtubeIframe){if(vsw_youtubeIframe.contentWindow){try{vsw_youtubeIframe.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}','*');}catch(e){}}vsw_youtubeIframe.src='';}
    vsw_currentVideoItems=[];vsw_videoSlideIndex=0;
}
function vsw_calculateItemsPerPage(){
    if(!vsw_videoSliderContainer||vsw_videoSliderContainer.offsetWidth<=0){
         const itemWidth=150;const itemMargin=12;const itemTotalWidth=itemWidth+itemMargin;
         const containerWidthFallback=vsw_mainWidget?vsw_mainWidget.offsetWidth*.95-50:window.innerWidth*.95-50;
         const calculated=Math.max(1,Math.floor(containerWidthFallback/itemTotalWidth));return calculated;
    }
    const containerWidth=vsw_videoSliderContainer.offsetWidth-20;const itemWidth=150;const itemMargin=12;const itemTotalWidth=itemWidth+itemMargin;
    if(containerWidth<=0||itemTotalWidth<=0){return 1;}
    const calculatedItems=Math.max(1,Math.floor(containerWidth/itemTotalWidth));return calculatedItems;
}
function vsw_slideVideo(direction){
    const numVideoItems=vsw_currentVideoItems.length;vsw_itemsPerPage=vsw_calculateItemsPerPage();
    if(numVideoItems<=vsw_itemsPerPage)return;
    const maxIndex=Math.max(0,numVideoItems-vsw_itemsPerPage);let newIndex=vsw_videoSlideIndex+direction;
    vsw_videoSlideIndex=Math.max(0,Math.min(maxIndex,newIndex));vsw_updateVideoSlider();
}
function vsw_updateVideoSlider(){
    if(!vsw_videoSlider||vsw_currentVideoItems.length===0){if(vsw_videoSlider)vsw_videoSlider.style.transform='translateX(0px)';return;}
    const itemWidth=150;const itemMargin=12;const slideAmount=-vsw_videoSlideIndex*(itemWidth+itemMargin);
    vsw_videoSlider.style.transform=`translateX(${slideAmount}px)`;
}
function vsw_handleResize(){
    clearTimeout(vsw_resizeTimeout);
    vsw_resizeTimeout=setTimeout(()=>{
        if(vsw_videoSliderContainer&&vsw_videoSliderContainer.style.display!=='none'){
            const oldItemsPerPage=vsw_itemsPerPage;vsw_itemsPerPage=vsw_calculateItemsPerPage();
            if(oldItemsPerPage!==vsw_itemsPerPage){
                const maxIndex=Math.max(0,vsw_currentVideoItems.length-vsw_itemsPerPage);
                vsw_videoSlideIndex=Math.min(vsw_videoSlideIndex,maxIndex);vsw_updateVideoSlider();
                if(vsw_videoSliderNav){vsw_videoSliderNav.style.display=vsw_currentVideoItems.length>vsw_itemsPerPage?'flex':'none';}
            }
        }
         if(vsw_activeSearchContainerId){
              const activeContainer=document.getElementById(vsw_activeSearchContainerId);
              if(activeContainer){const searchBoxElement=activeContainer.querySelector('.vsw-search-box');if(searchBoxElement){vsw_checkInputsAndToggleSearchButton(searchBoxElement);}}
         }
    },250);
}
function vsw_performSearch(searchBoxId){
    const searchBox=document.getElementById(searchBoxId);if(!searchBox){console.error("VSW Error: Search box not found:",searchBoxId);vsw_showMessage(vsw_getTextById('vsw-msgInternalError'),4000);return;}
     const searchButton=searchBox.querySelector('.vsw-search-button');if(searchButton&&searchButton.disabled){console.warn("VSW: performSearch called on disabled button.");vsw_showMessage(vsw_getTextById('vsw-msgMinInputRequired'),4000);return;}
    let finalSearchTerm='';let inputCount=0;let dropdownSearchTerm='';
    const selects=searchBox.querySelectorAll('select');const textInput=searchBox.querySelector('.vsw-custom-search-input');
    selects.forEach(select=>{if(select.value?.trim()&&select.value!==""){dropdownSearchTerm+=select.value.trim()+' ';inputCount++;}});
    dropdownSearchTerm=dropdownSearchTerm.trim();const textValue=textInput?textInput.value.trim():'';
    if(textValue){inputCount++;}
    const minInputsRequired=2;
    if(inputCount<minInputsRequired){console.warn("VSW: performSearch called with insufficient inputs (fallback).");vsw_showMessage(vsw_getTextById('vsw-msgMinInputRequired'),4000);return;}
     if(textValue){finalSearchTerm=(dropdownSearchTerm+' '+textValue).trim();}else{finalSearchTerm=dropdownSearchTerm;}
    vsw_hideMessage();console.log(`VSW Performing search for: "${finalSearchTerm}"`);vsw_fetchYouTubeData(finalSearchTerm);
}
function vsw_showVideoSections(){
    if(vsw_currentVideoItems&&vsw_currentVideoItems.length>0){
        if(vsw_videoSliderContainer&&vsw_videoSliderContainer.style.display==='none'){vsw_videoSliderContainer.style.display='block';}
        if(vsw_youtubeIframe&&vsw_youtubeIframe.src&&vsw_youtubeIframe.src!=='about:blank'&&vsw_videoDisplay&&vsw_videoDisplay.style.display==='none'){vsw_videoDisplay.style.display='block';}
        vsw_itemsPerPage=vsw_calculateItemsPerPage();
        if(vsw_videoSliderNav){vsw_videoSliderNav.style.display=vsw_currentVideoItems.length>vsw_itemsPerPage?'flex':'none';}
    }else{vsw_hideVideoSections();}
}
function vsw_hideVideoSections(){
    if(vsw_videoSliderContainer)vsw_videoSliderContainer.style.display='none';if(vsw_videoDisplay)vsw_videoDisplay.style.display='none';if(vsw_videoSliderNav)vsw_videoSliderNav.style.display='none';
}
function vsw_showMessage(messageText,duration=3000){
    if(!vsw_messageBox)return;
    clearTimeout(vsw_messageTimeout);
    const textToShow=messageText||vsw_getTextById('vsw-msgInternalError');
    vsw_messageBox.textContent=textToShow;vsw_messageBox.style.display='block';
    if(duration>0){vsw_messageTimeout=setTimeout(vsw_hideMessage,duration);}
}
function vsw_hideMessage(){if(!vsw_messageBox)return;clearTimeout(vsw_messageTimeout);vsw_messageBox.style.display='none';}
