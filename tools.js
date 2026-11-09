// 使い方ページ（souba-kensaku・kaitori-keisan・shiire-jougen）で共通の検索リンクと計算
var SITES = [
  // [表示名, URL, 種類] 種類 sold＝売れた値段 / list＝出品中の値段（参考）
  ["メルカリ（売り切れ）", function(q){return "https://jp.mercari.com/search?keyword="+q+"&status=sold_out"}, "sold"],
  ["ヤフオク（落札相場）", function(q){return "https://auctions.yahoo.co.jp/closedsearch/closedsearch?p="+q}, "sold"],
  ["ラクマ（売り切れ）", function(q){return "https://fril.jp/s?query="+q+"&transaction=soldout"}, "sold"],
  ["Yahoo!ショッピング（中古）", function(q){return "https://shopping.yahoo.co.jp/search?p="+q+"&used=1"}, "list"],
  ["楽天市場", function(q){return "https://search.rakuten.co.jp/search/mall/"+q+"/"}, "list"],
  ["セカンドストリート", function(q){return "https://www.2ndstreet.jp/search?keyword="+q}, "list"],
  ["Amazon", function(q){return "https://www.amazon.co.jp/s?k="+q}, "list"]
];
function $(id){ return document.getElementById(id); }
function makeLinks(){
  var raw = $("q").value.normalize("NFKC").trim(), box = $("links");
  if(window.soubaAutoPrice) window.soubaAutoPrice(raw);
  box.innerHTML = "";
  if(!raw){ box.innerHTML = "<p class=\"small\" style=\"grid-column:1 / -1\">型番・商品名・JAN を入れてから押してください。</p>"; return; }
  var q = encodeURIComponent(raw);
  [["sold","売れた値段"],["list","出品中の値段（参考）"]].forEach(function(g){
    var h = document.createElement("p");
    h.className = "small"; h.style.fontWeight = "700"; h.style.gridColumn = "1 / -1"; h.style.margin = "8px 0 0"; h.textContent = g[1];
    box.appendChild(h);
    SITES.forEach(function(s){
      if(s[2] !== g[0]) return;
      var a = document.createElement("a");
      a.href = s[1](q); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = s[0];
      if(g[0] === "list") a.className = "list";
      box.appendChild(a);
    });
  });
}
// 全角数字・カンマも受け付ける。空欄や数字でないときは NaN
function num(id){
  var v = $(id).value.normalize("NFKC").replace(/[,，\s円%]/g, "");
  return v === "" || isNaN(Number(v)) ? NaN : Number(v);
}
function yen(n){ return Math.floor(Math.round(n*100)/100).toLocaleString("ja-JP") + " 円"; }
// 売値から買取（仕入れ）額の上限
function calcMax(){
  var sell = num("sell"), fee = num("fee"), ship = num("ship"), margin = num("margin"), cond = $("cond") ? Number($("cond").value) : 100;
  var minp = $("minp") && $("minp").value.trim() !== "" ? num("minp") : 0, wb = $("waitbtns") && $("waitbtns").querySelector("[data-on]"), drop = wb ? Number(wb.getAttribute("data-drop")) : 0;
  var out = $("out"), msg = $("msg");
  out.textContent = "―"; msg.textContent = "";
  if($("sell").value.trim() === "") return;
  if([sell, fee, ship, margin, minp].some(isNaN)){ msg.textContent = "すべての欄に数字を入れてください（手数料・送料がなければ 0）。"; return; }
  if(sell <= 0){ msg.textContent = "売れそうな価格は 1円以上で入れてください。"; return; }
  if(fee < 0 || fee >= 100 || margin < 0 || margin >= 100){ msg.textContent = "手数料と利益は 0〜99% で入れてください。"; return; }
  if(ship < 0){ msg.textContent = "送料は 0円以上で入れてください。"; return; }
  if(minp < 0){ msg.textContent = "最低でも残したい額は 0円以上で入れてください。"; return; }
  var exp = sell*cond/100, net = exp - exp*fee/100 - ship, rate = exp*margin/100, eff = minp > rate;
  var max = (net - (eff ? minp : rate)) * (1 - drop/100), maxRate = (net - rate) * (1 - drop/100);
  out.textContent = max > 0 ? yen(max) + "まで" : "利益が出ません（買わない）";
  msg.style.whiteSpace = "pre-line";
  msg.textContent = "売れる見込み " + yen(exp) + "（相場の" + cond/10 + "割）から、手数料・送料・利益を引いた額" + (max > 0 ? "で、相場の約" + Math.floor(max/sell*100) + "%です。" : "です。")
    + (max <= 0 ? "\n" + (eff ? "最低額" + yen(minp) + "を残そうとすると、手数料と送料を引いた額（" + yen(Math.max(net,0)) + "）に足りません。" : "手数料・送料・利益を引くと、残りがありません。") : "")
    + (eff && max > 0 ? "\n今回は最低額" + yen(minp) + "が効いて、上限は" + yen(max) + "（率だと" + yen(Math.max(maxRate,0)) + "）です。" : "")
    + (drop > 0 && max > 0 ? "\n売れるまで遅い見込みで" + drop + "%下げました。" : "") + "\n条件：手数料" + fee + "%・送料" + yen(ship) + "・利益" + margin + "%・最低" + yen(minp) + "・見込み" + (wb ? wb.textContent.replace(/^✓ /, "") : "ふつう");
}
// 仕入れ値から、損をしない最低の売値（利益0）
function calcMin(){
  var cost = num("cost"), fee = num("fee2"), ship = num("ship2");
  var out = $("out2"), msg = $("msg2");
  out.textContent = "―"; msg.textContent = "";
  if($("cost").value.trim() === "") return;
  if([cost, fee, ship].some(isNaN)){ msg.textContent = "すべての欄に数字を入れてください。"; return; }
  if(cost < 0 || ship < 0){ msg.textContent = "仕入れ値と送料は 0円以上で入れてください。"; return; }
  if(fee < 0 || fee >= 100){ msg.textContent = "手数料は 0〜99% で入れてください。"; return; }
  out.textContent = yen(Math.ceil((cost + ship) / (1 - fee/100))) + "以上";
}
function on(id, ev, fn){ var e = $(id); if(e) e.addEventListener(ev, fn); }
on("go", "click", makeLinks);
on("q", "keydown", function(e){ if(e.key === "Enter") makeLinks(); });
["sell","fee","ship","margin"].forEach(function(id){ on(id, "input", calcMax); });
on("cond", "change", calcMax);
on("minp", "input", calcMax);
(function(){ var w = $("waitbtns"); if(!w) return; var bs = w.querySelectorAll(".waitbtn");
  function paint(){ for(var i = 0; i < bs.length; i++){ var o = bs[i].hasAttribute("data-on"); bs[i].style.background = o ? "#1f6feb" : "#fff"; bs[i].style.color = o ? "#fff" : "#333"; bs[i].style.border = o ? "2px solid #1f6feb" : "1px solid #999"; bs[i].style.fontWeight = o ? "700" : "400"; bs[i].textContent = bs[i].textContent.replace(/^✓ /, "") ; if(o) bs[i].textContent = "✓ " + bs[i].textContent; bs[i].setAttribute("aria-pressed", o ? "true" : "false"); } }
  for(var i = 0; i < bs.length; i++) bs[i].addEventListener("click", function(){ for(var j = 0; j < bs.length; j++) bs[j].removeAttribute("data-on"); this.setAttribute("data-on", "1"); paint(); calcMax(); });
  paint(); })();
["cost","fee2","ship2"].forEach(function(id){ on(id, "input", calcMin); });
