// ============================================================================
// PLAN PRECARGADO: París Julio 2026 — Familia Nofal
// Fuente: itinerario de Frisco Travel by PHD Travel (PDF)
// ============================================================================

export const SEED_PARIS = {
  config: {
    name: 'París Julio 2026',
    destination: 'París, Francia',
    emoji: '🏰',
    startDate: '2026-07-19',
    endDate: '2026-07-27',
  },
  events: [
    // Domingo 19
    {
      title: 'Traslado aeropuerto → hotel', category: 'traslado', date: '2026-07-19', time: '18:00',
      place: 'CDG → Sofitel Le Faubourg',
      notes: 'Chabé #80399-1 · Sprinter · 8 pasajeros', alertMin: 60,
    },
    {
      title: 'Check-in Sofitel Paris Le Faubourg', category: 'hotel', date: '2026-07-19', time: '15:00',
      place: '15 Rue Boissy d’Anglas, 75008 París',
      notes: '8 noches (check-out 27/7 12:00) · Conf. QHQLFLRR · Desayuno diario para dos y crédito de hotel USD 100 por habitación incluidos', alertMin: 0,
    },
    // Lunes 20
    {
      title: 'Camioneta a La Galerie Dior', category: 'traslado', date: '2026-07-20', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-2 · Sprinter · 8 pasajeros · ida y vuelta al hotel', alertMin: 30,
    },
    {
      title: 'La Galerie Dior', category: 'actividad', date: '2026-07-20', time: '12:00',
      place: '11 Rue François 1er, 75008 París',
      notes: 'Tickets para 8 · Prepago · Llevar tickets descargados o impresos · No se permiten valijas ni bolsos grandes · +33 1 82 20 22 00', alertMin: 60,
    },
    {
      title: 'Almuerzo en L’Avenue', category: 'comida', date: '2026-07-20', time: '13:00',
      place: '41 Avenue Montaigne, 75008 París',
      notes: 'Mesa para 7 · A nombre de Elena Nofal · +33 1 40 70 14 91', alertMin: 30,
    },
    // Martes 21
    {
      title: 'Camioneta al Grand Palais', category: 'traslado', date: '2026-07-21', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-3 · Sprinter · 8 pasajeros · ida y vuelta al hotel', alertMin: 30,
    },
    {
      title: 'Grand Palais', category: 'actividad', date: '2026-07-21', time: '10:30',
      place: '17 Avenue du Général Eisenhower, 75008 París',
      notes: 'Tickets para 8 · Conf. 1370848 · Galerías 3 y 4: Matisse 1941-1954 · Galería 8: Hilma Af Klint · Galerías 9 y 10: Leandro Erlich · +33 1 44 13 17 17', alertMin: 60,
    },
    {
      title: 'Cena en Les Fous de l’Ile', category: 'comida', date: '2026-07-21', time: '20:00',
      place: '33 Rue des Deux Ponts, 75004 París',
      notes: 'Mesa para 7 · A nombre de Elena Nofal · +33 1 43 25 76 67', alertMin: 60,
    },
    {
      title: 'Paseo en barco — Bateaux Parisiens', category: 'actividad', date: '2026-07-21', time: '22:00',
      place: 'Quai de Montebello, 75007 París',
      notes: 'Tickets para 8 · Conf. 4635624 · +33 1 76 64 14 45', alertMin: 60,
    },
    // Miércoles 22
    {
      title: 'Camioneta a Versailles', category: 'traslado', date: '2026-07-22', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-4 · Sprinter · 10 pasajeros · ida y vuelta al hotel', alertMin: 30,
    },
    {
      title: 'Palacio de Versailles', category: 'actividad', date: '2026-07-22', time: '11:00',
      place: 'Place d’Armes, 78000 Versailles',
      notes: 'Tickets para 10 · ENTRADA: Pavillon d’Orleans · +33 1 30 83 78 00', alertMin: 60,
    },
    {
      title: 'Almuerzo en LAFAYETTE by Xavier Pincemin', category: 'comida', date: '2026-07-22', time: '13:00',
      place: '8 Bd du Roi, 78000 Versailles',
      notes: 'Reserva para 9 · A nombre de Elena Nofal · +33 9 83 74 20 05', alertMin: 30,
    },
    // Jueves 23
    {
      title: 'Camioneta al Louvre', category: 'traslado', date: '2026-07-23', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-5 · Sprinter · 10 pasajeros · ida y vuelta al hotel', alertMin: 30,
    },
    {
      title: 'Museo del Louvre', category: 'actividad', date: '2026-07-23', time: '11:00',
      place: 'Rue de Rivoli, 75001 París',
      notes: 'Tickets para 11 · Entrada: Carrousel o Pyramid · Tickets nominativos, no transferibles, entrada única · +33 1 40 20 50 50', alertMin: 60,
    },
    {
      title: 'Almuerzo en Loulou', category: 'comida', date: '2026-07-23', time: '12:00',
      place: '107 Rue de Rivoli, 75001 París',
      notes: 'Mesa para 9 · +33 1 42 60 41 96', alertMin: 30,
    },
    {
      title: 'Fondation Louis Vuitton', category: 'actividad', date: '2026-07-23', time: '18:30',
      place: '8 Av. du Mahatma Gandhi, París',
      notes: '6 tickets', alertMin: 60,
    },
    // Viernes 24
    {
      title: 'Camioneta a disposición', category: 'traslado', date: '2026-07-24', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-6 · Sprinter · 8 pasajeros · día libre con vehículo', alertMin: 30,
    },
    // Sábado 25
    {
      title: 'Camioneta a disposición', category: 'traslado', date: '2026-07-25', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-7 · Sprinter · 8 pasajeros · día libre con vehículo', alertMin: 30,
    },
    {
      title: 'Sainte-Chapelle', category: 'actividad', date: '2026-07-25', time: '16:30',
      place: '10 Bd du Palais, 75001 París',
      notes: 'Tickets comprados por el cliente (llevarlos)', alertMin: 60,
    },
    // Domingo 26
    {
      title: 'Camioneta a disposición', category: 'traslado', date: '2026-07-26', time: '10:00',
      place: 'Sale del Sofitel Le Faubourg',
      notes: 'Chabé #80399-8 · Sprinter · 8 pasajeros · día libre con vehículo', alertMin: 30,
    },
    // Lunes 27
    {
      title: 'Traslado hotel → aeropuerto', category: 'traslado', date: '2026-07-27', time: '10:30',
      place: 'Sofitel Le Faubourg → CDG Terminal 2E',
      notes: 'Chabé #80399-9 · Sprinter · 6 pasajeros · Check-out del hotel hasta las 12:00', alertMin: 120,
    },
  ],
};
