(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))a(s);new MutationObserver(s=>{for(const i of s)if(i.type==="childList")for(const o of i.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&a(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const i={};return s.integrity&&(i.integrity=s.integrity),s.referrerPolicy&&(i.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?i.credentials="include":s.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function a(s){if(s.ep)return;s.ep=!0;const i=t(s);fetch(s.href,i)}})();console.log("=== RENDERER SCRIPT LOADING ===");console.log("window object available:",!!window);console.log("window.moaAPI available at load:",!!window.moaAPI);let l;window.moaAPI?(l=window.moaAPI,console.log("✅ moaAPI found on window immediately")):(console.warn("⚠️  moaAPI not found at script load - waiting for injection..."),window.addEventListener("moaAPIReady",()=>{l=window.moaAPI,console.log("✅ moaAPI injected and ready")}));let c=0;const L=20;let p=new Set,q=null,we="uploadDate",Be="DESC",D="all",I="",O="",R="tile";const Q=document.getElementById("uploadBtn"),X=document.getElementById("selectAllBtn"),ee=document.getElementById("deleteSelectedBtn"),De=document.getElementById("searchInput"),te=document.getElementById("sortBy"),v=document.getElementById("moaList"),P=document.getElementById("emptyState"),Ae=document.getElementById("loadingSpinner"),ne=document.getElementById("totalCount"),Me=document.getElementById("totalCountLabel"),ae=document.getElementById("detailModal"),Le=document.querySelector("#detailModal .modal-close"),Ie=document.getElementById("closeModalBtn"),Oe=document.getElementById("saveMetadataBtn"),oe=document.getElementById("metadataCompanyName"),U=document.getElementById("metadataStartDate"),V=document.getElementById("metadataEndDate"),se=document.getElementById("metadataNotes"),F=document.getElementById("metadataCollege"),N=document.getElementById("metadataPartnerType"),Se=document.getElementById("metadataPDFName"),Pe=document.getElementById("metadataFileSize"),Ce=document.getElementById("metadataDate"),x=document.getElementById("paginationControls"),le=document.getElementById("prevPageBtn"),de=document.getElementById("nextPageBtn"),$e=document.getElementById("pageInfo"),W=document.getElementById("emptyStateTitle"),Y=document.getElementById("emptyStateMessage"),ie=document.getElementById("allStatusBtn"),ce=document.getElementById("activeStatusBtn"),re=document.getElementById("dueForRenewalBtn"),ue=document.getElementById("expiredStatusBtn"),H=document.getElementById("infoModal"),ke=document.querySelector(".info-modal-close"),S=document.getElementById("infoCardContainer"),C=document.getElementById("tileViewBtn"),$=document.getElementById("listViewBtn"),pe=document.getElementById("collegeFilter"),ge=document.getElementById("partnerTypeFilter"),me=document.getElementById("settingsToggleBtn"),ye=document.getElementById("settingsPanel"),xe=document.querySelector(".container");document.addEventListener("DOMContentLoaded",()=>{if(console.log("=== DOMContentLoaded FIRED ==="),console.log("moaAPI available:",!!l),console.log("window.moaAPI available:",!!window.moaAPI),!l&&window.moaAPI&&(l=window.moaAPI,console.log("✅ Using moaAPI from window")),!l){console.error("❌ FATAL: moaAPI is still not available!"),r("Fatal Error: API bridge not available. Please restart the app.","error");return}console.log("moaAPI.getMOAList available:",!!(l!=null&&l.getMOAList)),Q.addEventListener("click",Te),X.addEventListener("click",Ve),ee.addEventListener("click",Ge),De.addEventListener("input",He),te.addEventListener("change",ze),Le.addEventListener("click",G),Ie.addEventListener("click",G),ke.addEventListener("click",k),H.addEventListener("click",t=>{t.target===H&&k()}),Oe.addEventListener("click",Je),le.addEventListener("click",()=>qe()),de.addEventListener("click",()=>Re()),ie.addEventListener("click",()=>T("all")),ce.addEventListener("click",()=>T("active")),re.addEventListener("click",()=>T("dueForRenewal")),ue.addEventListener("click",()=>T("expired")),C.addEventListener("click",()=>Z("tile")),$.addEventListener("click",()=>Z("list")),pe.addEventListener("change",je),ge.addEventListener("change",Ue),me.addEventListener("click",()=>_()),document.querySelector(".main-content").addEventListener("click",()=>{ye.classList.contains("open")&&_()}),l.onMOAsUpdated(()=>{c=0,p.clear(),u()}),l.onMOADeleted(({id:t})=>{p.delete(t),u()}),l.onOpenMOADetails(({id:t})=>{z(t)});const n=localStorage.getItem("moaViewMode");n&&(n==="tile"||n==="list")&&(R=n,R==="tile"?(C.classList.add("active"),$.classList.remove("active")):($.classList.add("active"),C.classList.remove("active"))),console.log("About to call loadMOAs from DOMContentLoaded"),u(),console.log("loadMOAs called from DOMContentLoaded")});async function Te(){try{const e=await l.uploadMOA();e&&(r("MOA uploaded successfully!","success"),c=0,await u(),e.id&&setTimeout(()=>z(e.id),500))}catch(e){console.error("Upload error:",e),r("Error uploading MOA","error")}}async function u(){var e;try{console.log("=== LOAD MOAs CALLED ==="),console.log("moaAPI available:",!!l),console.log("moaAPI.getMOAList available:",!!(l!=null&&l.getMOAList)),f(!0);const[n,t]=te.value.split("_");we=n,Be=t,console.log("Calling getMOAList with:",{itemsPerPage:L,offset:c*L,sortBy:n,sortOrder:t}),console.log("Making API call...");const a=await l.getMOAList(L,c*L,n,t);if(console.log("✅ Received response from API"),console.log("Received from API:",a),console.log("MOAs count:",(e=a==null?void 0:a.moas)==null?void 0:e.length),console.log("Total:",a==null?void 0:a.total),!a||!a.moas)throw new Error("Invalid response from MOA API: "+JSON.stringify(a));const{moas:s,total:i}=a;let o=s;D!=="all"&&(o=s.filter(d=>{const m=new Date;m.setHours(0,0,0,0);const y=new Date(d.startDate);y.setHours(0,0,0,0);const g=new Date(d.endDate);g.setHours(23,59,59,999);const A=g-m,w=Math.ceil(A/(1e3*60*60*24)),B=m>=y&&m<=g;return D==="active"?B:D==="expired"?!B:D==="dueForRenewal"?w>0&&w<=31:!0})),I&&(I==="none"?o=o.filter(d=>!d.college||d.college.trim()===""):o=o.filter(d=>d.college===I)),O&&(O==="none"?o=o.filter(d=>!d.partnerType||d.partnerType.trim()===""):o=o.filter(d=>d.partnerType===O)),ne.textContent=o.length;const h=D!=="all"||I!==""||O!=="";if(Me.textContent=h?"MOA Count:":"Total MOAs:",o.length===0&&c===0){P.style.display="block",v.style.display="none",x.style.display="none",s.length===0?(W.textContent="No MOAs Yet",Y.textContent="Start by uploading your first MOA document using the upload button."):(W.textContent="No results found",Y.textContent="We couldn't find any documents matching your current filters. Try adjusting your search or clearing the filters."),f(!1);return}P.style.display="none",v.style.display="grid",fe(o,o.length),Ne(o.length),f(!1),J()}catch(n){console.error("Error loading MOAs:",n),console.error("Error message:",n==null?void 0:n.message),console.error("Error stack:",n==null?void 0:n.stack),r(`Error loading MOAs: ${(n==null?void 0:n.message)||"Unknown error"}`,"error"),f(!1)}}function fe(e,n){v.innerHTML="",v.className=`moa-list moa-${R}-view`,e.forEach(t=>{const a=document.createElement("div");a.className=`moa-card ${p.has(t.id)?"selected":""}`;const s=E(t.startDate),i=E(t.endDate),o=new Date;o.setHours(0,0,0,0);const h=new Date(t.startDate);h.setHours(0,0,0,0);const d=new Date(t.endDate);d.setHours(23,59,59,999);const m=d-o,y=Math.ceil(m/(1e3*60*60*24)),g=o>=h&&o<=d,A=y>0&&y<=31,w=g?'<span class="status-badge status-active">Active</span>':'<span class="status-badge status-inactive">Expired</span>',B=A?'<span class="status-badge status-renewal">Due for Renewal</span>':"",j=t.college?`<span class="status-badge college-badge college-${t.college.toLowerCase()}">${t.college}</span>`:"",K=t.partnerType?`<span class="status-badge partner-badge partner-${t.partnerType.toLowerCase().replace(" ","-")}">${t.partnerType}</span>`:"";a.innerHTML=`
      <div class="moa-card-header">
        <input 
          type="checkbox" 
          class="moa-checkbox" 
          data-id="${t.id}"
          ${p.has(t.id)?"checked":""}
        />
        <div class="moa-header-content">
          <h3 class="moa-company-name">${b(t.companyName)}</h3>
          <div class="badges-wrapper">
            <div class="category-badges">
              ${j}
              ${K}
            </div>
            <div class="status-badges">
              ${B}
              ${w}
            </div>
          </div>
        </div>
      </div>
      <div class="moa-card-body">
        <div class="moa-dates">
          <div class="date-item">
            <span class="date-label">Start:</span>
            <span class="date-value">${s}</span>
          </div>
          <div class="date-item">
            <span class="date-label">End:</span>
            <span class="date-value">${i}</span>
          </div>
        </div>
        <p class="moa-notes">${b(t.notes||"No notes")}</p>
      </div>
      <div class="moa-card-footer">
        <div class="moa-meta">
          <span class="meta-item">📄 ${b(t.pdfOriginalName)}</span>
          <span class="meta-item">📦 ${t.pdfFileSize}</span>
          <span class="meta-item">📅 ${E(t.uploadDate)}</span>
        </div>
        <div class="moa-actions">
          <button class="btn-icon btn-view" data-id="${t.id}" title="View and Edit Details">📝</button>
          <button class="btn-icon btn-open" data-id="${t.id}" title="Open PDF">🖨️</button>
          <button class="btn-icon btn-delete" data-id="${t.id}" title="Delete">🗑️</button>
        </div>
      </div>
    `,a.querySelector(".moa-checkbox").addEventListener("change",M=>{M.target.checked?p.add(t.id):p.delete(t.id),Fe(t.id,M.target.checked),J()}),a.querySelector(".btn-view").addEventListener("click",()=>z(t.id)),a.querySelector(".btn-open").addEventListener("click",()=>Ee(t.id)),a.querySelector(".btn-delete").addEventListener("click",()=>ve(t.id)),a.addEventListener("click",M=>{!M.target.closest(".btn-icon")&&!M.target.closest(".moa-checkbox")&&Ke(t)}),v.appendChild(a)})}function Fe(e,n){const t=document.querySelector(`.moa-card:has([data-id="${e}"])`);t&&(n?t.classList.add("selected"):t.classList.remove("selected"))}function J(){const e=p.size>0;X.style.display=e?"block":"none",ee.style.display=e?"block":"none",Q.style.display=e?"none":"block"}function Ne(e){const n=Math.ceil(e/L);n>1?(x.style.display="flex",$e.textContent=`Page ${c+1} of ${n}`,le.disabled=c===0,de.disabled=c>=n-1):x.style.display="none"}function qe(){c>0&&(c--,u(),window.scrollTo(0,0))}function Re(){c++,u(),window.scrollTo(0,0)}async function He(e){const n=e.target.value.trim();if(!n){c=0,u();return}try{f(!0);const t=await l.searchMOAs(n);ne.textContent=t.length,t.length===0?(P.innerHTML=`
        <div class="empty-icon">🔍</div>
        <h2>No Results</h2>
        <p>No MOAs match your search query.</p>
      `,P.style.display="block",v.style.display="none",x.style.display="none"):(P.style.display="none",v.style.display="grid",fe(t,t.length),x.style.display="none"),f(!1)}catch(t){console.error("Search error:",t),r("Error searching MOAs","error"),f(!1)}}function ze(){c=0,u()}function Z(e){R=e,c=0,localStorage.setItem("moaViewMode",e),e==="tile"?(C.classList.add("active"),$.classList.remove("active")):($.classList.add("active"),C.classList.remove("active")),u()}function T(e){D=e,c=0,[ie,ce,re,ue].forEach(t=>{t.getAttribute("data-status")===e?t.classList.add("active"):t.classList.remove("active")}),u()}function je(){I=pe.value,c=0,u()}function Ue(){O=ge.value,c=0,u()}function Ve(){const e=document.querySelectorAll(".moa-checkbox"),n=p.size===e.length;e.forEach(t=>{const a=parseInt(t.getAttribute("data-id"));t.checked=!n,n?p.delete(a):p.add(a)}),document.querySelectorAll(".moa-card").forEach(t=>{t.classList.toggle("selected")}),J()}async function Ge(){if(p.size!==0&&confirm(`Delete ${p.size} MOA(s)?`))try{const e=Array.from(p);await l.deleteMOAs(e),p.clear(),r(`${e.length} MOA(s) deleted successfully!`,"success"),u()}catch(e){console.error("Delete error:",e),r("Error deleting MOAs","error")}}async function ve(e){if(confirm("Delete this MOA?"))try{await l.deleteMOA(e),r("MOA deleted successfully!","success"),u()}catch(n){console.error("Delete error:",n),r("Error deleting MOA","error")}}async function Ee(e){try{await l.openMOA(e)?r("Opening PDF","info"):r("Could not open PDF","error")}catch(n){console.error("Error opening PDF:",n),r("Error opening PDF","error")}}async function z(e){try{q=e;const n=await l.getMOAMetadata(e);if(!n){r("Could not load MOA details","error");return}document.getElementById("modalTitle").textContent=`Edit: ${n.companyName}`,oe.value=n.companyName,U.value=n.startDate,V.value=n.endDate,se.value=n.notes,F.value=n.college||"",N.value=n.partnerType||"",Se.textContent=b(n.pdfOriginalName),Pe.textContent=n.pdfFileSize,Ce.textContent=E(n.uploadDate),ae.style.display="flex",document.body.classList.add("no-scroll")}catch(n){console.error("Error opening details:",n),r("Error loading MOA details","error")}}async function Je(){if(q){if(new Date(U.value)>new Date(V.value)){r("Start date must be before end date","error");return}try{const e={companyName:oe.value,startDate:U.value,endDate:V.value,notes:se.value};F.value&&F.value.trim()?e.college=F.value.trim():e.college=null,N.value&&N.value.trim()?e.partnerType=N.value.trim():e.partnerType=null,await l.updateMOAMetadata(q,e),r("MOA details saved successfully!","success"),G(),u()}catch(e){console.error("Error saving metadata:",e),r("Error saving MOA metadata","error")}}}function Ke(e){const n=E(e.startDate),t=E(e.endDate),a=E(e.uploadDate),s=new Date;s.setHours(0,0,0,0);const i=new Date(e.startDate);i.setHours(0,0,0,0);const o=new Date(e.endDate);o.setHours(23,59,59,999);const h=o-s,d=Math.ceil(h/(1e3*60*60*24)),m=s>=i&&s<=o,y=d>0&&d<=31;let g=e.companyName;g.length>200&&(g=g.substring(0,200)+"...");const A=m?'<span class="status-badge status-active">Active</span>':'<span class="status-badge status-inactive">Expired</span>',w=y?'<span class="status-badge status-renewal">Due for Renewal</span>':"",B=e.college?`<span class="status-badge college-badge college-${e.college.toLowerCase()}">${e.college}</span>`:"",j=e.partnerType?`<span class="status-badge partner-badge partner-${e.partnerType.toLowerCase().replace(" ","-")}">${e.partnerType}</span>`:"";S.innerHTML=`
    <div class="moa-card">
      <div class="moa-card-header">
        <div class="moa-header-content">
          <h3 class="moa-company-name">${b(g)}</h3>
          <div class="badges-wrapper">
            <div class="category-badges">
              ${B}
              ${j}
            </div>
            <div class="status-badges">
              ${w}
              ${A}
            </div>
          </div>
        </div>
      </div>
      <div class="moa-card-body">
        <div class="moa-dates">
          <div class="date-item">
            <span class="date-label">Start Date:</span>
            <span class="date-value">${n}</span>
          </div>
          <div class="date-item">
            <span class="date-label">End Date:</span>
            <span class="date-value">${t}</span>
          </div>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
          <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem;">NOTES:</p>
          <p style="color: var(--text-primary); line-height: 1.5; margin: 0;">${b(e.notes||"No notes added")}</p>
        </div>
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
          <div style="font-size: 0.8rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div>
              <p style="font-weight: 600; margin-bottom: 0.25rem;">PDF FILE:</p>
              <p style="color: var(--text-primary); word-break: break-word;">${b(e.pdfOriginalName)}</p>
            </div>
            <div>
              <p style="font-weight: 600; margin-bottom: 0.25rem;">FILE SIZE:</p>
              <p style="color: var(--text-primary);">${e.pdfFileSize}</p>
            </div>
          </div>
          <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-color);">
            <p style="font-weight: 600; margin-bottom: 0.25rem;">UPLOADED:</p>
            <p style="color: var(--text-primary);">${a}</p>
          </div>
        </div>
      </div>
      <div class="moa-card-footer">
        <div class="moa-actions">
          <button class="btn-icon btn-edit-info" data-id="${e.id}" title="Edit Details">✏️ Edit</button>
          <button class="btn-icon btn-open-info" data-id="${e.id}" title="Open PDF">🖨️ Open PDF</button>
          <button class="btn-icon btn-delete-info" data-id="${e.id}" title="Delete">🗑️ Delete</button>
        </div>
      </div>
    </div>
  `,S.querySelector(".btn-edit-info").addEventListener("click",()=>{k(),z(e.id)}),S.querySelector(".btn-open-info").addEventListener("click",()=>{k(),Ee(e.id)}),S.querySelector(".btn-delete-info").addEventListener("click",()=>{k(),ve(e.id)}),H.style.display="flex"}function k(){H.style.display="none",S.innerHTML=""}function G(){ae.style.display="none",q=null}function f(e){Ae.style.display=e?"block":"none"}function r(e,n="info"){const t=document.createElement("div");t.className=`notification notification-${n}`,t.textContent=e,document.body.appendChild(t),setTimeout(()=>{t.classList.add("show")},10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},3e3)}function E(e){return e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"N/A"}function b(e){if(!e)return"";const n={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return e.replace(/[&<>"']/g,t=>n[t])}function _(){ye.classList.toggle("open"),me.classList.toggle("open"),xe.classList.toggle("settings-open")}console.log("👋 MOA Management System loaded!");
