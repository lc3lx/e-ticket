'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.bulkInsert(
    //   'Privacy_Policy',
    //   [
    //     {
    //       id: 1,
    //       language: 'en',
    //       content: `
    //       **Privacy Policy (Version 1.0)**
    //       Effective Date: April 23, 2025
    //       At E-Tickets, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our platform.
    //       **1. Information We Collect**
    //       - **Personal Information**: Name, email, phone number, and payment details when you register or make a purchase.
    //       - **Usage Data**: Information about how you interact with our platform, such as IP address, browser type, and pages visited.
    //       **2. How We Use Your Information**
    //       - To process ticket purchases and reservations.
    //       - To send you updates, promotions, and notifications (with your consent).
    //       - To improve our platform and services.
    //       **3. Data Sharing**
    //       We do not sell your personal information. We may share it with:
    //       - Event organizers to facilitate your attendance.
    //       - Third-party payment processors to handle transactions.
    //       **4. Your Rights**
    //       You can access, update, or delete your personal information by contacting us at privacy@e-ticket.sy.
    //       **5. Contact Us**
    //       For questions, contact us at support@e-ticket.sy.
    //     `,
    //       createdAt: new Date('2025-04-23T00:00:00Z'),
    //       updatedAt: new Date('2025-04-23T00:00:00Z'),
    //     },
    //     {
    //       id: 2,
    //       language: 'ar',
    //       content: `
    //       **سياسة الخصوصية (Version 1.0)**
    //       Effective Date: April 23, 2025
    //       At E-Tickets, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you use our platform.
    //       **1. Information We Collect**
    //       - **Personal Information**: Name, email, phone number, and payment details when you register or make a purchase.
    //       - **Usage Data**: Information about how you interact with our platform, such as IP address, browser type, and pages visited.
    //       **2. How We Use Your Information**
    //       - To process ticket purchases and reservations.
    //       - To send you updates, promotions, and notifications (with your consent).
    //       - To improve our platform and services.
    //       **3. Data Sharing**
    //       We do not sell your personal information. We may share it with:
    //       - Event organizers to facilitate your attendance.
    //       - Third-party payment processors to handle transactions.
    //       **4. Your Rights**
    //       You can access, update, or delete your personal information by contacting us at privacy@e-ticket.sy.
    //       **5. Contact Us**
    //       For questions, contact us at support@e-ticket.sy.
    //     `,
    //       createdAt: new Date('2025-04-23T00:00:00Z'),
    //       updatedAt: new Date('2025-04-23T00:00:00Z'),
    //     },
    //   ],
    //   {},
    // );
    // await queryInterface.sequelize.query(
    //   `SELECT setval('"Privacy_Policy_id_seq"', (SELECT MAX(id) FROM "Privacy_Policy"));`,
    // );
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkDelete('Privacy_Policy', null, {});
    } catch (error) {
      console.error('Error in down function:', error);
      throw error;
    }
  },
};
