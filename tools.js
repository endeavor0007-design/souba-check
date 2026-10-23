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
  var raw = $("q").value.trim(), box = $("links");
  if(window.soubaAutoPrice) window.soubaAutoPrice(raw);
  box.innerHTML = "";
  if(!raw) return;
  var q = encodeURIComponent(raw);
  [["sold","売れた値段"],["list","出品中の値段（参考）"]].forEach(function(g){
    var h = document.createElement("p");
    h.className = "small"; h.style.gridColumn = "1 / -1"; h.style.margin = "8px 0 0"; h.textContent = g[1];
    box.appendChild(h);
    SITES.forEach(function(s){
      if(s[2] !== g[0]) return;
      var a = document.createElement("a");
      a.href = s[1](q); a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = s[0];
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
  var sell = num("sell"), fee = num("fee"), ship = num("ship"), margin = num("margin");
  var out = $("out"), msg = $("msg");
  out.textContent = "―"; msg.textContent = "";
  if($("sell").value.trim() === "") return;
  if([sell, fee, ship, margin].some(isNaN)){ msg.textContent = "すべての欄に数字を入れてください（手数料・送料がなければ 0）。"; return; }
  if(sell <= 0){ msg.textContent = "売れそうな価格は 1円以上で入れてください。"; return; }
  if(fee < 0 || fee >= 100 || margin < 0 || margin >= 100){ msg.textContent = "手数料と利益は 0〜99% で入れてください。"; return; }
  if(ship < 0){ msg.textContent = "送料は 0円以上で入れてください。"; return; }
  var max = sell - sell*fee/100 - ship - sell*margin/100;
  out.textContent = max > 0 ? yen(max) + "まで" : "利益が出ません";
  if(max > 0) msg.textContent = "売値の約" + Math.floor(max/sell*100) + "%です。";
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
["cost","fee2","ship2"].forEach(function(id){ on(id, "input", calcMin); });
