const KEYS={master:"atp.master.v5",accounts:"atp.accounts.v5",assignments:"atp.assignments.v5"};

const seedMaster=[
{id:crypto.randomUUID(),assetNumber:"43MTX5033HD",model:"HR54-700",accessCard:"001234567890",rid:"0349583945",serial:"A1B2C3D4",type:"Genie",rentState:"On Rent"},
{id:crypto.randomUUID(),assetNumber:"43MTX1168HD",model:"H25-500",accessCard:"001234567893",rid:"0391172840",serial:"MTX11680",type:"HD",rentState:"Off Rent"},
{id:crypto.randomUUID(),assetNumber:"43HOB2147HD",model:"H24-700",accessCard:"001234567891",rid:"0384412098",serial:"HOB77211",type:"HD",rentState:"On Rent"},
{id:crypto.randomUUID(),assetNumber:"43CAR8812HD",model:"HR24-500",accessCard:"001234567892",rid:"0357718204",serial:"CAR88291",type:"DVR",rentState:"Off Rent"}
];
const seedAccounts=[
{id:crypto.randomUUID(),number:"10024587",name:"Tanmar Rentals - Midland",location:"Midland",office:"Midland Yard"},
{id:crypto.randomUUID(),number:"10039812",name:"Tanmar Rentals - Hobbs",location:"Hobbs",office:"Hobbs Office"},
{id:crypto.randomUUID(),number:"10077421",name:"Carlsbad Operations",location:"Carlsbad",office:"Carlsbad Yard"}
];

let master=load(KEYS.master,seedMaster);
let accounts=load(KEYS.accounts,seedAccounts);
let assignments=load(KEYS.assignments,[
{id:crypto.randomUUID(),assetId:master[0].id,accountId:accounts[0].id,assignedAt:new Date().toISOString()},
{id:crypto.randomUUID(),assetId:master[1].id,accountId:accounts[0].id,assignedAt:new Date().toISOString()},
{id:crypto.randomUUID(),assetId:master[2].id,accountId:accounts[1].id,assignedAt:new Date().toISOString()},
{id:crypto.randomUUID(),assetId:master[3].id,accountId:accounts[2].id,assignedAt:new Date().toISOString()}
]);
let currentAccountId=null;

function load(key,fallback){try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}}
function save(){localStorage.setItem(KEYS.master,JSON.stringify(master));localStorage.setItem(KEYS.accounts,JSON.stringify(accounts));localStorage.setItem(KEYS.assignments,JSON.stringify(assignments))}
const $=id=>document.getElementById(id);
const views={dashboard:$("dashboardView"),accounts:$("accountsView"),accountDetail:$("accountDetailView"),master:$("masterView"),placeholder:$("placeholderView")};
const titles={dashboard:"Dashboard",accounts:"Accounts",master:"Master Registry",activations:"Activations",audit:"Audit Center",labels:"Labels",reports:"Reports",settings:"Settings"};

function showView(name){
Object.values(views).forEach(v=>v.classList.remove("active"));
if(name==="dashboard")views.dashboard.classList.add("active");
else if(name==="accounts")views.accounts.classList.add("active");
else if(name==="master")views.master.classList.add("active");
else views.placeholder.classList.add("active");
$("pageTitle").textContent=titles[name]||"Accounts";
$("placeholderTitle").textContent=titles[name]||"Coming Soon";
document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
closeSidebar();
if(name==="dashboard")renderDashboard();
if(name==="accounts")renderAccounts();
if(name==="master")renderMaster();
}

function assignedFor(accountId){return assignments.filter(a=>a.accountId===accountId)}
function assignmentForAsset(assetId){return assignments.find(a=>a.assetId===assetId)}
function assetById(id){return master.find(a=>a.id===id)}
function accountById(id){return accounts.find(a=>a.id===id)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function toast(msg){$("toast").textContent=msg;$("toast").hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>$("toast").hidden=true,2800)}
function openModal(id){$(id).hidden=false}
function closeModal(id){$(id).hidden=true}

