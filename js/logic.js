/* Pure date logic. Works in browser (window.NovenaLogic) and Node (module.exports). */
(function (root) {
  function todayNY(now) {
    var p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now || new Date());
    var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
    return o.year + "-" + o.month + "-" + o.day;
  }
  function utc(d) { var a = d.split("-").map(Number); return Date.UTC(a[0], a[1] - 1, a[2]); }
  function diffDays(a, b) { return Math.round((utc(b) - utc(a)) / 864e5); }
  function addDays(d, n) { var x = new Date(utc(d) + n * 864e5); return x.toISOString().slice(0, 10); }
  function weekday(d) { return new Date(utc(d)).getUTCDay(); }
  // Standard weekday Rosary: Sun Glorious, Mon Joyful, Tue Sorrowful, Wed Glorious, Thu Luminous, Fri Sorrowful, Sat Joyful
  var WEEK = ["glorious", "joyful", "sorrowful", "glorious", "luminous", "sorrowful", "joyful"];
  // Source site's rotation (luminous cycle by prayer day)
  var CYCLE = ["joyful", "sorrowful", "glorious", "luminous"];
  function compute(date, site, books) {
    var n = site.novena, r = site.reading;
    var day = n.anchorDay + diffDays(n.anchorDate, date);            // source: Day 42 = Oct 22, Day 1 = Sep 11
    var status = day < 1 ? "waiting" : day > n.totalDays ? "done" : "active";
    var phase = day <= n.petitionDays ? "petition" : "thanksgiving";
    var pd = Math.min(n.totalDays, Math.max(1, day));
    var mystery = site.mysteryMode === "novenaDay" ? CYCLE[(pd - 1) % 4] : WEEK[weekday(date)];
    var idx = Math.max(0, diffDays(r.startDate, date));            // source: Oct 21 = index 0 = Gen 46
    var reading = null, started = false, i = 0;
    for (var b = 0; b < books.length && !reading; b++) {
      var bk = books[b];
      if (!started) { if (bk.id !== r.startBook) continue; started = true; }
      for (var c = (bk.id === r.startBook ? r.startChapter : 1); c <= bk.chapters; c++, i++) {
        if (i === idx) { reading = { book: bk.id, name: bk.name, chapter: c, usccb: bk.usccb }; break; }
      }
    }
    return { date: date, day: day, prayerDay: pd, status: status, phase: phase, mystery: mystery,
      surrenderDay: (pd - 1) % 9 + 1, readingIndex: idx, reading: reading, startDate: addDays(n.anchorDate, -(n.anchorDay - 1)),
      endDate: addDays(n.anchorDate, n.totalDays - n.anchorDay) };
  }
  function psalmNabre(e) { return e <= 8 ? e : e === 9 ? 9 : e >= 10 && e <= 112 ? e + 1 : e === 113 ? 114 : e === 114 || e === 115 ? 116 : e >= 116 && e <= 145 ? e + 1 : e === 146 || e === 147 ? 147 : e; }
  function nabreLink(bk, ch) {
    var intro = "https://bible.usccb.org/bible/" + bk.usccb + "/0";
    if (bk.id === "est" && ch > 10) return { url: intro, note: "Esther 11–16 here are the Greek additions; the NABRE prints them as lettered sections, so this opens the USCCB introduction." };
    if (bk.id === "psa") { var p = psalmNabre(ch); return { url: "https://bible.usccb.org/bible/psalms/" + p, note: p === ch ? "Traditional Catholic psalm numbering; matches the NABRE." : "Traditional Catholic psalm numbering; this is NABRE Psalm " + p + "." }; }
    return { url: "https://bible.usccb.org/bible/" + bk.usccb + "/" + ch, note: "" };
  }
  var api = { todayNY: todayNY, compute: compute, addDays: addDays, diffDays: diffDays, nabreLink: nabreLink };
  if (typeof module !== "undefined") module.exports = api; else root.NovenaLogic = api;
})(this);
