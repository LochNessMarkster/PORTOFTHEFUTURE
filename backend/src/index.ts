import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema/schema.js';
import * as portsRoutes from './routes/ports.js';
import * as presentationsRoutes from './routes/presentations.js';
import * as floorplanRoutes from './routes/floorplan.js';
import * as preferencesRoutes from './routes/preferences.js';
import * as conversationsRoutes from './routes/conversations.js';
import * as networkingRoutes from './routes/networking.js';
import * as attendeesDirectoryRoutes from './routes/attendeesDirectory.js';
import * as authRoutes from './routes/auth.js';
import * as announcementsRoutes from './routes/announcements.js';
import * as agendaRoutes from './routes/agenda.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
portsRoutes.register(app, app.fastify);
presentationsRoutes.register(app, app.fastify);
floorplanRoutes.register(app, app.fastify);
preferencesRoutes.register(app, app.fastify);
conversationsRoutes.register(app, app.fastify);
networkingRoutes.register(app, app.fastify);
attendeesDirectoryRoutes.register(app, app.fastify);
authRoutes.register(app, app.fastify);
announcementsRoutes.register(app, app.fastify);
agendaRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
