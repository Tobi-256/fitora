// Deprecated Mongoose model placeholder.
// Replaced by Firestore-based `analyticsService` in `be/src/services/analyticsService.js`.
// This module keeps compatibility for any imports that expect a default export.

import * as analyticsService from '../services/analyticsService.js';

export default {
  create: analyticsService.createEvent,
  list: analyticsService.listEvents,
  delete: analyticsService.deleteEvent,
};
