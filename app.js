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

const seedAssignments=(master.length>=4 && accounts.length>=3) ? [
{id:crypto.randomUUID(),assetId:master[0].id,accountId:accounts[0].id,assignedAt:new Date().toISOString()},
{id:crypto.randomUUID(),assetId:master[1].id,accountId:accounts[0].id,assignedAt:new Date().toISOString()},
{id:crypto.randomUUID(),assetId:master[2].id,accountId:accounts[1].id,assignedAt:new Date().toISOString()},
{id:crypto.randomUUID(),assetId:master[3].id,accountId:accounts[2].id,assignedAt:new Date().toISOString()}
] : [];

let assignments=load(KEYS.assignments,seedAssignments);
let currentAccountId=null;
const expandedAccountIds=new Set();

function load(key,fallback){
  try{
    const stored=localStorage.getItem(key);
    return stored===null ? fallback : JSON.parse(stored);
  }catch{
    return fallback;
  }
}
function save(){localStorage.setItem(KEYS.master,JSON.stringify(master));localStorage.setItem(KEYS.accounts,JSON.stringify(accounts));localStorage.setItem(KEYS.assignments,JSON.stringify(assignments))}
const $=id=>document.getElementById(id);
const views={dashboard:$("dashboardView"),accounts:$("accountsView"),accountDetail:$("accountDetailView"),master:$("masterView"),audit:$("auditView"),placeholder:$("placeholderView")};
const titles={dashboard:"Dashboard",accounts:"Accounts",master:"Master Registry",activations:"Activations",audit:"Audit Center",labels:"Labels",reports:"Reports",settings:"Settings"};