function renderDashboard(){
$("accountStat").textContent=accounts.length;
$("assignedStat").textContent=assignments.length;
$("offRentStat").textContent=assignments.filter(a=>assetById(a.assetId)?.rentState==="Off Rent").length;
$("capacityStat").textContent=accounts.filter(a=>assignedFor(a.id).length>=20).length;
$("dashboardAccounts").innerHTML=accounts.slice(0,6).map(a=>{
const count=assignedFor(a.id).length;
return `<button class="dashboard-account-row" data-open-account="${a.id}">
<div><strong>${esc(a.number)}</strong><span>${esc(a.name)}</span></div>
<div><strong>${count}/20</strong><span>Receivers</span></div>
<div class="capacity-mini"><i style="width:${Math.min(count/20*100,100)}%"></i></div>
</button>`}).join("");
}

function renderAccounts(){
const q=$("accountSearch").value.trim().toLowerCase();
const filtered=accounts.filter(a=>{
  const accountText=[a.number,a.name,a.location,a.office].join(" ").toLowerCase();
  const receiverText=assignedFor(a.id)
    .map(assignment=>assetById(assignment.assetId))
    .filter(Boolean)
    .map(asset=>[
      asset.assetNumber,
      asset.serial,
      asset.accessCard,
      asset.rid,
      asset.model
    ].join(" "))
    .join(" ")
    .toLowerCase();

  return `${accountText} ${receiverText}`.includes(q);
});
$("accountCardGrid").innerHTML=filtered.map(a=>{
const list=assignedFor(a.id),on=list.filter(x=>assetById(x.assetId)?.rentState==="On Rent").length,off=list.length-on;
return `<article class="account-card" data-open-account="${a.id}">
<div class="account-card-top"><div><h3>${esc(a.number)}</h3><p>${esc(a.name)}</p></div><span class="capacity-pill ${list.length>=20?"full":""}">${list.length}/20</span></div>
<p class="account-location">${esc(a.location||"No location")} · ${esc(a.office||"No office")}</p>
<div class="account-card-metrics"><div><span>Assigned</span><strong>${list.length}</strong></div><div><span>On Rent</span><strong>${on}</strong></div><div><span>Off Rent</span><strong>${off}</strong></div></div>
</article>`}).join("");
$("accountEmpty").hidden=filtered.length!==0;
}

function openAccount(id){
currentAccountId=id;
const a=accountById(id);if(!a)return;
Object.values(views).forEach(v=>v.classList.remove("active"));views.accountDetail.classList.add("active");
$("pageTitle").textContent="Account "+a.number;
$("detailAccountNumber").textContent="Account "+a.number;
$("detailAccountName").textContent=`${a.name} · ${a.location||"No location"} · ${a.office||"No office"}`;
$("receiverSearch").value="";
renderAccountDetail();
}

function renderAccountDetail(){
const a=accountById(currentAccountId);if(!a)return;
const list=assignedFor(a.id),assets=list.map(x=>assetById(x.assetId)).filter(Boolean);
const q=$("receiverSearch").value.trim().toLowerCase();
const filtered=assets.filter(x=>[x.assetNumber,x.model,x.accessCard,x.rid,x.serial].join(" ").toLowerCase().includes(q));
const on=assets.filter(x=>x.rentState==="On Rent").length,off=assets.length-on;
$("detailAssigned").textContent=assets.length;$("detailAvailable").textContent=Math.max(0,20-assets.length);$("detailOnRent").textContent=on;$("detailOffRent").textContent=off;
$("capacityCopy").textContent=`${assets.length} of 20`;
$("capacityFill").style.width=`${Math.min(assets.length/20*100,100)}%`;
$("capacityFill").classList.toggle("full",assets.length>=20);
$("capacityWarning").hidden=assets.length<20;
$("addReceiverButton").disabled=assets.length>=20;
$("receiverRows").innerHTML=filtered.map(x=>`<tr>
<td><strong>${esc(x.assetNumber)}</strong></td><td>${esc(x.model||"—")}</td><td>${esc(x.accessCard||"—")}</td><td>${esc(x.rid||"—")}</td><td>${esc(x.serial||"—")}</td>
<td><span class="rent-badge ${x.rentState==="On Rent"?"rent-on":"rent-off"}">${esc(x.rentState)}</span></td>
<td><div class="row-actions"><button class="small-button" data-move="${x.id}">Move</button><button class="small-button danger" data-remove="${x.id}">Remove</button></div></td>
</tr>`).join("");
$("receiverEmpty").hidden=filtered.length!==0;
}

