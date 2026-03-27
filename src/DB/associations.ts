import NormalUser from '../models/normalUser.model';
import EventType from '../models/eventType.model';
import Event from '../models/event.model';
import Province from '../models/provinces.model';
import { PendingSupervisorChanges, Supervisor } from '../models/supervisor.model';
import PendingEvent from '../models/eventPending.model';
import SupervisorRequest from '../models/supervisorRequest.model.js';
import Booking from '../models/BookTicket.model';
import Ticket from '../models/ticket.model';
import NotificationAdmin from '../models/notificationAdmin.model';
import NotificationAdminEventType from '../models/notificationAdminEventType.model.js';
import NotificationAdminProvince from '../models/notificationAdminProvince.model.js';
import ScannerUser from '../models/scannerUser.model';
import RateEvent from '../models/rateEvent.model';

NormalUser.belongsToMany(EventType, {
  through: 'UserEventType',
  foreignKey: 'userId',
  otherKey: 'eventTypeId',
  as: 'eventTypes',
});
EventType.belongsToMany(NormalUser, {
  through: 'UserEventType',
  foreignKey: 'eventTypeId',
  otherKey: 'userId',
  as: 'normalUser',
});

NormalUser.belongsToMany(Province, {
  through: 'UserProvince',
  foreignKey: 'userId',
  otherKey: 'provinceId',
  as: 'provinces',
});
Province.belongsToMany(NormalUser, {
  through: 'UserProvince',
  foreignKey: 'provinceId',
  otherKey: 'userId',
  as: 'user',
});

NormalUser.belongsToMany(Event, {
  through: 'Favorite',
  foreignKey: 'userId',
  otherKey: 'eventId',
  as: 'eventFavourite',
});
Event.belongsToMany(NormalUser, {
  through: 'Favorite',
  foreignKey: 'eventId',
  otherKey: 'userId',
  as: 'userFavourite',
});

Supervisor.hasMany(Event, {
  foreignKey: 'supervisorId',
  as: 'events',
  onDelete: 'CASCADE',
});
Event.belongsTo(Supervisor, {
  foreignKey: 'supervisorId',
  as: 'supervisor',
});

Supervisor.hasMany(PendingEvent, {
  foreignKey: 'supervisorId',
  as: 'PendingEvents',
  onDelete: 'CASCADE',
});
PendingEvent.belongsTo(Supervisor, {
  foreignKey: 'supervisorId',
  as: 'supervisor',
});

Supervisor.belongsToMany(EventType, {
  through: 'SupervisorEventType',
  foreignKey: 'supervisorId',
  otherKey: 'eventTypeId',
  as: 'eventTypes',
});
EventType.belongsToMany(Supervisor, {
  through: 'SupervisorEventType',
  foreignKey: 'eventTypeId',
  otherKey: 'supervisorId',
  as: 'supervisor',
});

Supervisor.hasMany(SupervisorRequest, { foreignKey: 'supervisorId', as: 'SupervisorRequest' });
SupervisorRequest.belongsTo(Supervisor, { foreignKey: 'supervisorId', as: 'supervisor' });
Event.belongsTo(SupervisorRequest, { foreignKey: 'supervisorId' });
PendingEvent.belongsTo(SupervisorRequest, { foreignKey: 'supervisorId' });
PendingSupervisorChanges.belongsTo(SupervisorRequest, { foreignKey: 'supervisorId' });

Booking.hasMany(Ticket, { foreignKey: 'bookingId', as: 'tickets' });
Ticket.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Event.hasMany(Booking, { foreignKey: 'eventId', as: 'bookings' });
Booking.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });
NormalUser.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(NormalUser, { foreignKey: 'userId', as: 'user' });

NotificationAdmin.belongsToMany(EventType, {
  through: NotificationAdminEventType,
  foreignKey: 'notificationAdminId',
  otherKey: 'eventTypeId',
  as: 'eventTypes',
});
NotificationAdmin.belongsToMany(Province, {
  through: NotificationAdminProvince,
  foreignKey: 'notificationAdminId',
  otherKey: 'provinceId',
  as: 'provinces',
});

EventType.belongsToMany(NotificationAdmin, {
  through: NotificationAdminEventType,
  foreignKey: 'eventTypeId',
  otherKey: 'notificationAdminId',
  as: 'notifications',
});
Province.belongsToMany(NotificationAdmin, {
  through: NotificationAdminProvince,
  foreignKey: 'provinceId',
  otherKey: 'notificationAdminId',
  as: 'notifications',
});

Supervisor.hasOne(ScannerUser, {
  foreignKey: 'supervisorId',
  as: 'scannerUser',
});
ScannerUser.belongsTo(Supervisor, {
  foreignKey: 'supervisorId',
  as: 'supervisor',
});

Event.hasMany(RateEvent, {
  foreignKey: 'eventId',
  as: 'ratings',
  onDelete: 'CASCADE',
});
RateEvent.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

export default { NormalUser, EventType, Event, Booking, Ticket, NotificationAdmin };