function showView(name){
Object.values(views).forEach(v=>v.classList.remove("active"));
if(name==="dashboard")views.dashboard.classList.add("active");
else if(name==="accounts")views.accounts.classList.add("active");
else if(name==="master")views.master.classList.add("active");
else if(name==="audit")views.audit.classList.add("active");
else views.placeholder.classList.add("active");
$("pageTitle").textContent=titles[name]||"Accounts";
$("placeholderTitle").textContent=titles[name]||"Coming Soon";
document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
closeSidebar();
if(name==="dashboard")renderDashboard();
if(name==="accounts")renderAccounts();
if(name==="master")renderMaster();
if(name==="audit")renderAuditResults();
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

$("accountCardGrid").innerHTML=filtered.map(account=>{
  const assignmentList=assignedFor(account.id);
  const receivers=assignmentList.map(item=>assetById(item.assetId)).filter(Boolean);
  const onRent=receivers.filter(receiver=>receiver.rentState==="On Rent").length;
  const offRent=receivers.length-onRent;
  const isExpanded=q!=="" || expandedAccountIds.has(account.id);

  const receiverRows=receivers.map(receiver=>`
    <tr>
      <td><strong>${esc(receiver.assetNumber)}</strong></td>
      <td>${esc(receiver.model||"—")}</td>
      <td>${esc(receiver.accessCard||"—")}</td>
      <td>${esc(receiver.rid||"—")}</td>
      <td>${esc(receiver.serial||"—")}</td>
      <td><span class="rent-badge ${receiver.rentState==="On Rent"?"rent-on":"rent-off"}">${esc(receiver.rentState)}</span></td>
      <td>
        <div class="row-actions">
          <button class="small-button" data-inline-move="${receiver.id}" data-account-id="${account.id}">Move</button>
          <button class="small-button danger" data-inline-remove="${receiver.id}" data-account-id="${account.id}">Remove</button>
        </div>
      </td>
    </tr>`).join("");

  return `<section class="account-sheet-row ${isExpanded?"expanded":""} ${receivers.length>=20?"full":""}" data-account-row="${account.id}">
    <button class="account-sheet-header" type="button" data-toggle-account="${account.id}">
      <span class="account-chevron">›</span>
      <span class="account-main">
        <strong>${esc(account.number)}</strong>
        <span>Account Number</span>
      </span>
      <span class="account-main">
        <strong>${esc(account.name)}</strong>
        <span>Account Name</span>
      </span>
      <span class="account-location-cell">
        <strong>${esc(account.office||account.location||"—")}</strong>
        <span>Office / Location</span>
      </span>
      <span class="account-sheet-metric">
        <strong>${receivers.length}/20</strong>
        <span>Assigned</span>
      </span>
      <span class="account-sheet-metric on-rent">
        <strong>${onRent}</strong>
        <span>On Rent</span>
      </span>
      <span class="account-sheet-metric off-rent">
        <strong>${offRent}</strong>
        <span>Off Rent</span>
      </span>
    </button>

    <div class="account-sheet-body">
      <div class="account-inline-tools">
        <div class="account-inline-summary">
          ${receivers.length>=20
            ? "Account is at the 20-receiver limit."
            : `${20-receivers.length} receiver slot${20-receivers.length===1?"":"s"} available.`}
        </div>
        <div class="account-inline-buttons">
          <button class="small-button" data-inline-edit-account="${account.id}">Edit Account</button>
          <button class="small-button" data-inline-import="${account.id}">Import Receivers</button>
          <button class="small-button" data-inline-add="${account.id}" ${receivers.length>=20?"disabled":""}>+ Add Receiver</button>
          <button class="small-button" data-open-account="${account.id}">Full Account View</button>
        </div>
      </div>

      ${receivers.length
        ? `<div class="table-wrap">
            <table class="account-inline-table">
              <thead>
                <tr><th>Asset</th><th>Model</th><th>Access Card</th><th>RID</th><th>Serial</th><th>Rent</th><th></th></tr>
              </thead>
              <tbody>${receiverRows}</tbody>
            </table>
          </div>`
        : `<div class="account-inline-empty">No receivers are currently assigned to this account.</div>`}
    </div>
  </section>`;
}).join("");

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

$("accountSearch").oninput=renderAccounts;
$("expandAllAccounts").onclick=()=>{
  accounts.forEach(account=>expandedAccountIds.add(account.id));
  renderAccounts();
};
$("collapseAllAccounts").onclick=()=>{
  expandedAccountIds.clear();
  renderAccounts();
};
$("receiverSearch").oninput=renderAccountDetail;
$("masterSearch").oninput=renderMaster;
$("accountCardGrid").addEventListener("click",event=>{
  const toggle=event.target.closest("[data-toggle-account]");
  if(toggle){
    const id=toggle.dataset.toggleAccount;
    if(expandedAccountIds.has(id))expandedAccountIds.delete(id);
    else expandedAccountIds.add(id);
    renderAccounts();
    return;
  }

  const open=event.target.closest("[data-open-account]");
  if(open){
    openAccount(open.dataset.openAccount);
    return;
  }

  const edit=event.target.closest("[data-inline-edit-account]");
  if(edit){
    openAccountForm(accountById(edit.dataset.inlineEditAccount));
    return;
  }

  const add=event.target.closest("[data-inline-add]");
  if(add){
    currentAccountId=add.dataset.inlineAdd;
    openAssign();
    return;
  }

  const importButton=event.target.closest("[data-inline-import]");
  if(importButton){
    currentAccountId=importButton.dataset.inlineImport;
    openAccountImportModal();
    return;
  }

  const move=event.target.closest("[data-inline-move]");
  if(move){
    currentAccountId=move.dataset.accountId;
    openMove(move.dataset.inlineMove);
    return;
  }

  const remove=event.target.closest("[data-inline-remove]");
  if(remove){
    const receiver=assetById(remove.dataset.inlineRemove);
    if(confirm(`Remove ${receiver?.assetNumber||"this receiver"} from the account? It will remain in the Master Registry.`)){
      assignments=assignments.filter(item=>item.assetId!==remove.dataset.inlineRemove);
      save();
      renderAccounts();
      renderDashboard();
      toast("Receiver removed from account and kept in Master Registry.");
    }
  }
});
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

let pendingAccountImport=null;

function normalizeCsvHeader(value){
  return String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
}

function parseCsvText(text){
  const rows=[];
  let row=[];
  let cell="";
  let quoted=false;

  for(let i=0;i<text.length;i++){
    const ch=text[i];
    const next=text[i+1];

    if(ch==='"' && quoted && next==='"'){
      cell+='"';
      i++;
      continue;
    }

    if(ch==='"'){
      quoted=!quoted;
      continue;
    }

    if(ch==="," && !quoted){
      row.push(cell.trim());
      cell="";
      continue;
    }

    if((ch==="\n" || ch==="\r") && !quoted){
      if(ch==="\r" && next==="\n")i++;
      row.push(cell.trim());
      cell="";
      if(row.some(v=>v!==""))rows.push(row);
      row=[];
      continue;
    }

    cell+=ch;
  }

  row.push(cell.trim());
  if(row.some(v=>v!==""))rows.push(row);

  if(rows.length<2)throw new Error("The CSV does not contain any receiver rows.");

  const headers=rows[0].map(normalizeCsvHeader);
  return rows.slice(1).map(values=>{
    const record={};
    headers.forEach((header,index)=>record[header]=values[index]??"");
    return record;
  });
}

function csvValue(row,aliases){
  for(const alias of aliases){
    const key=normalizeCsvHeader(alias);
    if(row[key]!==undefined && String(row[key]).trim()!==""){
      return String(row[key]).trim();
    }
  }
  return "";
}

function accountImportRecord(row){
  return {
    assetNumber:csvValue(row,["Asset Number","Asset","Asset #","Asset ID","Unit Number"]).toUpperCase(),
    model:csvValue(row,["Model","Receiver Model"]),
    accessCard:csvValue(row,["Access Card","Access Card Number","Card Number","Card"]),
    rid:csvValue(row,["RID","Receiver ID","ReceiverID","Receiver RID Num"]),
    serial:csvValue(row,["Serial Number","Serial","SN"]),
    type:csvValue(row,["Receiver Type","Type"])
  };
}

function resetAccountImportModal(){
  pendingAccountImport=null;
  $("accountImportStart").hidden=false;
  $("accountImportPreview").hidden=true;
  $("accountImportFileInput").value="";
}

function openAccountImportModal(){
  const currentCount=assignedFor(currentAccountId).length;
  if(currentCount>=20){
    toast("This account already has 20 receivers.");
    return;
  }
  resetAccountImportModal();
  openModal("accountImportModal");
}

async function prepareAccountImport(file){
  try{
    const rawRows=parseCsvText(await file.text());
    const records=rawRows.map(accountImportRecord);
    const currentCount=assignedFor(currentAccountId).length;
    const availableSlots=Math.max(0,20-currentCount);
    const seen=new Set();
    const preview=[];
    let newToMaster=0;
    let ready=0;
    let warnings=0;

    for(let i=0;i<records.length;i++){
      const record=records[i];

      if(!record.assetNumber){
        warnings++;
        preview.push({
          asset:`Row ${i+2}`,
          master:"Blocked",
          assignment:"Blocked",
          detail:"Missing Asset Number",
          canApply:false
        });
        continue;
      }

      if(seen.has(record.assetNumber)){
        warnings++;
        preview.push({
          asset:record.assetNumber,
          master:"Duplicate Row",
          assignment:"Blocked",
          detail:"Duplicate Asset Number in this CSV",
          canApply:false
        });
        continue;
      }
      seen.add(record.assetNumber);

      const existingMaster=master.find(x=>x.assetNumber.toUpperCase()===record.assetNumber);
      const existingAssignment=existingMaster ? assignmentForAsset(existingMaster.id) : null;

      if(existingAssignment){
        const assignedAccount=accountById(existingAssignment.accountId);
        warnings++;
        preview.push({
          asset:record.assetNumber,
          master:"Existing",
          assignment:"Blocked",
          detail:`Already assigned to Account ${assignedAccount?.number||"Unknown"}`,
          canApply:false
        });
        continue;
      }

      const applyIndex=ready;
      const withinCapacity=applyIndex<availableSlots;

      if(!withinCapacity){
        warnings++;
        preview.push({
          asset:record.assetNumber,
          master:existingMaster ? "Existing" : "New",
          assignment:"Blocked",
          detail:"Would exceed the 20-receiver account limit",
          canApply:false
        });
        continue;
      }

      if(!existingMaster)newToMaster++;
      ready++;

      preview.push({
        asset:record.assetNumber,
        master:existingMaster ? "Existing" : "New",
        assignment:"Ready",
        detail:record.model || record.accessCard || record.rid || "Receiver record",
        canApply:true,
        record
      });
    }

    pendingAccountImport={fileName:file.name,preview};

    $("accountImportStart").hidden=true;
    $("accountImportPreview").hidden=false;
    $("accountImportFileName").textContent=file.name;
    $("accountImportRows").textContent=records.length;
    $("accountImportNew").textContent=newToMaster;
    $("accountImportReady").textContent=ready;
    $("accountImportWarnings").textContent=warnings;
    $("accountImportMessage").textContent=`This account currently has ${currentCount} receiver${currentCount===1?"":"s"} and ${availableSlots} available slot${availableSlots===1?"":"s"}. Only rows marked Ready will be applied.`;
    $("applyAccountImport").disabled=ready===0;

    $("accountImportPreviewRows").innerHTML=preview.map(item=>{
      const masterClass=item.master==="New"?"import-new":item.master==="Existing"?"import-ok":"import-warn";
      const assignmentClass=item.assignment==="Ready"?"import-ok":"import-blocked";
      return `<tr>
        <td><strong>${esc(item.asset)}</strong></td>
        <td><span class="${masterClass}">${esc(item.master)}</span></td>
        <td><span class="${assignmentClass}">${esc(item.assignment)}</span></td>
        <td>${esc(item.detail)}</td>
      </tr>`;
    }).join("");
  }catch(error){
    toast(error.message||"Unable to read that CSV.");
  }
}

function applyAccountImport(){
  if(!pendingAccountImport)return;

  let applied=0;
  let newMasterCount=0;

  for(const item of pendingAccountImport.preview){
    if(!item.canApply)continue;

    const record=item.record;
    let receiver=master.find(x=>x.assetNumber.toUpperCase()===record.assetNumber);

    if(!receiver){
      receiver={
        id:crypto.randomUUID(),
        assetNumber:record.assetNumber,
        model:record.model,
        accessCard:record.accessCard,
        rid:record.rid,
        serial:record.serial,
        type:record.type,
        rentState:"Off Rent"
      };
      master.push(receiver);
      newMasterCount++;
    }else{
      receiver.model=record.model||receiver.model;
      receiver.accessCard=record.accessCard||receiver.accessCard;
      receiver.rid=record.rid||receiver.rid;
      receiver.serial=record.serial||receiver.serial;
      receiver.type=record.type||receiver.type;
    }

    if(!assignmentForAsset(receiver.id)){
      assignments.push({
        id:crypto.randomUUID(),
        assetId:receiver.id,
        accountId:currentAccountId,
        assignedAt:new Date().toISOString()
      });
      applied++;
    }
  }

  save();
  closeModal("accountImportModal");
  resetAccountImportModal();
  renderAccountDetail();
  renderAccounts();
  renderMaster();
  renderDashboard();
  toast(`${applied} receiver${applied===1?"":"s"} assigned. ${newMasterCount} added to Master Registry.`);
}

$("importAccountReceiversButton").addEventListener("click",openAccountImportModal);
$("chooseAccountImportFile").addEventListener("click",()=>{
  $("accountImportFileInput").value="";
  $("accountImportFileInput").click();
});
$("accountImportFileInput").addEventListener("change",event=>{
  const file=event.target.files[0];
  if(file)prepareAccountImport(file);
});
$("cancelAccountImportPreview").addEventListener("click",()=>{
  closeModal("accountImportModal");
  resetAccountImportModal();
});
$("backToAccountImportStart").addEventListener("click",resetAccountImportModal);
$("applyAccountImport").addEventListener("click",applyAccountImport);


const AUDIT_KEY="atp.audit.v8";
let auditState=load(AUDIT_KEY,null);
let pendingAuditImport=null;

function auditRecordFromRow(row){
  return {
    accountNumber:csvValue(row,["Account Number","Account","Account #","Acct Number","Acct"]),
    accessCard:csvValue(row,["Access Card","Access Card Number","Card Number","Card"]),
    rid:csvValue(row,["RID","Receiver ID","ReceiverID","Receiver RID Num"])
  };
}

function receiverKey(card,rid){
  const c=String(card||"").trim();
  const r=String(rid||"").trim();
  if(c&&r)return `C:${c}|R:${r}`;
  if(c)return `C:${c}`;
  if(r)return `R:${r}`;
  return "";
}

function appReceiverSnapshot(accountId){
  return assignedFor(accountId).map(assignment=>{
    const asset=assetById(assignment.assetId);
    return {
      assetNumber:asset?.assetNumber||"",
      accessCard:asset?.accessCard||"",
      rid:asset?.rid||"",
      key:receiverKey(asset?.accessCard,asset?.rid)
    };
  });
}

function compareAuditRows(validRows,fileName){
  const auditByAccount=new Map();

  for(const row of validRows){
    if(!auditByAccount.has(row.accountNumber))auditByAccount.set(row.accountNumber,[]);
    auditByAccount.get(row.accountNumber).push({...row,key:receiverKey(row.accessCard,row.rid)});
  }

  // Audit only the accounts tracked by this local facility.
  // Company-wide accounts in the DirecTV workbook are intentionally ignored.
  const accountNumbers=new Set(accounts.map(account=>account.number));

  const results=[];

  for(const accountNumber of accountNumbers){
    const account=accounts.find(a=>a.number===accountNumber);
    const appRows=account?appReceiverSnapshot(account.id):[];
    const auditRows=auditByAccount.get(accountNumber)||[];

    const appMap=new Map();
    const auditMap=new Map();

    for(const row of appRows){
      if(!appMap.has(row.key))appMap.set(row.key,[]);
      appMap.get(row.key).push(row);
    }
    for(const row of auditRows){
      if(!auditMap.has(row.key))auditMap.set(row.key,[]);
      auditMap.get(row.key).push(row);
    }

    const matched=[];
    const missingFromAudit=[];
    const missingFromApp=[];

    const allKeys=new Set([...appMap.keys(),...auditMap.keys()]);
    for(const key of allKeys){
      const appList=appMap.get(key)||[];
      const auditList=auditMap.get(key)||[];
      const matchCount=Math.min(appList.length,auditList.length);

      for(let i=0;i<matchCount;i++)matched.push({app:appList[i],audit:auditList[i]});
      for(let i=matchCount;i<appList.length;i++)missingFromAudit.push(appList[i]);
      for(let i=matchCount;i<auditList.length;i++)missingFromApp.push(auditList[i]);
    }

    const countMatch=appRows.length===auditRows.length;
    const perfect=Boolean(account)&&countMatch&&missingFromAudit.length===0&&missingFromApp.length===0;

    results.push({
      accountNumber,
      accountName:account?.name||"Account not found in app",
      appCount:appRows.length,
      auditCount:auditRows.length,
      countMatch,
      matchedCount:matched.length,
      missingFromAudit,
      missingFromApp,
      perfect,
      accountExists:Boolean(account)
    });
  }

  return {
    fileName,
    importedAt:new Date().toISOString(),
    results
  };
}

function renderAuditResults(){
  const hasAudit=Boolean(auditState?.results?.length);
  $("auditEmptyState").hidden=hasAudit;
  $("auditResults").hidden=!hasAudit;
  $("clearAuditButton").disabled=!hasAudit;
  $("auditFileLabel").textContent=hasAudit?`${auditState.fileName} · ${new Date(auditState.importedAt).toLocaleString()}`:"No audit imported";

  if(!hasAudit){
    $("auditAccountsChecked").textContent="0";
    $("auditPerfectMatches").textContent="0";
    $("auditIssueAccounts").textContent="0";
    $("auditUnmatchedReceivers").textContent="0";
    return;
  }

  const perfect=auditState.results.filter(r=>r.perfect).length;
  const issues=auditState.results.length-perfect;
  const unmatched=auditState.results.reduce((sum,r)=>sum+r.missingFromAudit.length+r.missingFromApp.length,0);

  $("auditAccountsChecked").textContent=auditState.results.length;
  $("auditPerfectMatches").textContent=perfect;
  $("auditIssueAccounts").textContent=issues;
  $("auditUnmatchedReceivers").textContent=unmatched;

  const query=$("auditSearch").value.trim().toLowerCase();
  const filter=$("auditStatusFilter").value;

  const filtered=auditState.results.filter(result=>{
    const text=[
      result.accountNumber,
      result.accountName,
      ...result.missingFromAudit.flatMap(x=>[x.assetNumber,x.accessCard,x.rid]),
      ...result.missingFromApp.flatMap(x=>[x.accessCard,x.rid])
    ].join(" ").toLowerCase();

    const matchesSearch=text.includes(query);
    const matchesFilter=filter==="all"||(filter==="perfect"&&result.perfect)||(filter==="issues"&&!result.perfect);
    return matchesSearch&&matchesFilter;
  });

  $("auditAccountList").innerHTML=filtered.map(result=>{
    const issueCount=result.missingFromAudit.length+result.missingFromApp.length;
    const appMissingRows=result.missingFromAudit.map(x=>`
      <div class="audit-issue-row">
        <div><strong>${esc(x.assetNumber||"Unknown Asset")}</strong><span>App assignment</span></div>
        <div><strong>${esc(x.accessCard||"No card")}</strong><span>RID: ${esc(x.rid||"—")}</span></div>
      </div>`).join("");

    const auditMissingRows=result.missingFromApp.map(x=>`
      <div class="audit-issue-row">
        <div><strong>${esc(x.accessCard||"No card")}</strong><span>DirecTV audit</span></div>
        <div><strong>RID: ${esc(x.rid||"—")}</strong><span>Not assigned in app account</span></div>
      </div>`).join("");

    return `<section class="audit-account-card ${result.perfect?"perfect":"issues"}">
      <button class="audit-account-header" type="button">
        <span class="audit-account-title">
          <strong>Account ${esc(result.accountNumber)}</strong>
          <span>${esc(result.accountName)}</span>
        </span>
        <span class="audit-badges">
          <span class="audit-badge ${result.countMatch?"good":"bad"}">Count ${result.countMatch?"Matches":"Mismatch"}</span>
          <span class="audit-badge ${result.perfect?"good":"warn"}">${result.perfect?"Perfect Match":issueCount+" Receiver Issue"+(issueCount===1?"":"s")}</span>
        </span>
        <span class="audit-toggle">⌄</span>
      </button>

      <div class="audit-account-body">
        <div class="audit-count-line">
          <div class="audit-count-box"><span>App Count</span><strong>${result.appCount}</strong></div>
          <div class="audit-count-box"><span>DirecTV Count</span><strong>${result.auditCount}</strong></div>
          <div class="audit-count-box"><span>Correct Matches</span><strong>${result.matchedCount}</strong></div>
          <div class="audit-count-box"><span>Receiver Issues</span><strong>${issueCount}</strong></div>
        </div>

        ${result.perfect
          ? `<div class="audit-perfect-message">The account count and every receiver match the DirecTV audit.</div>`
          : `<div class="audit-issue-grid">
              <section class="audit-issue-section">
                <h4>In App, Missing from DirecTV Audit (${result.missingFromAudit.length})</h4>
                <div class="audit-issue-list">${appMissingRows||'<div class="audit-issue-row"><div><strong>None</strong></div></div>'}</div>
              </section>
              <section class="audit-issue-section">
                <h4>In DirecTV Audit, Missing from App Account (${result.missingFromApp.length})</h4>
                <div class="audit-issue-list">${auditMissingRows||'<div class="audit-issue-row"><div><strong>None</strong></div></div>'}</div>
              </section>
            </div>`
        }
      </div>
    </section>`;
  }).join("");
}

function resetAuditImport(){
  pendingAuditImport=null;
  $("auditImportStart").hidden=false;
  $("auditImportPreview").hidden=true;
  $("auditFileInput").value="";
}

function openAuditImport(){
  resetAuditImport();
  openModal("auditImportModal");
}

async function readAuditImportRows(file){
  const extension=file.name.split(".").pop().toLowerCase();

  if(extension==="xlsx"||extension==="xls"){
    const book=await readExcelBook(file);
    const sheetName=book.SheetNames.find(name=>normalizeImportKey(name)===normalizeImportKey("Receiver_Report"));

    if(!sheetName)throw new Error('Workbook is missing the "Receiver_Report" sheet.');

    const matrix=XLSX.utils.sheet_to_json(book.Sheets[sheetName],{
      header:1,
      defval:"",
      raw:false
    });

    // DirecTV Receiver_Report uses row 3 for headers.
    const headerRowIndex=matrix.findIndex(row=>
      row.some(value=>normalizeImportKey(value)==="accountnumber")&&
      row.some(value=>normalizeImportKey(value)==="accesscard")&&
      row.some(value=>normalizeImportKey(value)==="receiverridnum")
    );

    if(headerRowIndex<0){
      throw new Error('Could not find the Account Number, Access Card, and Receiver RID Num headers.');
    }

    const headers=matrix[headerRowIndex].map(normalizeCsvHeader);

    return matrix.slice(headerRowIndex+1)
      .filter(row=>row.some(value=>String(value||"").trim()!==""))
      .map(values=>{
        const record={};
        headers.forEach((header,index)=>{
          if(header)record[header]=values[index]??"";
        });
        return record;
      });
  }

  if(extension==="csv"){
    return parseCsvText(await file.text());
  }

  throw new Error("Choose an XLSX, XLS, or CSV audit file.");
}

async function prepareAuditImport(file){
  try{
    const rawRows=await readAuditImportRows(file);
    const parsed=rawRows.map(auditRecordFromRow);
    const preview=[];
    const valid=[];
    const localAccountNumbers=new Set(accounts.map(account=>String(account.number).trim()));
    let skipped=0;
    let ignoredCompanyWide=0;

    parsed.forEach((row,index)=>{
      const accountNumber=String(row.accountNumber||"").trim();
      const hasAccount=Boolean(accountNumber);
      const hasIdentifier=Boolean(row.accessCard||row.rid);
      const isLocalAccount=hasAccount&&localAccountNumbers.has(accountNumber);
      const validRow=isLocalAccount&&hasIdentifier;

      if(validRow){
        valid.push({...row,accountNumber});
      }else if(hasAccount&&!isLocalAccount){
        ignoredCompanyWide++;
      }else{
        skipped++;
      }

      preview.push({
        account:accountNumber||`Row ${index+4}`,
        card:row.accessCard||"—",
        rid:row.rid||"—",
        result:validRow
          ?"Ready"
          :hasAccount&&!isLocalAccount
            ?"Ignored — Not a Local Account"
            :!hasAccount
              ?"Missing Account Number"
              :"Missing Card and RID",
        valid:validRow,
        ignored:hasAccount&&!isLocalAccount
      });
    });

    pendingAuditImport={fileName:file.name,validRows:valid};

    $("auditImportStart").hidden=true;
    $("auditImportPreview").hidden=false;
    $("auditImportFileName").textContent=file.name;
    $("auditRowsRead").textContent=parsed.length;
    $("auditAccountsFound").textContent=new Set(valid.map(x=>x.accountNumber)).size;
    $("auditValidRows").textContent=valid.length;
    $("auditSkippedRows").textContent=skipped+ignoredCompanyWide;
    $("auditImportMessage").textContent=`Review only: this audit will not change app data. It will compare local accounts and return receiver/count mismatches for research. ${ignoredCompanyWide} company-wide row${ignoredCompanyWide===1?" was":"s were"} ignored because ${ignoredCompanyWide===1?"its account is":"their accounts are"} not tracked by this facility.`;
    $("runAuditButton").disabled=valid.length===0;

    const previewRows=[...preview.filter(item=>item.valid),...preview.filter(item=>!item.valid)].slice(0,150);
    $("auditImportPreviewRows").innerHTML=previewRows.map(item=>`
      <tr>
        <td><strong>${esc(item.account)}</strong></td>
        <td>${esc(item.card)}</td>
        <td>${esc(item.rid)}</td>
        <td><span class="${item.valid?"import-ok":item.ignored?"import-ignore":"import-blocked"}">${esc(item.result)}</span></td>
      </tr>`).join("");
  }catch(error){
    toast(error.message||"Unable to read that audit file.");
  }
}

function runPendingAudit(){
  if(!pendingAuditImport)return;
  auditState=compareAuditRows(pendingAuditImport.validRows,pendingAuditImport.fileName);
  localStorage.setItem(AUDIT_KEY,JSON.stringify(auditState));
  closeModal("auditImportModal");
  resetAuditImport();

  // Open the results on mismatches first so the audit is immediately useful for research.
  $("auditStatusFilter").value="issues";
  showView("audit");
  renderAuditResults();
  toast("Audit complete. Review only — no app data was changed.");
}

$("importAuditButton").addEventListener("click",openAuditImport);
$("chooseAuditFile").addEventListener("click",()=>{
  $("auditFileInput").value="";
  $("auditFileInput").accept=".xlsx,.xls,.csv";
  $("auditFileInput").click();
});
$("auditFileInput").addEventListener("change",event=>{
  const file=event.target.files[0];
  if(file)prepareAuditImport(file);
});
$("cancelAuditPreview").addEventListener("click",()=>{
  closeModal("auditImportModal");
  resetAuditImport();
});
$("backToAuditStart").addEventListener("click",resetAuditImport);
$("runAuditButton").addEventListener("click",runPendingAudit);
$("clearAuditButton").addEventListener("click",()=>{
  auditState=null;
  localStorage.removeItem(AUDIT_KEY);
  renderAuditResults();
  toast("Audit results cleared.");
});
$("auditSearch").addEventListener("input",renderAuditResults);
$("auditStatusFilter").addEventListener("change",renderAuditResults);
$("auditAccountList").addEventListener("click",event=>{
  const header=event.target.closest(".audit-account-header");
  if(header)header.closest(".audit-account-card").classList.toggle("collapsed");
});


let pendingDataImport=null;

function normalizeImportKey(value){
  return String(value||"").trim().toLowerCase().replace(/[^a-z0-9]/g,"");
}

function importValue(row,names){
  const normalized={};
  Object.keys(row||{}).forEach(key=>normalized[normalizeImportKey(key)]=row[key]);

  for(const name of names){
    const value=normalized[normalizeImportKey(name)];
    if(value!==undefined && String(value).trim()!=="")return String(value).trim();
  }
  return "";
}

async function readExcelBook(file){
  if(typeof XLSX==="undefined")throw new Error("Excel reader did not load. Refresh while connected to the internet.");
  return XLSX.read(await file.arrayBuffer(),{type:"array"});
}

function readNamedSheet(book,name){
  const sheetName=book.SheetNames.find(sheet=>normalizeImportKey(sheet)===normalizeImportKey(name));
  if(!sheetName)throw new Error(`Workbook is missing the "${name}" sheet.`);
  return XLSX.utils.sheet_to_json(book.Sheets[sheetName],{defval:"",raw:false});
}

function resetDataImport(){
  pendingDataImport=null;
  $("dataImportChoices").hidden=false;
  $("dataImportPreview").hidden=true;
  $("masterXlsxInput").value="";
  $("wtxXlsxInput").value="";
  $("tqCsvInput").value="";
}

function openDataImport(){
  resetDataImport();
  openModal("dataImportModal");
}

function showDataImportPreview(config){
  pendingDataImport={type:config.type,data:config.data};
  $("dataImportChoices").hidden=true;
  $("dataImportPreview").hidden=false;
  $("dataImportType").textContent=config.type;
  $("dataImportFileName").textContent=config.fileName;
  $("dataRowsRead").textContent=config.rows;
  $("dataNewCount").textContent=config.newCount;
  $("dataUpdateCount").textContent=config.updateCount;
  $("dataWarningCount").textContent=config.warningCount;
  $("dataImportMessage").textContent=config.message;
  $("dataImportPreviewRows").innerHTML=config.preview.slice(0,200).map(item=>`
    <tr>
      <td><strong>${esc(item.record)}</strong></td>
      <td><span class="${item.action==="New"?"import-new":item.action==="Update"?"import-ok":item.action==="Ignored"?"import-ignore":"import-blocked"}">${esc(item.action)}</span></td>
      <td>${esc(item.detail)}</td>
    </tr>`).join("");
  $("applyDataImport").disabled=!config.data.length;
}

function masterImportRecord(row){
  return {
    assetNumber:importValue(row,["Asset Number","Asset","asset","Asset #","Asset ID"]).toUpperCase(),
    accessCard:importValue(row,["Access Card","access_card","Access Card Number","Card Number","Card"]),
    serial:importValue(row,["Serial Number","serial_number","Serial","SN"]),
    rid:importValue(row,["Receiver ID","receiver_id","RID"]),
    type:importValue(row,["Type","Receiver Type"]),
    model:importValue(row,["Model","Receiver Model"])
  };
}

async function prepareMasterImport(file){
  try{
    const rows=readNamedSheet(await readExcelBook(file),"Master");
    const preview=[],data=[];
    let newCount=0,updateCount=0,warningCount=0;

    rows.forEach((row,index)=>{
      const record=masterImportRecord(row);
      if(!record.assetNumber){
        warningCount++;
        preview.push({record:`Row ${index+2}`,action:"Skipped",detail:"Missing Asset Number"});
        return;
      }

      const existing=master.find(receiver=>receiver.assetNumber.toUpperCase()===record.assetNumber);
      if(existing)updateCount++;
      else newCount++;

      preview.push({
        record:record.assetNumber,
        action:existing?"Update":"New",
        detail:record.model||record.type||"Receiver"
      });
      data.push(record);
    });

    showDataImportPreview({
      type:"Master Registry XLSX",
      fileName:file.name,
      rows:rows.length,
      newCount,updateCount,warningCount,
      message:"Updates permanent receiver information only. Account assignments and rent status are preserved.",
      preview,data
    });
  }catch(error){
    toast(error.message||"Unable to read the Master workbook.");
  }
}

function wtxImportRecord(row){
  return {
    accountNumber:importValue(row,["Account Number","account_number","Account #","Acct Number"]),
    accountName:importValue(row,["Account Name","account_name","Customer"]),
    assetNumber:importValue(row,["Asset Number","Asset","asset","Asset #","Asset ID"]).toUpperCase(),
    accessCard:importValue(row,["Access Card","access_card","Access Card Number","Card Number","Card"]),
    serial:importValue(row,["Serial Number","serial_number","Serial","SN"]),
    rid:importValue(row,["Receiver ID","receiver_id","RID"]),
    type:importValue(row,["Type","Receiver Type"]),
    model:importValue(row,["Model","Receiver Model"])
  };
}

function readWestTexasRows(book){
  const n=book.SheetNames.find(x=>normalizeImportKey(x)===normalizeImportKey("West Texas"));
  if(!n)throw new Error('Workbook is missing the "West Texas" sheet.');
  const s=book.Sheets[n],d=XLSX.utils.decode_range(s["!ref"]||"A1:N1");
  return XLSX.utils.sheet_to_json(s,{header:1,defval:"",raw:false,range:{s:{r:0,c:0},e:{r:d.e.r,c:13}}}).slice(1);
}
function cleanExcelValue(v){return String(v??"").trim();}
async function prepareWtxImport(file){
  try{
    const rows=readWestTexasRows(await readExcelBook(file)),preview=[],data=[],seen=new Set();
    let currentNumber="",currentName="",newCount=0,updateCount=0,warningCount=0;
    rows.forEach((c,i)=>{
      const asset=cleanExcelValue(c[1]).toUpperCase(),acct=cleanExcelValue(c[7]),name=cleanExcelValue(c[8]);
      if(acct)currentNumber=acct;if(name)currentName=name;if(!asset)return;
      if(!currentNumber){warningCount++;preview.push({record:asset,action:"Skipped",detail:`Row ${i+2}: no Account Number`});return;}
      if(seen.has(asset)){warningCount++;preview.push({record:asset,action:"Skipped",detail:"Duplicate Asset Number in West Texas sheet"});return;}seen.add(asset);
      const exists=master.find(x=>x.assetNumber.toUpperCase()===asset);exists?updateCount++:newCount++;
      preview.push({record:asset,action:exists?"Update":"New",detail:`Account ${currentNumber}${currentName?` · ${currentName}`:""}`});
      data.push({accountNumber:currentNumber,accountName:currentName||`Account ${currentNumber}`,assetNumber:asset,accessCard:cleanExcelValue(c[2]),serial:cleanExcelValue(c[3]),rid:cleanExcelValue(c[4]),type:cleanExcelValue(c[5]),model:cleanExcelValue(c[6]),office:cleanExcelValue(c[12]),notes:cleanExcelValue(c[13])});
    });
    showDataImportPreview({type:"West Texas XLSX",fileName:file.name,rows:rows.length,newCount,updateCount,warningCount,message:`Detected ${new Set(data.map(x=>x.accountNumber)).size} accounts and ${data.length} assigned receivers. Only columns A:N were read, preventing the workbook formatting from freezing the page.`,preview,data});
  }catch(e){toast(e.message||"Unable to read the West Texas workbook.");}
}

function normalizeRentStatus(value){
  const clean=String(value||"").trim().toLowerCase();

  if(["yes","y","1","true","on rent","onrent","rented"].includes(clean))return "On Rent";
  if(["no","n","0","false","off rent","offrent","not rented"].includes(clean))return "Off Rent";
  return "";
}

function parseCsvMatrix(text){
  const rows=[];
  let row=[];
  let cell="";
  let quoted=false;

  for(let i=0;i<text.length;i++){
    const ch=text[i];
    const next=text[i+1];

    if(ch==='"' && quoted && next==='"'){
      cell+='"';
      i++;
      continue;
    }

    if(ch==='"'){
      quoted=!quoted;
      continue;
    }

    if(ch==="," && !quoted){
      row.push(cell.trim());
      cell="";
      continue;
    }

    if((ch==="\n" || ch==="\r") && !quoted){
      if(ch==="\r" && next==="\n")i++;
      row.push(cell.trim());
      cell="";
      if(row.some(value=>value!==""))rows.push(row);
      row=[];
      continue;
    }

    cell+=ch;
  }

  row.push(cell.trim());
  if(row.some(value=>value!==""))rows.push(row);
  return rows;
}

async function prepareTqImport(file){
  try{
    const matrix=parseCsvMatrix(await file.text());
    const preview=[],data=[];
    let updateCount=0,warningCount=0,ignoredCount=0;

    matrix.forEach((columns,index)=>{
      const assetNumber=String(columns[0]||"").trim().toUpperCase();
      const serialNumber=String(columns[1]||"").trim();
      const location=String(columns[2]||"").trim();
      const rentState=normalizeRentStatus(columns[3]);

      if(!assetNumber||!rentState){
        warningCount++;
        preview.push({
          record:assetNumber||`Row ${index+1}`,
          action:"Skipped",
          detail:!assetNumber
            ?"Missing Asset Number"
            :"Unrecognized On Rent / Off Rent value"
        });
        return;
      }

      const receiver=master.find(item=>item.assetNumber.toUpperCase()===assetNumber);

      if(!receiver){
        ignoredCount++;
        preview.push({
          record:assetNumber,
          action:"Ignored",
          detail:"Company-wide receiver not in the local Master Registry"
        });
        return;
      }

      updateCount++;
      preview.push({
        record:assetNumber,
        action:"Update",
        detail:`${rentState}${location?` · ${location}`:""}${serialNumber?` · ${serialNumber}`:""}`
      });
      data.push({id:receiver.id,rentState});
    });

    showDataImportPreview({
      type:"TQ Report CSV",
      fileName:file.name,
      rows:matrix.length,
      newCount:0,
      updateCount,
      warningCount,
      message:`TQ format detected: Asset Number, Serial Number, Location, and On Rent Yes/No. ${ignoredCount} company-wide receiver${ignoredCount===1?" was":"s were"} ignored because ${ignoredCount===1?"it is":"they are"} not in the local Master Registry.`,
      preview,
      data
    });
  }catch(error){
    toast(error.message||"Unable to read the TQ CSV.");
  }
}

function applyDataImport(){
  if(!pendingDataImport)return;
  let processed=0;

  if(pendingDataImport.type==="Master Registry XLSX"){
    pendingDataImport.data.forEach(record=>{
      let receiver=master.find(item=>item.assetNumber.toUpperCase()===record.assetNumber);

      if(receiver){
        receiver.model=record.model||receiver.model;
        receiver.accessCard=record.accessCard||receiver.accessCard;
        receiver.rid=record.rid||receiver.rid;
        receiver.serial=record.serial||receiver.serial;
        receiver.type=record.type||receiver.type;
      }else{
        master.push({
          id:crypto.randomUUID(),
          ...record,
          rentState:"Off Rent"
        });
      }
      processed++;
    });
  }

  if(pendingDataImport.type==="West Texas XLSX"){
    pendingDataImport.data.forEach(record=>{
      let account=accounts.find(item=>item.number===record.accountNumber);

      if(!account){
        account={
          id:crypto.randomUUID(),
          number:record.accountNumber,
          name:record.accountName||`Account ${record.accountNumber}`,
          location:"",
          office:""
        };
        accounts.push(account);
      }

      let receiver=master.find(item=>item.assetNumber.toUpperCase()===record.assetNumber);

      if(!receiver){
        receiver={
          id:crypto.randomUUID(),
          assetNumber:record.assetNumber,
          model:record.model,
          accessCard:record.accessCard,
          rid:record.rid,
          serial:record.serial,
          type:record.type,
          rentState:"Off Rent"
        };
        master.push(receiver);
      }

      const assignment=assignmentForAsset(receiver.id);

      if(assignment){
        if(assignment.accountId!==account.id && assignedFor(account.id).length<20){
          assignment.accountId=account.id;
        }
      }else if(assignedFor(account.id).length<20){
        assignments.push({
          id:crypto.randomUUID(),
          assetId:receiver.id,
          accountId:account.id,
          assignedAt:new Date().toISOString()
        });
      }

      processed++;
    });
  }

  if(pendingDataImport.type==="TQ Report CSV"){
    pendingDataImport.data.forEach(item=>{
      const receiver=assetById(item.id);
      if(receiver){
        receiver.rentState=item.rentState;
        processed++;
      }
    });
  }

  save();
  closeModal("dataImportModal");
  resetDataImport();
  renderDashboard();
  renderAccounts();
  renderMaster();
  if(currentAccountId)renderAccountDetail();
  toast(`${processed} record${processed===1?"":"s"} processed.`);
}

$("openMasterImport").onclick=openDataImport;
$("chooseMasterXlsx").onclick=()=>$("masterXlsxInput").click();
$("chooseWtxXlsx").onclick=()=>$("wtxXlsxInput").click();
$("chooseTqCsv").onclick=()=>$("tqCsvInput").click();

$("masterXlsxInput").onchange=event=>{
  const file=event.target.files[0];
  if(file)prepareMasterImport(file);
};

$("wtxXlsxInput").onchange=event=>{
  const file=event.target.files[0];
  if(file)prepareWtxImport(file);
};

$("tqCsvInput").onchange=event=>{
  const file=event.target.files[0];
  if(file)prepareTqImport(file);
};

$("cancelDataImport").onclick=()=>{
  closeModal("dataImportModal");
  resetDataImport();
};

$("backToDataImportChoices").onclick=resetDataImport;
$("applyDataImport").onclick=applyDataImport;


$("clearAllAppData").addEventListener("click",()=>{
  const confirmed=confirm(
    "Clear ALL app data?\n\nThis will permanently remove every account, receiver, assignment, audit result, and test entry stored in this browser. This cannot be undone."
  );

  if(!confirmed)return;

  master=[];
  accounts=[];
  assignments=[];
  currentAccountId=null;
  auditState=null;

  localStorage.setItem(KEYS.master,JSON.stringify([]));
  localStorage.setItem(KEYS.accounts,JSON.stringify([]));
  localStorage.setItem(KEYS.assignments,JSON.stringify([]));
  localStorage.removeItem("atp.audit.v8");

  save();
  resetDataImport();
  closeModal("dataImportModal");
  renderDashboard();
  renderAccounts();
  renderMaster();
  renderAuditResults();
  showView("dashboard");
  toast("All app data cleared. You can now import clean data.");
});