function renderMaster(){
const q=$("masterSearch").value.trim().toLowerCase();
const filtered=master.filter(x=>[x.assetNumber,x.model,x.accessCard,x.rid,x.serial,x.type].join(" ").toLowerCase().includes(q));
$("masterRows").innerHTML=filtered.map(x=>{
const asn=assignmentForAsset(x.id),acct=asn?accountById(asn.accountId):null;
return `<tr><td><strong>${esc(x.assetNumber)}</strong></td><td>${esc(x.model||"—")}</td><td>${esc(x.accessCard||"—")}</td><td>${esc(x.rid||"—")}</td><td>${esc(x.serial||"—")}</td><td>${acct?esc(acct.number):"Unassigned"}</td><td><button class="small-button" data-edit-master="${x.id}">Edit</button></td></tr>`}).join("");
}

function openAccountForm(account=null){
$("accountForm").reset();$("accountEditId").value=account?.id||"";$("accountModalTitle").textContent=account?"Edit Account":"Add Account";
$("accountNumberInput").value=account?.number||"";$("accountNameInput").value=account?.name||"";$("accountLocationInput").value=account?.location||"";$("accountOfficeInput").value=account?.office||"";
openModal("accountModal");
}

$("accountForm").addEventListener("submit",e=>{
e.preventDefault();const id=$("accountEditId").value,number=$("accountNumberInput").value.trim(),name=$("accountNameInput").value.trim();
if(accounts.some(a=>a.number===number&&a.id!==id)){toast("That Account Number already exists.");return}
const rec={id:id||crypto.randomUUID(),number,name,location:$("accountLocationInput").value.trim(),office:$("accountOfficeInput").value.trim()};
accounts=id?accounts.map(a=>a.id===id?rec:a):[...accounts,rec];save();closeModal("accountModal");renderAccounts();renderDashboard();if(id)openAccount(id);else openAccount(rec.id);
});

function openAssign(){
if(assignedFor(currentAccountId).length>=20){toast("This account already has 20 receivers.");return}
$("assignForm").reset();$("lookupResult").hidden=true;openModal("assignModal");setTimeout(()=>$("assignAssetInput").focus(),0);
}
$("assignAssetInput").addEventListener("input",()=>{
const value=$("assignAssetInput").value.trim().toUpperCase(),asset=master.find(x=>x.assetNumber.toUpperCase()===value);
if(!value){$("lookupResult").hidden=true;return}
$("lookupResult").hidden=false;
if(asset){const existing=assignmentForAsset(asset.id);$("lookupResult").className="lookup-result";$("lookupResult").innerHTML=`<strong>${esc(asset.assetNumber)} · ${esc(asset.model||"No model")}</strong><span>Card: ${esc(asset.accessCard||"—")} · RID: ${esc(asset.rid||"—")}${existing?` · Currently in Account ${esc(accountById(existing.accountId)?.number||"")}`:""}</span>`}
else{$("lookupResult").className="lookup-result lookup-missing";$("lookupResult").innerHTML="<strong>Receiver not found in Master Registry</strong><span>Submitting will open a new Master Receiver form and then assign it to this account.</span>"}
});

$("assignForm").addEventListener("submit",e=>{
e.preventDefault();const value=$("assignAssetInput").value.trim().toUpperCase();let asset=master.find(x=>x.assetNumber.toUpperCase()===value);
if(!asset){closeModal("assignModal");openMasterForm(null,value,true);return}
const existing=assignmentForAsset(asset.id);
if(existing){const acct=accountById(existing.accountId);toast(`Receiver is already assigned to Account ${acct?.number||""}. Use Move instead.`);return}
assignments.push({id:crypto.randomUUID(),assetId:asset.id,accountId:currentAccountId,assignedAt:new Date().toISOString()});save();closeModal("assignModal");renderAccountDetail();renderDashboard();toast("Receiver added to account.");
});

function openMasterForm(asset=null,prefill="",assignAfter=false){
$("masterForm").reset();$("masterEditId").value=asset?.id||"";$("assignAfterMaster").value=assignAfter?"yes":"no";$("masterModalTitle").textContent=asset?"Edit Master Receiver":"Add Receiver to Master";
$("masterAssetInput").value=asset?.assetNumber||prefill;$("masterModelInput").value=asset?.model||"";$("masterCardInput").value=asset?.accessCard||"";$("masterRidInput").value=asset?.rid||"";$("masterSerialInput").value=asset?.serial||"";$("masterTypeInput").value=asset?.type||"";openModal("masterModal");
}

