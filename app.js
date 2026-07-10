const STORAGE_KEY="assetTrackerPro.assets.v3";

const starterAssets=[
  {id:crypto.randomUUID(),assetNumber:"43MTX5033HD",model:"HR54-700",rid:"0349583945",serial:"A1B2C3D4",accessCard:"001234567890",accountNumber:"10024587",accountName:"Tanmar Rentals - Midland",rentState:"On Rent",status:"Active",location:"Midland Yard",labelsPrinted:true,notes:""},
  {id:crypto.randomUUID(),assetNumber:"43MTX1168HD",model:"H25-500",rid:"0391172840",serial:"MTX11680",accessCard:"001234567893",accountNumber:"10024587",accountName:"Tanmar Rentals - Midland",rentState:"Off Rent",status:"Warehouse",location:"Midland Warehouse",labelsPrinted:false,notes:""},
  {id:crypto.randomUUID(),assetNumber:"43HOB2147HD",model:"H24-700",rid:"0384412098",serial:"HOB77211",accessCard:"001234567891",accountNumber:"10039812",accountName:"Tanmar Rentals - Hobbs",rentState:"On Rent",status:"Pending",location:"Hobbs Office",labelsPrinted:false,notes:"Activation requested"},
  {id:crypto.randomUUID(),assetNumber:"43CAR8812HD",model:"HR24-500",rid:"0357718204",serial:"CAR88291",accessCard:"001234567892",accountNumber:"10077421",accountName:"Carlsbad Operations",rentState:"Off Rent",status:"Missing",location:"Unknown",labelsPrinted:true,notes:"Location under review"}
];

let assets=loadAssets();
const navItems=document.querySelectorAll(".nav-item");
const dashboardView=document.getElementById("dashboardView");
const assetsView=document.getElementById("assetsView");
const placeholderView=document.getElementById("placeholderView");
const placeholderTitle=document.getElementById("placeholderTitle");
const pageTitle=document.getElementById("pageTitle");
const sidebar=document.getElementById("sidebar");
const menuButton=document.getElementById("menuButton");
const sidebarOverlay=document.getElementById("sidebarOverlay");
const assetSearch=document.getElementById("assetSearch");
const rentFilter=document.getElementById("rentFilter");
const accountGroups=document.getElementById("accountGroups");
const dashboardAssetRows=document.getElementById("dashboardAssetRows");
const assetEmptyState=document.getElementById("assetEmptyState");
const modalBackdrop=document.getElementById("assetModalBackdrop");
const assetForm=document.getElementById("assetForm");
const importFileInput=document.getElementById("importFileInput");
const toast=document.getElementById("toast");

const viewTitles={dashboard:"Dashboard",assets:"Assets",accounts:"Accounts",activations:"Activations",labels:"Labels",reports:"Reports",settings:"Settings"};

function migrateAsset(asset){
  return {
    ...asset,
    accountNumber:asset.accountNumber || "",
    accountName:asset.accountName || asset.account || "Unassigned",
    rentState:asset.rentState || (asset.status==="Warehouse" ? "Off Rent" : "On Rent")
  };
}

function loadAssets(){
  const current=localStorage.getItem(STORAGE_KEY);
  if(current){
    try{return JSON.parse(current).map(migrateAsset)}catch{}
  }
  const old=localStorage.getItem("assetTrackerPro.assets.v2");
  if(old){
    try{
      const migrated=JSON.parse(old).map(migrateAsset);
      localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
      return migrated;
    }catch{}
  }
  localStorage.setItem(STORAGE_KEY,JSON.stringify(starterAssets));
  return [...starterAssets];
}

function saveAssets(){localStorage.setItem(STORAGE_KEY,JSON.stringify(assets))}
function closeMobileSidebar(){sidebar.classList.remove("open");sidebarOverlay.classList.remove("show")}

function showView(viewName){
  pageTitle.textContent=viewTitles[viewName]||"Dashboard";
  dashboardView.classList.toggle("active",viewName==="dashboard");
  assetsView.classList.toggle("active",viewName==="assets");
  const placeholder=!["dashboard","assets"].includes(viewName);
  placeholderView.classList.toggle("active",placeholder);
  if(placeholder)placeholderTitle.textContent=viewTitles[viewName];
  navItems.forEach(item=>item.classList.toggle("active",item.dataset.view===viewName));
  closeMobileSidebar();
  if(viewName==="assets")renderAssets();
}

function statusClass(status){return `status status-${status.toLowerCase().replace(/\s+/g,"-")}`}
function rentClass(rentState){return rentState==="On Rent"?"rent-badge rent-on":"rent-badge rent-off"}

