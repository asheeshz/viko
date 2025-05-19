/*
परिचय: यह कई स्वतंत्र विजेट्स का संयोजित मिनीफाईड जावास्क्रिप्ट कोड है।
प्रत्येक विजेट को एक IIFE (Immediately Invoked Function Expression) में लपेटा गया है ताकि ग्लोबल स्कोप पोल्यूशन से बचा जा सके और नामों का टकराव न हो।
यह स्क्रिप्ट HTML में <script defer> के साथ उपयोग के लिए है।
टिप्पणियाँ और श्वेतस्थान हटा दिए गए हैं और वेरिएबल/फंक्शन नामों को मिनीफाई किया गया है।
*/

// --------------------------------------------------
// विजेट 1: Circle Menu लॉजिक
// --------------------------------------------------
(function() { // Circle Menu विजेट के लिए IIFE शुरू

    const mwCM = document.getElementById('my-unique-circle-menu'); // Circle Menu का मुख्य एलिमेंट

    if (!mwCM) {
        // console.log("Circle Menu widget not found on this page."); // वैकल्पिक डीबगिंग
        return;
    }

    const mt = mwCM.querySelector('.menu-toggle');
    const cm = mwCM.querySelector('.menu-categories');
    const lm = mwCM.querySelector('.menu-links');
    const lt = lm ? lm.querySelector('.links-title') : null;
    const ctel = cm ? cm.querySelector('.category-title') : null;
    const c = mwCM.querySelectorAll('.category');
    const lcs = mwCM.querySelectorAll('.links-content .links');

    const ci = {
        'class-1-5': '<i class="fas fa-book-reader"></i>', 'class-6-8': '<i class="fas fa-graduation-cap"></i>',
        'class-9-10': '<i class="fas fa-school"></i>', 'class-11-12': '<i class="fas fa-university"></i>',
        'competitive-exam': '<i class="fas fa-trophy"></i>', 'news-channel': '<i class="fas fa-newspaper"></i>',
        'yoga-ayurveda': '<i class="fas fa-heart"></i>', 'marriage-links': '<i class="fas fa-ring"></i>',
        'editorial-links': '<i class="fas fa-edit"></i>', 'government-links': '<i class="fas fa-flag"></i>',
        'astrology-links': '<i class="fas fa-star"></i>', 'vaidik-links': '<i class="fas fa-om"></i>'
    };
    const gc = [
        'gradient-1', 'gradient-2', 'gradient-3', 'gradient-4', 'gradient-5', 'gradient-6',
        'gradient-7', 'gradient-8', 'gradient-9', 'gradient-10', 'gradient-11', 'gradient-12'
    ];

    function rgc(e) { if (e) { gc.forEach(cls => e.classList.remove(cls)); } }

    if (mt && cm && lm && ctel) {
        mt.addEventListener('click', (e) => {
            e.stopPropagation();
            const ia = cm.classList.contains('active');
            if (ia) {
                cm.classList.remove('active');
                lm.classList.remove('show');
                ctel.style.display = 'none';
            } else {
                lm.classList.remove('show');
                cm.classList.add('active');
                ctel.style.display = 'block';
                rgc(ctel);
                const rgi = Math.floor(Math.random() * gc.length);
                ctel.classList.add(gc[rgi]);
                ctel.innerHTML = '<i class="fas fa-hand-point-down"></i> अपनी पसंद पर क्लिक करें';
            }
        });
    }

    if (c.length > 0 && lm && lt && cm && ctel) {
        c.forEach((cat, i) => {
            cat.addEventListener('click', (e) => {
                e.stopPropagation();
                const cd = cat.getAttribute('data-category');
                const tt = cat.getAttribute('data-title');
                const ih = ci[cd] || '<i class="fas fa-link"></i>';
                lcs.forEach(lb => { lb.style.display = 'none'; });
                const tl = lm.querySelector(`.links-content .${cd}`);
                if (tl) { tl.style.display = 'block'; }
                if (lt) {
                    lt.innerHTML = `${ih} ${tt}`;
                    rgc(lt);
                    lt.classList.add(gc[i % gc.length]);
                }
                cm.classList.remove('active');
                lm.classList.add('show');
                ctel.style.display = 'none';
            });
        });
    }

    document.addEventListener('click', (e) => {
        if (mt && cm && lm && ctel) {
             if (!mt.contains(e.target) && !cm.contains(e.target) && !lm.contains(e.target) ) {
                cm.classList.remove('active');
                lm.classList.remove('show');
                ctel.style.display = 'none';
             }
        }
    });

    // console.log("Circle Menu Initialized (deferred)."); // Optional confirmation

})(); // Circle Menu विजेट के लिए IIFE समाप्त
// --------------------------------------------------
// विजेट 2: Table of Contents (TOC) लॉजिक
// --------------------------------------------------
(function() { // TOC विजेट के लिए IIFE शुरू

    const config = {
        postContainerSelector: ".post-body",
        headingsSelector: "h2, h3",
        minHeadingsForToc: 2,
        tocTitleText: "Table of Contents",
        showButtonBaseText: "Explore Topics",
        hideButtonBaseText: "Hide Contents",
        showIconClass: "fa-solid fa-chevron-down",
        hideIconClass: "fa-solid fa-chevron-up",
        highlightDuration: 3000,
        useIcons: true,
        h2IconClass: "fa-solid fa-book-reader",
        h3IconClass: "fa-regular fa-circle",
    };

    let cht = null;
    let tc = null;
    let tb = null;
    const pc = document.querySelector(config.postContainerSelector);

    function csi(h, i) {
        let tid = (h.textContent || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-').replace(/^-+|-+$/g, '');
        let id = "toc-h-" + (tid || i);
        let cntr = 1; const oid = id;
        while (document.getElementById(id)) { id = oid + '-' + cntr; cntr++; }
        return id;
    }

    function ch(sh = null, sc = []) {
        if (cht) { clearTimeout(cht); cht = null; }
        if (sh) { sh.classList.remove('highlight-target'); }
        if (sc.length > 0) { sc.forEach(el => el.classList.remove('highlight-content')); }
        else if (!sh && !sc.length) {
            document.querySelectorAll('.highlight-target').forEach(el => el.classList.remove('highlight-target'));
            document.querySelectorAll('.highlight-content').forEach(el => el.classList.remove('highlight-content'));
        }
    }

    function ah(th) {
        ch();
        th.classList.add('highlight-target');
        const hc = [];
        let sib = th.nextElementSibling;
        while (sib && !sib.matches(config.headingsSelector) && !sib.matches('#toc-container')) {
            if (sib.nodeType === 1) { sib.classList.add('highlight-content'); hc.push(sib); }
            sib = sib.nextElementSibling;
        }
        cht = setTimeout(() => { ch(th, hc); }, config.highlightDuration);
    }

    function ss(e) {
        const er = e.getBoundingClientRect();
        const aet = er.top + window.pageYOffset;
        const off = window.innerHeight * 0.28;
        const tsp = aet - off;
        window.scrollTo({ top: tsp, behavior: 'smooth' });
    }

    function cbg(be, sg) {
        if (!be) return;
        if (sg) {
            setTimeout(() => {
                if (toc && !toc.classList.contains('toc-visible')) {
                     be.classList.add('toc-closed-effect');
                }
            }, 700);
        } else {
            be.classList.remove('toc-closed-effect');
        }
    }

    function ubc(ie) {
        if (!tb) return;
        const t = ie ? config.hideButtonBaseText : config.showButtonBaseText;
        const icl = ie ? config.hideIconClass : config.showIconClass;
        tb.innerHTML = `${t} <i class="${icl}" aria-hidden="true" style="margin-left: 8px;"></i>`;
        tb.setAttribute('aria-expanded', String(ie));
    }

    function sel() {
        if (!tc || !toc || !tb) return;

        tb.addEventListener('click', () => {
            const ie = toc.classList.toggle('toc-visible');
            ubc(ie);
            tc.classList.toggle('toc-is-shown', ie);
            cbg(tb, !ie);
        });

        toc.addEventListener('click', (e) => {
            const l = e.target.closest('a');
            if (l && l.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const tid = l.getAttribute('href').substring(1);
                const th = document.getElementById(tid);
                if (th) {
                   if (!toc.classList.contains('toc-visible')) {
                       toc.classList.add('toc-visible');
                       tc.classList.add('toc-is-shown');
                       ubc(true);
                       cbg(tb, false);
                   }
                   ss(th);
                   setTimeout(() => { ah(th); }, 500);
                } else { console.warn("TOC: Target '" + tid + "' not found."); }
            }
        });
    }

    function it() {
        if (!pc) { console.warn("TOC: Container '" + config.postContainerSelector + "' not found."); return; }
        const h = Array.from(pc.querySelectorAll(config.headingsSelector));
        const vh = [];
        let fvh = null;

        h.forEach(hd => {
            if (!hd.closest('#toc-container') && hd.textContent.trim()) {
                vh.push(hd);
                if (!fvh) fvh = hd;
            }
        });

        if (vh.length < config.minHeadingsForToc) { return; }

        tc = document.createElement("div"); tc.id = "toc-container";
        tb = document.createElement("button"); tb.id = "toc-toggle-button";
        ubc(false);
        tb.setAttribute("aria-controls", "toc");
        cbg(tb, true);

        toc = document.createElement("div"); toc.id = "toc";
        const tt = document.createElement("h2");
        tt.textContent = config.tocTitleText;
        toc.appendChild(tt);
        const tl = document.createElement("ul");

        vh.forEach((hd, i) => {
            let id = hd.getAttribute("id");
            if (!id) { id = csi(hd, i); hd.setAttribute("id", id); }
            const li = document.createElement("li");
            const hl = hd.tagName.toLowerCase();
            li.classList.add('toc-level-' + hl.replace('h',''));
            const lnk = document.createElement("a"); lnk.setAttribute("href", "#" + id);

            let icl = "";
            if (config.useIcons) {
                if (hl === 'h2' && config.h2IconClass) icl = config.h2IconClass;
                else if (hl === 'h3' && config.h3IconClass) icl = config.h3IconClass;
                if (icl) {
                    const ie = document.createElement("i");
                    icl.split(' ').forEach(cls => { if (cls) ie.classList.add(cls); });
                    ie.setAttribute("aria-hidden", "true");
                    lnk.appendChild(ie);
                }
            }
            lnk.appendChild(document.createTextNode((hd.textContent || '').trim()));
            li.appendChild(lnk); tl.appendChild(li);
        });

        toc.appendChild(tl); tc.appendChild(tb); tc.appendChild(toc);

        if (fvh && fvh.parentNode) {
             fvh.parentNode.insertBefore(tc, fvh);
         } else if (pc.firstChild) {
             pc.insertBefore(tc, pc.firstChild);
         } else {
             pc.appendChild(tc);
         }

        sel();
        // console.log("Table of Contents Initialized."); // Optional confirmation
    }

    try {
        it();
    } catch (error) {
        console.error("TOC Script Error:", error);
    }

})(); // TOC विजेट के लिए IIFE समाप्त
// --------------------------------------------------
// विजेट 3: खोजें और सीखें विजेट लॉजिक
// --------------------------------------------------
(function() { // Search and Learn (VSW) विजेट के लिए IIFE शुरू

    let mwVSW,cbcVSW,cbVSW,ascVSW,vscVSW,vdVSW,vsnVSW,mbVSW,vsVSW,yiVSW,mtVSW;
    let cviVSW=[],vsiVSW=0,ippVSW=4,asciVSW=null,mtmVSW,rtmVSW,stmVSW;

    mwVSW=document.getElementById('vsw-main-widget');
    cbcVSW=document.getElementById('vsw-category-buttons');
    cbVSW=document.getElementById('vsw-category-banner');
    ascVSW=document.querySelectorAll('.vsw-search-category-container');
    vscVSW=document.getElementById('vsw-video-slider-container');
    vdVSW=document.getElementById('vsw-video-display');
    vsnVSW=document.getElementById('vsw-video-slider-nav');
    mbVSW=document.getElementById('vsw-messageBox');
    vsVSW=document.getElementById('vsw-video-slider');
    yiVSW=document.getElementById('vsw-youtube-iframe');
    mtVSW=document.getElementById('vsw-message-texts');

    if(mwVSW&&cbcVSW&&mtVSW&&mbVSW){
        sucVSW();subVSW();socVSW();
        window.addEventListener('resize',hrVSW);
        window.addEventListener('scroll',hsVSW);
        mwVSW.addEventListener('change',hiiVSW);
        mwVSW.addEventListener('input',hiiVSW);
        mwVSW.addEventListener('click',hsbVSW);

        scbVSW();
        ascVSW.forEach(c=>{c.style.display='none';c.classList.remove('vsw-active-search-box');c.style.opacity=0;});
        hvsVSW();
        // console.log("Search and Learn Widget Initialized (deferred)."); // Optional confirmation
    }else{
        console.error("VSW Error: Essential elements missing.");
        if(mbVSW){mbVSW.textContent="VSW Initialization Error: Essential elements missing.";mbVSW.style.display='block';}
    }

    function hsbVSW(e){const t=e.target;const s=t.closest('.vsw-search-button');if(s){const sb=s.closest('.vsw-search-box');const cc=sb?sb.closest('.vsw-search-category-container'):null;if(cc&&cc.id===asciVSW){if(s.disabled){e.preventDefault();e.stopPropagation();smVSW(gtxVSW('vsw-msgMinInputRequired'),4000);}}}}
    function hiiVSW(e){const t=e.target;if(t.tagName==='SELECT'||(t.tagName==='INPUT'&&t.classList.contains('vsw-custom-search-input'))){const sb=t.closest('.vsw-search-box');const cc=sb?sb.closest('.vsw-search-category-container'):null;if(sb&&cc&&cc.id===asciVSW){citVSW(sb);hmVSW();}}}
    function citVSW(s){const b=s.querySelector('.vsw-search-button');if(!b)return;let ic=0;const sl=s.querySelectorAll('select');const ti=s.querySelector('.vsw-custom-search-input');sl.forEach(select=>{if(select.value?.trim()&&select.value!==""){ic++;}});if(ti&&ti.value.trim()){ic++;}
    const mir=2;if(ic>=mir){b.disabled=false;}else{b.disabled=true;}}
    function scbVSW(){if(cbcVSW){cbcVSW.style.display='flex';setTimeout(()=>{cbcVSW.classList.remove('vsw-hidden');cbcVSW.style.opacity=1;},10);}if(cbVSW){cbVSW.style.display='block';setTimeout(()=>{cbVSW.classList.remove('vsw-hidden');cbVSW.style.opacity=1;},10);}}
    function hcbVSW(){if(cbcVSW){cbcVSW.style.opacity=0;const ch=function(){this.style.display='none';this.removeEventListener('transitionend',ch);};if(parseFloat(cbcVSW.style.opacity)>0){cbcVSW.addEventListener('transitionend',ch,{once:true});}else{cbcVSW.style.display='none';}cbcVSW.classList.add('vsw-hidden');}if(cbVSW){cbVSW.style.opacity=0;const bh=function(){this.style.display='none';this.removeEventListener('transitionend',bh);};if(parseFloat(cbVSW.style.opacity)>0){cbVSW.addEventListener('transitionend',bh,{once:true});}else{cbVSW.style.display='none';}cbVSW.classList.add('vsw-hidden');}}
    function gtxVSW(id){if(!mtVSW){console.error("VSW Error: Message text container not found.");return`[${id}]`;}const e=mtVSW.querySelector(`#${id}`);if(e){return e.textContent||`[${id}]`;}else{console.warn(`VSW Warning: Message ID "${id}" not found.`);return`[${id}]`;}}
    function sucVSW(){if(!cbcVSW)return;const b=cbcVSW.querySelectorAll('button[data-target]');b.forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();const tid=btn.getAttribute('data-target');if(tid){tcVSW(tid);}else{console.warn("VSW Warning: Button missing data-target.");}});});}
    function subVSW(){const b=document.querySelectorAll('.vsw-back-button');b.forEach(btn=>{btn.addEventListener('click',e=>{e.stopPropagation();ccaVSW();});});}
    function ccaVSW(){if(asciVSW){const c=document.getElementById(asciVSW);if(c){const b=c.querySelector('.vsw-search-button');if(b){b.disabled=true;}c.style.opacity=0;const ch=function(){this.style.display='none';this.classList.remove('vsw-active-search-box');const sl=this.querySelectorAll('select');const ti=this.querySelector('.vsw-custom-search-input');sl.forEach(s=>s.value="");if(ti)ti.value="";this.removeEventListener('transitionend',ch);};if(parseFloat(c.style.opacity)>0){c.addEventListener('transitionend',ch,{once:true});}else{c.style.display='none';c.classList.remove('vsw-active-search-box');const sl=c.querySelectorAll('select');const ti=c.querySelector('.vsw-custom-search-input');sl.forEach(s=>s.value="");if(ti)ti.value="";}hvsVSW();cvrVSW();}else{console.warn(`VSW Warning: Active container ID ${asciVSW} not found.`);}}asciVSW=null;scbVSW();hmVSW();}
    function tcVSW(cs){const ct=document.getElementById(cs);if(!ct){console.error(`VSW Error: Target container ID ${cs} not found.`);return;}if(cs===asciVSW){ccaVSW();return;}if(asciVSW){const cc=document.getElementById(asciVSW);if(cc){const b=cc.querySelector('.vsw-search-button');if(b){b.disabled=true;}cc.style.opacity=0;const och=function(){this.style.display='none';this.classList.remove('vsw-active-search-box');const sl=this.querySelectorAll('select');const ti=this.querySelector('.vsw-custom-search-input');sl.forEach(s=>s.value="");if(ti)ti.value="";this.removeEventListener('transitionend',och);};if(parseFloat(cc.style.opacity)>0){cc.addEventListener('transitionend',och,{once:true});}else{cc.style.display='none';cc.classList.remove('vsw-active-search-box');const sl=cc.querySelectorAll('select');const ti=cc.querySelector('.vsw-custom-search-input');sl.forEach(s=>s.value="");if(ti)ti.value="";}}}hcbVSW();
    ct.style.display='block';setTimeout(()=>{ct.classList.add('vsw-active-search-box');ct.style.opacity=1;const sb=ct.querySelector('.vsw-search-box');if(sb){citVSW(sb);}setTimeout(()=>{const wr=mwVSW.getBoundingClientRect();const tst=window.scrollY+wr.top;window.scrollTo({top:tst,behavior:'smooth'});},400);},10);
    asciVSW=cs;cvrVSW();hvsVSW();ippVSW=cipVSW();hmVSW();}
    function socVSW(){if(!mwVSW)return;document.addEventListener('click',e=>{if(!asciVSW)return;if(mwVSW.contains(e.target)){return;}ccaVSW();});}
    function hsVSW(){clearTimeout(stmVSW);stmVSW=setTimeout(()=>{if(asciVSW&&mwVSW){if(vdVSW&&vdVSW.style.display!=='none'){return;}const wr=mwVSW.getBoundingClientRect();const th=Math.min(wr.height*.3,window.innerHeight*.3);const ioo=(wr.bottom<th||wr.top>window.innerHeight-th);if(ioo){ccaVSW();}}},100);}
    async function fydVSW(st=''){const ak='AIzaSyBYVKCeEIlBjCoS6Xy_mWatJywG3hUPv3Q';if(!ak||ak==='YOUR_API_KEY_HERE'||ak.length<30||ak.startsWith('AIzaSyB')){console.error("VSW Error: API Key config missing/invalid.");smVSW(gtxVSW('vsw-msgApiKeyError'),8000);hvsVSW();cvrVSW();return;}
    const ah='youtube.googleapis.com';const mr=30;const sst=st||'educational videos in Hindi';let au=`https://${ah}/youtube/v3/search?part=snippet&type=video&maxResults=${mr}&key=${ak}`;au+=`&q=${encodeURIComponent(sst)}`;const hhc=/[\u0900-\u097F]/.test(sst);const hchw=/\b(हिंदी|कक्षा|परीक्षा|विज्ञान|गणित|इतिहास|भूगोल|समाचार|लाइव|कहानी|कविता)\b/i.test(sst);if(hhc||hchw||sst.toLowerCase().includes("hindi")){au+=`&relevanceLanguage=hi`;}
    smVSW(gtxVSW('vsw-msgSearchingVideos'),2500);hvsVSW();cvrVSW();
    try{const r=await fetch(au,{method:'GET',headers:{'Accept':'application/json'}});const d=await r.json();
    if(!r.ok){console.error('VSW API Error Response:',d);let eid='vsw-msgApiGenericErrorPrefix';let ed=`(${r.status})`;if(d.error?.message){if(d.error.errors?.[0]?.reason==='quotaExceeded'){eid='vsw-msgApiQuotaError';ed='';}else if(d.error.errors?.[0]?.reason==='keyInvalid'){eid='vsw-msgApiKeyInvalid';ed='';}else{ed=`:${d.error.message}`;}}else{ed=`(${r.status})`;}const ae=new Error(gtxVSW(eid)+ed);ae.statusCode=r.status;throw ae;}
    if(!d?.items||d.items.length===0){smVSW(gtxVSW('vsw-msgNoVideosFound'),4000);hvsVSW();cvrVSW();cviVSW=[];return;}
    cviVSW=d.items.filter(i=>i.id?.videoId&&i.snippet);if(cviVSW.length===0){smVSW(gtxVSW('vsw-msgNoVideosFound')+" (valid items not found)",4000);hvsVSW();cvrVSW();return;}
    dvVSW(cviVSW);svsVSW();hmVSW();}catch(e){console.error('VSW Fetch Error:',e);let de=gtxVSW('vsw-msgInternalError');if(e.message&&(e.message.startsWith(gtxVSW('vsw-msgApiGenericErrorPrefix'))||e.message.startsWith(gtxVSW('vsw-msgApiQuotaError'))||e.message.startsWith(gtxVSW('vsw-msgApiKeyInvalid'))||e.message.startsWith(gtxVSW('vsw-msgApiKeyError')))){de=e.message;}else if(e.message){de=`${gtxVSW('vsw-msgVideoLoadErrorPrefix')}: ${e.message.substring(0,100)}...`;}
    smVSW(de,6000);hvsVSW();cvrVSW();cviVSW=[];}}
    function dvVSW(v){if(!vsVSW||!vscVSW||!vdVSW||!yiVSW){console.error("VSW Video display elements not found.");return;}vsVSW.innerHTML='';vsiVSW=0;cviVSW=v;
    if(!cviVSW||cviVSW.length===0){if(vscVSW){vsVSW.innerHTML=`<p style="color:#ccc; padding: 20px; text-align: center; width: 100%;">${gtxVSW('vsw-msgNoVideosFound')}</p>`;vscVSW.style.display='block';}if(vsnVSW)vsnVSW.style.display='none';if(yiVSW)yiVSW.src='';if(vdVSW)vdVSW.style.display='none';return;}
    cviVSW.forEach((video,i)=>{if(!video.id?.videoId||!video.snippet){console.warn("VSW Skipping invalid video item:",video);return;}const vid=video.id.videoId;const vt=video.snippet.title||'Untitled Video';const tu=video.snippet.thumbnails?.medium?.url||video.snippet.thumbnails?.default?.url||'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const vi=document.createElement('div');vi.classList.add('vsw-video-item');vi.setAttribute('data-index',i);vi.setAttribute('data-videoid',vid);
    const th=document.createElement('img');th.src=tu;th.alt=vt;th.onerror=function(){this.onerror=null;this.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';console.warn(`VSW Thumbnail failed for ${vid}`);};
    const t=document.createElement('p');const te=document.createElement('textarea');te.innerHTML=vt;t.textContent=te.value;
    vi.appendChild(th);vi.appendChild(t);
    vi.addEventListener('click',()=>{devVSW(vid);if(vdVSW&&vdVSW.style.display!=='none'){const pr=vdVSW.getBoundingClientRect();if(pr.top<20){window.scrollTo({top:window.scrollY+pr.top-20,behavior:'smooth'});}}});
    vsVSW.appendChild(vi);});
    if(cviVSW.length>0&&cviVSW[0].id?.videoId){devVSW(cviVSW[0].id.videoId);}else{if(yiVSW)yiVSW.src='';if(vdVSW)vdVSW.style.display='none';}
    ippVSW=cipVSW();uvsVSW();if(vscVSW)vscVSW.style.display='block';if(vsnVSW){vsnVSW.style.display=cviVSW.length>ippVSW?'flex':'none';}}
    function devVSW(vid){if(!yiVSW||!vdVSW)return;if(!vid){yiVSW.src='';vdVSW.style.display='none';return;}yiVSW.src=`https://www.youtube.com/embed/${vid}?autoplay=0&rel=0&modestbranding=1&hl=hi`;vdVSW.style.display='block';yiVSW.onerror=()=>{console.error('VSW iFrame failed to load video ID:',vid);smVSW(gtxVSW('vsw-msgVideoLoadFailed'),3000);vdVSW.style.display='none';};yiVSW.onload=()=>{console.log(`VSW iFrame loaded ID: ${vid}`);if(yiVSW.src.includes(vid)){vdVSW.style.display='block';}};if(!yiVSW.src||yiVSW.src==='about:blank'){vdVSW.style.display='none';}}
    function cvrVSW(){if(vsVSW)vsVSW.innerHTML='';if(yiVSW){if(yiVSW.contentWindow){try{yiVSW.contentWindow.postMessage('{"event":"command","func":"stopVideo","args":""}','*');}catch(e){}}yiVSW.src='';}cviVSW=[];vsiVSW=0;}
    function cipVSW(){if(!vscVSW||vscVSW.offsetWidth<=0){const iw=150;const im=12;const itw=iw+im;const cwf=mwVSW?mwVSW.offsetWidth*.95-50:window.innerWidth*.95-50;const cal=Math.max(1,Math.floor(cwf/itw));return cal;}const cw=vscVSW.offsetWidth-20;const iw=150;const im=12;const itw=iw+im;if(cw<=0||itw<=0){return 1;}const ci=Math.max(1,Math.floor(cw/itw));return ci;}
    function svVSW(d){const nvi=cviVSW.length;ippVSW=cipVSW();if(nvi<=ippVSW)return;const mi=Math.max(0,nvi-ippVSW);let ni=vsiVSW+d;vsiVSW=Math.max(0,Math.min(mi,ni));uvsVSW();}
    function uvsVSW(){if(!vsVSW||cviVSW.length===0){if(vsVSW)vsVSW.style.transform='translateX(0px)';return;}const iw=150;const im=12;const sa=-vsiVSW*(iw+im);vsVSW.style.transform=`translateX(${sa}px)`;}
    function hrVSW(){clearTimeout(rtmVSW);rtmVSW=setTimeout(()=>{if(vscVSW&&vscVSW.style.display!=='none'){const oipp=ippVSW;ippVSW=cipVSW();if(oipp!==ippVSW){const mi=Math.max(0,cviVSW.length-ippVSW);vsiVSW=Math.min(vsiVSW,mi);uvsVSW();if(vsnVSW){vsnVSW.style.display=cviVSW.length>ippVSW?'flex':'none';}}}if(asciVSW){const ac=document.getElementById(asciVSW);if(ac){const sb=ac.querySelector('.vsw-search-box');if(sb){citVSW(sb);}}}},250);}
    // Expose performSearch function globally or via a namespace if needed for button onclick
    window.performVswSearch = function(searchBoxId){
         const sb=document.getElementById(searchBoxId);if(!sb){console.error("VSW Error: Search box not found:",searchBoxId);smVSW(gtxVSW('vsw-msgInternalError'),4000);return;}const sbtn=sb.querySelector('.vsw-search-button');if(sbtn&&sbtn.disabled){console.warn("VSW: performSearch called on disabled button.");smVSW(gtxVSW('vsw-msgMinInputRequired'),4000);return;}
        let fst='';let ic=0;let dst='';const sl=sb.querySelectorAll('select');const ti=sb.querySelector('.vsw-custom-search-input');
        sl.forEach(s=>{if(s.value?.trim()&&s.value!==""){dst+=s.value.trim()+' ';ic++;}});dst=dst.trim();const tv=ti?ti.value.trim():'';if(tv){ic++;}
        const mir=2;if(ic<mir){console.warn("VSW: performSearch called with insufficient inputs (fallback).");smVSW(gtxVSW('vsw-msgMinInputRequired'),4000);return;}
        if(tv){fst=(dst+' '+tv).trim();}else{fst=dst;}hmVSW();console.log(`VSW Performing search for: "${fst}"`);fydVSW(fst);
    }
     // Expose slideVideo function globally or via a namespace if needed for button onclick
     window.slideVswVideo = function(direction){
         svVSW(direction);
     }

    function psVSW(sbid){ // Renamed internal performSearch
         window.performVswSearch(sbid); // Call the globally exposed function
     }
     function svVSW_internal(d){ // Renamed internal slideVideo
          svVSW(d); // Call the globally exposed function
     }


    function svsVSW(){if(cviVSW&&cviVSW.length>0){if(vscVSW&&vscVSW.style.display==='none'){vscVSW.style.display='block';}if(yiVSW&&yiVSW.src&&yiVSW.src!=='about:blank'&&vdVSW&&vdVSW.style.display==='none'){vdVSW.style.display='block';}ippVSW=cipVSW();if(vsnVSW){vsnVSW.style.display=cviVSW.length>ippVSW?'flex':'none';}}else{hvsVSW();}}
    function hvsVSW(){if(vscVSW)vscVSW.style.display='none';if(vdVSW)vdVSW.style.display='none';if(vsnVSW)vsnVSW.style.display='none';}
    function smVSW(mtxt,d=3000){if(!mbVSW)return;clearTimeout(mtmVSW);const tts=mtxt||gtxVSW('vsw-msgInternalError');mbVSW.textContent=tts;mbVSW.style.display='block';if(d>0){mtmVSW=setTimeout(hmVSW,d);}else{mtmVSW=null;}} // Added else to clear timeout handle if duration is 0
    function hmVSW(){if(!mbVSW)return;clearTimeout(mtmVSW);mtmVSW=null;mbVSW.style.display='none';} // Added null assignment


})(); // Search and Learn (VSW) विजेट के लिए IIFE समाप्त

/*
अंत: यह संयोजित विजेट स्क्रिप्ट फ़ाइल का अंत है।
*/