$("masterForm").addEventListener("submit",e=>{
e.preventDefault();const id=$("masterEditId").value,assetNumber=$("masterAssetInput").value.trim().toUpperCase();
if(master.some(x=>x.assetNumber.toUpperCase()===assetNumber&&x.id!==id)){toast("That Asset Number already exists in the Master Registry.");return}
const existing=master.find(x=>x.id===id);
const rec={id:id||crypto.randomUUID(),assetNumber,model:$("masterModelInput").value.trim(),accessCard:$("masterCardInput").value.trim(),rid:$("masterRidInput").value.trim(),serial:$("masterSerialInput").value.trim(),type:$("masterTypeInput").value.trim(),rentState:existing?.rentState||"Off Rent"};
master=id?master.map(x=>x.id===id?rec:x):[...master,rec];
if($("assignAfterMaster").value==="yes"&&!assignmentForAsset(rec.id))assignments.push({id:crypto.randomUUID(),assetId:rec.id,accountId:currentAccountId,assignedAt:new Date().toISOString()});
save();closeModal("masterModal");renderMaster();renderDashboard();if(currentAccountId)renderAccountDetail();toast(id?"Master receiver updated.":"Receiver added to Master Registry.");
});

function openMove(assetId){
$("moveAssetId").value=assetId;
const current=assignmentForAsset(assetId);
$("moveAccountSelect").innerHTML=accounts.filter(a=>a.id!==current?.accountId).map(a=>`<option value="${a.id}" ${assignedFor(a.id).length>=20?"disabled":""}>${esc(a.number)} — ${esc(a.name)} (${assignedFor(a.id).length}/20)</option>`).join("");
if(!$("moveAccountSelect").options.length){toast("No other account is available.");return}
openModal("moveModal");
}
$("moveForm").addEventListener("submit",e=>{
e.preventDefault();const assetId=$("moveAssetId").value,target=$("moveAccountSelect").value;
if(assignedFor(target).length>=20){toast("The destination account already has 20 receivers.");return}
const asn=assignmentForAsset(assetId);if(asn)asn.accountId=target;save();closeModal("moveModal");renderAccountDetail();renderDashboard();toast("Receiver moved to the selected account.");
});

document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("[data-open-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.openView)));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeModal(b.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.hidden=true}));
$("globalNewAccount").onclick=$("accountsNewButton").onclick=$("quickNewAccount").onclick=()=>openAccountForm();
$("backToAccounts").onclick=()=>showView("accounts");
$("editAccountButton").onclick=()=>openAccountForm(accountById(currentAccountId));
$("addReceiverButton").onclick=openAssign;
$("masterAddButton").onclick=()=>openMasterForm();
$("openMasterImport").onclick=()=>toast("Master CSV import comes after this account workflow is approved.");
$("accountSearch").oninput=renderAccounts;
$("receiverSearch").oninput=renderAccountDetail;
$("masterSearch").oninput=renderMaster;
$("accountCardGrid").addEventListener("click",e=>{const card=e.target.closest("[data-open-account]");if(card)openAccount(card.dataset.openAccount)});
$("dashboardAccounts").addEventListener("click",e=>{const row=e.target.closest("[data-open-account]");if(row)openAccount(row.dataset.openAccount)});
$("receiverRows").addEventListener("click",e=>{
const move=e.target.closest("[data-move]"),remove=e.target.closest("[data-remove]");
if(move)openMove(move.dataset.move);
if(remove&&confirm("Remove this receiver from the account? It will remain in the Master Registry.")){assignments=assignments.filter(a=>a.assetId!==remove.dataset.remove);save();renderAccountDetail();renderDashboard();toast("Receiver removed from account and kept in Master Registry.")}
});
$("masterRows").addEventListener("click",e=>{const btn=e.target.closest("[data-edit-master]");if(btn)openMasterForm(assetById(btn.dataset.editMaster))});
$("menuButton").onclick=()=>{$("sidebar").classList.toggle("open");$("sidebarOverlay").classList.toggle("show")};
$("sidebarOverlay").onclick=closeSidebar;
function closeSidebar(){$("sidebar").classList.remove("open");$("sidebarOverlay").classList.remove("show")}
renderDashboard();renderAccounts();renderMaster();