function renderDashboard(){
  document.getElementById("totalAssetsStat").textContent=assets.length.toLocaleString();
  document.getElementById("onRentStat").textContent=assets.filter(a=>a.rentState==="On Rent").length.toLocaleString();
  document.getElementById("warehouseStat").textContent=assets.filter(a=>a.status==="Warehouse").length.toLocaleString();
  document.getElementById("attentionStat").textContent=assets.filter(a=>["Missing","Deactivated","Pending"].includes(a.status)).length.toLocaleString();

  dashboardAssetRows.innerHTML=assets.slice(0,4).map(asset=>`
    <tr>
      <td><strong>${escapeHtml(asset.assetNumber)}</strong><span>${escapeHtml(asset.model||"—")}</span></td>
      <td>${escapeHtml(asset.accountNumber||"Unassigned")}<span>${escapeHtml(asset.accountName||"")}</span></td>
      <td><span class="${rentClass(asset.rentState)}">${escapeHtml(asset.rentState)}</span></td>
      <td>${escapeHtml(asset.location||"—")}</td>
      <td>Recently</td>
    </tr>`).join("");
}

function getFilteredAssets(){
  const query=assetSearch.value.trim().toLowerCase();
  const rental=rentFilter.value;
  return assets.filter(asset=>{
    const matchesRental=rental==="all"||asset.rentState===rental;
    const haystack=[asset.assetNumber,asset.model,asset.rid,asset.serial,asset.accessCard,asset.accountNumber,asset.accountName,asset.location].join(" ").toLowerCase();
    return matchesRental&&haystack.includes(query);
  });
}

function groupAssets(items){
  const groups=new Map();
  for(const asset of items){
    const key=asset.accountNumber?.trim() || "__unassigned__";
    if(!groups.has(key)){
      groups.set(key,{
        accountNumber:key==="__unassigned__"?"Unassigned":asset.accountNumber,
        accountName:key==="__unassigned__"?"Assets without an account":asset.accountName || "",
        assets:[]
      });
    }
    groups.get(key).assets.push(asset);
  }
  return [...groups.values()].sort((a,b)=>{
    if(a.accountNumber==="Unassigned")return 1;
    if(b.accountNumber==="Unassigned")return -1;
    return a.accountNumber.localeCompare(b.accountNumber);
  });
}

