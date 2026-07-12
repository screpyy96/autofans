export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  readTime: number;
  publishedAt: string;
  isFeatured?: boolean;
}

export const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    slug: "top-suv-uri-premium-romania-2026",
    title: "Top Cele Mai Bune SUV-uri Premium în România (2026) – Ghid Complet de Achiziție",
    excerpt: "Analiză detaliată a celor mai căutate SUV-uri de lux din România. Află ce model se potrivește familiei tale: BMW X5, Mercedes GLE, Porsche Cayenne sau Audi Q7.",
    content: `
Alegerea unui SUV premium second-hand sau nou în România nu este o decizie ușoară. Cu atât de multe opțiuni, sisteme hibride complexe și tehnologii de asistență a șoferului, cumpărătorii trebuie să fie extrem de atenți la ce cumpără. Acest ghid complet îți va prezenta cele mai populare SUV-uri de lux pe platforma AutoFans, analizând fiabilitatea, costurile de întreținere și valoarea la revânzare.

## De ce sunt SUV-urile premium atât de populare în România?

Drumurile din România, nevoile familiilor moderne și dorința de siguranță au transformat segmentul SUV-urilor premium în cel mai dinamic de pe piața autohtonă. Tracțiunea integrală (xDrive, 4MATIC, quattro) a devenit o necesitate pentru iernile noastre, iar gărzile la sol ridicate previn daunele pe drumurile mai puțin ideale.

## 1. BMW X5 (G05 LCI) - Regele Dinamicii

Lansat recent cu un facelift masiv (LCI), BMW X5 rămâne referința clasei. Interiorul dominat de **BMW Curved Display** și sistemul iDrive 8.5 îl face să pară cu 10 ani în viitor față de vechea generație F15.

### Versiunea recomandată: BMW X5 xDrive50e (Plug-in Hybrid)
A înlocuit vechiul 45e, oferind acum:
* **Autonomie pur electrică:** Peste 90 km în regim WLTP (suficient pentru naveta zilnică în București sau Cluj).
* **Putere:** 490 CP / 700 Nm, capabil de 0-100 km/h în 4.8 secunde.
* **Impozit auto redus:** În România, mașinile PHEV beneficiază de reduceri de până la 100% la impozitul auto local.

## 2. Mercedes-Benz GLE (V167) - Etalonul Luxului

Dacă BMW excelează la capitolul condus sportiv, Mercedes-Benz GLE este regele incontestabil al confortului la rulare. Suspensia opțională E-Active Body Control face efectiv să dispară gropile din asfalt.

### Puncte forte GLE:
* **Sistemul MBUX:** Interfața cu asistentul vocal inteligent ("Hey Mercedes") este impecabilă.
* **Spațiul pe bancheta din spate:** Generos pentru adulți.
* **Materiale:** Finisajele din lemn poros și piele Nappa sunt fără cusur.

### Versiunea recomandată: GLE 350de 4MATIC
Este printre puținele SUV-uri Plug-in Hybrid care combină un motor **DIESEL** cu un motor electric. Bateria masivă de 31.2 kWh oferă peste 100 km electrici, iar la drum lung te bazezi pe consumul mic de motorină.

## 3. Porsche Cayenne (E3 Facelift) - Sportivitate Supremă

Actualizarea recentă a lui Cayenne a transformat complet suspensia mașinii. Tehnologia cu două supape pentru amortizoare separă compresia de revenire, oferind un confort de rulare la nivel de limuzină, dar cu setarea Sport Plus, mașina devine practic o compactă sportivă grea.

* **Ideal pentru:** Șoferii care iubesc să conducă și fac des drumuri pe trasee virajate montane (ex: Transfăgărășan).
* **Atenție la costuri:** Reviziile, frânele și anvelopele (mai ales dacă ai jante pe 22") sunt considerabil mai scumpe decât la rivalii nemțești de la BMW și Mercedes.

## Întrebări Frecvente (FAQ) despre SUV-urile Premium

**Q: Este mai rentabil să iau un SUV plug-in hybrid sau un diesel clasic?**  
R: Dacă ai unde să încarci mașina acasă sau la birou, un Plug-in Hybrid (PHEV) te poate scuti de mii de lei la benzină anual, iar impozitul va fi infim. Dacă mergi zilnic sute de kilometri pe autostradă, dieselul (ex: X5 xDrive30d sau GLE 400d) rămâne opțiunea superioară ca și cost/km.

**Q: Ce depreciere au aceste mașini după 3 ani?**  
R: În general, un SUV premium pierde între 35% și 45% din valoarea sa inițială în primii 3 ani sau 100.000 km. Din acest motiv, cumpărarea unuia rulat (de pe AutoFans.ro) verificat este de multe ori "smart money".

## Concluzie
Piața actuală oferă mașini incredibil de avansate. Alegerea ta ar trebui să depindă strict de utilitate:
- Vrei dinamică și tehnologie? Alege **BMW X5**.
- Vrei lux absolut și confort? Alege **Mercedes GLE**.
- Vrei o mașină sport mai înaltă? Alege **Porsche Cayenne**.

Nu uita, indiferent ce mașină alegi, folosește filtrele noastre avansate de pe platformă pentru a găsi doar mașini cu istoric curat și istoric de service la zi.
    `,
    coverImage: "https://images.unsplash.com/photo-1606016159991-ddeab5617277?q=80&w=2000&auto=format&fit=crop", // BMW/SUV style image
    author: {
      name: "Andrei Popescu",
      avatar: "https://i.pravatar.cc/150?u=andrei",
      role: "Redactor Șef AutoFans"
    },
    category: "Review-uri",
    tags: ["SUV", "Premium", "BMW", "Mercedes-Benz", "Porsche", "Ghid Achiziție"],
    readTime: 8,
    publishedAt: "2026-07-10T09:00:00Z",
    isFeatured: true
  },
  {
    id: "2",
    slug: "ghid-verificare-istoric-auto-second-hand",
    title: "Cum Verifici Istoricul Unei Mașini Second-Hand înainte de Cumpărare: Sfaturi Vitale",
    excerpt: "Evită țepele de mii de euro. Află exact ce este seria de șasiu (VIN), cum să detectezi kilometri dați înapoi și la ce să te uiți sub capotă.",
    content: `
Piața mașinilor rulate ascunde oportunități fantastice, dar și "capcane" extrem de costisitoare. Achiziționarea unei mașini pe nevăzute, fără o verificare minuțioasă, te poate aduce în situația de a cumpăra un autoturism care a fost "daună totală" (totaled) și reparat la colț de stradă. 

Aici este ghidul AutoFans pentru cumpărători inteligenți, care își bazează decizia pe fapte, documente și teste reale.

## 1. Importanța Numărului de Identificare (VIN)
Numărul de Identificare al Vehiculului (sau seria de șasiu) este ADN-ul mașinii. Orice vânzător de bună credință ar trebui să îl aibă trecut vizibil în anunț (la fel cum cerem noi obligatoriu pe AutoFans) sau să ți-l ofere la primul telefon. 

Dacă vânzătorul ezită să-ți dea VIN-ul ("E la nevastă-mea", "Nu am actele aici", "E în mașină, o să ți-l trimit mâine"), închide apelul și treci la următorul anunț. Fără excepții.

### Unde găsești seria VIN pe mașină?
* Partea de jos a parbrizului, vizibilă din exterior.
* Stâlpul ușii (B-pillar) de pe partea șoferului sau a pasagerului.
* Ștanțată direct pe caroserie în compartimentul motor.
* Pe talon (Certificatul de Înmatriculare) și pe cartea de identitate a vehiculului (CIV).
**Sfat:** Verifică personal dacă seria de pe geam coincide cu cea din acte și cu cea de sub capotă.

## 2. Platformele de Verificare Istoric (CarVertical, RAR Auto-Pass)
După ce ai VIN-ul, folosește unelte digitale pentru a "radiografia" trecutul mașinii:

* **CarVertical sau AutoRecord:** Pentru ~100 de lei, obții un raport detaliat. Te interesează două lucruri: graficul kilometrajului (dacă există scăderi bruște, "s-au dat km înapoi") și secțiunea de "Daune / Accidente". Multe mașini aduse din SUA sau vestul Europei au fost cumpărate la licitații pe post de resturi/daune totale.
* **RAR Auto-Pass (pentru mașini înmatriculate în România):** Platforma gratuită a Registrului Auto Român îți oferă citirile de kilometri notate oficial la fiecare ITP efectuat în țară.

## 3. Inspecția Fizică: La ce să fii atent?

Dacă rapoartele sunt curate, abia acum mergi să vezi mașina fizic. Nu merge niciodată singur, ia pe cineva mai puțin entuziasmat, care poate vedea lucrurile la rece.

### Exteriorul
- **Grosimea Vopselei:** Un tester de vopsea costă sub 200 de lei și este esențial. Un panou original de vopsea ar trebui să aibă între 90-150 microni. Peste 250-300 microni înseamnă revopsire, iar valorile de peste 1000 microni arată prezența de chit (accidente grave).
- **Alinieri și Șuruburi:** Uită-te la alinierea (luft-urile) portierelor, capotei și farurilor. Ridică capota și uită-te la capetele șuruburilor de la aripi. Sunt julite? Înseamnă că piesa a fost demontată.
- **Anvelope:** 4 anvelope diferite sau de la mărci "obscure" chinezești pe o mașină premium? E un indiciu că s-a făcut o mentenanță pe "budget redus".

### Interiorul
Uzul trebuie să aibă sens în raport cu kilometrii. O mașină la "120.000 km reali" nu are volanul "tocit" complet și scaunul șoferului lăsat până la burete, la fel cum nu are pedalierul ros până la metal. 

### Motorul (La rece)
- Cere vânzătorului ca motorul să fie RECE (ne-pornit de câteva ore) când ajungi. Primele secunde de la pornirea la rece (Cold Start) spun totul despre lanțul de distribuție, injectoare și turație.
- Deschide bușonul de ulei: Există o "spumă" gălbuie/albicioasă pe interiorul capacului? Poate fi condensație (la drumuri scurte iarna) sau, mult mai grav, antigel amestecat în ulei (garnitura de chiulasă dusă).

## 4. Testul la Reprezentanță (Inspecția Pre-Purchase)
Test-drive-ul tău e bun, dar un mecanic va ridica mașina pe elevator. Peste 80% din defectele ascunse sunt sub mașină: 
- Scurgeri grave de ulei între cutie și motor (simering palier).
- Jocuri la planetare, bielete, bucși.
- Filtru DPF anulat sau tăiat cu sudură neconformă (caz în care mașina îți va fi respinsă la următorul ITP / ITP la drum de RAR).

**Merită o verificare de 300-500 Lei?** 
Gândește-te că o casetă de direcție pentru un BMW modern costă peste 10.000 de Lei. Verificarea e cel mai ieftin "asigurare" pe care o poți cumpăra.
    `,
    coverImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop", // Checking car engine
    author: {
      name: "Mihai Stan",
      avatar: "https://i.pravatar.cc/150?u=mihai",
      role: "Expert Mecanic & Inspector Auto"
    },
    category: "Ghiduri",
    tags: ["Verificare Auto", "Sfaturi", "Second-hand", "Siguranță", "Țepe Auto"],
    readTime: 6,
    publishedAt: "2026-07-08T14:30:00Z"
  },
  {
    id: "3",
    slug: "colantare-vs-folie-ppf-protectie-vopsea-pret-avantaje",
    title: "PPF (Folie de Protecție) vs Colantare Auto: Care e diferența și ce merită să alegi?",
    excerpt: "Analizăm diferențele dintre foliile transparente Paint Protection Film (PPF) de mii de euro și foliile de colantare obișnuite (Vinyl). Costuri, rezistență, durabilitate.",
    content: `
A venit momentul în care vrei să îți personalizezi mașina sau să îi protejezi vopseaua originală, mai ales dacă tocmai ai cumpărat-o. Dacă mergi la un atelier de detailing, fie că e în București sau cauți un centru de [colantare auto suceava](https://detalingsuceava.com), primești oferte variate: de la 1.500 Euro pentru o colantare banală, la oferte de 5.000 Euro pentru "Full Body PPF". 

Cum explici această diferență uriașă de preț? Care dintre opțiuni se potrivește mașinii tale? Răspunsul stă în tehnologia materialului: Poliuretan vs. Clorură de Polivinil.

## Diferența Fundamentală de Material

### 1. Colantarea (Vinyl Wrap / PVC)
Colantarea clasică folosește un film pe bază de PVC (Clorură de polivinil). Acesta este foarte subțire (în jur de 3-4 mils / 80-100 microni grosime). 

* **Rol principal:** Schimbarea culorii. Poți face mașina din neagră -> verde smarald, portocaliu mat, cameleon, etc.
* **Protecție:** Extrem de redusă. Oferă o barieră vagă contra razelor UV și zgârieturilor superficiale de spălătorie (swirl marks). **NU protejează împotriva pietrelor de pe autostradă!** O piatră sărită dintr-un tir va trece direct prin colant și prin vopsea până la metal.
* **Durată de viață:** 2 - 5 ani (dacă este expusă mult la soare, colantul tinde să devină casant și se dă foarte greu jos, putând rupe din lac).

### 2. Folia de Protecție a Vopselei (PPF - Paint Protection Film)
PPF-ul este făcut din TPU (Poliuretan Termoplastic). Este substanțial mai gros decât colantul (între 8 mils și 12 mils / 200-300 microni).

* **Rol principal:** Protejarea absolută a mașinii contra impacturilor fizice minore.
* **Protecție:** Acționează ca o „pernă” elastică. Dacă sare o piatră mărișoară, forța este disipată în grosimea foliei de poliuretan, iar vopseaua de dedesubt rămâne absolut imaculată.
* **Tehnologia "Self-Healing":** Dacă zgârii folia cu o cheie (superficial), prin expunerea la căldură (soare fierbinte sau un pistol de aer cald), zgârieturile dispar complet! Foliile premium (Xpel, Stek, SunTek, Llumar) includ și un strat hidrofob.
* **Durată de viață:** Până la 10 ani de garanție reală contra îngălbenirii sau crăpării.

## Tabel Comparativ: PPF vs. Colantare Vinyl

| Funcție / Caracteristică | Colantare (Vinyl) | Protecție PPF |
|--------------------------|-------------------|---------------|
| **Cost estimativ Full Car** | 1.500 € - 2.500 € | 3.500 € - 6.000 € |
| **Protecție anti-pietre (Criblură)** | FOARTE SLABĂ | **EXCELENTĂ** |
| **Auto-vindecare (Self-Healing)** | NU | **DA** |
| **Schimbarea culorii?** | DA, mii de opțiuni | NU (doar mat/lucios)* |
| **Grosime (microni)** | ~90 microni | ~200-250 microni |

*\*Notă: În ultimul an, producătorii au început să scoată PPF-uri colorate, dar la prețuri exorbitante (peste 6000 Euro o aplicare completă).*

## Ce ar trebui să alegi? Scenarii practice

### Cazul A: "Vreau să îmi protejez mașina nouă ca să îi mențin valoarea de revânzare."
**Alegerea logică:** PPF.
Dacă nu vrei să plătești mii de euro pe toată mașina, alege un pachet **"Front End PPF"**. Adică vei plăti doar pentru capotă, bară față, aripi stânga/dreapta, faruri și oglinzi (aprox. 1.500 - 2.000 Euro). Sunt zonele cu risc de 95% să fie lovite de pietre. Restul mașinii o poți da cu un tratament ceramic pentru curățare ușoară.

### Cazul B: "Mașina mea are deja vopseaua zgâriată/mătuită și m-am săturat de culoare."
**Alegerea logică:** Colantare.
Nu poți pune PPF transparent peste o vopsea urâtă, pentru că defectele se vor vedea în continuare. Un colant nou îți va da un "refresh" spectaculos la un preț mult mai abordabil.

## Concluzie
Nu te lăsa păcălit de unele spălătorii sau "ateliere auto" care susțin că o folie colant simplă (vinyl) îți va "proteja mașina". Orice zgârietură cu cheia sau pietricică la viteze de peste 80km/h va distruge folia respectivă. Investiția într-un film de protecție PPF pe "partea frontală" (Front Impact Zone) rămâne cea mai inteligentă mutare dacă iubești mașina și vrei s-o păstrezi țiplă pe ani de zile.
    `,
    coverImage: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=2000&auto=format&fit=crop", // Car detailing
    author: {
      name: "Elena Popa",
      avatar: "https://i.pravatar.cc/150?u=elena",
      role: "Auto Detailer Pro"
    },
    category: "Întreținere",
    tags: ["PPF", "Detailing", "Vopsea", "Protecție Ceramică", "Colantare"],
    readTime: 5,
    publishedAt: "2026-07-05T10:15:00Z"
  }
];
