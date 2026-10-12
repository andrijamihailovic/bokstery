# Bokstery — bokstery.si

Spletna stran je pripravljena za **andrijamihailovic/bokstery** in **https://bokstery.si/**.

## 1. Naloži na GitHub

1. Na https://github.com/new ustvari **public** repozitorij z imenom **bokstery** (lastnik **andrijamihailovic**).
2. Odpri repozitorij, izberi **Add file → Upload files** in naloži **vso vsebino tega paketa**. `index.html`, `app.js`, `style.css`, `data.js`, `CNAME`, `.nojekyll`, `assets/` in druge datoteke/mape naj bodo v korenu repozitorija. Lahko jih tudi potisneš prek `git`.
3. Odpri **Settings → Pages**, izberi **Deploy from a branch**, vejo **main**, mapo **/(root)** in **Save**.
4. V istem razdelku pod **Custom domain** vpiši **bokstery.si** in shrani. V korenu je `CNAME` že pripravljen z vsebino `bokstery.si`; GitHub Pages ga uporablja, kadar stran objavljaš neposredno iz veje.

## 2. Usmeri DNS pri Hitrost.com

Hitrost omogoča brezplačno DNS gostovanje za njihove domene. V uporabniškem vmesniku pojdi v **Storitve → DNS gostovanje**, po potrebi izberi **Dodajte domeno**. Če domena ne uporablja Hitrostovih ustreznih DNS strežnikov, v **Storitve → Domene → Domenski strežniki** preveri, kje upravljaš aktivno DNS cono. Za Hitrostovo brezplačno DNS gostovanje so strežniki **ns1.naliniji.com**, **ns2.naliniji.com**, **ns3.naliniji.com**. Strežnikov ne spreminjaj, če DNS cone že upravljaš drugje, brez da tam preneseš obstoječe zapise (zlasti e-poštne).

V **aktivno** DNS cono dodaj:

| Tip | Ime/Host | Vrednost |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | andrijamihailovic.github.io |

Opomba: pri nekaterih Hitrostovih urejevalnikih je namesto `@` treba uporabiti `bokstery.si.` (s končno piko); za cilj CNAME je lahko potrebna končna pika `andrijamihailovic.github.io.`. **Ne vnašaj `/bokstery/` v DNS zapise.**

Odstrani le **konfliktne** stare zapise A/AAAA za golo domeno in A/AAAA/CNAME za `www`, če obstajajo. **Ne briši MX, SPF, DKIM ali drugih e-poštnih zapisov.**

## 3. Priporočeno: preveri lastništvo domene

Na GitHubu odpri osebni **Settings → Pages → Add a domain** in dodaj `bokstery.si`. GitHub ti pokaže vrednost TXT zapisa, ki jo dodaš v DNS. Ime bo podobno `_github-pages-challenge-andrijamihailovic`, **vrednosti ne ugibaj**: prepiši jo iz GitHuba. Po potrditvi TXT zapisa lastništvo potrdi na GitHubu in TXT pusti v DNS.

## 4. Preveri HTTPS in povezave

1. Po osvežitvi DNS (lahko traja do 24 ur ali več) odpri **https://bokstery.si** in **https://www.bokstery.si**.
2. Na GitHubu v **Settings → Pages** počakaj, da je omogočena možnost **Enforce HTTPS**, in jo vključi.
3. Oba naslova naj kažeta na isto stran; `www` se lahko preusmeri na `bokstery.si`.
4. Preveri pet iger in deljenje rezultata. Deljeni rezultat vsebuje povezavo `https://bokstery.si/`.

GitHub Pages je za to statično spletno stran dovolj; ni dnevnega strežniškega opravila in ni potrebe po gostovanju pri Hitrostu. Domeno je treba normalno obnavljati.

## 5. Dnevna vsebina

- Pripravljen koledar: **12. 10. 2026–11. 10. 2027**, 365 različnih dnevnih sklopov, 5 iger × 3 vprašanja vsak dan.
- Isti izzivi na isti datum, določeno po časovnem pasu **Europe/Ljubljana**.
- Po **11. 10. 2027** bo treba dodati nov koledar; vprašanja se ne ustvarjajo sama za nedoločen čas.
- Napredek je shranjen samo lokalno v igralčevem brskalniku. Skupne lestvice ni.
- Priporočljiv je uredniški pregled zahtevnejših zgodovinskih vprašanj pred širšo objavo.

## Viri

- [GitHub Pages — lastna domena](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [GitHub Pages — preverjanje lastništva domene](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
- [Hitrost — aktivacija brezplačnega DNS gostovanja](https://podpora.hitrost.com/p/kako-in-kje-aktiviram-brezplacno-dns-gostovanje/)
- [Hitrost — urejanje DNS](https://podpora.hitrost.com/p/dns-gostovanje/)
