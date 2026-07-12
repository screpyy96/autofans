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
    slug: "top-5-suv-uri-premium-2026",
    title: "Top 5 SUV-uri Premium pe care merită să le cumperi în 2026",
    excerpt: "Piața SUV-urilor de lux s-a schimbat masiv. Analizăm cele mai bune opțiuni de pe piață, de la eficiența plug-in hybrid până la performanțe pure M și AMG.",
    content: `
Piața SUV-urilor premium a devenit mai competitivă ca niciodată. Fie că ești în căutarea confortului suprem pentru familie sau a performanțelor care sfidează fizica, 2026 aduce modele care redefinesc standardele.

## 1. BMW X5 (G05) LCI
Facelift-ul actualului X5 a adus un interior spectaculos, dominat de ecranul curbat (Curved Display) cu iDrive 8.5. Versiunea xDrive45e a fost înlocuită de xDrive50e, oferind acum o autonomie electrică reală de peste 80km și 490 CP în total. Este probabil cel mai complet SUV din segment.

## 2. Porsche Cayenne (E3 II)
Cunoscut mereu ca "mașina sport a SUV-urilor", cel mai recent update pentru Cayenne a rafinat și mai mult trenul de rulare. Suspensia pneumatică cu două camere separă controlul ruliului de cel al confortului. Versiunea E-Hybrid este recomandarea noastră pentru utilizare zilnică.

## 3. Mercedes-Benz GLE
Pentru cei care pun confortul pe primul loc, GLE rămâne regele. Materialele din interior și sistemul MBUX actualizat transformă orice călătorie lungă într-o relaxare totală.

## 4. Range Rover Sport
Designul minimalist și reducerea masivă a zgomotului la rulare (mulțumită sistemului activ de anulare a zgomotului din tetiere) îl fac o prezență impunătoare, dar rafinată pe șosele.

## Concluzie
Alegerea se rezumă la priorități: BMW pentru dinamică tech, Mercedes pentru lux, Porsche pentru sportivitate, și Range Rover pentru acel statut unic. Indiferent de alegere, tehnologia hibridă din această generație le face mai versatile ca niciodată.
    `,
    coverImage: "https://images.unsplash.com/photo-1606016159991-ddeab5617277?q=80&w=2000&auto=format&fit=crop", // BMW/SUV style image
    author: {
      name: "Andrei Popescu",
      avatar: "https://i.pravatar.cc/150?u=andrei",
      role: "Auto Reviewer"
    },
    category: "Review-uri",
    tags: ["SUV", "Premium", "BMW", "Porsche", "2026"],
    readTime: 5,
    publishedAt: "2026-07-10T09:00:00Z",
    isFeatured: true
  },
  {
    id: "2",
    slug: "ghid-verificare-istoric-auto",
    title: "Ghid Complet: Cum să verifici istoricul unei mașini second-hand",
    excerpt: "Nu cumpăra niciodată o mașină second-hand pe nevăzute. Află pașii esențiali pentru a verifica kilometrajul, daunele ascunse și actele.",
    content: `
Cumpărarea unei mașini rulate poate fi o experiență stresantă dacă nu ești pregătit. Totuși, urmând câțiva pași clari de verificare, poți minimiza masiv riscul de a lua o "țeapă".

### 1. Seria de Șasiu (VIN)
Primul și cel mai important pas este solicitarea seriei VIN de la vânzător. Orice refuz din partea lui este un "steag roșu" imens.

### 2. Raportul Istoric (CarVertical / RAR)
Odată ce ai VIN-ul:
- Verifică istoricul pe platforme precum CarVertical. Aici poți descoperi daune ascunse grave, care au dus mașina la stadiul de "daună totală" în alte țări.
- Folosește aplicația RAR Auto-Pass (în România) pentru a vedea evoluția kilometrajului la fiecare ITP.

### 3. Verificarea Fizică și Actele
- Verifică seria poansonată pe caroserie (de obicei sub parbriz, sub capotă sau pe stâlpul B) cu cea din talon și carte.
- Cere să vezi cartea de service (ideal format digital la reprezentanță).

O inspecție la un service autorizat înainte de plată te poate salva de mii de euro reparații.
    `,
    coverImage: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2000&auto=format&fit=crop", // Checking car engine
    author: {
      name: "Mihai Stan",
      avatar: "https://i.pravatar.cc/150?u=mihai",
      role: "Expert Auto"
    },
    category: "Ghiduri",
    tags: ["Second-hand", "Sfaturi", "Siguranță"],
    readTime: 4,
    publishedAt: "2026-07-08T14:30:00Z"
  },
  {
    id: "3",
    slug: "ce-este-ppf-protectie-vopsea",
    title: "Merită investiția într-o folie PPF (Paint Protection Film)?",
    excerpt: "Analizăm costurile și beneficiile aplicării unei folii de protecție transparente pe mașina ta nouă sau proaspăt vopsită.",
    content: `
Odată cu creșterea prețurilor mașinilor și a complexității culorilor (mai ales cele mate), folia PPF (Paint Protection Film) a devenit un subiect extrem de popular în rândul pasionaților auto.

## Ce este PPF-ul?
Spre deosebire de o simplă folie de colantare (vinyl) care schimbă culoarea, PPF-ul este un film poliuretanic gros, invizibil, cu proprietăți de "self-healing" (zgârieturile fine dispar la căldură).

## Avantaje
- **Protecție reală:** Singura soluție care protejează cu adevărat împotriva pietrelor sărite pe autostradă. Ceramica ajută doar la murdărie și raze UV, nu la pietre.
- **Păstrarea valorii de revânzare:** Când vinzi mașina, o poți decoji, dezvăluind o vopsea imaculată, ca nouă.
- **Spălare mai ușoară:** Are un strat hidrofob inclus.

## Dezavantaje
- **Costul ridicat:** O aplicare full-body pe un SUV poate costa între 3.000 și 6.000 de Euro, în funcție de calitatea foliei (Xpel, SunTek, Stek).
- **Nu e indestructibilă:** La un impact mai serios, folia se rupe, iar înlocuirea unui singur element costă.

Dacă ai o mașină rară, scumpă sau conduci foarte mult pe autostradă, protecția frontală (bară, capotă, aripi) este o investiție absolut logică.
    `,
    coverImage: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=2000&auto=format&fit=crop", // Car detailing
    author: {
      name: "Elena Popa",
      avatar: "https://i.pravatar.cc/150?u=elena",
      role: "Detailer Auto"
    },
    category: "Întreținere",
    tags: ["PPF", "Detailing", "Vopsea"],
    readTime: 3,
    publishedAt: "2026-07-05T10:15:00Z"
  }
];
