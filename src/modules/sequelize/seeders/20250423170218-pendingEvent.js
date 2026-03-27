'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    //     await queryInterface.bulkInsert(
    //       'PendingEvent',
    //       [
    //         {
    //           id: 1,
    //           eventId: 1, // References Event ID 1 (e.g., Damascus Music Festival)
    //           supervisorId: 1, // Assuming supervisor ID 1 exists
    //           eventName: 'Damascus Music Festival - Updated',
    //           mainPhoto: 'http://207.180.217.5:5000/events/damascus_music_festival_updated_main.jpg',
    //           miniPoster: 'http://207.180.217.5:5000/events/damascus_music_festival_updated_mini.jpg',
    //           eventPhotos: ['http://207.180.217.5:5000/events/damascus_music_festival_updated_1.jpg'],
    //           eventType: 1, // Assuming event type ID 1 exists (e.g., Music)
    //           startEventDate: new Date('2025-05-03T00:00:00Z'),
    //           endEventDate: new Date('2025-05-04T00:00:00Z'),
    //           startApplyDate: new Date('2025-04-22T00:00:00Z'),
    //           endApplyDate: new Date('2025-05-02T00:00:00Z'),
    //           startEventHour: '6:00 PM',
    //           endEventHour: '9:00 PM',
    //           province: 1, // Assuming province ID 1 exists (e.g., Damascus)
    //           location: 'Damascus Cultural Arena',
    //           ticketOptionsAndPrices: `{
    //             "vip": { "price": 55000, "description": "Enhanced VIP experience" },
    //             "classic": { "price": 27000, "description": "Updated standard seating" }
    //           }`,
    //           attendanceType: 'any',
    //           seatsQty: 600,
    //           description: 'Updated music festival with additional artists.',
    //           notes: 'Updated schedule; check website.',
    //           eventStatus: 'commingSoon',
    //           needApproveFromSupervisor: true,
    //           visitCount: 0,
    //           isUpdateApproved: false,
    //           isUpdateDeclined: false,
    //           createdAt: new Date('2025-04-23T00:00:00Z'),
    //           updatedAt: new Date('2025-04-23T00:00:00Z'),
    //         },
    //         {
    //           id: 2,
    //           eventId: 2, // References Event ID 2 (e.g., Aleppo Art Exhibition)
    //           supervisorId: 2, // Assuming supervisor ID 2 exists
    //           eventName: 'Aleppo Art Exhibition - Extended',
    //           mainPhoto: 'http://207.180.217.5:5000/events/aleppo_art_exhibition_extended_main.jpg',
    //           miniPoster: 'http://207.180.217.5:5000/events/aleppo_art_exhibition_extended_mini.jpg',
    //           eventPhotos: [
    //             'http://207.180.217.5:5000/events/aleppo_art_exhibition_extended_1.jpg',
    //             'http://207.180.217.5:5000/events/aleppo_art_exhibition_extended_2.jpg',
    //             'http://207.180.217.5:5000/events/aleppo_art_exhibition_extended_3.jpg',
    //           ],
    //           eventType: 2, // Assuming event type ID 2 exists (e.g., Art)
    //           startEventDate: new Date('2025-06-04T00:00:00Z'),
    //           endEventDate: new Date('2025-06-06T00:00:00Z'),
    //           startApplyDate: new Date('2025-05-20T00:00:00Z'),
    //           endApplyDate: new Date('2025-06-03T00:00:00Z'),
    //           startEventHour: '9:00 AM',
    //           endEventHour: '5:00 PM',
    //           province: 3, // Assuming province ID 3 exists (e.g., Aleppo)
    //           location: 'Aleppo Art Gallery',
    //           ticketOptionsAndPrices: `{
    //             "economy": { "price": 12000, "description": "Extended general admission" },
    //             "classic": { "price": 20000, "description": "Access to exclusive exhibits" }
    //           }`,
    //           attendanceType: 'any',
    //           seatsQty: 250,
    //           description: 'Extended exhibition with new artists and workshops.',
    //           notes: 'Workshops require pre-registration.',
    //           eventStatus: 'commingSoon',
    //           needApproveFromSupervisor: true,
    //           visitCount: 0,
    //           isUpdateApproved: false,
    //           isUpdateDeclined: false,
    //           createdAt: new Date('2025-04-24T00:00:00Z'),
    //           updatedAt: new Date('2025-04-24T00:00:00Z'),
    //         },
    //         {
    //           id: 3,
    //           eventId: 3, // References Event ID 3 (e.g., Latakia Film Festival)
    //           supervisorId: 3, // Assuming supervisor ID 3 exists
    //           eventName: 'Latakia Film Festival - Special Edition',
    //           mainPhoto: 'https://e-ticket.sy/events/latakia_film_festival_special_main.jpg',
    //           miniPoster: 'https://e-ticket.sy/events/latakia_film_festival_special_mini_new.jpg',
    //           // eventPhotos: [],
    //           eventType: 3, // Assuming event type ID 3 exists (e.g., Film)
    //           startEventDate: new Date('2025-07-13T00:00:00Z'),
    //           endEventDate: new Date('2025-07-15T00:00:00Z'),
    //           startApplyDate: new Date('2025-06-25T00:00:00Z'),
    //           endApplyDate: new Date('2025-07-12T00:00:00Z'),
    //           startEventHour: '5:00 PM',
    //           endEventHour: '10:00 PM',
    //           province: 6, // Assuming province ID 6 exists (e.g., Latakia)
    //           location: 'Latakia Coastal Theater',
    //           ticketOptionsAndPrices: `{
    //             "vip": { "price": 45000, "description": "Special edition VIP with meet-and-greet" },
    //             "economy": { "price": 18000, "description": "Standard seating for special screenings" }
    //           }`,
    //           attendanceType: 'any',
    //           seatsQty: 350,
    //           description: 'Special edition with exclusive film screenings.',
    //           notes: 'Limited seats for VIP sessions.',
    //           eventStatus: 'commingSoon',
    //           needApproveFromSupervisor: true,
    //           visitCount: 0,
    //           isUpdateApproved: false,
    //           isUpdateDeclined: false,
    //           createdAt: new Date('2025-04-25T00:00:00Z'),
    //           updatedAt: new Date('2025-04-25T00:00:00Z'),
    //         },
    //       ],
    //       {},
    //     );
    //     await queryInterface.sequelize.query(
    //       `SELECT setval('"PendingEvent_id_seq"', (SELECT MAX(id) FROM "PendingEvent"));`,
    //     );
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('PendingEvent', null, { paranoid: false });
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
