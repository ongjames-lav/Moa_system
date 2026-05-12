import"./styles-D6_VvzBq.js";const x="/api";let n=1;const A=20;let y="all",h="",D="",L=localStorage.getItem("moaViewMode")||"tile",I=[];const v=document.getElementById("moaList"),_=document.getElementById("emptyState"),N=document.getElementById("loadingSpinner"),U=document.getElementById("totalCount"),T=document.getElementById("searchInput"),k=document.getElementById("sortBy"),H=document.getElementById("collegeFilter"),R=document.getElementById("partnerTypeFilter"),f=document.getElementById("infoModal"),V=document.getElementById("infoCardContainer"),q=document.getElementById("infoDownloadBtn");document.addEventListener("DOMContentLoaded",()=>{j(),d()});function j(){k.addEventListener("change",()=>{n=1,d()}),T.addEventListener("input",K(()=>{n=1,d()},400)),H.addEventListener("change",e=>{h=e.target.value,n=1,d()}),R.addEventListener("change",e=>{D=e.target.value,n=1,d()}),document.querySelectorAll(".status-filter-btn").forEach(e=>{e.addEventListener("click",()=>{y=e.dataset.status,document.querySelectorAll(".status-filter-btn").forEach(t=>t.classList.remove("active")),e.classList.add("active"),n=1,d()})}),document.getElementById("tileViewBtn").addEventListener("click",()=>M("tile")),document.getElementById("listViewBtn").addEventListener("click",()=>M("list")),document.getElementById("prevPageBtn").addEventListener("click",()=>{n>1&&(n--,d())}),document.getElementById("nextPageBtn").addEventListener("click",()=>{n++,d()}),document.querySelectorAll(".modal-close").forEach(e=>{e.addEventListener("click",()=>{f.style.display="none"})}),window.addEventListener("click",e=>{e.target===f&&(f.style.display="none")})}async function d(){S(!0);try{const[e,a]=k.value.split("_"),l={uploadDate:"upload_date",companyName:"company_name",startDate:"start_date",endDate:"end_date"}[e]||"upload_date",s=T.value.trim();let o=`${x}/public/moas?page=${n}&limit=${A}&sortBy=${l}&sortOrder=${a}`;s&&(o+=`&search=${encodeURIComponent(s)}`),h&&(o+=`&college=${encodeURIComponent(h)}`),D&&(o+=`&partnerType=${encodeURIComponent(D)}`),y&&y!=="all"&&(o+=`&status=${y}`);const c=await(await fetch(o)).json();I=c.data||[];const r=c.pagination?c.pagination.total:0;P(I),J(r),U.textContent=r}catch(e){console.error("Load Error:",e),C("Failed to load MOAs","error")}finally{S(!1)}}function P(e){if(v.innerHTML="",v.className=`moa-list moa-${L}-view guest-card`,e.length===0){_.style.display="block",v.style.display="none";return}_.style.display="none",v.style.display=L==="list"?"flex":"grid",e.forEach(a=>{const t=z(a);v.appendChild(t)})}function z(e){const a=document.createElement("div");a.className="moa-card";const t=new Date;t.setHours(0,0,0,0);const l=new Date(e.start_date||e.startDate),s=new Date(e.end_date||e.endDate);s.setHours(23,59,59,999);const o=s-t,i=Math.ceil(o/(1e3*60*60*24)),c=t>=l&&t<=s,r=i>0&&i<=31,b=c?'<span class="status-badge status-active">Active</span>':'<span class="status-badge status-inactive">Expired</span>',E=r?'<span class="status-badge status-renewal">Due for Renewal</span>':"",m=e.college||"",B=m?`<span class="status-badge college-badge college-${m.toLowerCase()}">${m}</span>`:"",p=e.partner_type||e.partnerType||"",$=p?`<span class="status-badge partner-badge partner-${p.toLowerCase().replace(/ /g,"-")}">${p}</span>`:"";return a.innerHTML=`
        <div class="moa-card-header">
            <div class="moa-header-content">
                <h3 class="moa-company-name">${w(e.company_name||e.companyName)}</h3>
                <div class="badges-wrapper">
                    <div class="category-badges">${B}${$}</div>
                    <div class="status-badges">${E}${b}</div>
                </div>
            </div>
        </div>
        <div class="moa-card-body">
            <div class="moa-dates">
                <div class="date-item"><span class="date-label">Start:</span><span class="date-value">${u(e.start_date)}</span></div>
                <div class="date-item"><span class="date-label">End:</span><span class="date-value">${u(e.end_date)}</span></div>
            </div>
            <p class="moa-notes">${w(e.notes||"No notes")}</p>
        </div>
        <div class="moa-card-footer">
            <div class="moa-meta">
                <span class="meta-item"><i class="fas fa-file-pdf"></i> PDF Available</span>
                <span class="meta-item"><i class="fas fa-calendar-alt"></i> ${u(e.upload_date)}</span>
            </div>
            <div class="moa-actions">
                <button class="btn-icon btn-download" title="Download"><i class="fas fa-download"></i></button>
            </div>
        </div>
    `,a.querySelector(".btn-download").addEventListener("click",g=>{g.stopPropagation(),F(e.id)}),a.addEventListener("click",()=>G(e)),a}function G(e){const a=u(e.start_date),t=u(e.end_date),l=u(e.upload_date),s=new Date;s.setHours(0,0,0,0);const o=new Date(e.start_date),i=new Date(e.end_date);i.setHours(23,59,59,999);const c=i-s,r=Math.ceil(c/(1e3*60*60*24)),b=s>=o&&s<=i,E=r>0&&r<=31,m=b?'<span class="status-badge status-active">Active</span>':'<span class="status-badge status-inactive">Expired</span>',B=E?'<span class="status-badge status-renewal">Due for Renewal</span>':"",p=e.college||"",$=p?`<span class="status-badge college-badge college-${p.toLowerCase()}">${p}</span>`:"",g=e.partner_type||"",O=g?`<span class="status-badge partner-badge partner-${g.toLowerCase().replace(/ /g,"-")}">${g}</span>`:"";V.innerHTML=`
        <div class="moa-card">
            <div class="moa-card-header">
                <div class="moa-header-content">
                    <h3 class="moa-company-name">${w(e.company_name)}</h3>
                    <div class="badges-wrapper">
                        <div class="category-badges">${$}${O}</div>
                        <div class="status-badges">${B}${m}</div>
                    </div>
                </div>
            </div>
            <div class="moa-card-body">
                <div class="moa-dates">
                    <div class="date-item"><span class="date-label">Start Date:</span><span class="date-value">${a}</span></div>
                    <div class="date-item"><span class="date-label">End Date:</span><span class="date-value">${t}</span></div>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; margin-bottom: 0.5rem;">NOTES:</p>
                    <p style="color: var(--text-primary); line-height: 1.5; margin: 0;">${w(e.notes||"No notes added")}</p>
                </div>
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
                    <div style="font-size: 0.8rem; color: var(--text-secondary); display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div><p style="font-weight: 600; margin-bottom: 0.25rem;">FILE STATUS:</p><p style="color: var(--text-primary);">Available for Download</p></div>
                        <div><p style="font-weight: 600; margin-bottom: 0.25rem;">UPLOADED:</p><p style="color: var(--text-primary);">${l}</p></div>
                    </div>
                </div>
            </div>
        </div>
    `,q.onclick=()=>F(e.id),f.style.display="flex"}async function F(e){try{const t=await(await fetch(`${x}/public/moas/${e}/download`)).json();t.url?window.open(t.url,"_blank"):C("Failed to get download link","error")}catch{C("Download failed","error")}}function J(e){const a=Math.ceil(e/A),t=document.getElementById("paginationControls");a>1?(t.style.display="flex",document.getElementById("pageInfo").textContent=`Page ${n} of ${a}`,document.getElementById("prevPageBtn").disabled=n===1,document.getElementById("nextPageBtn").disabled=n===a):t.style.display="none"}function M(e){L=e,localStorage.setItem("moaViewMode",e),document.getElementById("tileViewBtn").classList.toggle("active",e==="tile"),document.getElementById("listViewBtn").classList.toggle("active",e==="list"),P(I)}function S(e){N.style.display=e?"block":"none"}function C(e,a="info"){const t=document.createElement("div");t.className=`notification notification-${a}`,t.textContent=e,document.body.appendChild(t),setTimeout(()=>t.classList.add("show"),10),setTimeout(()=>{t.classList.remove("show"),setTimeout(()=>t.remove(),300)},4e3)}function u(e){return e?new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"}):"N/A"}function w(e){if(!e)return"";const a={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return e.replace(/[&<>"']/g,t=>a[t])}function K(e,a){let t;return function(...l){clearTimeout(t),t=setTimeout(()=>e(...l),a)}}
