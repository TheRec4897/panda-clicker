'use strict';

/* ========================================================================
   3. Données du jeu
   ======================================================================== */

/* ----- Bâtiments : coût de base, production par seconde, description ----- */
const BUILDINGS = [
  { name: 'Bébé panda',                 base: 15,     cps: 0.1,    desc: 'Il roule, il mâchouille, il fait pousser le compteur.' },
  { name: 'Pousse de bambou',           base: 100,    cps: 1,      desc: 'Grandit de 90 cm par jour sans se plaindre.' },
  { name: 'Panda tapoteur',             base: 250,    cps: 0,      clicksPerSecond: 0.1, desc: 'Il donne un coup de patte toutes les 10 secondes.' },
  { name: 'Soigneur',                   base: 1100,   cps: 8,      desc: 'Apporte des tiges fraîches avant le lever du soleil.' },
  { name: 'Bambouseraie',               base: 12000,  cps: 47,     desc: 'Un hectare de tiges qui bruissent dans le vent.' },
  { name: 'Scierie à bambou',           base: 130000, cps: 260,    desc: 'Découpe, ponce et emballe pour l’export.' },
  { name: 'Réserve de Chengdu',         base: 1.4e6,  cps: 1400,   desc: 'Une réserve entière dédiée à la sieste des pandas.' },
  { name: 'Temple de la Brume',         base: 2e7,    cps: 7800,   desc: 'Les moines y méditent entre deux tiges.' },
  { name: 'Serre de bambou',            base: 1.27e8, cps: 44000,  desc: 'Une serre géante accélère la pousse des jeunes bambous.' },
  { name: 'Laboratoire botanique',      base: 3.3e8,  cps: 111000,  desc: 'Des chercheurs croisent bambou et photosynthèse turbo.' },
  { name: 'Banque du Bambou',           base: 5.1e9,  cps: 260000, desc: 'Les intérêts poussent tout seuls.' },
  { name: 'Portail céleste',            base: 7.5e10, cps: 1.6e6,  desc: 'Importe du bambou d’une dimension voisine.' },
  { name: 'Montagne sacrée',            base: 1e12,   cps: 1e7,    desc: 'Ses pentes sont couvertes de tiges millénaires.' },
  { name: 'Machine à remonter le temps', base: 1.4e13, cps: 6.5e7,  desc: 'Récolte le bambou avant même qu’il soit planté.' },
  { name: 'Galaxie Panda',              base: 1.7e14, cps: 4.3e8,  desc: 'Des planètes entières en noir et blanc.' },
  { name: 'Panda Absolu',               base: 2.1e15, cps: 2.9e9,  desc: 'Il est le bambou. Le bambou est lui.' }
];
