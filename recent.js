// 最近調べた品：調べた語をこの端末のブラウザの中（localStorage）にだけ残し、1押しで調べ直す。件数の上限なし・サーバーには送らない
(function(){
  var KEY = "souba_recent", SHOW = 12, q = document.getElementById("q"), go = document.getElementById("go"), links = document.getElementById("links");
  if(!q || !go || !links) return;
  var open = false, failed = false;
  function load(){ try{ var v = JSON.parse(localStorage.getItem(KEY) || "[]"); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
  function save(list){ try{ localStorage.setItem(KEY, JSON.stringify(list)); return true; }catch(e){ return false; } }
  function same(a, b){ return a.toLowerCase() === b.toLowerCase(); }
  function el(tag, text, cls){ var e = document.createElement(tag); if(text != null) e.textContent = text; if(cls) e.className = cls; return e; }
  var box = el("div", null, "recent");
  box.id = "recent";
  links.parentNode.insertBefore(box, links);
  function render(){
    var list = load();
    box.innerHTML = "";
    if(failed){ box.hidden = false; box.appendChild(el("p", "この端末（ブラウザの設定やプライベートモード）では、最近調べた品を残せません。検索はふつうに使えます。", "small")); return; }
    if(!list.length){ box.hidden = true; return; }
    box.hidden = false;
    var h = el("p", null, "small");
    h.style.margin = "10px 0 4px";
    h.appendChild(el("b", "最近調べた品"));
    h.appendChild(document.createTextNode("（押すと調べ直します。この端末のブラウザの中にだけ残り、ほかの端末とは共有されません）"));
    box.appendChild(h);
    var warn = el("p", null, "small");
    warn.style.margin = "0 0 6px";
    warn.appendChild(el("b", "お店の共用の端末では、同じ端末を使うほかの人にも見えます。使い終わりに消してください。"));
    box.appendChild(warn);
    var row = el("div", null, "chips");
    list.slice(0, open ? list.length : SHOW).forEach(function(w){
      var c = el("span", null, "chip");
      var b = el("button", w, "chip-go");
      b.type = "button";
      b.addEventListener("click", function(){ q.value = w; go.click(); });
      var x = el("button", "×", "chip-x");
      x.type = "button"; x.setAttribute("aria-label", w + " を消す");
      x.addEventListener("click", function(){ save(load().filter(function(v){ return v !== w; })); render(); });
      c.appendChild(b); c.appendChild(x);
      row.appendChild(c);
    });
    box.appendChild(row);
    var tools = el("div", null, "chip-tools");
    if(list.length > SHOW){
      var more = el("button", open ? "少なく表示する" : "もっと見る（ほか " + (list.length - SHOW) + " 件）", "chip-del");
      more.type = "button";
      more.addEventListener("click", function(){ open = !open; render(); });
      tools.appendChild(more);
    }
    var del = el("button", "最近調べた品を全部消す", "chip-del");
    del.type = "button";
    del.addEventListener("click", function(){
      if(!confirm("この端末に残した「最近調べた品」を全部消します。よろしいですか？")) return;
      try{ localStorage.removeItem(KEY); }catch(e){}
      open = false; render();
    });
    tools.appendChild(del);
    box.appendChild(tools);
  }
  function remember(){
    var w = q.value.normalize("NFKC").trim();
    if(!w) return;
    var list = load().filter(function(x){ return !same(x, w); });
    list.unshift(w);
    failed = !save(list);
    render();
  }
  go.addEventListener("click", remember);
  q.addEventListener("keydown", function(e){ if(e.key === "Enter") remember(); });
  render();
})();
