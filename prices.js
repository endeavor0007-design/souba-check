// 楽天市場の販売中の値段を、検索と同時に画面に出す（楽天ウェブサービスの商品検索API）
// キーは config.js の SOUBA_CONFIG。空なら何も表示しない（検索リンクだけ）
(function(){
  var C = window.SOUBA_CONFIG || {};
  var box = document.getElementById("autoprice");
  if(!box || !C.rakutenAppId || !C.rakutenAccessKey) return;
  var ENDPOINT = "https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701";
  var seq = 0;
  // 本体ではなく付属品・消耗品の出品によく出る言葉（楽天の除外語と、画面側の二重の確認に使う）
  var NG = ["フィルム","ケース","カバー","イヤーパッド","イヤーパット","イヤークッション","交換用","互換","保護","シール","スキン","ステッカー","ケーブル","充電器","アダプタ","パーツ","部品","レンタル","プロテクター","ガラス","専用","ガイド","ストラップ","スタンド","収納"];
  function yen(n){ return Math.round(n).toLocaleString("ja-JP") + "円"; }
  function el(tag, text, cls){ var e = document.createElement(tag); if(text != null) e.textContent = text; if(cls) e.className = cls; return e; }
  function show(nodes){ box.innerHTML = ""; nodes.forEach(function(n){ box.appendChild(n); }); box.hidden = false; }
  function stats(prices){
    var a = prices.slice().sort(function(x, y){ return x - y; }), n = a.length;
    var mid = n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
    return {n: n, lo: a[0], mid: mid, hi: a[n - 1]};
  }
  window.soubaAutoPrice = function(raw){
    raw = (raw || "").trim();
    if(raw.length < 2){ box.hidden = true; return; }
    var my = ++seq;
    show([el("p", "楽天市場の値段を取得しています…", "small")]);
    var p = new URLSearchParams({applicationId: C.rakutenAppId, accessKey: C.rakutenAccessKey, keyword: raw,
      hits: "30", availability: "1", NGKeyword: NG.slice(0, 10).join(" "), format: "json", formatVersion: "2"});
    fetch(ENDPOINT + "?" + p.toString()).then(function(r){
      if(!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function(d){
      if(my !== seq) return;
      var items = (d.Items || []).map(function(it){ return it.Item || it; })
        .filter(function(it){ return it.itemPrice > 0 && !NG.some(function(w){ return String(it.itemName).indexOf(w) >= 0; }); });
      var head = el("p", null, "small");
      head.appendChild(el("b", "楽天市場で販売中の値段（参考）"));
      head.appendChild(document.createTextNode("：新品が中心の「売りたい値段」で、売れた値段ではありません。付属品や別の商品が混ざることがあります。"));
      if(!items.length){ show([head, el("p", "楽天市場では見つかりませんでした。型番の書き方を変えるか、上のボタンで各サイトを見てください。", "small")]); return; }
      // 高いほうから4分の1の値段の3割に満たないものは、付属品・部品とみなして外す
      var ps = items.map(function(it){ return it.itemPrice; }).sort(function(x, y){ return x - y; });
      var p75 = ps[Math.floor((ps.length - 1) * 0.75)], cut = items.length;
      items = items.filter(function(it){ return it.itemPrice >= p75 * 0.3; }); cut -= items.length;
      var s = stats(items.map(function(it){ return it.itemPrice; }));
      var row = el("div", null, "pstat");
      [["安値", s.lo], ["真ん中", s.mid], ["高値", s.hi]].forEach(function(x){
        var c = el("div"); c.appendChild(el("span", x[0], "small")); c.appendChild(el("b", yen(x[1]))); row.appendChild(c);
      });
      var list = el("ul", null, "plist");
      items.slice().sort(function(x, y){ return x.itemPrice - y.itemPrice; }).slice(0, 5).forEach(function(it){
        var li = el("li"), a = el("a", it.itemName.slice(0, 60));
        var u = String(it.itemUrl || "").replace(/[&?]rafcid=[^&]*/, ""); if(/^https:\/\//.test(u)) a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer";
        li.appendChild(el("b", yen(it.itemPrice) + " ")); li.appendChild(a);
        li.appendChild(el("span", "（" + it.shopName + (it.postageFlag === 0 ? "・送料込み" : "・送料別") + "）", "small"));
        list.appendChild(li);
      });
      var credit = el("p", null, "small");
      var ca = el("a", "Supported by Rakuten Developers"); ca.href = "https://developers.rakuten.com/"; ca.target = "_blank"; ca.rel = "noopener";
      credit.appendChild(document.createTextNode(s.n + "件から集計" + (cut ? "（安すぎる" + cut + "件は付属品などとして除外）" : "") + "　")); credit.appendChild(ca);
      show([head, row, el("p", "安い順の5件", "small"), list, credit]);
    }).catch(function(){
      if(my !== seq) return;
      show([el("p", "楽天市場の値段を取得できませんでした（混み合っているか、通信の問題です）。少し待ってもう一度押すか、上のボタンで各サイトを見てください。", "small")]);
    });
  };
})();