function renderAssets(){
  const filtered=getFilteredAssets();
  const groups=groupAssets(filtered);

  document.getElementById("showingCount").textContent=filtered.length;
  document.getElementById("onRentCount").textContent=assets.filter(a=>a.rentState==="On Rent").length;
  document.getElementById("offRentCount").textContent=assets.filter(a=>a.rentState==="Off Rent").length;
  document.getElementById("accountCount").textContent=new Set(assets.map(a=>a.accountNumber||"Unassigned")).size;

  accountGroups.innerHTML=groups.map((group,index)=>{
    const onRent=group.assets.filter(a=>a.rentState==="On Rent").length;
    const offRent=group.assets.filter(a=>a.rentState==="Off Rent").length;
    return `
      <section class="account-group" data-group="${escapeHtml(group.accountNumber)}">
        <button class="account-group-header" type="button">
          <span class="account-heading">
            <strong>Account ${escapeHtml(group.accountNumber)}</strong>
            <span>${escapeHtml(group.accountName)}</span>
          </span>
          <span class="account-metrics">
            <span class="account-metric">${group.assets.length} Assets</span>
            <span class="account-metric">${onRent} On Rent</span>
            <span class="account-metric">${offRent} Off Rent</span>
          </span>
          <span class="account-toggle">⌄</span>
        </button>
        <div class="account-group-body">
          <div class="table-wrap">
            <table class="asset-table">
              <thead>
                <tr>
                  <th>Asset Number</th><th>Model</th><th>RID</th><th>Rental State</th><th>Status</th><th>Location</th><th>Labels</th><th></th>
                </tr>
              </thead>
              <tbody>
                ${group.assets.map(asset=>`
                  <tr>
                    <td><strong>${escapeHtml(asset.assetNumber)}</strong><span>Primary ID</span></td>
                    <td>${escapeHtml(asset.model||"—")}</td>
                    <td>${escapeHtml(asset.rid||"—")}</td>
                    <td><span class="${rentClass(asset.rentState)}">${escapeHtml(asset.rentState)}</span></td>
                    <td><span class="${statusClass(asset.status)}">${escapeHtml(asset.status)}</span></td>
                    <td>${escapeHtml(asset.location||"—")}</td>
                    <td><span class="label-state ${asset.labelsPrinted?"":"not-printed"}">${asset.labelsPrinted?"Printed":"Not printed"}</span></td>
                    <td><div class="row-actions">
                      <button class="small-button" data-action="labels" data-id="${asset.id}">Labels</button>
                      <button class="small-button" data-action="edit" data-id="${asset.id}">Edit</button>
                    </div></td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </section>`;
  }).join("");

  assetEmptyState.hidden=filtered.length!==0;
  renderDashboard();
}

function openAssetModal(asset=null){
  assetForm.reset();
  document.getElementById("editingAssetId").value=asset?.id||"";
  document.getElementById("assetModalTitle").textContent=asset?"Edit Asset":"Add Asset";
  document.getElementById("assetNumberInput").value=asset?.assetNumber||"";
  document.getElementById("modelInput").value=asset?.model||"";
  document.getElementById("ridInput").value=asset?.rid||"";
  document.getElementById("serialInput").value=asset?.serial||"";
  document.getElementById("accessCardInput").value=asset?.accessCard||"";
  document.getElementById("accountNumberInput").value=asset?.accountNumber||"";
  document.getElementById("accountNameInput").value=asset?.accountName||"";
  document.getElementById("rentStateInput").value=asset?.rentState||"On Rent";
  document.getElementById("assetStatusInput").value=asset?.status||"Active";
  document.getElementById("locationInput").value=asset?.location||"";
  document.getElementById("notesInput").value=asset?.notes||"";
  modalBackdrop.hidden=false;
  setTimeout(()=>document.getElementById("assetNumberInput").focus(),0);
}

function closeAssetModal(){modalBackdrop.hidden=true}

function saveAssetFromForm(event){
  event.preventDefault();
  const id=document.getElementById("editingAssetId").value;
  const assetNumber=document.getElementById("assetNumberInput").value.trim().toUpperCase();
  if(!assetNumber)return;

  const duplicate=assets.find(a=>a.assetNumber.toUpperCase()===assetNumber&&a.id!==id);
  if(duplicate){showToast("That Asset Number already exists.");return}

  const record={
    id:id||crypto.randomUUID(),
    assetNumber,
    model:document.getElementById("modelInput").value.trim(),
    rid:document.getElementById("ridInput").value.trim(),
    serial:document.getElementById("serialInput").value.trim(),
    accessCard:document.getElementById("accessCardInput").value.trim(),
    accountNumber:document.getElementById("accountNumberInput").value.trim(),
    accountName:document.getElementById("accountNameInput").value.trim()||"Unassigned",
    rentState:document.getElementById("rentStateInput").value,
    status:document.getElementById("assetStatusInput").value,
    location:document.getElementById("locationInput").value.trim(),
    notes:document.getElementById("notesInput").value.trim(),
    labelsPrinted:id?(assets.find(a=>a.id===id)?.labelsPrinted??false):false
  };

  if(id){assets=assets.map(a=>a.id===id?record:a);showToast("Asset updated.")}
  else{assets.unshift(record);showToast("Asset added.")}

  saveAssets();closeAssetModal();renderAssets();showView("assets");
}

function showToast(message){
  toast.textContent=message;toast.hidden=false;
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>toast.hidden=true,2600);
}

function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
}

navItems.forEach(item=>item.addEventListener("click",()=>showView(item.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.openView)));
menuButton.addEventListener("click",()=>{sidebar.classList.toggle("open");sidebarOverlay.classList.toggle("show")});
sidebarOverlay.addEventListener("click",closeMobileSidebar);
window.addEventListener("resize",()=>{if(window.innerWidth>860)closeMobileSidebar()});

["globalAddAssetButton","assetsAddButton","quickAddAsset"].forEach(id=>document.getElementById(id).addEventListener("click",()=>openAssetModal()));
["closeAssetModal","cancelAssetModal"].forEach(id=>document.getElementById(id).addEventListener("click",closeAssetModal));
modalBackdrop.addEventListener("click",event=>{if(event.target===modalBackdrop)closeAssetModal()});
assetForm.addEventListener("submit",saveAssetFromForm);

assetSearch.addEventListener("input",renderAssets);
rentFilter.addEventListener("change",renderAssets);
document.getElementById("clearFiltersButton").addEventListener("click",()=>{
  assetSearch.value="";rentFilter.value="all";renderAssets();
});

accountGroups.addEventListener("click",event=>{
  const header=event.target.closest(".account-group-header");
  if(header){
    header.closest(".account-group").classList.toggle("collapsed");
    return;
  }
  const button=event.target.closest("[data-action]");
  if(!button)return;
  const asset=assets.find(a=>a.id===button.dataset.id);
  if(!asset)return;
  if(button.dataset.action==="edit")openAssetModal(asset);
  if(button.dataset.action==="labels"){
    asset.labelsPrinted=true;saveAssets();renderAssets();
    showToast(`Label marked printed for ${asset.assetNumber}.`);
  }
});

function openImporter(){importFileInput.value="";importFileInput.click()}
["importAssetsButton","quickImport"].forEach(id=>document.getElementById(id).addEventListener("click",openImporter));
importFileInput.addEventListener("change",event=>{
  const file=event.target.files[0];
  if(file)showToast(`${file.name} selected. Full Excel/CSV mapping comes in the next import build.`);
});

renderDashboard();
renderAssets();
