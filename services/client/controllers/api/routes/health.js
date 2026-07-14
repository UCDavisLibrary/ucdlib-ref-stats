import models from '#models';
import config from '#lib/config.js';
import { Router } from 'express';
import logger from '#lib/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const services = {};

    // check database
    const forms = await models.form.query({per_page: 1});
    services.database = {
      status: forms?.error ? 'fail' : 'pass'
    };

    // check last time backup service was successfully run
    const backupLogExists = await models.backupLog.tableExists();
    if ( backupLogExists && config.backup.statusFailAfterInterval ) {
      const lastBackup = await models.backupLog.lastBackupWithinInterval();

      if ( lastBackup.error ){
        throw lastBackup.error;
      }

      services.backup = {
        status: lastBackup.res.rows.length > 0 ? 'pass' : 'fail',
        failAfterInterval: config.backup.statusFailAfterInterval
      };

      if ( lastBackup.res.rows.length ) {
        services.backup.lastBackup = lastBackup.res.rows[0].backup_time;
      } else {
        let b = await models.backupLog.lastBackup();
        if ( b.error ) {
          throw b.error;
        }
        services.backup.lastBackup = b.res?.rows?.[0]?.backup_time || null;
      }

    }

    // check superset
    try {
      const supersetRes = await fetch(config.superset.healthUrl);
      const supersetText = await supersetRes.text();
      services.superset = {
        status: supersetRes.ok && supersetText.includes('OK') ? 'pass' : 'fail'
      };
    } catch(e) {
      logger.error('Error checking superset health', { error: e });
      services.superset = { status: 'fail' };
    }

    const overallStatus = Object.values(services).every(service => service.status === 'pass') ? 'pass' : 'fail';

    res.status(200).json({ status: overallStatus, services });
  } catch (error) {
    logger.error('Error checking health', { error });
    res.status(500).json({ status: 'fail', error: error.message });
  }
});

export default router;